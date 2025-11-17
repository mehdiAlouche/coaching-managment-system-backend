import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { requireRole } from '../middleware/roleCheck';
import { UserModel } from '../modules/user/model/user.model';
import { SessionModel } from '../modules/session/model/session.model';
import { AuthRequest } from '../middleware/auth';

const router = Router();

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

// GET /coaches/:coachId - Get one coach with details
router.get(
  '/:coachId',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const { coachId } = req.params;

      const coach = await UserModel.findOne({
        _id: coachId,
        organizationId: orgId,
        role: 'coach',
        isActive: true,
      })
        .select('-password')
        .lean();

      if (!coach) {
        return res.status(404).json({ message: 'Coach not found' });
      }

      // Get coach statistics
      const [upcomingSessions, completedSessions, totalSessions] = await Promise.all([
        SessionModel.countDocuments({
          coachId: coachId,
          organizationId: orgId,
          scheduledAt: { $gte: new Date() },
          status: { $in: ['scheduled', 'rescheduled'] },
        }),
        SessionModel.countDocuments({
          coachId: coachId,
          organizationId: orgId,
          status: 'completed',
        }),
        SessionModel.countDocuments({
          coachId: coachId,
          organizationId: orgId,
        }),
      ]);

      res.json({
        ...coach,
        stats: {
          upcomingSessions,
          completedSessions,
          totalSessions,
        },
      });
    } catch (err) {
      console.error('Get coach error:', err);
      res.status(500).json({ message: 'Failed to fetch coach' });
    }
  }
);

export default router;

