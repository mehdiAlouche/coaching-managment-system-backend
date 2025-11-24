import { Router, Request, Response } from 'express';
import { SessionModel } from '../../modules/session/model/session.model';
import { GoalModel } from '../../modules/goal/model/goal.model';
import { UserModel } from '../../modules/user/model/user.model';
import { PaymentModel } from '../../modules/payment/model/payment.model';
import { NotificationModel } from '../../modules/notification/model/notification.model';
import { buildPagination } from '../../_shared/utils/pagination';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';

const router = Router();

router.use(requireAuth, requireSameOrganization);

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { limit, page, skip, sort } = buildPagination(req.query);
    const organizationId = authReq.user?.organizationId;
    const userId = authReq.user?.userId || authReq.user?._id;
    const userRole = authReq.user?.role;

    const query: Record<string, unknown> = { organizationId };

    if (userRole === 'coach') {
      query.coachId = userId;
    } else if (userRole === 'entrepreneur') {
      query.entrepreneurId = userId;
    } else if (userRole === 'manager') {
      query.managerId = userId;
    } else {
      query.$or = [{ coachId: userId }, { entrepreneurId: userId }, { managerId: userId }];
    }

    const sessions = await SessionModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-notes.privateNotes')
      .populate('coachId', 'firstName lastName email')
      .populate('entrepreneurId', 'firstName lastName email startupName')
      .populate('managerId', 'firstName lastName email')
      .lean();

    const total = await SessionModel.countDocuments(query);

    res.json({ data: sessions, meta: { total, page, limit } });
  } catch (err) {
    console.error('Get my sessions error:', err);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

router.get('/goals', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { limit, page, skip, sort } = buildPagination(req.query);
    const organizationId = authReq.user?.organizationId;
    const userId = authReq.user?.userId || authReq.user?._id;
    const userRole = authReq.user?.role;

    const query: Record<string, unknown> = { organizationId };
    if (userRole === 'entrepreneur') {
      query.entrepreneurId = userId;
    } else if (userRole === 'coach') {
      query.coachId = userId;
    } else {
      query.$or = [{ entrepreneurId: userId }, { coachId: userId }];
    }

    const goals = await GoalModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('entrepreneurId', 'firstName lastName email startupName')
      .populate('coachId', 'firstName lastName email')
      .lean();

    const total = await GoalModel.countDocuments(query);
    res.json({ data: goals, meta: { total, page, limit } });
  } catch (err) {
    console.error('Get my goals error:', err);
    res.status(500).json({ message: 'Failed to fetch goals' });
  }
});

router.get('/startup', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user?.organizationId;
    const userId = authReq.user?.userId || authReq.user?._id;

    const user = await UserModel.findOne({
      _id: userId,
      organizationId,
    })
      .select('startupName firstName lastName email phone')
      .lean();

    if (!user?.startupName) {
      return res.status(404).json({ message: 'Startup not found for current user' });
    }

    const teammates = await UserModel.find({
      organizationId,
      startupName: user.startupName,
      isActive: true,
    })
      .select('firstName lastName email phone role')
      .lean();

    res.json({
      name: user.startupName,
      members: teammates,
    });
  } catch (err) {
    console.error('Get my startup error:', err);
    res.status(500).json({ message: 'Failed to fetch startup info' });
  }
});

router.get('/payments', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { limit, page, skip, sort } = buildPagination(req.query);
    const organizationId = authReq.user?.organizationId;
    const userId = authReq.user?.userId || authReq.user?._id;
    const userRole = authReq.user?.role;

    if (userRole !== 'coach') {
      return res.json({ data: [], meta: { total: 0, page: 1, limit } });
    }

    const query = { organizationId, coachId: userId };
    const payments = await PaymentModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('sessionIds', 'scheduledAt duration status')
      .lean();

    const total = await PaymentModel.countDocuments(query);

    res.json({ data: payments, meta: { total, page, limit } });
  } catch (err) {
    console.error('Get my payments error:', err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { limit, page, skip, sort } = buildPagination(req.query);
    const organizationId = authReq.user?.organizationId;
    const userId = authReq.user?.userId || authReq.user?._id;

    const notifications = await NotificationModel.find({
      organizationId,
      userId,
    })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await NotificationModel.countDocuments({ organizationId, userId });
    res.json({ data: notifications, meta: { total, page, limit } });
  } catch (err) {
    console.error('Get my notifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

export default router;

