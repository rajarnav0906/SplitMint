import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import {
  calculateBalances,
  calculateBalanceMatrix,
  calculateMinimalSettlements,
  calculateSummary
} from '../services/balanceEngine.js';

export const getBalances = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    const hasAccess = group.createdBy.toString() === req.user._id.toString() ||
      group.participants.some(p => p.userId && p.userId.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to balances for this group.'
      });
    }

    const expenses = await Expense.find({ group: id });

    const { balances, participantMap } = calculateBalances(expenses, group.participants);
    const balanceMatrix = calculateBalanceMatrix(expenses, group.participants);
    const summary = calculateSummary(expenses);

    const participantBalances = group.participants.map(participant => {
      const balance = balances.find(b => b.participantId.toString() === participant._id.toString());
      return {
        participantId: participant._id,
        participantName: participant.name,
        netBalance: balance ? balance.netBalance : 0,
        totalPaid: balance ? balance.totalPaid : 0,
        totalOwed: balance ? balance.totalOwed : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name
        },
        balances,
        participantBalances,
        balanceMatrix,
        summary,
        netBalance: balances.find(b => {
          const participant = group.participants.find(p => 
            p.userId && p.userId.toString() === req.user._id.toString()
          );
          return participant && b.participantId.toString() === participant._id.toString();
        })?.netBalance || 0
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      success: false,
      message
    });
  }
};

export const getSettlements = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    const hasAccess = group.createdBy.toString() === req.user._id.toString() ||
      group.participants.some(p => p.userId && p.userId.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to settlements for this group.'
      });
    }

    const expenses = await Expense.find({ group: id });

    const settlements = calculateMinimalSettlements(expenses, group.participants);
    const { balances } = calculateBalances(expenses, group.participants);

    const settlementSuggestions = settlements.map(settlement => {
      const fromParticipant = group.participants.find(p => 
        p._id.toString() === settlement.from.participantId.toString()
      );
      const toParticipant = group.participants.find(p => 
        p._id.toString() === settlement.to.participantId.toString()
      );
      return {
        from: fromParticipant?.name || 'Unknown',
        to: toParticipant?.name || 'Unknown',
        amount: settlement.amount
      };
    });

    res.status(200).json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name
        },
        settlements: settlementSuggestions,
        balances,
        totalTransactions: settlementSuggestions.length
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      success: false,
      message
    });
  }
};

export const getUserBalance = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    const hasAccess = group.createdBy.toString() === req.user._id.toString() ||
      group.participants.some(p => p.userId && p.userId.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this group.'
      });
    }

    const userParticipant = group.participants.find(
      p => p.userId && p.userId.toString() === req.user._id.toString()
    );

    if (!userParticipant) {
      return res.status(404).json({
        success: false,
        message: 'You are not a participant in this group.'
      });
    }

    const expenses = await Expense.find({ group: id });

    const { balances } = calculateBalances(expenses, group.participants);
    const balanceMatrix = calculateBalanceMatrix(expenses, group.participants);
    
    const userBalance = balances.find(
      b => b.participantId.toString() === userParticipant._id.toString()
    );

    if (!userBalance) {
      return res.status(404).json({
        success: false,
        message: 'Balance information not found for your account.'
      });
    }

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
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      success: false,
      message
    });
  }
};
