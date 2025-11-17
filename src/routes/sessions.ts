import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { requireRole } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';
import { SessionModel } from '../modules/session/model/session.model';
import { UserModel } from '../modules/user/model/user.model';
import { AuthRequest } from '../middleware/auth';
import {
  createSessionSchema,
  updateSessionSchema,
  sessionParamsSchema,
} from '../modules/validation/schemas';
import { buildPagination } from '../_shared/utils/pagination';

const router = Router();

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
      const { limit, page, skip, sort } = buildPagination(req.query);

      // Build query filters
      const query: any = { organizationId: orgId };

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
        .populate('coachId', 'firstName lastName email')
        .populate('entrepreneurId', 'firstName lastName email startupName')
        .populate('managerId', 'firstName lastName email')
        .lean();

      const total = await SessionModel.countDocuments(query);

      res.json({ data: sessions, meta: { total, page, limit } });
    } catch (err) {
      console.error('Get sessions error:', err);
      res.status(500).json({ message: 'Failed to fetch sessions' });
    }
  }
);

// GET /sessions/:sessionId - Get one session
router.get(
  '/:sessionId',
  requireAuth,
  requireSameOrganization,
  validate(sessionParamsSchema),
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { sessionId } = req.params;

      const session = await SessionModel.findOne({
        _id: sessionId,
        organizationId: orgId,
      })
        .populate('coachId', 'firstName lastName email hourlyRate')
        .populate('entrepreneurId', 'firstName lastName email startupName')
        .populate('managerId', 'firstName lastName email')
        .populate('paymentId')
        .lean();

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(session);
    } catch (err) {
      console.error('Get session error:', err);
      res.status(500).json({ message: 'Failed to fetch session' });
    }
  }
);

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
        .lean();

      res.status(201).json(populatedSession);
    } catch (err) {
      console.error('Create session error:', err);
      res.status(500).json({ message: 'Failed to create session' });
    }
  }
);

// PUT /sessions/:sessionId - Full update
router.put(
  '/:sessionId',
  requireAuth,
  requireSameOrganization,
  validate(updateSessionSchema),
  requireRole('admin', 'manager', 'coach'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { sessionId } = req.params;

      const session = await SessionModel.findOne({
        _id: sessionId,
        organizationId: orgId,
      });

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const { coachId, entrepreneurId, managerId, scheduledAt, duration, agendaItems, location, videoConferenceUrl, status } = req.body;

      // If time is being updated, check for conflicts
      if (scheduledAt || duration) {
        const newScheduledAt = scheduledAt ? new Date(scheduledAt) : session.scheduledAt;
        const newDuration = duration || session.duration;
        const newEndTime = new Date(newScheduledAt.getTime() + newDuration * 60000);
        const coachIdToCheck = coachId || session.coachId;

        const hasConflict = await SessionModel.checkConflict(coachIdToCheck, newScheduledAt, newEndTime, sessionId);
        if (hasConflict) {
          return res.status(409).json({ message: 'Coach has a conflicting session at this time' });
        }
      }

      // Update all fields
      if (coachId) session.coachId = new Types.ObjectId(coachId);
      if (entrepreneurId) session.entrepreneurId = new Types.ObjectId(entrepreneurId);
      if (managerId) session.managerId = new Types.ObjectId(managerId);
      if (scheduledAt) session.scheduledAt = new Date(scheduledAt);
      if (duration) session.duration = duration;
      if (agendaItems) session.agendaItems = agendaItems;
      if (location !== undefined) session.location = location;
      if (videoConferenceUrl !== undefined) session.videoConferenceUrl = videoConferenceUrl;
      if (status) session.status = status;

      await session.save();

      const updatedSession = await SessionModel.findById(session._id)
        .populate('coachId', 'firstName lastName email')
        .populate('entrepreneurId', 'firstName lastName email startupName')
        .populate('managerId', 'firstName lastName email')
        .lean();

      res.json(updatedSession);
    } catch (err) {
      console.error('Update session error:', err);
      res.status(500).json({ message: 'Failed to update session' });
    }
  }
);

// PATCH /sessions/:sessionId - Partial update
router.patch(
  '/:sessionId',
  requireAuth,
  requireSameOrganization,
  validate(updateSessionSchema),
  requireRole('admin', 'manager', 'coach'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { sessionId } = req.params;

      const session = await SessionModel.findOne({
        _id: sessionId,
        organizationId: orgId,
      });

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const { scheduledAt, duration, status, notes, rating, agendaItems } = req.body;

      // If time is being updated, check for conflicts
      if (scheduledAt || duration) {
        const newScheduledAt = scheduledAt ? new Date(scheduledAt) : session.scheduledAt;
        const newDuration = duration || session.duration;
        const newEndTime = new Date(newScheduledAt.getTime() + newDuration * 60000);

        const hasConflict = await SessionModel.checkConflict(session.coachId, newScheduledAt, newEndTime, sessionId);
        if (hasConflict) {
          return res.status(409).json({ message: 'Coach has a conflicting session at this time' });
        }
      }

      // Update only provided fields
      if (scheduledAt) session.scheduledAt = new Date(scheduledAt);
      if (duration) session.duration = duration;
      if (status) session.status = status;
      if (notes) session.notes = { ...session.notes, ...notes };
      if (rating) session.rating = rating;
      if (agendaItems) session.agendaItems = agendaItems;

      await session.save();

      const updatedSession = await SessionModel.findById(session._id)
        .populate('coachId', 'firstName lastName email')
        .populate('entrepreneurId', 'firstName lastName email startupName')
        .populate('managerId', 'firstName lastName email')
        .lean();

      res.json(updatedSession);
    } catch (err) {
      console.error('Patch session error:', err);
      res.status(500).json({ message: 'Failed to update session' });
    }
  }
);

// DELETE /sessions/:sessionId - Delete session
router.delete(
  '/:sessionId',
  requireAuth,
  requireSameOrganization,
  validate(sessionParamsSchema),
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { sessionId } = req.params;

      const session = await SessionModel.findOneAndDelete({
        _id: sessionId,
        organizationId: orgId,
      });

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.status(204).send();
    } catch (err) {
      console.error('Delete session error:', err);
      res.status(500).json({ message: 'Failed to delete session' });
    }
  }
);

export default router;
