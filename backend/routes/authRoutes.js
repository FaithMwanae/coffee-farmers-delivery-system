import express from 'express';
import {
  login,
  register,
  getCurrentUser,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  handleResetLink,
  changePassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.get('/reset-link/:token', handleResetLink);

// Authenticated routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePassword);

export default router;