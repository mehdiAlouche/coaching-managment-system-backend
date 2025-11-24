import { Router } from 'express';
import paymentsRoutes from '../../../payments/routes';

const router = Router({ mergeParams: true });

// Reuse the payments routes logic but filtered by userId param
router.use('/', paymentsRoutes);

export default router;
