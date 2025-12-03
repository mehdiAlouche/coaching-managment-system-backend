import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { validate } from '../../../middleware/validate';
import { GoalModel } from '../../../modules/goal/model/goal.model';
import { UserModel } from '../../../modules/user/model/user.model';
import {
    updateGoalSchema,
    goalParamsSchema,
} from '../../../modules/validation/schemas';

const router = Router({ mergeParams: true });

// GET /goals/:goalId - Get one goal
router.get(
    '/',
    requireAuth,
    requireSameOrganization,
    validate(goalParamsSchema),
    requireRole('admin', 'manager', 'coach', 'entrepreneur'),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const orgId = authReq.user?.organizationId;
            const userId = authReq.user?.userId || authReq.user?._id;
            const userRole = authReq.user?.role;
            const { goalId } = req.params;

            const goal = await GoalModel.findOne({
                _id: goalId,
                organizationId: orgId,
            })
                .populate('entrepreneurId', 'firstName lastName email startupName')
                .populate('coachId', 'firstName lastName email')
                .populate('collaborators.userId', 'firstName lastName email')
                .populate('comments.userId', 'firstName lastName email')
                .populate('updateLog.updatedBy', 'firstName lastName email')
                .populate('linkedSessions')
                .lean();

            if (!goal) {
                return res.status(404).json({ message: 'Goal not found' });
            }

            // Role-based access control
            if (userRole === 'entrepreneur' && goal.entrepreneurId.toString() !== userId?.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }

            if (userRole === 'coach' && goal.coachId.toString() !== userId?.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }

            res.json(goal);
        } catch (err) {
            console.error('Get goal error:', err);
            res.status(500).json({ message: 'Failed to fetch goal' });
        }
    }
);

// PATCH /goals/:goalId - Partial update (e.g., progress only)
router.patch(
    '/',
    requireAuth,
    requireSameOrganization,
    validate(updateGoalSchema),
    requireRole('admin', 'manager', 'coach', 'entrepreneur'),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const orgId = authReq.user?.organizationId;
            const userId = authReq.user?.userId || authReq.user?._id;
            const userRole = authReq.user?.role;
            const { goalId } = req.params;

            const goal = await GoalModel.findOne({
                _id: goalId,
                organizationId: orgId,
            });

            if (!goal) {
                return res.status(404).json({ message: 'Goal not found' });
            }

            // Role-based access control (admins bypass these checks)
            if (userRole === 'entrepreneur' && goal.entrepreneurId.toString() !== userId?.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }

            if (userRole === 'coach' && goal.coachId.toString() !== userId?.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }

            const { title, description, status, priority, targetDate, progress, milestones } = req.body;
            const changes: Record<string, unknown> = {};

            // Entrepreneurs can ONLY update progress (admins and managers bypass this)
            if (userRole === 'entrepreneur') {
                if (title || description || status || priority || targetDate || milestones) {
                    return res.status(403).json({ message: 'Entrepreneurs can only update progress' });
                }
            }

            // Entrepreneurs cannot change status (admins and managers bypass this)
            if (userRole === 'entrepreneur' && status) {
                return res.status(403).json({ message: 'Entrepreneurs cannot change goal status' });
            }

            // Update only provided fields
            if (title) {
                changes.title = { from: goal.title, to: title };
                goal.title = title;
            }
            if (description !== undefined) {
                changes.description = { from: goal.description, to: description };
                goal.description = description;
            }
            if (status) {
                changes.status = { from: goal.status, to: status };
                goal.status = status;
            }
            if (priority) {
                changes.priority = { from: goal.priority, to: priority };
                goal.priority = priority;
            }
            if (targetDate !== undefined) {
                changes.targetDate = { from: goal.targetDate, to: targetDate };
                goal.targetDate = targetDate ? new Date(targetDate) : undefined;
            }
            if (progress !== undefined) {
                changes.progress = { from: goal.progress, to: progress };
                goal.progress = Math.max(0, Math.min(100, progress));
            }
            if (milestones) {
                changes.milestones = { from: goal.milestones.length, to: milestones.length };
                goal.milestones = milestones;
            }

            // Add to update log if any changes
            if (Object.keys(changes).length > 0) {
                goal.updateLog.push({
                    updatedBy: new Types.ObjectId(userId),
                    updateType: 'updated',
                    message: 'Goal partially updated',
                    changes,
                    updatedAt: new Date(),
                });
            }

            await goal.save();

            // Update progress from milestones if milestones were updated
            if (milestones) {
                await GoalModel.updateProgressFromMilestones(goal._id);
            }

            const updatedGoal = await GoalModel.findById(goal._id)
                .populate('entrepreneurId', 'firstName lastName email startupName')
                .populate('coachId', 'firstName lastName email')
                .lean();

            res.json(updatedGoal);
        } catch (err) {
            console.error('Patch goal error:', err);
            res.status(500).json({ message: 'Failed to update goal' });
        }
    }
);

// DELETE /goals/:goalId - Delete goal
router.delete(
    '/',
    requireAuth,
    requireSameOrganization,
    validate(goalParamsSchema),
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const orgId = authReq.user?.organizationId;
            const { goalId } = req.params;

            const goal = await GoalModel.findOneAndDelete({
                _id: goalId,
                organizationId: orgId,
            });

            if (!goal) {
                return res.status(404).json({ message: 'Goal not found' });
            }

            res.status(204).send();
        } catch (err) {
            console.error('Delete goal error:', err);
            res.status(500).json({ message: 'Failed to delete goal' });
        }
    }
);

export default router;
