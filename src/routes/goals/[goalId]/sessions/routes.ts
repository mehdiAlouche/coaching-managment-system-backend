import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { validate } from '../../../../middleware/validate';
import { GoalModel } from '../../../../modules/goal/model/goal.model';
import { SessionModel } from '../../../../modules/session/model/session.model';
import { goalSessionLinkSchema } from '../../../../modules/validation/schemas';
import { asyncHandler } from '../../../../middleware/errorHandler';
import { ErrorFactory } from '../../../../_shared/errors/AppError';
import { HttpStatus } from '../../../../_shared/enums/httpStatus';

const router = Router({ mergeParams: true });

// POST /goals/:goalId/sessions/:sessionId - Link session to goal
router.post(
    '/:sessionId',
    requireAuth,
    requireSameOrganization,
    validate(goalSessionLinkSchema),
    requireRole('admin', 'manager', 'coach'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const orgId = req.user?.organizationId;
        const { goalId, sessionId } = req.params;

        const [goal, session] = await Promise.all([
            GoalModel.findOne({ _id: goalId, organizationId: orgId }),
            SessionModel.findOne({ _id: sessionId, organizationId: orgId }),
        ]);

        if (!goal) {
            throw ErrorFactory.notFound('Goal not found', 'GOAL_NOT_FOUND');
        }

        if (!session) {
            throw ErrorFactory.notFound('Session not found', 'SESSION_NOT_FOUND');
        }

        // Check if already linked
        const alreadyLinked = goal.linkedSessions.some(
            (s) => s.toString() === sessionId
        );

        if (alreadyLinked) {
            throw ErrorFactory.conflict('Session already linked to goal', 'ALREADY_LINKED');
        }

        // Link session
        goal.linkedSessions.push(new Types.ObjectId(sessionId));

        await goal.save();

        const updatedGoal = await GoalModel.findById(goal._id)
            .populate('entrepreneurId', 'firstName lastName email startupName')
            .populate('coachId', 'firstName lastName email')
            .populate('linkedSessions')
            .lean();

        res.status(HttpStatus.CREATED).json({ success: true, data: updatedGoal });
    })
);

export default router;
