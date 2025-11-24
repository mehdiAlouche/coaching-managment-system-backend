import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { SessionModel } from '../../../modules/session/model/session.model';
import { GoalModel } from '../../../modules/goal/model/goal.model';

const router = Router({ mergeParams: true });

// GET /dashboard/entrepreneur
router.get('/', requireAuth, requireSameOrganization, requireRole('entrepreneur'), async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  const userId = req.user?.userId;
  const now = new Date();

  const [nextSession, upcomingSessions, activeGoals, completedGoals, recentSessions, progressSummary] = await Promise.all([
    SessionModel.findOne({ organizationId: orgId, entrepreneurId: userId, scheduledAt: { $gte: now }, status: { $in: ['scheduled', 'rescheduled'] } })
      .sort({ scheduledAt: 1 })
      .populate('coachId', 'firstName lastName')
      .lean(),
    SessionModel.find({ organizationId: orgId, entrepreneurId: userId, scheduledAt: { $gte: now }, status: { $in: ['scheduled', 'rescheduled'] } })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .populate('coachId', 'firstName lastName')
      .lean(),
    GoalModel.find({ organizationId: orgId, entrepreneurId: userId, status: { $in: ['not_started', 'in_progress'] }, isArchived: false })
      .populate('coachId', 'firstName lastName')
      .lean(),
    GoalModel.find({ organizationId: orgId, entrepreneurId: userId, status: 'completed', isArchived: false })
      .populate('coachId', 'firstName lastName')
      .lean(),
    SessionModel.find({ organizationId: orgId, entrepreneurId: userId, status: 'completed' })
      .sort({ scheduledAt: -1 })
      .limit(5)
      .populate('coachId', 'firstName lastName')
      .lean(),
    GoalModel.aggregate([
      { $match: { organizationId: new Types.ObjectId(orgId), entrepreneurId: new Types.ObjectId(userId), isArchived: false } },
      { $group: { _id: null, avgProgress: { $avg: '$progress' }, totalMilestones: { $sum: { $size: '$milestones' } } } },
    ]),
  ]);

  let completedMilestones = 0;
  activeGoals.concat(completedGoals).forEach((goal) => {
    completedMilestones += goal.milestones.filter((m: any) => m.status === 'completed').length;
  });

  res.json({
    success: true,
    data: {
      overview: {
        activeGoalsCount: activeGoals.length,
        completedGoalsCount: completedGoals.length,
        upcomingSessionsCount: upcomingSessions.length,
        completedMilestones,
        averageProgress: progressSummary[0]?.avgProgress || 0,
      },
      nextSession,
      upcomingSessions,
      activeGoals,
      recentSessions,
      progressSummary: {
        averageProgress: Math.round((progressSummary[0]?.avgProgress || 0) * 10) / 10,
        totalMilestones: progressSummary[0]?.totalMilestones || 0,
        completedMilestones,
      },
    },
  });
});

export default router;
