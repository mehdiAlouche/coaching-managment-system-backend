import { Router } from 'express';
import routes from './routes';

const router = Router({ mergeParams: true });
router.use('/', routes);
export default router;
