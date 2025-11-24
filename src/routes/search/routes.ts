import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { requireRole } from '../../middleware/roleCheck';
import { SessionModel } from '../../modules/session/model/session.model';
import { UserModel } from '../../modules/user/model/user.model';
import { GoalModel } from '../../modules/goal/model/goal.model';

const router = Router();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

      if (!query) {
        return res.status(400).json({ message: 'Query parameter q is required' });
      }

      if (!organizationId) {
        return res.status(400).json({ message: 'Organization context missing' });
      }

      const regex = new RegExp(escapeRegex(query), 'i');
      const orgObjectId = new Types.ObjectId(organizationId);

      const [sessions, users, goals, startups] = await Promise.all([
        SessionModel.find({
          organizationId,
          $or: [{ 'notes.summary': regex }, { location: regex }],
        })
          .select('scheduledAt status coachId entrepreneurId')
          .limit(5)
          .populate('coachId', 'firstName lastName email')
          .populate('entrepreneurId', 'firstName lastName email startupName')
          .lean(),
        UserModel.find({
          organizationId,
          isActive: true,
          $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
        })
          .select('firstName lastName email role startupName')
          .limit(5)
          .lean(),
        GoalModel.find({
          organizationId,
          title: regex,
        })
          .select('title status priority entrepreneurId coachId')
          .limit(5)
          .lean(),
        UserModel.aggregate([
          {
            $match: {
              organizationId: orgObjectId,
              role: 'entrepreneur',
              startupName: { $regex: regex, $options: 'i' },
            },
          },
          {
            $group: {
              _id: '$startupName',
              members: {
                $push: {
                  _id: '$_id',
                  firstName: '$firstName',
                  lastName: '$lastName',
                  email: '$email',
                },
              },
            },
          },
          { $limit: 5 },
        ]),
      ]);

      res.json({
        query,
        results: {
          sessions,
          users,
          goals,
          startups,
        },
      });
    } catch (err) {
      console.error('Global search error:', err);
      res.status(500).json({ message: 'Failed to perform search' });
    }
  }
);

export default router;

