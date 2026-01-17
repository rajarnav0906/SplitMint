# SplitMint Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas account)

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file in the `backend` directory with the following variables:
   ```
   PORT=8080
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ```

   For MongoDB Atlas, use:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
   ```

3. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:8080`

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

## Project Structure

```
SplitMint/
├── backend/
│   ├── connections/      # Database connection
│   ├── constants/         # Constants
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   └── index.js          # Server entry point
├── frontend/
│   └── src/              # React application
└── req.txt               # Requirements document
```

## Next Steps

Step 1 is complete! The project foundation is set up. Ready to proceed with Step 2: Authentication System.
