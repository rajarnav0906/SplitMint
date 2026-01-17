import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes - no authentication required
router.post('/register', register);
router.post('/login', login);

// Protected route - requires authentication
router.get('/profile', authenticate, getProfile);

export default router;
