import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { requireRole } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';
import { GoalModel, IGoal } from '../modules/goal/model/goal.model';
import { UserModel } from '../modules/user/model/user.model';
import { AuthRequest } from '../middleware/auth';
import { createGoalSchema, updateGoalSchema, goalParamsSchema } from '../modules/validation/schemas';

const router = Router();

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
      const userId = authReq.user?.userId || authReq.user?._id;
      const userRole = authReq.user?.role;

      // Build query filters
      const query: any = { organizationId: orgId, isArchived: false };

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

// GET /goals/:goalId - Get one goal
router.get(
  '/:goalId',
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

      const { entrepreneurId, coachId, title, description, status, priority, targetDate, milestones } = req.body;

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

// PUT /goals/:goalId - Full update
router.put(
  '/:goalId',
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

      // Role-based access control
      if (userRole === 'entrepreneur' && goal.entrepreneurId.toString() !== userId?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (userRole === 'coach' && goal.coachId.toString() !== userId?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { entrepreneurId, coachId, title, description, status, priority, targetDate, milestones, progress } = req.body;

      // Track changes for update log
      const changes: Record<string, unknown> = {};

      if (entrepreneurId) {
        const entrepreneur = await UserModel.findOne({ _id: entrepreneurId, organizationId: orgId, role: 'entrepreneur' });
        if (!entrepreneur) {
          return res.status(400).json({ message: 'Invalid entrepreneur ID' });
        }
        goal.entrepreneurId = new Types.ObjectId(entrepreneurId);
        changes.entrepreneurId = entrepreneurId;
      }

      if (coachId) {
        const coach = await UserModel.findOne({ _id: coachId, organizationId: orgId, role: 'coach' });
        if (!coach) {
          return res.status(400).json({ message: 'Invalid coach ID' });
        }
        goal.coachId = new Types.ObjectId(coachId);
        changes.coachId = coachId;
      }

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
      if (milestones) {
        changes.milestones = { from: goal.milestones.length, to: milestones.length };
        goal.milestones = milestones;
      }
      if (progress !== undefined) {
        changes.progress = { from: goal.progress, to: progress };
        goal.progress = Math.max(0, Math.min(100, progress));
      }

      // Add to update log
      goal.updateLog.push({
        updatedBy: new Types.ObjectId(userId),
        updateType: 'updated',
        message: 'Goal updated',
        changes,
        updatedAt: new Date(),
      });

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
      console.error('Update goal error:', err);
      res.status(500).json({ message: 'Failed to update goal' });
    }
  }
);

// PATCH /goals/:goalId - Partial update (e.g., progress only)
router.patch(
  '/:goalId',
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

      // Role-based access control
      if (userRole === 'entrepreneur' && goal.entrepreneurId.toString() !== userId?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (userRole === 'coach' && goal.coachId.toString() !== userId?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { title, description, status, priority, targetDate, progress, milestones } = req.body;
      const changes: Record<string, unknown> = {};

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
  '/:goalId',
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

