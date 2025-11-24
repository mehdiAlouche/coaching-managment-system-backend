import { Router } from 'express';
import routes from './routes';
import entrepreneurIdRouter from './[entrepreneurId]/routes';

const router = Router({ mergeParams: true });

router.use('/', routes);
router.use('/:entrepreneurId', entrepreneurIdRouter);

export default router;
