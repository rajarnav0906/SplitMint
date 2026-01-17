import express from 'express';
import { searchUsers } from '../controllers/userController.js';
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
      
      const statusCode = err.statusCode || err.status || 500;
      const message = err.message || 'Internal Server Error';
      
      res.status(statusCode).json({
        success: false,
        message
      });
    }
  };
};

router.use(authenticate);
router.get('/search', catchAsync(searchUsers));

export default router;
