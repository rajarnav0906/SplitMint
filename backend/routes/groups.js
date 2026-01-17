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

router.get('/', catchAsync(getGroups));
router.get('/:id', catchAsync(getGroup));
router.post('/', catchAsync(createGroup));
router.put('/:id', catchAsync(updateGroup));
router.delete('/:id', catchAsync(deleteGroup));

router.post('/:id/participants', catchAsync(addParticipant));
router.put('/:id/participants/:participantId', catchAsync(updateParticipant));
router.delete('/:id/participants/:participantId', catchAsync(removeParticipant));

router.get('/:id/balances', catchAsync(getBalances));
router.get('/:id/settlements', catchAsync(getSettlements));
router.get('/:id/balance/user', catchAsync(getUserBalance));

export default router;
