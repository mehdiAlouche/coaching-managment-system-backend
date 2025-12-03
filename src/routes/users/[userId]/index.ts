import { Router } from 'express';
import routes from './routes';
import roleRouter from './role';

const router = Router({ mergeParams: true });

// Subresources
router.use('/role', roleRouter);

// Base routes (GET, PATCH, DELETE)
router.use('/', routes);

export default router;
