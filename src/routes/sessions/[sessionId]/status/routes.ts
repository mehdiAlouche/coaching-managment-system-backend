import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { validate } from '../../../../middleware/validate';
import { sessionStatusSchema } from '../../../../modules/validation/schemas';
import { SessionModel } from '../../../../modules/session/model/session.model';
import { ErrorFactory } from '../../../../_shared/errors/AppError';

const router = Router({ mergeParams: true });

// PATCH /sessions/:sessionId/status
router.patch(
  '/',
  requireAuth,
  requireSameOrganization,
  validate(sessionStatusSchema),
  requireRole('admin', 'manager', 'coach'),
  async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.organizationId;
    const { sessionId } = req.params;
    const { status } = req.body;

    const session = await SessionModel.findOne({ _id: sessionId, organizationId: orgId });
    if (!session) {
      throw ErrorFactory.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    session.status = status;
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
  }
);

export default router;
