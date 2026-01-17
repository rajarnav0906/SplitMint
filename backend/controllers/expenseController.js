import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import { calculateSplits } from '../services/splitCalculator.js';

// Get all expenses for a group
export const getExpenses = async (req, res, next) => {
  try {
    const { groupId } = req.query;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required. Provide it as a query parameter: ?groupId=...'
      });
    }

    // Verify group exists and user has access
    const group = await Group.findById(groupId);
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
        message: 'You do not have access to expenses for this group.'
      });
    }

    // Get all expenses for the group, sorted by date (newest first)
    const expenses = await Expense.find({ group: groupId })
      .populate('createdBy', 'name email')
      .populate('group', 'name')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: { expenses }
    });
  } catch (error) {
    next(error);
  }
};

// Get a single expense by ID
export const getExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate('createdBy', 'name email')
      .populate('group', 'name participants');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    // Verify user has access to the group
    const group = await Group.findById(expense.group._id);
    const hasAccess = group.createdBy.toString() === req.user._id.toString() ||
      group.participants.some(p => p.userId && p.userId.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this expense.'
      });
    }

    res.status(200).json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new expense
export const createExpense = async (req, res, next) => {
  try {
    const { amount, description, date, payer, groupId, splitMode, participantIds, splits } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount is required and must be greater than 0.'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Expense description is required.'
      });
    }

    if (!payer) {
      return res.status(400).json({
        success: false,
        message: 'Payer (participant) is required.'
      });
    }

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required.'
      });
    }

    if (!splitMode || !['equal', 'custom', 'percentage'].includes(splitMode)) {
      return res.status(400).json({
        success: false,
        message: 'Valid split mode is required (equal, custom, or percentage).'
      });
    }

    // Verify group exists and user has access
    const group = await Group.findById(groupId);
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
        message: 'You do not have access to create expenses for this group.'
      });
    }

    // Verify payer is a valid participant in the group
    const payerExists = group.participants.some(
      p => p._id.toString() === payer.toString()
    );

    if (!payerExists) {
      return res.status(400).json({
        success: false,
        message: 'Payer must be a participant in the group.'
      });
    }

    // Calculate splits based on split mode
    let calculatedSplits;
    try {
      if (splitMode === 'equal') {
        if (!participantIds || participantIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Participant IDs are required for equal split mode.'
          });
        }

        // Verify all participant IDs are valid
        const validParticipants = participantIds.every(pid =>
          group.participants.some(p => p._id.toString() === pid.toString())
        );

        if (!validParticipants) {
          return res.status(400).json({
            success: false,
            message: 'All participant IDs must be valid participants in the group.'
          });
        }

        calculatedSplits = calculateSplits(splitMode, amount, participantIds, null);
      } else {
        // Custom or percentage mode
        if (!splits || splits.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Splits are required for custom or percentage split mode.'
          });
        }

        // Verify all participant IDs in splits are valid
        const validParticipants = splits.every(split =>
          group.participants.some(p => p._id.toString() === split.participantId.toString())
        );

        if (!validParticipants) {
          return res.status(400).json({
            success: false,
            message: 'All participant IDs in splits must be valid participants in the group.'
          });
        }

        calculatedSplits = calculateSplits(splitMode, amount, null, splits);
      }
    } catch (splitError) {
      return res.status(400).json({
        success: false,
        message: splitError.message
      });
    }

    // Create new expense
    const expense = new Expense({
      amount: parseFloat(amount),
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      payer,
      group: groupId,
      splitMode,
      splits: calculatedSplits,
      createdBy: req.user._id
    });

    await expense.save();

    // Populate before sending response
    await expense.populate('createdBy', 'name email');
    await expense.populate('group', 'name');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully.',
      data: { expense }
    });
  } catch (error) {
    // Handle validation errors
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

// Update an expense
export const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, description, date, payer, splitMode, participantIds, splits } = req.body;

    // Find the expense
    const expense = await Expense.findById(id).populate('group');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    // Check if user is the creator or has access to the group
    const group = await Group.findById(expense.group._id);
    const hasAccess = expense.createdBy.toString() === req.user._id.toString() ||
      group.createdBy.toString() === req.user._id.toString() ||
      group.participants.some(p => p.userId && p.userId.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this expense.'
      });
    }

    // Update fields if provided
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Expense amount must be greater than 0.'
        });
      }
      expense.amount = parseFloat(amount);
    }

    if (description !== undefined) {
      if (!description || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Expense description cannot be empty.'
        });
      }
      expense.description = description.trim();
    }

    if (date !== undefined) {
      expense.date = new Date(date);
    }

    if (payer !== undefined) {
      // Verify payer is a valid participant
      const payerExists = group.participants.some(
        p => p._id.toString() === payer.toString()
      );

      if (!payerExists) {
        return res.status(400).json({
          success: false,
          message: 'Payer must be a participant in the group.'
        });
      }
      expense.payer = payer;
    }

    // Recalculate splits if split mode or related data changed
    if (splitMode !== undefined || participantIds !== undefined || splits !== undefined) {
      const modeToUse = splitMode || expense.splitMode;
      const amountToUse = amount !== undefined ? parseFloat(amount) : expense.amount;

      let calculatedSplits;
      try {
        if (modeToUse === 'equal') {
          const idsToUse = participantIds || expense.splits.map(s => s.participantId);
          calculatedSplits = calculateSplits(modeToUse, amountToUse, idsToUse, null);
        } else {
          const splitsToUse = splits || expense.splits;
          calculatedSplits = calculateSplits(modeToUse, amountToUse, null, splitsToUse);
        }
      } catch (splitError) {
        return res.status(400).json({
          success: false,
          message: splitError.message
        });
      }

      expense.splitMode = modeToUse;
      expense.splits = calculatedSplits;
    }

    await expense.save();

    // Populate before sending response
    await expense.populate('createdBy', 'name email');
    await expense.populate('group', 'name');

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully.',
      data: { expense }
    });
  } catch (error) {
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

// Delete an expense
export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the expense
    const expense = await Expense.findById(id).populate('group');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    // Check if user is the creator or has access to the group
    const group = await Group.findById(expense.group._id);
    const hasAccess = expense.createdBy.toString() === req.user._id.toString() ||
      group.createdBy.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this expense.'
      });
    }

    // Delete the expense
    await Expense.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
