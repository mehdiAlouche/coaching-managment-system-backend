import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { SessionModel } from '../../../modules/session/model/session.model';
import { PaymentModel } from '../../../modules/payment/model/payment.model';
import { GoalModel } from '../../../modules/goal/model/goal.model';
import { UserModel } from '../../../modules/user/model/user.model';

const router = Router({ mergeParams: true });

// GET /dashboard/manager
router.get('/', requireAuth, requireSameOrganization, requireRole('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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
    SessionModel.countDocuments({ organizationId: orgId, status: { $in: ['scheduled', 'rescheduled', 'in_progress'] } }),
    SessionModel.countDocuments({ organizationId: orgId, status: 'completed' }),
    GoalModel.countDocuments({ organizationId: orgId, status: { $in: ['not_started', 'in_progress'] } }),
    GoalModel.countDocuments({ organizationId: orgId, status: 'completed' }),
    PaymentModel.countDocuments({ organizationId: orgId, status: 'pending' }),
    PaymentModel.find({ organizationId: orgId, status: 'paid' }).select('totalAmount').lean(),
    UserModel.countDocuments({ organizationId: orgId, isActive: true }),
    SessionModel.aggregate([
      { $match: { organizationId: new Types.ObjectId(orgId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    GoalModel.aggregate([
      { $match: { organizationId: new Types.ObjectId(orgId), isArchived: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    SessionModel.find({ organizationId: orgId }).sort({ scheduledAt: -1 }).limit(5).populate('coachId', 'firstName lastName').populate('entrepreneurId', 'firstName lastName startupName').lean(),
    SessionModel.find({ organizationId: orgId, scheduledAt: { $gte: now }, status: { $in: ['scheduled', 'rescheduled'] } }).sort({ scheduledAt: 1 }).limit(5).populate('coachId', 'firstName lastName').populate('entrepreneurId', 'firstName lastName startupName').lean(),
  ]);

  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100 * 10) / 10 : 0;

  const sessionsByMonth = await SessionModel.aggregate([
    { $match: { organizationId: new Types.ObjectId(orgId), scheduledAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { year: { $year: '$scheduledAt' }, month: { $month: '$scheduledAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const revenueByWeek = await PaymentModel.aggregate([
    { $match: { organizationId: new Types.ObjectId(orgId), status: 'paid', paidAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { year: { $year: '$paidAt' }, week: { $week: '$paidAt' } }, total: { $sum: '$totalAmount' } } },
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
      sessionsByStatus: sessionsByStatus.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {} as Record<string, number>),
      goalsByPriority: goalsByPriority.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {} as Record<string, number>),
      sessionsByMonth,
      revenueByWeek,
      recentSessions,
      upcomingSessions,
    },
  });
});

export default router;
