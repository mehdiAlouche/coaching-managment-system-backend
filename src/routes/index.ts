import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import sessionsRoutes from './sessions';
import goalsRoutes from './goals';
import paymentsRoutes from './payments';
import dashboardRoutes from './dashboard';
import exportsRoutes from './exports';
import organizationRoutes from './organization';
import uploadRoutes from './upload';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organization', organizationRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/goals', goalsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/exports', exportsRoutes);
router.use('/upload', uploadRoutes);

// Temporary alias for /me -> /users/profile for convenience
router.use('/me', userRoutes);

router.get('/', (_req, res) => res.json({ message: 'API v1' }));

export default router;
