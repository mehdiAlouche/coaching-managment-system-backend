import { Router } from 'express';
import routes from './routes';
import sessionRouter from './sessions';
import goalRouter from './goals';
import paymentRouter from './payments';
import roleRouter from './role';

const router = Router({ mergeParams: true });

// Subresources
router.use('/sessions', sessionRouter);
router.use('/goals', goalRouter);
router.use('/payments', paymentRouter);
router.use('/role', roleRouter);

// Base routes (GET, PUT, PATCH, DELETE)
router.use('/', routes);

export default router;
