import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { validate } from '../../../middleware/validate';
import { SessionModel } from '../../../modules/session/model/session.model';
import { UserModel } from '../../../modules/user/model/user.model';
import { updateSessionSchema, sessionParamsSchema } from '../../../modules/validation/schemas';

const router = Router({ mergeParams: true });

// GET /sessions/:sessionId - Get one session
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  validate(sessionParamsSchema),
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { sessionId } = req.params;

      const session = await SessionModel.findOne({ _id: sessionId, organizationId: orgId })
        .populate('coachId', 'firstName lastName email hourlyRate')
        .populate('entrepreneurId', 'firstName lastName email startupName')
        .populate('managerId', 'firstName lastName email')
        .populate('paymentId')
        .lean()
        .then((session: any) => {
          if (!session) return null;
          return {
            ...session,
            entrepreneur: session.entrepreneurId,
            manager: session.managerId,
            entrepreneurId: undefined,
            managerId: undefined,
          };
        });

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

// PUT /sessions/:sessionId - Full update
router.put(
  '/',
  requireAuth,
  requireSameOrganization,
  validate(updateSessionSchema),
  requireRole('admin', 'manager', 'coach'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { sessionId } = req.params;

      const session = await SessionModel.findOne({ _id: sessionId, organizationId: orgId });
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const { coachId, entrepreneurId, managerId, scheduledAt, duration, agendaItems, location, videoConferenceUrl, status } = req.body;

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
  '/',
  requireAuth,
  requireSameOrganization,
  validate(updateSessionSchema),
  requireRole('admin', 'manager', 'coach'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { sessionId } = req.params;

      const session = await SessionModel.findOne({ _id: sessionId, organizationId: orgId });
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const { scheduledAt, duration, status, notes, rating, agendaItems } = req.body;

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
        .lean()
        .then((session: any) => ({
          ...session,
          entrepreneur: session.entrepreneurId,
          manager: session.managerId,
          entrepreneurId: undefined,
          managerId: undefined,
        }));

      res.json(updatedSession);
    } catch (err) {
      console.error('Patch session error:', err);
      res.status(500).json({ message: 'Failed to update session' });
    }
  }
);

// DELETE /sessions/:sessionId - Delete session
router.delete(
  '/',
  requireAuth,
  requireSameOrganization,
  validate(sessionParamsSchema),
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { sessionId } = req.params;

      const session = await SessionModel.findOneAndDelete({ _id: sessionId, organizationId: orgId });
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
