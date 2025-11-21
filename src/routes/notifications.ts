import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { NotificationModel } from '../modules/notification/model/notification.model';
import { buildPagination } from '../_shared/utils/pagination';
import { validate } from '../middleware/validate';
import { notificationParamsSchema } from '../modules/validation/schemas';
import { asyncHandler } from '../middleware/errorHandler';
import { ErrorFactory } from '../_shared/errors/AppError';
import { HttpStatus } from '../_shared/enums/httpStatus';

const router = Router();

router.get('/', requireAuth, requireSameOrganization, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { limit, page, skip, sort } = buildPagination(req.query);
    const organizationId = authReq.user?.organizationId;
    const userId = authReq.user?.userId || authReq.user?._id;
    const userRole = authReq.user?.role;

    const query: Record<string, unknown> = {
      organizationId,
    };

    if (userRole === 'admin' && req.query.userId) {
      query.userId = req.query.userId;
    } else {
      query.userId = userId;
    }

    if (req.query.status === 'unread') {
      query.readAt = null;
    }

    const notifications = await NotificationModel.find(query).sort(sort).skip(skip).limit(limit).lean();
    const total = await NotificationModel.countDocuments(query);

    res.json({ data: notifications, meta: { total, page, limit } });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

router.patch(
  '/:notificationId/read',
  requireAuth,
  requireSameOrganization,
  validate(notificationParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const requesterId = authReq.user?.userId || authReq.user?._id;
      const userRole = authReq.user?.role;
      const { notificationId } = req.params;

      const notification = await NotificationModel.findOne({
        _id: notificationId,
        organizationId,
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      if (userRole !== 'admin' && notification.userId.toString() !== requesterId?.toString()) {
        return res.status(403).json({ message: 'Cannot modify another user’s notification' });
      }

      notification.readAt = new Date();
      await notification.save();

      res.json(notification);
    } catch (err) {
      console.error('Mark notification read error:', err);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  }
);

export default router;

