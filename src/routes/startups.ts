import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { requireRole } from '../middleware/roleCheck';
import { UserModel } from '../modules/user/model/user.model';
import { AuthRequest } from '../middleware/auth';
import { buildPagination } from '../_shared/utils/pagination';

const router = Router();

// GET /startups - List all startups (derived from entrepreneurs)
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { limit, page, skip } = buildPagination(req.query);

      // Get all entrepreneurs with startup names
      const entrepreneurs = await UserModel.find({
        organizationId: orgId,
        role: 'entrepreneur',
        isActive: true,
        startupName: { $exists: true, $ne: '' },
      })
        .select('-password')
        .sort({ startupName: 1 })
        .lean();

      // Group by startup name and create startup objects
      const startupsMap = new Map();
      entrepreneurs.forEach((entrepreneur) => {
        const startupName = entrepreneur.startupName;
        if (startupName) {
          if (!startupsMap.has(startupName)) {
            startupsMap.set(startupName, {
              name: startupName,
              entrepreneurs: [],
            });
          }
          startupsMap.get(startupName).entrepreneurs.push({
            _id: entrepreneur._id,
            firstName: entrepreneur.firstName,
            lastName: entrepreneur.lastName,
            email: entrepreneur.email,
            phone: entrepreneur.phone,
          });
        }
      });

      const startups = Array.from(startupsMap.values());
      const paged = startups.slice(skip, skip + limit);

      res.json({ data: paged, meta: { total: startups.length, page, limit } });
    } catch (err) {
      console.error('Get startups error:', err);
      res.status(500).json({ message: 'Failed to fetch startups' });
    }
  }
);

// GET /startups/:startupId - Get one startup (by name)
router.get(
  '/:startupId',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { startupId } = req.params;

      // Decode startup name from URL (replace dashes with spaces)
      const startupName = startupId.replace(/-/g, ' ');

      // Get all entrepreneurs for this startup
      const entrepreneurs = await UserModel.find({
        organizationId: orgId,
        role: 'entrepreneur',
        isActive: true,
        startupName: { $regex: new RegExp(`^${startupName}$`, 'i') },
      })
        .select('-password')
        .sort({ firstName: 1, lastName: 1 })
        .lean();

      if (entrepreneurs.length === 0) {
        return res.status(404).json({ message: 'Startup not found' });
      }

      const startup = {
        name: entrepreneurs[0].startupName,
        entrepreneurs: entrepreneurs.map((e) => ({
          _id: e._id,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          phone: e.phone,
          timezone: e.timezone,
        })),
      };

      res.json(startup);
    } catch (err) {
      console.error('Get startup error:', err);
      res.status(500).json({ message: 'Failed to fetch startup' });
    }
  }
);

export default router;

