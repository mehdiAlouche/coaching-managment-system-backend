import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';

const router = Router();

router.get('/', requireAuth, requireSameOrganization, (_req, res) => {
  return res.json({ message: 'list users (stub) for organization' });
});

export default router;
