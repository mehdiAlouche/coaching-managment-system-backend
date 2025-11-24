import { Router } from 'express';
import routes from './routes';
import checkConflict from './check-conflict';
import calendar from './calendar';
import sessionIdRouter from './[sessionId]';

const router = Router({ mergeParams: true });

// Collection routes
router.use('/', routes);

// Subresources
router.use('/check-conflict', checkConflict);
router.use('/calendar', calendar);

// Nested/:sessionId aggregator (routes, status, rating, notes)
router.use('/:sessionId', sessionIdRouter);

export default router;
