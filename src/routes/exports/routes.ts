import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { requireRole } from '../../middleware/roleCheck';
import { UserModel } from '../../modules/user/model/user.model';
import { SessionModel } from '../../modules/session/model/session.model';
import { GoalModel } from '../../modules/goal/model/goal.model';
import { PaymentModel } from '../../modules/payment/model/payment.model';
import { AuthRequest } from '../../middleware/auth';

const router = Router();

// GET /export/dashboard - Export dashboard data
router.get(
  '/dashboard',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const format = (req.query.format as string) || 'json';

      // Get all dashboard data
      const [users, sessions, goals, payments] = await Promise.all([
        UserModel.find({ organizationId: orgId, isActive: true })
          .select('-password')
          .lean(),
        SessionModel.find({ organizationId: orgId })
          .populate('coachId', 'firstName lastName email')
          .populate('entrepreneurId', 'firstName lastName email startupName')
          .populate('managerId', 'firstName lastName email')
          .lean(),
        GoalModel.find({ organizationId: orgId, isArchived: false })
          .populate('entrepreneurId', 'firstName lastName email startupName')
          .populate('coachId', 'firstName lastName email')
          .lean(),
        PaymentModel.find({ organizationId: orgId })
          .populate('coachId', 'firstName lastName email')
          .populate('sessionIds')
          .lean(),
      ]);

      const dashboardData = {
        exportedAt: new Date().toISOString(),
        users,
        sessions,
        goals,
        payments,
        summary: {
          totalUsers: users.length,
          totalSessions: sessions.length,
          totalGoals: goals.length,
          totalPayments: payments.length,
          totalRevenue: payments
            .filter((p) => p.status === 'paid')
            .reduce((sum, p) => sum + p.totalAmount, 0),
        },
      };

      if (format === 'csv') {
        // Simple CSV export (could be enhanced with a proper CSV library)
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=dashboard-export.csv');
        res.send('Format,Count\nUsers,' + users.length + '\nSessions,' + sessions.length + '\nGoals,' + goals.length + '\nPayments,' + payments.length);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=dashboard-export.json');
        res.json(dashboardData);
      } else {
        res.status(400).json({ message: 'Unsupported format. Use "json" or "csv"' });
      }
    } catch (err) {
      console.error('Export dashboard error:', err);
      res.status(500).json({ message: 'Failed to export dashboard data' });
    }
  }
);

export default router;

