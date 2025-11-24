import { Router } from 'express';
import routes from './routes';
import goalIdRouter from './[goalId]';

const router = Router({ mergeParams: true });

// Collection routes
router.use('/', routes);

// Nested/:goalId aggregator
router.use('/:goalId', goalIdRouter);

export default router;
