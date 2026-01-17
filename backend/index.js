import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import connectDB from './connections/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);

// Connect DB
connectDB();

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server Listening on port ${PORT}`);
});

