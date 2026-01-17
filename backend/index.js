import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';

import connectDB from './connections/db.js';

const app = express();

// Connect DB
connectDB();

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server Listening on port ${PORT}`);
});

