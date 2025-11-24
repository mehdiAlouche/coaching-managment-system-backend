import { Router } from 'express';
import sessionNotesRoutes from '../../../sessionNotes/routes';

const router = Router({ mergeParams: true });

// Reuse the session notes routes logic (already expects sessionId param)
router.use('/', sessionNotesRoutes);

export default router;
