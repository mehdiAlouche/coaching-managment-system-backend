import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { requireRole } from '../../middleware/roleCheck';
import { UserModel } from '../../modules/user/model/user.model';

const router = Router({ mergeParams: true });

// GET /coaches - List all coaches
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;

      const coaches = await UserModel.find({
        organizationId: orgId,
        role: 'coach',
        isActive: true,
      })
        .select('-password')
        .sort({ firstName: 1, lastName: 1 })
        .lean();

      res.json({ data: coaches, count: coaches.length });
    } catch (err) {
      console.error('Get coaches error:', err);
      res.status(500).json({ message: 'Failed to fetch coaches' });
    }
  }
);

export default router;
