import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { requireRole } from '../middleware/roleCheck';
import { UserModel } from '../modules/user/model/user.model';
import { SessionModel } from '../modules/session/model/session.model';
import { PaymentModel } from '../modules/payment/model/payment.model';
import { GoalModel } from '../modules/goal/model/goal.model';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /dashboard/stats - Dashboard stats (cards)
router.get('/stats', requireAuth, requireSameOrganization, requireRole('admin', 'manager', 'coach'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const orgId = authReq.user?.organizationId;

    const [totalUsers, coaches, entrepreneurs, totalSessions, upcomingSessions, completedSessions] =
      await Promise.all([
        UserModel.countDocuments({ organizationId: orgId, isActive: true }),
        UserModel.countDocuments({ organizationId: orgId, role: 'coach', isActive: true }),
        UserModel.countDocuments({ organizationId: orgId, role: 'entrepreneur', isActive: true }),
        SessionModel.countDocuments({ organizationId: orgId }),
        SessionModel.countDocuments({ organizationId: orgId, scheduledAt: { $gt: new Date() }, status: { $in: ['scheduled', 'rescheduled'] } }),
        SessionModel.countDocuments({ organizationId: orgId, status: 'completed' }),
      ]);

    // total revenue from paid payments
    const revenueAgg = await PaymentModel.aggregate([
      { $match: { organizationId: new Types.ObjectId(orgId), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]).exec();

    const totalRevenue = (revenueAgg && revenueAgg[0] && revenueAgg[0].total) || 0;

    res.json({
      users: { total: totalUsers, coaches, entrepreneurs },
      sessions: { total: totalSessions, upcoming: upcomingSessions, completed: completedSessions },
      revenue: { total: totalRevenue },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// GET /dashboard/sessions?range=month - Session overview chart
router.get('/sessions', requireAuth, requireSameOrganization, requireRole('admin', 'manager', 'coach'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const orgId = authReq.user?.organizationId;
    const range = (req.query.range as string) || 'month';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const sessions = await SessionModel.find({
      organizationId: orgId,
      scheduledAt: { $gte: startDate },
    })
      .select('scheduledAt status')
      .sort({ scheduledAt: 1 })
      .lean();

    // Group by date
    const sessionsByDate: Record<string, { scheduled: number; completed: number; cancelled: number }> = {};
    sessions.forEach((session) => {
      const dateKey = new Date(session.scheduledAt).toISOString().split('T')[0];
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = { scheduled: 0, completed: 0, cancelled: 0 };
      }
      if (session.status === 'completed') {
        sessionsByDate[dateKey].completed++;
      } else if (session.status === 'cancelled' || session.status === 'no_show') {
        sessionsByDate[dateKey].cancelled++;
      } else {
        sessionsByDate[dateKey].scheduled++;
      }
    });

    res.json({ data: sessionsByDate, range });
  } catch (err) {
    console.error('Dashboard sessions error:', err);
    res.status(500).json({ message: 'Failed to fetch session overview' });
  }
});

// GET /dashboard/goals-category - Goals by category (pie chart)
router.get('/goals-category', requireAuth, requireSameOrganization, requireRole('admin', 'manager', 'coach'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const orgId = authReq.user?.organizationId;

    const goals = await GoalModel.find({
      organizationId: orgId,
      isArchived: false,
    })
      .select('status priority')
      .lean();

    // Group by status
    const byStatus: Record<string, number> = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
      blocked: 0,
    };

    // Group by priority
    const byPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    goals.forEach((goal) => {
      byStatus[goal.status] = (byStatus[goal.status] || 0) + 1;
      byPriority[goal.priority] = (byPriority[goal.priority] || 0) + 1;
    });

    res.json({
      byStatus,
      byPriority,
    });
  } catch (err) {
    console.error('Dashboard goals-category error:', err);
    res.status(500).json({ message: 'Failed to fetch goals category' });
  }
});

// GET /dashboard/revenue?range=month - Revenue chart
router.get('/revenue', requireAuth, requireSameOrganization, requireRole('admin', 'manager', 'coach'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const orgId = authReq.user?.organizationId;
    const range = (req.query.range as string) || 'month';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const payments = await PaymentModel.find({
      organizationId: orgId,
      status: 'paid',
      paidAt: { $gte: startDate },
    })
      .select('paidAt totalAmount')
      .sort({ paidAt: 1 })
      .lean();

    // Group by date
    const revenueByDate: Record<string, number> = {};
    payments.forEach((payment) => {
      if (payment.paidAt) {
        const dateKey = new Date(payment.paidAt).toISOString().split('T')[0];
        revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + payment.totalAmount;
      }
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.totalAmount, 0);

    res.json({ data: revenueByDate, total: totalRevenue, range });
  } catch (err) {
    console.error('Dashboard revenue error:', err);
    res.status(500).json({ message: 'Failed to fetch revenue chart' });
  }
});

export default router;
