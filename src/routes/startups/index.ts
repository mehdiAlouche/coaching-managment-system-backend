import { Router } from 'express';
import routes from './routes';
import startupIdRouter from './[startupId]/routes';

const router = Router({ mergeParams: true });

router.use('/', routes);
router.use('/:startupId', startupIdRouter);

export default router;
