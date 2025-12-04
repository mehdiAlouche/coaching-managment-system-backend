import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { requireRole } from '../../middleware/roleCheck';
import { validate } from '../../middleware/validate';
import { GoalModel } from '../../modules/goal/model/goal.model';
import { UserModel } from '../../modules/user/model/user.model';
import { AuthRequest } from '../../middleware/auth';
import {
  createGoalSchema,
} from '../../modules/validation/schemas';

const router = Router({ mergeParams: true });

// GET /goals - List all goals with optional filters
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const isAdmin = (authReq as any).isAdmin;
      const userId = authReq.user?.userId || authReq.user?._id;
      const userRole = authReq.user?.role;
      const { userId: paramUserId } = req.params;
      const { organizationId: queryOrgId } = req.query;

      // Build query filters
      const query: any = { isArchived: false };

      // Admins can query across all orgs or filter by specific org
      if (isAdmin) {
        if (queryOrgId && typeof queryOrgId === 'string') {
          query.organizationId = queryOrgId;
        }
      } else {
        query.organizationId = orgId;
      }

      // Filter by user if accessed via nested route
      if (paramUserId) {
        query.$or = [
          { entrepreneurId: paramUserId },
          { coachId: paramUserId },
          { 'collaborators.userId': paramUserId }
        ];
      }

      // Entrepreneurs can only see their own goals
      if (userRole === 'entrepreneur') {
        query.entrepreneurId = userId;
      }

      // Coaches can only see goals they're assigned to
      if (userRole === 'coach') {
        query.coachId = userId;
      }

      // Filter by priority
      if (req.query.priority) {
        query.priority = req.query.priority;
      }

      // Filter by status
      if (req.query.status) {
        query.status = req.query.status;
      }

      const goals = await GoalModel.find(query)
        .sort({ priority: -1, targetDate: 1, createdAt: -1 })
        .populate('entrepreneurId', 'firstName lastName email startupName')
        .populate('coachId', 'firstName lastName email')
        .populate('collaborators.userId', 'firstName lastName email')
        .lean();

      res.json({ data: goals, count: goals.length });
    } catch (err) {
      console.error('Get goals error:', err);
      res.status(500).json({ message: 'Failed to fetch goals' });
    }
  }
);

// POST /goals - Create goal
router.post(
  '/',
  requireAuth,
  requireSameOrganization,
  validate(createGoalSchema),
  requireRole('admin', 'manager', 'coach'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const userId = authReq.user?.userId || authReq.user?._id;
      const userRole = authReq.user?.role;

      const { entrepreneurId, coachId, title, description, status, priority, targetDate, milestones } = req.body;

      // Coaches can only create goals for their entrepreneurs (admins and managers have no restrictions)
      if (userRole === 'coach' && coachId !== userId?.toString()) {
        return res.status(403).json({ message: 'Coaches can only create goals for their own entrepreneurs' });
      }

      // Verify users belong to the same organization
      const [entrepreneur, coach] = await Promise.all([
        UserModel.findOne({ _id: entrepreneurId, organizationId: orgId, role: 'entrepreneur' }),
        UserModel.findOne({ _id: coachId, organizationId: orgId, role: 'coach' }),
      ]);

      if (!entrepreneur || !coach) {
        return res.status(400).json({ message: 'Invalid entrepreneur or coach ID' });
      }

      const goal = await GoalModel.create({
        organizationId: orgId,
        entrepreneurId: new Types.ObjectId(entrepreneurId),
        coachId: new Types.ObjectId(coachId),
        title,
        description,
        status: status || 'not_started',
        priority: priority || 'medium',
        progress: 0,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        isArchived: false,
        milestones: milestones || [],
        linkedSessions: [],
        collaborators: [],
        comments: [],
        updateLog: [
          {
            updatedBy: new Types.ObjectId(userId),
            updateType: 'created',
            message: 'Goal created',
            updatedAt: new Date(),
          },
        ],
      });

      // Update progress from milestones if any
      if (milestones && milestones.length > 0) {
        await GoalModel.updateProgressFromMilestones(goal._id);
      }

      const populatedGoal = await GoalModel.findById(goal._id)
        .populate('entrepreneurId', 'firstName lastName email startupName')
        .populate('coachId', 'firstName lastName email')
        .lean();

      res.status(201).json(populatedGoal);
    } catch (err) {
      console.error('Create goal error:', err);
      res.status(500).json({ message: 'Failed to create goal' });
    }
  }
);

export default router;
