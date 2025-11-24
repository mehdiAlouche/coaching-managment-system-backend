import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { requireRole } from '../../middleware/roleCheck';
import { UserModel } from '../../modules/user/model/user.model';
import { SessionModel } from '../../modules/session/model/session.model';
import { PaymentModel } from '../../modules/payment/model/payment.model';
import { GoalModel } from '../../modules/goal/model/goal.model';
import { AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { ErrorFactory } from '../../_shared/errors/AppError';

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

// GET /dashboard/manager - Manager-specific dashboard
router.get(
  '/manager',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.organizationId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all statistics in parallel
    const [
      totalSessions,
      activeSessions,
      completedSessions,
      activeGoals,
      completedGoals,
      pendingPayments,
      paidPayments,
      totalUsers,
      sessionsByStatus,
      goalsByPriority,
      recentSessions,
      upcomingSessions,
    ] = await Promise.all([
      SessionModel.countDocuments({ organizationId: orgId }),
      SessionModel.countDocuments({
        organizationId: orgId,
        status: { $in: ['scheduled', 'rescheduled', 'in_progress'] },
      }),
      SessionModel.countDocuments({ organizationId: orgId, status: 'completed' }),
      GoalModel.countDocuments({ organizationId: orgId, status: { $in: ['not_started', 'in_progress'] } }),
      GoalModel.countDocuments({ organizationId: orgId, status: 'completed' }),
      PaymentModel.countDocuments({ organizationId: orgId, status: 'pending' }),
      PaymentModel.find({ organizationId: orgId, status: 'paid' })
        .select('totalAmount')
        .lean(),
      UserModel.countDocuments({ organizationId: orgId, isActive: true }),
      SessionModel.aggregate([
        { $match: { organizationId: new Types.ObjectId(orgId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      GoalModel.aggregate([
        { $match: { organizationId: new Types.ObjectId(orgId), isArchived: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      SessionModel.find({ organizationId: orgId })
        .sort({ scheduledAt: -1 })
        .limit(5)
        .populate('coachId', 'firstName lastName')
        .populate('entrepreneurId', 'firstName lastName startupName')
        .lean(),
      SessionModel.find({
        organizationId: orgId,
        scheduledAt: { $gte: now },
        status: { $in: ['scheduled', 'rescheduled'] },
      })
        .sort({ scheduledAt: 1 })
        .limit(5)
        .populate('coachId', 'firstName lastName')
        .populate('entrepreneurId', 'firstName lastName startupName')
        .lean(),
    ]);

    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const completionRate =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100 * 10) / 10 : 0;

    // Sessions by month (last 6 months)
    const sessionsByMonth = await SessionModel.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(orgId),
          scheduledAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$scheduledAt' },
            month: { $month: '$scheduledAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Revenue by week (last 4 weeks)
    const revenueByWeek = await PaymentModel.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(orgId),
          status: 'paid',
          paidAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            week: { $week: '$paidAt' },
          },
          total: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalSessions,
          activeSessions,
          completedSessions,
          activeGoals,
          completedGoals,
          pendingPayments,
          totalRevenue,
          completionRate,
          totalUsers,
        },
        sessionsByStatus: sessionsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        goalsByPriority: goalsByPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        sessionsByMonth,
        revenueByWeek,
        recentSessions,
        upcomingSessions,
      },
    });
  })
);

// GET /dashboard/coach - Coach-specific dashboard
router.get(
  '/coach',
  requireAuth,
  requireSameOrganization,
  requireRole('coach'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    const now = new Date();

    const [
      upcomingSessions,
      completedSessionsCount,
      activeGoals,
      pendingPayments,
      totalEarned,
      averageRating,
      nextSession,
      recentSessions,
    ] = await Promise.all([
      SessionModel.find({
        organizationId: orgId,
        coachId: userId,
        scheduledAt: { $gte: now },
        status: { $in: ['scheduled', 'rescheduled'] },
      })
        .sort({ scheduledAt: 1 })
        .populate('entrepreneurId', 'firstName lastName startupName')
        .lean(),
      SessionModel.countDocuments({
        organizationId: orgId,
        coachId: userId,
        status: 'completed',
      }),
      GoalModel.find({
        organizationId: orgId,
        coachId: userId,
        status: { $in: ['not_started', 'in_progress'] },
        isArchived: false,
      })
        .populate('entrepreneurId', 'firstName lastName startupName')
        .lean(),
      PaymentModel.find({
        organizationId: orgId,
        coachId: userId,
        status: 'pending',
      })
        .populate('sessionIds')
        .lean(),
      PaymentModel.aggregate([
        {
          $match: {
            organizationId: new Types.ObjectId(orgId),
            coachId: new Types.ObjectId(userId),
            status: 'paid',
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      SessionModel.aggregate([
        {
          $match: {
            organizationId: new Types.ObjectId(orgId),
            coachId: new Types.ObjectId(userId),
            'rating.score': { $exists: true },
          },
        },
        { $group: { _id: null, avgRating: { $avg: '$rating.score' } } },
      ]),
      SessionModel.findOne({
        organizationId: orgId,
        coachId: userId,
        scheduledAt: { $gte: now },
        status: { $in: ['scheduled', 'rescheduled'] },
      })
        .sort({ scheduledAt: 1 })
        .populate('entrepreneurId', 'firstName lastName startupName')
        .lean(),
      SessionModel.find({
        organizationId: orgId,
        coachId: userId,
        status: 'completed',
      })
        .sort({ scheduledAt: -1 })
        .limit(5)
        .populate('entrepreneurId', 'firstName lastName startupName')
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          upcomingSessionsCount: upcomingSessions.length,
          completedSessionsCount,
          activeGoalsCount: activeGoals.length,
          pendingPaymentsCount: pendingPayments.length,
          totalEarned: totalEarned[0]?.total || 0,
          averageRating: averageRating[0]?.avgRating || 0,
        },
        nextSession,
        upcomingSessions: upcomingSessions.slice(0, 5),
        activeGoals: activeGoals.slice(0, 5),
        pendingPayments,
        recentSessions,
      },
    });
  })
);

// GET /dashboard/entrepreneur - Entrepreneur-specific dashboard
router.get(
  '/entrepreneur',
  requireAuth,
  requireSameOrganization,
  requireRole('entrepreneur'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    const now = new Date();

    const [nextSession, upcomingSessions, activeGoals, completedGoals, recentSessions, progressSummary] =
      await Promise.all([
        SessionModel.findOne({
          organizationId: orgId,
          entrepreneurId: userId,
          scheduledAt: { $gte: now },
          status: { $in: ['scheduled', 'rescheduled'] },
        })
          .sort({ scheduledAt: 1 })
          .populate('coachId', 'firstName lastName')
          .lean(),
        SessionModel.find({
          organizationId: orgId,
          entrepreneurId: userId,
          scheduledAt: { $gte: now },
          status: { $in: ['scheduled', 'rescheduled'] },
        })
          .sort({ scheduledAt: 1 })
          .limit(5)
          .populate('coachId', 'firstName lastName')
          .lean(),
        GoalModel.find({
          organizationId: orgId,
          entrepreneurId: userId,
          status: { $in: ['not_started', 'in_progress'] },
          isArchived: false,
        })
          .populate('coachId', 'firstName lastName')
          .lean(),
        GoalModel.find({
          organizationId: orgId,
          entrepreneurId: userId,
          status: 'completed',
          isArchived: false,
        })
          .populate('coachId', 'firstName lastName')
          .lean(),
        SessionModel.find({
          organizationId: orgId,
          entrepreneurId: userId,
          status: 'completed',
        })
          .sort({ scheduledAt: -1 })
          .limit(5)
          .populate('coachId', 'firstName lastName')
          .lean(),
        GoalModel.aggregate([
          {
            $match: {
              organizationId: new Types.ObjectId(orgId),
              entrepreneurId: new Types.ObjectId(userId),
              isArchived: false,
            },
          },
          {
            $group: {
              _id: null,
              avgProgress: { $avg: '$progress' },
              totalMilestones: { $sum: { $size: '$milestones' } },
            },
          },
        ]),
      ]);

    // Count completed milestones
    let completedMilestones = 0;
    activeGoals.concat(completedGoals).forEach((goal) => {
      completedMilestones += goal.milestones.filter((m) => m.status === 'completed').length;
    });

    res.json({
      success: true,
      data: {
        overview: {
          activeGoalsCount: activeGoals.length,
          completedGoalsCount: completedGoals.length,
          upcomingSessionsCount: upcomingSessions.length,
          completedMilestones,
          averageProgress: progressSummary[0]?.avgProgress || 0,
        },
        nextSession,
        upcomingSessions,
        activeGoals,
        recentSessions,
        progressSummary: {
          averageProgress: Math.round((progressSummary[0]?.avgProgress || 0) * 10) / 10,
          totalMilestones: progressSummary[0]?.totalMilestones || 0,
          completedMilestones,
        },
      },
    });
  })
);

export default router;
