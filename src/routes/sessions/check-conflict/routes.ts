import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { validate } from '../../../middleware/validate';
import { sessionConflictSchema } from '../../../modules/validation/schemas';
import { SessionModel } from '../../../modules/session/model/session.model';
import { UserModel } from '../../../modules/user/model/user.model';
import { asyncHandler } from '../../../middleware/errorHandler';
import { ErrorFactory } from '../../../_shared/errors/AppError';

const router = Router({ mergeParams: true });

// POST /sessions/check-conflict
router.post(
  '/',
  requireAuth,
  requireSameOrganization,
  validate(sessionConflictSchema),
  requireRole('admin', 'manager', 'coach'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { coachId, scheduledAt, duration, excludeSessionId } = req.body;
    const orgId = req.user?.organizationId;

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
        .lean()
        .then((session: any) => {
          if (!session) return null;
          return {
            ...session,
            entrepreneur: session.entrepreneurId,
            entrepreneurId: undefined,
          };
        });

      res.json({
        success: true,
        data: { hasConflict: true, conflictingSession },
      });
    } else {
      res.json({ success: true, data: { hasConflict: false } });
    }
  })
);

export default router;
