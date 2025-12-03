import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { validate } from '../../../../middleware/validate';
import { GoalModel } from '../../../../modules/goal/model/goal.model';
import { UserModel } from '../../../../modules/user/model/user.model';
import { goalCollaboratorSchema } from '../../../../modules/validation/schemas';
import { asyncHandler } from '../../../../middleware/errorHandler';
import { ErrorFactory } from '../../../../_shared/errors/AppError';
import { HttpStatus } from '../../../../_shared/enums/httpStatus';

const router = Router({ mergeParams: true });

// POST /goals/:goalId/collaborators - Add collaborator to goal
router.post(
    '/',
    requireAuth,
    requireSameOrganization,
    validate(goalCollaboratorSchema),
    requireRole('admin', 'manager', 'coach'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const orgId = req.user?.organizationId;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { goalId } = req.params;
        const { userId: collaboratorUserId, role } = req.body;

        const goal = await GoalModel.findOne({
            _id: goalId,
            organizationId: orgId,
        });

        if (!goal) {
            throw ErrorFactory.notFound('Goal not found', 'GOAL_NOT_FOUND');
        }

        // Coaches can only add collaborators to goals they coach (admins and managers bypass this)
        if (userRole === 'coach' && goal.coachId.toString() !== userId?.toString()) {
            throw ErrorFactory.forbidden('Coaches can only add collaborators to goals they coach', 'INSUFFICIENT_PERMISSIONS');
        }

        // Verify user exists in organization
        const user = await UserModel.findOne({
            _id: collaboratorUserId,
            organizationId: orgId,
        });

        if (!user) {
            throw ErrorFactory.badRequest('Invalid user ID', 'INVALID_USER');
        }

        // Check if already a collaborator
        const existingCollaborator = goal.collaborators.find(
            (c) => c.userId.toString() === collaboratorUserId
        );

        if (existingCollaborator) {
            throw ErrorFactory.conflict('User is already a collaborator', 'ALREADY_COLLABORATOR');
        }

        // Add collaborator
        goal.collaborators.push({
            userId: new Types.ObjectId(collaboratorUserId),
            role: role || 'contributor',
            addedAt: new Date(),
        });

        await goal.save();

        const updatedGoal = await GoalModel.findById(goal._id)
            .populate('entrepreneurId', 'firstName lastName email startupName')
            .populate('coachId', 'firstName lastName email')
            .populate('collaborators.userId', 'firstName lastName email')
            .lean();

        res.status(HttpStatus.CREATED).json({ success: true, data: updatedGoal });
    })
);

export default router;
