import { Router } from 'express';
import routes from './routes';
import statusRoutes from './status';
import ratingRoutes from './rating';
import notesRoutes from './notes';

const router = Router({ mergeParams: true });

// Single session routes: GET, PUT, PATCH, DELETE at '/'
router.use('/', routes);

// Subresources of a session
router.use('/status', statusRoutes);
router.use('/rating', ratingRoutes);
router.use('/notes', notesRoutes);

export default router;
