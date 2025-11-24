import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { SessionModel } from '../../../modules/session/model/session.model';

const router = Router({ mergeParams: true });

// GET /dashboard/sessions?range=month
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

    const sessions = await SessionModel.find({
      organizationId: orgId,
      scheduledAt: { $gte: startDate },
    })
      .select('scheduledAt status')
      .sort({ scheduledAt: 1 })
      .lean();

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

export default router;
