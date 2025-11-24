import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { PaymentModel } from '../../../modules/payment/model/payment.model';

const router = Router({ mergeParams: true });

// GET /dashboard/revenue?range=month
router.get('/', requireAuth, requireSameOrganization, requireRole('admin', 'manager', 'coach'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const orgId = authReq.user?.organizationId;
    const range = (req.query.range as string) || 'month';

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
