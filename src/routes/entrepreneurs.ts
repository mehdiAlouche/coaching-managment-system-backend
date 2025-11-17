import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { requireRole } from '../middleware/roleCheck';
import { UserModel } from '../modules/user/model/user.model';
import { SessionModel } from '../modules/session/model/session.model';
import { GoalModel } from '../modules/goal/model/goal.model';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /entrepreneurs - List all entrepreneurs
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;

      const entrepreneurs = await UserModel.find({
        organizationId: orgId,
        role: 'entrepreneur',
        isActive: true,
      })
        .select('-password')
        .sort({ firstName: 1, lastName: 1 })
        .lean();

      res.json({ data: entrepreneurs, count: entrepreneurs.length });
    } catch (err) {
      console.error('Get entrepreneurs error:', err);
      res.status(500).json({ message: 'Failed to fetch entrepreneurs' });
    }
  }
);

// GET /entrepreneurs/:entrepreneurId - Get one entrepreneur
router.get(
  '/:entrepreneurId',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const userId = authReq.user?.userId || authReq.user?._id;
      const userRole = authReq.user?.role;
      const { entrepreneurId } = req.params;

      // Entrepreneurs can only see their own profile
      if (userRole === 'entrepreneur' && entrepreneurId !== userId?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const entrepreneur = await UserModel.findOne({
        _id: entrepreneurId,
        organizationId: orgId,
        role: 'entrepreneur',
        isActive: true,
      })
        .select('-password')
        .lean();

      if (!entrepreneur) {
        return res.status(404).json({ message: 'Entrepreneur not found' });
      }

      // Get entrepreneur statistics
      const [upcomingSessions, completedSessions, activeGoals, completedGoals] = await Promise.all([
        SessionModel.countDocuments({
          entrepreneurId: entrepreneurId,
          organizationId: orgId,
          scheduledAt: { $gte: new Date() },
          status: { $in: ['scheduled', 'rescheduled'] },
        }),
        SessionModel.countDocuments({
          entrepreneurId: entrepreneurId,
          organizationId: orgId,
          status: 'completed',
        }),
        GoalModel.countDocuments({
          entrepreneurId: entrepreneurId,
          organizationId: orgId,
          status: { $in: ['not_started', 'in_progress'] },
          isArchived: false,
        }),
        GoalModel.countDocuments({
          entrepreneurId: entrepreneurId,
          organizationId: orgId,
          status: 'completed',
          isArchived: false,
        }),
      ]);

      res.json({
        ...entrepreneur,
        stats: {
          upcomingSessions,
          completedSessions,
          activeGoals,
          completedGoals,
        },
      });
    } catch (err) {
      console.error('Get entrepreneur error:', err);
      res.status(500).json({ message: 'Failed to fetch entrepreneur' });
    }
  }
);

export default router;

