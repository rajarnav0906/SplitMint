import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to verify JWT token and authenticate user
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    try {
      // Verify token and decode user information
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by ID from token (without password)
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token is invalid.'
        });
      }

      // Attach user to request object for use in route handlers
      req.user = user;
      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error occurred.',
      error: error.message
    });
  }
};
