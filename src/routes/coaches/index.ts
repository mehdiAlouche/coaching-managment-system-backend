import { Router } from 'express';
import routes from './routes';
import coachIdRouter from './[coachId]/routes';

const router = Router({ mergeParams: true });

router.use('/', routes);
router.use('/:coachId', coachIdRouter);

export default router;
