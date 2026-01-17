import express from 'express';
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addParticipant,
  updateParticipant,
  removeParticipant
} from '../controllers/groupController.js';
import {
  getBalances,
  getSettlements,
  getUserBalance
} from '../controllers/balanceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Group CRUD routes
router.get('/', getGroups); // GET /api/groups - Get all groups for user
router.get('/:id', getGroup); // GET /api/groups/:id - Get single group
router.post('/', createGroup); // POST /api/groups - Create new group
router.put('/:id', updateGroup); // PUT /api/groups/:id - Update group
router.delete('/:id', deleteGroup); // DELETE /api/groups/:id - Delete group

// Participant management routes
router.post('/:id/participants', addParticipant); // POST /api/groups/:id/participants - Add participant
router.put('/:id/participants/:participantId', updateParticipant); // PUT /api/groups/:id/participants/:participantId - Update participant
router.delete('/:id/participants/:participantId', removeParticipant); // DELETE /api/groups/:id/participants/:participantId - Remove participant

// Balance and settlement routes
router.get('/:id/balances', getBalances); // GET /api/groups/:id/balances - Get all balances for group
router.get('/:id/settlements', getSettlements); // GET /api/groups/:id/settlements - Get settlement suggestions
router.get('/:id/balance/user', getUserBalance); // GET /api/groups/:id/balance/user - Get user-specific balance

export default router;
