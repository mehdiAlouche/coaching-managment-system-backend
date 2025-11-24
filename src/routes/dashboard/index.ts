import { Router } from 'express';
import statsRoutes from './stats';
import sessionsRoutes from './sessions';
import goalsCategoryRoutes from './goals-category';
import revenueRoutes from './revenue';
import managerRoutes from './manager';
import coachRoutes from './coach';
import entrepreneurRoutes from './entrepreneur';

const router = Router({ mergeParams: true });

router.use('/stats', statsRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/goals-category', goalsCategoryRoutes);
router.use('/revenue', revenueRoutes);
router.use('/manager', managerRoutes);
router.use('/coach', coachRoutes);
router.use('/entrepreneur', entrepreneurRoutes);

// Optional root overview or health
router.get('/', (_req, res) => res.json({ message: 'Dashboard root' }));

export default router;
