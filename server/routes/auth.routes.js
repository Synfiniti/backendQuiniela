import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  me, 
  forgotPassword, 
  verifyResetCode, 
  resetPassword 
} from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me
router.get('/me', me);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code', verifyResetCode);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

export default router;