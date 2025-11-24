import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { SessionModel } from '../../../modules/session/model/session.model';
import { PaymentModel } from '../../../modules/payment/model/payment.model';
import { GoalModel } from '../../../modules/goal/model/goal.model';

const router = Router({ mergeParams: true });

// GET /dashboard/coach
router.get('/', requireAuth, requireSameOrganization, requireRole('coach'), async (req: AuthRequest, res: Response) => {
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
    SessionModel.find({ organizationId: orgId, coachId: userId, scheduledAt: { $gte: now }, status: { $in: ['scheduled', 'rescheduled'] } })
      .sort({ scheduledAt: 1 })
      .populate('entrepreneurId', 'firstName lastName startupName')
      .lean(),
    SessionModel.countDocuments({ organizationId: orgId, coachId: userId, status: 'completed' }),
    GoalModel.find({ organizationId: orgId, coachId: userId, status: { $in: ['not_started', 'in_progress'] }, isArchived: false })
      .populate('entrepreneurId', 'firstName lastName startupName')
      .lean(),
    PaymentModel.find({ organizationId: orgId, coachId: userId, status: 'pending' })
      .populate('sessionIds')
      .lean(),
    PaymentModel.aggregate([
      { $match: { organizationId: new Types.ObjectId(orgId), coachId: new Types.ObjectId(userId), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    SessionModel.aggregate([
      { $match: { organizationId: new Types.ObjectId(orgId), coachId: new Types.ObjectId(userId), 'rating.score': { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$rating.score' } } },
    ]),
    SessionModel.findOne({ organizationId: orgId, coachId: userId, scheduledAt: { $gte: now }, status: { $in: ['scheduled', 'rescheduled'] } })
      .sort({ scheduledAt: 1 })
      .populate('entrepreneurId', 'firstName lastName startupName')
      .lean(),
    SessionModel.find({ organizationId: orgId, coachId: userId, status: 'completed' })
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
});

export default router;
