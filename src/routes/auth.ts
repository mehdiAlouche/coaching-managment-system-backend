import { Router } from 'express';

const router = Router();

// Placeholder auth routes
router.post('/register', (_req, res) => res.json({ message: 'register (stub)' }));
router.post('/login', (_req, res) => res.json({ message: 'login (stub)' }));

export default router;
