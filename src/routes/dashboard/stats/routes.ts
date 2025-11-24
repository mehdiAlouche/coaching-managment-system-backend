import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { UserModel } from '../../../modules/user/model/user.model';
import { SessionModel } from '../../../modules/session/model/session.model';
import { PaymentModel } from '../../../modules/payment/model/payment.model';

const router = Router({ mergeParams: true });

// GET /dashboard/stats
router.get('/', requireAuth, requireSameOrganization, requireRole('admin', 'manager', 'coach'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const orgId = authReq.user?.organizationId;

    const [totalUsers, coaches, entrepreneurs, totalSessions, upcomingSessions, completedSessions] = await Promise.all([
      UserModel.countDocuments({ organizationId: orgId, isActive: true }),
      UserModel.countDocuments({ organizationId: orgId, role: 'coach', isActive: true }),
      UserModel.countDocuments({ organizationId: orgId, role: 'entrepreneur', isActive: true }),
      SessionModel.countDocuments({ organizationId: orgId }),
      SessionModel.countDocuments({ organizationId: orgId, scheduledAt: { $gt: new Date() }, status: { $in: ['scheduled', 'rescheduled'] } }),
      SessionModel.countDocuments({ organizationId: orgId, status: 'completed' }),
    ]);

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

export default router;
