import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import sessionsRoutes from './sessions';
import goalsRoutes from './goals';
import paymentsRoutes from './payments';
import coachesRoutes from './coaches';
import entrepreneursRoutes from './entrepreneurs';
import startupsRoutes from './startups';
import dashboardRoutes from './dashboard';
import activitiesRoutes from './activities';
import exportsRoutes from './exports';
import organizationRoutes from './organization';
import rolesRoutes from './roles';
import uploadRoutes from './upload';
import notificationsRoutes from './notifications';
import meRoutes from './me';
import sessionNotesRoutes from './sessionNotes';
import searchRoutes from './search';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organization', organizationRoutes);
router.use('/roles', rolesRoutes);
router.use('/sessions/:sessionId/notes', sessionNotesRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/goals', goalsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/coaches', coachesRoutes);
router.use('/entrepreneurs', entrepreneursRoutes);
router.use('/startups', startupsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/activities', activitiesRoutes);
router.use('/exports', exportsRoutes);
router.use('/upload', uploadRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/me', meRoutes);
router.use('/search', searchRoutes);

router.get('/', (_req, res) => res.json({ message: 'API root' }));

export default router;
