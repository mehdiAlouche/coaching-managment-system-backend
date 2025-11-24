import { Router } from 'express';
import routes from './routes';
import paymentIdRouter from './[paymentId]';

const router = Router({ mergeParams: true });

// Collection routes
router.use('/', routes);

// Nested/:paymentId aggregator
router.use('/:paymentId', paymentIdRouter);

export default router;
