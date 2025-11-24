import { Router } from 'express';
import { requireAuth } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import sessionsRoutes from '../../../sessions/routes';

const router = Router({ mergeParams: true });

// Reuse the sessions routes logic but filtered by userId param
router.use('/', sessionsRoutes);

export default router;
