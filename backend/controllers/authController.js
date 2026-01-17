import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT token for authenticated user
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register a new user
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, and name.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists. Please use a different email or login.'
      });
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      email: email.toLowerCase(),
      password,
      name: name.trim()
    });

    await user.save();

    // Generate token for the new user
    const token = generateToken(user._id);

    // Return user data (without password) and token
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    // Handle validation errors from mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    next(error);
  }
};

// Login existing user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user by email and include password field (since it's select: false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Compare provided password with hashed password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate token for authenticated user
    const token = generateToken(user._id);

    // Return user data (without password) and token
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current authenticated user profile
export const getProfile = async (req, res, next) => {
  try {
    // User is already attached to req by authenticate middleware
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name,
          createdAt: req.user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
