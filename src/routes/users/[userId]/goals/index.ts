import { Router } from 'express';

const routes = Router();

const router = Router({ mergeParams: true });

router.use('/', routes);

export default router;
