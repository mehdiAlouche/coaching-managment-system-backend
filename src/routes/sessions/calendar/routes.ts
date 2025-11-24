import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { SessionModel } from '../../../modules/session/model/session.model';

const router = Router({ mergeParams: true });

// GET /sessions/calendar
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const view = (req.query.view as string) || 'month';

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const query: any = {
      organizationId: orgId,
      scheduledAt: { $gte: startDate, $lte: endDate },
    };

    if (userRole === 'coach') {
      query.coachId = userId;
    } else if (userRole === 'entrepreneur') {
      query.entrepreneurId = userId;
    }

    if (req.query.coachId) query.coachId = req.query.coachId;
    if (req.query.entrepreneurId) query.entrepreneurId = req.query.entrepreneurId;
    if (req.query.status) query.status = req.query.status;

    const sessions = await SessionModel.find(query)
      .sort({ scheduledAt: 1 })
      .populate('coachId', 'firstName lastName email')
      .populate('entrepreneurId', 'firstName lastName email startupName')
      .populate('managerId', 'firstName lastName email')
      .lean()
      .then((sessions) =>
        sessions.map((session: any) => ({
          ...session,
          entrepreneur: session.entrepreneurId,
          manager: session.managerId,
          entrepreneurId: undefined,
          managerId: undefined,
        }))
      );

    const calendar: Record<string, any[]> = {};
    sessions.forEach((session) => {
      const dateKey = session.scheduledAt.toISOString().split('T')[0];
      if (!calendar[dateKey]) calendar[dateKey] = [];
      calendar[dateKey].push(session);
    });

    res.json({ success: true, data: { calendar, month, year, view, total: sessions.length } });
  }
);

export default router;
