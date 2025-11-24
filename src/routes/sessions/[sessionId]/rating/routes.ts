import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { validate } from '../../../../middleware/validate';
import { sessionRatingSchema } from '../../../../modules/validation/schemas';
import { SessionModel } from '../../../../modules/session/model/session.model';
import { ErrorFactory } from '../../../../_shared/errors/AppError';

const router = Router({ mergeParams: true });

// POST /sessions/:sessionId/rating
router.post(
  '/',
  requireAuth,
  requireSameOrganization,
  validate(sessionRatingSchema),
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    const { sessionId } = req.params;
    const { score, comment } = req.body;

    const session = await SessionModel.findOne({ _id: sessionId, organizationId: orgId });
    if (!session) {
      throw ErrorFactory.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.status !== 'completed') {
      throw ErrorFactory.badRequest('Can only rate completed sessions', 'SESSION_NOT_COMPLETED');
    }

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
      .lean()
      .then((session: any) => ({
        ...session,
        entrepreneur: session.entrepreneurId,
        manager: session.managerId,
        entrepreneurId: undefined,
        managerId: undefined,
      }));

    res.json({ success: true, data: updatedSession });
  }
);

export default router;
