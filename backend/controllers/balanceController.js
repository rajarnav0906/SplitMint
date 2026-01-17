import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import {
  calculateBalances,
  calculateBalanceMatrix,
  calculateMinimalSettlements,
  calculateSummary
} from '../services/balanceEngine.js';

// Get balances for a group
export const getBalances = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    // Check if user has access to this group
    const hasAccess = group.createdBy.toString() === req.user._id.toString() ||
      group.participants.some(p => p.userId && p.userId.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to balances for this group.'
      });
    }

    // Get all expenses for the group
    const expenses = await Expense.find({ group: id });

    // Calculate balances
    const { balances, participantMap } = calculateBalances(expenses, group.participants);

    // Calculate balance matrix (who owes whom)
    const balanceMatrix = calculateBalanceMatrix(expenses, group.participants);

    // Calculate summary
    const summary = calculateSummary(expenses);

    res.status(200).json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name
        },
        balances,
        balanceMatrix,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get settlement suggestions for a group
export const getSettlements = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    // Check if user has access to this group
    const hasAccess = group.createdBy.toString() === req.user._id.toString() ||
      group.participants.some(p => p.userId && p.userId.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to settlements for this group.'
      });
    }

    // Get all expenses for the group
    const expenses = await Expense.find({ group: id });

    // Calculate minimal settlements
    const settlements = calculateMinimalSettlements(expenses, group.participants);

    // Also provide balance information for context
    const { balances } = calculateBalances(expenses, group.participants);

    res.status(200).json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name
        },
        settlements,
        balances,
        totalTransactions: settlements.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user-specific balance summary (what they owe and what's owed to them)
export const getUserBalance = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    // Check if user has access to this group
    const hasAccess = group.createdBy.toString() === req.user._id.toString() ||
      group.participants.some(p => p.userId && p.userId.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this group.'
      });
    }

    // Find the participant that corresponds to the current user
    const userParticipant = group.participants.find(
      p => p.userId && p.userId.toString() === req.user._id.toString()
    );

    if (!userParticipant) {
      return res.status(404).json({
        success: false,
        message: 'You are not a participant in this group.'
      });
    }

    // Get all expenses for the group
    const expenses = await Expense.find({ group: id });

    // Calculate balances
    const { balances } = calculateBalances(expenses, group.participants);

    // Find user's balance
    const userBalance = balances.find(
      b => b.participantId.toString() === userParticipant._id.toString()
    );

    if (!userBalance) {
      return res.status(404).json({
        success: false,
        message: 'Balance information not found for your account.'
      });
    }

    // Calculate what user owes to others and what others owe to user
    const balanceMatrix = calculateBalanceMatrix(expenses, group.participants);
    
    const owedByUser = balanceMatrix.filter(
      entry => entry.from.participantId.toString() === userParticipant._id.toString()
    );

    const owedToUser = balanceMatrix.filter(
      entry => entry.to.participantId.toString() === userParticipant._id.toString()
    );

    res.status(200).json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name
        },
        balance: userBalance,
        owedByUser,
        owedToUser,
        totalOwed: owedByUser.reduce((sum, entry) => sum + entry.amount, 0),
        totalOwedToUser: owedToUser.reduce((sum, entry) => sum + entry.amount, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};
