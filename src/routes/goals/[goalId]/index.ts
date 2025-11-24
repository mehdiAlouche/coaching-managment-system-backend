import { Router } from 'express';
import routes from './routes';
import milestones from './milestones';
import comments from './comments';
import collaborators from './collaborators';
import sessions from './sessions';
import progress from './progress';

const router = Router({ mergeParams: true });

// Subresources
router.use('/milestones', milestones);
router.use('/comments', comments);
router.use('/collaborators', collaborators);
router.use('/sessions', sessions);
router.use('/progress', progress);

// Base routes (GET, PUT, PATCH, DELETE)
router.use('/', routes);

export default router;
