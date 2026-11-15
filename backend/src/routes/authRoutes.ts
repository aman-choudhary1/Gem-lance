import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/authSchemas';
import { authenticateJwt } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authenticateJwt, authController.getMe);

export default router;
