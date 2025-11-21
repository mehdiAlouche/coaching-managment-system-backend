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
  sessionStatusSchema,
  sessionConflictSchema,
  sessionRatingSchema,
  sessionNotesUpdateSchema,
} from '../modules/validation/schemas';
import { buildPagination } from '../_shared/utils/pagination';
import { asyncHandler } from '../middleware/errorHandler';
import { ErrorFactory } from '../_shared/errors/AppError';
import { HttpStatus } from '../_shared/enums/httpStatus';

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

// PATCH /sessions/:sessionId/status - Update session status
router.patch(
  '/:sessionId/status',
  requireAuth,
  requireSameOrganization,
  validate(sessionStatusSchema),
  requireRole('admin', 'manager', 'coach'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.organizationId;
    const { sessionId } = req.params;
    const { status } = req.body;

    const session = await SessionModel.findOne({
      _id: sessionId,
      organizationId: orgId,
    });

    if (!session) {
      throw ErrorFactory.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    // Update status
    session.status = status;

    // If marking as completed, set endTime if not already set
    if (status === 'completed' && !session.endTime) {
      session.endTime = new Date();
    }

    await session.save();

    const updatedSession = await SessionModel.findById(session._id)
      .populate('coachId', 'firstName lastName email')
      .populate('entrepreneurId', 'firstName lastName email startupName')
      .populate('managerId', 'firstName lastName email')
      .lean();

    res.json({ success: true, data: updatedSession });
  })
);

// POST /sessions/check-conflict - Check for scheduling conflicts
router.post(
  '/check-conflict',
  requireAuth,
  requireSameOrganization,
  validate(sessionConflictSchema),
  requireRole('admin', 'manager', 'coach'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { coachId, scheduledAt, duration, excludeSessionId } = req.body;
    const orgId = req.user?.organizationId;

    // Verify coach exists
    const coach = await UserModel.findOne({ _id: coachId, organizationId: orgId, role: 'coach' });
    if (!coach) {
      throw ErrorFactory.badRequest('Invalid coach ID', 'INVALID_COACH');
    }

    const scheduledAtDate = new Date(scheduledAt);
    const endTime = new Date(scheduledAtDate.getTime() + duration * 60000);

    const hasConflict = await SessionModel.checkConflict(
      coachId,
      scheduledAtDate,
      endTime,
      excludeSessionId
    );

    if (hasConflict) {
      // Find the conflicting session
      const conflictingSession = await SessionModel.findOne({
        coachId: new Types.ObjectId(coachId),
        status: { $in: ['scheduled', 'rescheduled', 'in_progress'] },
        _id: excludeSessionId ? { $ne: new Types.ObjectId(excludeSessionId) } : undefined,
        $or: [
          { scheduledAt: { $lt: endTime }, endTime: { $gt: scheduledAtDate } },
          { scheduledAt: { $gte: scheduledAtDate, $lt: endTime } },
        ],
      })
        .populate('entrepreneurId', 'firstName lastName')
        .lean();

      res.json({
        success: true,
        data: {
          hasConflict: true,
          conflictingSession,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          hasConflict: false,
        },
      });
    }
  })
);

// GET /sessions/calendar - Calendar view of sessions
router.get(
  '/calendar',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const view = (req.query.view as string) || 'month';

    // Calculate date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Build query
    const query: any = {
      organizationId: orgId,
      scheduledAt: { $gte: startDate, $lte: endDate },
    };

    // Filter by role
    if (userRole === 'coach') {
      query.coachId = userId;
    } else if (userRole === 'entrepreneur') {
      query.entrepreneurId = userId;
    }

    // Additional filters
    if (req.query.coachId) {
      query.coachId = req.query.coachId;
    }
    if (req.query.entrepreneurId) {
      query.entrepreneurId = req.query.entrepreneurId;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    const sessions = await SessionModel.find(query)
      .sort({ scheduledAt: 1 })
      .populate('coachId', 'firstName lastName email')
      .populate('entrepreneurId', 'firstName lastName email startupName')
      .populate('managerId', 'firstName lastName email')
      .lean();

    // Group by date
    const calendar: Record<string, any[]> = {};
    sessions.forEach((session) => {
      const dateKey = session.scheduledAt.toISOString().split('T')[0];
      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }
      calendar[dateKey].push(session);
    });

    res.json({
      success: true,
      data: {
        calendar,
        month,
        year,
        view,
        total: sessions.length,
      },
    });
  })
);

// POST /sessions/:sessionId/rating - Add session rating
router.post(
  '/:sessionId/rating',
  requireAuth,
  requireSameOrganization,
  validate(sessionRatingSchema),
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    const { sessionId } = req.params;
    const { score, comment } = req.body;

    const session = await SessionModel.findOne({
      _id: sessionId,
      organizationId: orgId,
    });

    if (!session) {
      throw ErrorFactory.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    // Only allow rating completed sessions
    if (session.status !== 'completed') {
      throw ErrorFactory.badRequest(
        'Can only rate completed sessions',
        'SESSION_NOT_COMPLETED'
      );
    }

    // Update rating
    session.rating = {
      score,
      comment,
      ratedBy: new Types.ObjectId(userId),
      ratedAt: new Date(),
    };

    await session.save();

    const updatedSession = await SessionModel.findById(session._id)
      .populate('coachId', 'firstName lastName email')
      .populate('entrepreneurId', 'firstName lastName email startupName')
      .populate('managerId', 'firstName lastName email')
      .populate('rating.ratedBy', 'firstName lastName')
      .lean();

    res.json({ success: true, data: updatedSession });
  })
);

// PATCH /sessions/:sessionId/notes - Add role-based notes
router.patch(
  '/:sessionId/notes',
  requireAuth,
  requireSameOrganization,
  validate(sessionNotesUpdateSchema),
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { sessionId } = req.params;
    const { role, notes } = req.body;

    const session = await SessionModel.findOne({
      _id: sessionId,
      organizationId: orgId,
    });

    if (!session) {
      throw ErrorFactory.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    // Verify user has permission to add notes for this role
    if (role === 'coach' && userRole !== 'coach' && userRole !== 'manager' && userRole !== 'admin') {
      throw ErrorFactory.forbidden('Cannot add coach notes', 'INSUFFICIENT_PERMISSIONS');
    }

    if (role === 'entrepreneur' && userRole !== 'entrepreneur' && userRole !== 'manager' && userRole !== 'admin') {
      throw ErrorFactory.forbidden('Cannot add entrepreneur notes', 'INSUFFICIENT_PERMISSIONS');
    }

    // Initialize notes object if needed
    if (!session.notes) {
      session.notes = {};
    }

    // Add role-specific notes
    if (role === 'coach') {
      session.notes.coachNotes = notes;
    } else if (role === 'entrepreneur') {
      session.notes.entrepreneurNotes = notes;
    } else if (role === 'manager') {
      session.notes.managerNotes = notes;
    }

    await session.save();

    const updatedSession = await SessionModel.findById(session._id)
      .populate('coachId', 'firstName lastName email')
      .populate('entrepreneurId', 'firstName lastName email startupName')
      .populate('managerId', 'firstName lastName email')
      .lean();

    res.json({ success: true, data: updatedSession });
  })
);

export default router;
