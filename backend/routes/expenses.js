import express from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Expense CRUD routes
router.get('/', getExpenses); // GET /api/expenses?groupId=... - Get all expenses for a group
router.get('/:id', getExpense); // GET /api/expenses/:id - Get single expense
router.post('/', createExpense); // POST /api/expenses - Create new expense
router.put('/:id', updateExpense); // PUT /api/expenses/:id - Update expense
router.delete('/:id', deleteExpense); // DELETE /api/expenses/:id - Delete expense

export default router;
