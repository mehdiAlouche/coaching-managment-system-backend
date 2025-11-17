import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { requireRole } from '../middleware/roleCheck';
import { SessionModel } from '../modules/session/model/session.model';
import { GoalModel } from '../modules/goal/model/goal.model';
import { PaymentModel } from '../modules/payment/model/payment.model';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const getTimestamp = (doc: Record<string, any>) => doc?.updatedAt || doc?.createdAt || new Date();

// GET /activities - List recent activity
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '50'), 10)));

      // Get recent sessions
      const recentSessions = await SessionModel.find({
        organizationId: orgId,
      })
        .select('scheduledAt status createdAt updatedAt coachId entrepreneurId')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate('coachId', 'firstName lastName')
        .populate('entrepreneurId', 'firstName lastName startupName')
        .lean();

      // Get recent goals with update logs
      const recentGoals = await GoalModel.find({
        organizationId: orgId,
        isArchived: false,
      })
        .select('title status progress updatedAt updateLog')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate('updateLog.updatedBy', 'firstName lastName')
        .lean();

      // Get recent payments
      const recentPayments = await PaymentModel.find({
        organizationId: orgId,
      })
        .select('invoiceNumber status totalAmount createdAt updatedAt coachId')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate('coachId', 'firstName lastName')
        .lean();

      // Combine and sort by timestamp
      const activities: any[] = [];

      recentSessions.forEach((session) => {
        activities.push({
          type: 'session',
          action: session.status === 'completed' ? 'completed' : session.status === 'cancelled' ? 'cancelled' : 'updated',
          timestamp: getTimestamp(session),
          data: {
            sessionId: session._id,
            scheduledAt: session.scheduledAt,
            status: session.status,
            coach: session.coachId,
            entrepreneur: session.entrepreneurId,
          },
        });
      });

      recentGoals.forEach((goal) => {
        const lastUpdate = goal.updateLog && goal.updateLog.length > 0 ? goal.updateLog[goal.updateLog.length - 1] : null;
        activities.push({
          type: 'goal',
          action: lastUpdate?.updateType || 'updated',
          timestamp: getTimestamp(goal),
          data: {
            goalId: goal._id,
            title: goal.title,
            status: goal.status,
            progress: goal.progress,
            updatedBy: lastUpdate?.updatedBy,
          },
        });
      });

      recentPayments.forEach((payment) => {
        activities.push({
          type: 'payment',
          action: payment.status === 'paid' ? 'paid' : payment.status === 'pending' ? 'created' : 'updated',
          timestamp: getTimestamp(payment),
          data: {
            paymentId: payment._id,
            invoiceNumber: payment.invoiceNumber,
            status: payment.status,
            totalAmount: payment.totalAmount,
            coach: payment.coachId,
          },
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Limit to requested number
      const limitedActivities = activities.slice(0, limit);

      res.json({ data: limitedActivities, count: limitedActivities.length });
    } catch (err) {
      console.error('Get activity error:', err);
      res.status(500).json({ message: 'Failed to fetch activity' });
    }
  }
);

// POST /activities - Create activity entry (internal use)
router.post(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      // This endpoint is for internal system use to log activities
      // For now, activities are derived from actual data changes
      // This could be extended to support manual activity logging
      res.status(501).json({ message: 'Manual activity creation not yet implemented' });
    } catch (err) {
      console.error('Create activity error:', err);
      res.status(500).json({ message: 'Failed to create activity' });
    }
  }
);

export default router;

