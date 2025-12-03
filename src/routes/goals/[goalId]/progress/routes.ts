import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { validate } from '../../../../middleware/validate';
import { GoalModel } from '../../../../modules/goal/model/goal.model';
import { goalProgressSchema } from '../../../../modules/validation/schemas';
import { asyncHandler } from '../../../../middleware/errorHandler';
import { ErrorFactory } from '../../../../_shared/errors/AppError';

const router = Router({ mergeParams: true });

// PATCH /goals/:goalId/progress - Update goal progress
router.patch(
    '/',
    requireAuth,
    requireSameOrganization,
    validate(goalProgressSchema),
    requireRole('admin', 'manager', 'coach', 'entrepreneur'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const orgId = req.user?.organizationId;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { goalId } = req.params;
        const { progress } = req.body;

        const goal = await GoalModel.findOne({
            _id: goalId,
            organizationId: orgId,
        });

        if (!goal) {
            throw ErrorFactory.notFound('Goal not found', 'GOAL_NOT_FOUND');
        }

        // Role-based access control (admins bypass these checks)
        if (userRole === 'entrepreneur' && goal.entrepreneurId.toString() !== userId?.toString()) {
            throw ErrorFactory.forbidden('Access denied', 'INSUFFICIENT_PERMISSIONS');
        }

        if (userRole === 'coach' && goal.coachId.toString() !== userId?.toString()) {
            throw ErrorFactory.forbidden('Access denied', 'INSUFFICIENT_PERMISSIONS');
        }

        const oldProgress = goal.progress;
        goal.progress = progress;

        // Add to update log
        goal.updateLog.push({
            updatedBy: new Types.ObjectId(userId),
            updateType: 'progress_updated',
            message: `Progress updated from ${oldProgress}% to ${progress}%`,
            changes: { progress: { from: oldProgress, to: progress } },
            updatedAt: new Date(),
        });

        await goal.save();

        const updatedGoal = await GoalModel.findById(goal._id)
            .populate('entrepreneurId', 'firstName lastName email startupName')
            .populate('coachId', 'firstName lastName email')
            .lean();

        res.json({ success: true, data: updatedGoal });
    })
);

export default router;
