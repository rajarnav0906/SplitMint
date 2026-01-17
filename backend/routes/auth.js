import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const catchAsync = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (res.headersSent) {
        return;
      }
      
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors || {}).map(e => e.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: messages
        });
      }
      
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate entry. This record already exists.'
        });
      }
      
      const statusCode = err.statusCode || err.status || 500;
      const message = err.message || 'Internal Server Error';
      
      res.status(statusCode).json({
        success: false,
        message
      });
    }
  };
};

router.post('/register', catchAsync(register));
router.post('/login', catchAsync(login));
router.get('/profile', authenticate, catchAsync(getProfile));

export default router;
