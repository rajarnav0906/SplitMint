# SplitMint

**Live Application:** [https://splitmint-frontend.onrender.com](https://splitmint-frontend.onrender.com)

SplitMint is a modern expense splitting application that helps you manage shared expenses with friends and family. Track who paid what, calculate balances automatically, and settle up with minimal transactions.

## Features

- User authentication with secure JWT tokens
- Group management for up to 4 participants
- Expense tracking with multiple split modes (equal, custom, percentage)
- Real-time balance calculations and net balance tracking
- Settlement suggestions for optimal payment transactions
- Visual balance matrix showing who owes whom
- Participant contributions and share analysis
- Color-coded expense ledger
- Search and filter expenses by description, participant, date, and amount

## Tech Stack

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- Axios
- React Router
- Lucide React Icons

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/splitmint.git
cd splitmint
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:

Create `backend/.env`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=8080
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8080/api
```

5. Start the backend server:
```bash
cd backend
npm run dev
```

6. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
SplitMint/
├── backend/
│   ├── connections/     # Database connection
│   ├── constants/       # Application constants
│   ├── controllers/    # Route controllers
│   ├── middleware/      # Authentication and error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   └── services/       # Business logic (balance engine, split calculator)
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── context/    # React context (Auth)
│   │   ├── pages/      # Page components
│   │   └── services/   # API service layer
│   └── public/         # Static assets
└── render.yaml         # Render deployment configuration
```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group details
- `GET /api/groups/:id/balances` - Get group balances
- `GET /api/groups/:id/settlements` - Get settlement suggestions
- `GET /api/expenses?groupId=:id` - Get group expenses
- `POST /api/expenses` - Create expense
- `GET /api/users/search?query=:term` - Search users

## Deployment

This application is configured for deployment on Render. See `DEPLOYMENT.md` for detailed deployment instructions.

Quick deployment steps:
1. Deploy backend as a Web Service
2. Deploy frontend as a Static Site
3. Configure environment variables in Render dashboard
4. Update CORS settings with frontend URL

## License

ISC
