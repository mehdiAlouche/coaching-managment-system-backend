import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

router.get('/', (_req, res) => res.json({ message: 'API root' }));

export default router;
