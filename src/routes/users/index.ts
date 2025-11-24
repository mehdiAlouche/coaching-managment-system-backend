import { Router } from 'express';
import routes from './routes';
import userIdRouter from './[userId]';

const router = Router({ mergeParams: true });

// Collection routes
router.use('/', routes);

// Nested/:userId aggregator
router.use('/:userId', userIdRouter);

export default router;
