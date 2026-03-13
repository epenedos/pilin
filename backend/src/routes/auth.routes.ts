import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();
const authLimiter = rateLimit(10, 15 * 60 * 1000); // 10 req / 15 min

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(authController.register as any));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login as any));
router.post('/refresh', asyncHandler(authController.refresh as any));
router.post('/logout', asyncHandler(authController.logout as any));

export default router;
