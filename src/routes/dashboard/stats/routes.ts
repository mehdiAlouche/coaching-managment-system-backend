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
    const isAdmin = (authReq as any).isAdmin;
    const { organizationId: queryOrgId } = req.query;

    // Build query filter
    const orgFilter: any = {};
    if (isAdmin) {
      // Admin can view global stats or filter by specific org
      if (queryOrgId && typeof queryOrgId === 'string') {
        orgFilter.organizationId = new Types.ObjectId(queryOrgId);
      }
      // Otherwise no org filter (global stats)
    } else {
      orgFilter.organizationId = orgId;
    }

    const [totalUsers, coaches, entrepreneurs, totalSessions, upcomingSessions, completedSessions] = await Promise.all([
      UserModel.countDocuments({ ...orgFilter, isActive: true }),
      UserModel.countDocuments({ ...orgFilter, role: 'coach', isActive: true }),
      UserModel.countDocuments({ ...orgFilter, role: 'entrepreneur', isActive: true }),
      SessionModel.countDocuments(orgFilter),
      SessionModel.countDocuments({ ...orgFilter, scheduledAt: { $gt: new Date() }, status: { $in: ['scheduled', 'rescheduled'] } }),
      SessionModel.countDocuments({ ...orgFilter, status: 'completed' }),
    ]);

    const revenueMatchFilter = orgFilter.organizationId
      ? { organizationId: orgFilter.organizationId, status: 'paid' }
      : { status: 'paid' };

    const revenueAgg = await PaymentModel.aggregate([
      { $match: revenueMatchFilter },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]).exec();

    const totalRevenue = (revenueAgg && revenueAgg[0] && revenueAgg[0].total) || 0;

    res.json({
      users: { total: totalUsers, coaches, entrepreneurs },
      sessions: { total: totalSessions, upcoming: upcomingSessions, completed: completedSessions },
      revenue: { total: totalRevenue },
      scope: isAdmin && !queryOrgId ? 'global' : 'organization',
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

export default router;
