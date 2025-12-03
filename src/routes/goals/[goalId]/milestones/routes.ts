import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { validate } from '../../../../middleware/validate';
import { GoalModel } from '../../../../modules/goal/model/goal.model';
import { milestoneUpdateSchema } from '../../../../modules/validation/schemas';
import { asyncHandler } from '../../../../middleware/errorHandler';
import { ErrorFactory } from '../../../../_shared/errors/AppError';

const router = Router({ mergeParams: true });

// PATCH /goals/:goalId/milestones/:milestoneId - Update milestone status
router.patch(
    '/:milestoneId',
    requireAuth,
    requireSameOrganization,
    validate(milestoneUpdateSchema),
    requireRole('admin', 'manager', 'coach', 'entrepreneur'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const orgId = req.user?.organizationId;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { goalId, milestoneId } = req.params;
        const { status, notes } = req.body;

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

        // Find milestone
        const milestone = goal.milestones.find((m: any) => m._id?.toString() === milestoneId);
        if (!milestone) {
            throw ErrorFactory.notFound('Milestone not found', 'MILESTONE_NOT_FOUND');
        }

        const oldStatus = milestone.status;
        milestone.status = status;
        if (notes) {
            milestone.notes = notes;
        }

        // If milestone is completed, set completedAt
        if (status === 'completed' && !milestone.completedAt) {
            milestone.completedAt = new Date();
        }

        // Add to update log
        goal.updateLog.push({
            updatedBy: new Types.ObjectId(userId),
            updateType: 'milestone_updated',
            message: `Milestone "${milestone.title}" status changed from ${oldStatus} to ${status}`,
            changes: { milestone: { id: milestoneId, status: { from: oldStatus, to: status } } },
            updatedAt: new Date(),
        });

        await goal.save();

        // Update progress from milestones
        await GoalModel.updateProgressFromMilestones(goal._id);

        const updatedGoal = await GoalModel.findById(goal._id)
            .populate('entrepreneurId', 'firstName lastName email startupName')
            .populate('coachId', 'firstName lastName email')
            .lean();

        res.json({ success: true, data: updatedGoal });
    })
);

export default router;
