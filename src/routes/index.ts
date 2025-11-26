import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import sessionsRoutes from './sessions';
import goalsRoutes from './goals';
import paymentsRoutes from './payments';
import startupsRoutes from './startups';
import dashboardRoutes from './dashboard';
import activitiesRoutes from './activities';
import exportsRoutes from './exports';
import organizationRoutes from './organization';
import rolesRoutes from './roles';
import uploadRoutes from './upload';
import notificationsRoutes from './notifications';
import searchRoutes from './search';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organization', organizationRoutes);
router.use('/roles', rolesRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/goals', goalsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/startups', startupsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/activities', activitiesRoutes);
router.use('/exports', exportsRoutes);
router.use('/upload', uploadRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search', searchRoutes);

// Temporary alias for /me -> /users/profile for convenience
router.use('/me', userRoutes);

router.get('/', (_req, res) => res.json({ message: 'API v1' }));

export default router;
