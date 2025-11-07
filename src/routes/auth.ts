import { Router } from 'express';
import { register, login, getMe } from '../modules/auth/controller/authController';
import { requireAuth } from '../middleware/auth';
import { authLimiter, registrationLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../modules/validation/schemas';

const router = Router();

// Apply validation middleware along with rate limiting
router.post('/register', registrationLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', requireAuth, getMe);

export default router;
