import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { requireRole } from '../../middleware/roleCheck';
import { validate } from '../../middleware/validate';
import { SessionModel } from '../../modules/session/model/session.model';
import { UserModel } from '../../modules/user/model/user.model';
import { createSessionSchema } from '../../modules/validation/schemas';
import { buildPagination } from '../../_shared/utils/pagination';

const router = Router({ mergeParams: true });

// GET /sessions - List all sessions with optional filters
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const isAdmin = (authReq as any).isAdmin;
      const { userId } = req.params;
      const { limit, page, skip, sort } = buildPagination(req.query, isAdmin);
      const { organizationId: queryOrgId } = req.query;

      // Build query filters
      const query: any = {};

      // Admins can query across all orgs or filter by specific org
      if (isAdmin) {
        if (queryOrgId && typeof queryOrgId === 'string') {
          query.organizationId = queryOrgId;
        }
      } else {
        query.organizationId = orgId;
      }

      // Filter by user if accessed via nested route
      if (userId) {
        query.$or = [
          { coachId: userId },
          { entrepreneurId: userId },
          { managerId: userId }
        ];
      }

      // Filter by status
      if (req.query.status) {
        query.status = req.query.status;
      }

      // Filter upcoming sessions
      if (req.query.upcoming === 'true') {
        query.scheduledAt = { $gte: new Date() };
        if (!req.query.status) {
          query.status = { $in: ['scheduled', 'rescheduled'] };
        }
      }

      const sessions = await SessionModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-notes.privateNotes -attachments')
        .populate({ path: 'coachId', select: 'firstName lastName email' })
        .populate({ path: 'entrepreneurId', select: 'firstName lastName email startupName', options: { lean: true } })
        .populate({ path: 'managerId', select: 'firstName lastName email', options: { lean: true } })
        .lean()
        .then((sessions) => 
          sessions.map((session: any) => ({
            ...session,
            entrepreneur: session.entrepreneurId,
            manager: session.managerId,
            entrepreneurId: undefined,
            managerId: undefined,
          }))
        );

      const total = await SessionModel.countDocuments(query);

      res.json({ data: sessions, meta: { total, page, limit } });
    } catch (err) {
      console.error('Get sessions error:', err);
      res.status(500).json({ message: 'Failed to fetch sessions' });
    }
  }
);

// (moved) POST /sessions/check-conflict -> ./check-conflict
// (moved) GET /sessions/calendar -> ./calendar

// (moved) single session GET/PUT/PATCH/DELETE -> ./[sessionId]

// POST /sessions - Create session
router.post(
  '/',
  requireAuth,
  requireSameOrganization,
  validate(createSessionSchema),
  requireRole('admin', 'manager', 'coach'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const userId = authReq.user?.userId || authReq.user?._id;

      const { coachId, entrepreneurId, managerId, scheduledAt, duration, agendaItems, location, videoConferenceUrl } = req.body;

      // Verify all users belong to the same organization
      const [coach, entrepreneur, manager] = await Promise.all([
        UserModel.findOne({ _id: coachId, organizationId: orgId, role: 'coach' }),
        UserModel.findOne({ _id: entrepreneurId, organizationId: orgId, role: 'entrepreneur' }),
        UserModel.findOne({ _id: managerId, organizationId: orgId, role: 'manager' }),
      ]);

      if (!coach || !entrepreneur || !manager) {
        return res.status(400).json({ message: 'Invalid coach, entrepreneur, or manager ID' });
      }

      const scheduledAtDate = new Date(scheduledAt);
      const endTime = new Date(scheduledAtDate.getTime() + duration * 60000);

      // Check for scheduling conflicts
      const hasConflict = await SessionModel.checkConflict(coachId, scheduledAtDate, endTime);
      if (hasConflict) {
        return res.status(409).json({ message: 'Coach has a conflicting session at this time' });
      }

      const session = await SessionModel.create({
        organizationId: orgId,
        coachId: new Types.ObjectId(coachId),
        entrepreneurId: new Types.ObjectId(entrepreneurId),
        managerId: new Types.ObjectId(managerId),
        scheduledAt: scheduledAtDate,
        duration,
        endTime,
        status: 'scheduled',
        agendaItems: agendaItems || [],
        notes: {},
        attachments: [],
        location,
        videoConferenceUrl,
      });

      const populatedSession = await SessionModel.findById(session._id)
        .populate('coachId', 'firstName lastName email')
        .populate('entrepreneurId', 'firstName lastName email startupName')
        .populate('managerId', 'firstName lastName email')
        .lean()
        .then((session: any) => ({
          ...session,
          entrepreneur: session.entrepreneurId,
          manager: session.managerId,
          coach: session.coachId,
          entrepreneurId: undefined,
          managerId: undefined,
          coachId: undefined,
        }));

      res.status(201).json(populatedSession);
    } catch (err) {
      console.error('Create session error:', err);
      res.status(500).json({ message: 'Failed to create session' });
    }
  }
);



// (moved) single session DELETE -> ./[sessionId]

// (moved) status -> ./[sessionId]/status

// (moved) rating -> ./[sessionId]/rating

// Notes mounted within nested [sessionId] aggregator

export default router;
