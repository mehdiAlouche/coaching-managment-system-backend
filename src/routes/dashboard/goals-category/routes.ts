import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { GoalModel } from '../../../modules/goal/model/goal.model';

const router = Router({ mergeParams: true });

// GET /dashboard/goals-category
router.get('/', requireAuth, requireSameOrganization, requireRole('admin', 'manager', 'coach'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const orgId = authReq.user?.organizationId;

    const goals = await GoalModel.find({ organizationId: orgId, isArchived: false })
      .select('status priority')
      .lean();

    const byStatus: Record<string, number> = { not_started: 0, in_progress: 0, completed: 0, blocked: 0 };
    const byPriority: Record<string, number> = { low: 0, medium: 0, high: 0 };

    goals.forEach((goal) => {
      byStatus[goal.status] = (byStatus[goal.status] || 0) + 1;
      byPriority[goal.priority] = (byPriority[goal.priority] || 0) + 1;
    });

    res.json({ byStatus, byPriority });
  } catch (err) {
    console.error('Dashboard goals-category error:', err);
    res.status(500).json({ message: 'Failed to fetch goals category' });
  }
});

export default router;
