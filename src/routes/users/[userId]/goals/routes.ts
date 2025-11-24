import { Router } from 'express';
import goalsRoutes from '../../../goals/routes';

const router = Router({ mergeParams: true });

// Reuse the goals routes logic but filtered by userId param
router.use('/', goalsRoutes);

export default router;
