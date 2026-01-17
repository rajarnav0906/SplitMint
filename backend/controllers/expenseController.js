import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import { calculateSplits } from '../services/splitCalculator.js';

export const getExpenses = async (req, res) => {
  try {
    const { groupId } = req.query;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required. Provide it as a query parameter: ?groupId=...'
      });
    }

    const group = await Group.findById(groupId);
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
        message: 'You do not have access to expenses for this group.'
      });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate('payer', 'name')
      .populate('createdBy', 'name email')
      .populate('group', 'name')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: { expenses }
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

export const getExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate('createdBy', 'name email')
      .populate('group', 'name participants')
      .populate('payer', 'name');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

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
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      success: false,
      message
    });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { amount, description, date, payer, group, splitMode, participantIds, splits } = req.body;

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

    if (description.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Expense description cannot exceed 200 characters.'
      });
    }

    if (!payer) {
      return res.status(400).json({
        success: false,
        message: 'Payer (participant) is required.'
      });
    }

    if (!group) {
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

    const groupDoc = await Group.findById(group);
    if (!groupDoc) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    const hasAccess = groupDoc.createdBy.toString() === req.user._id.toString() ||
      groupDoc.participants.some(p => p.userId && p.userId.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to create expenses for this group.'
      });
    }

    const payerExists = groupDoc.participants.some(
      p => p._id.toString() === payer.toString()
    );

    if (!payerExists) {
      return res.status(400).json({
        success: false,
        message: 'Payer must be a valid participant in the group.'
      });
    }

    let calculatedSplits;
    try {
      if (splitMode === 'equal') {
        if (!participantIds || participantIds.length === 0) {
          const allParticipantIds = groupDoc.participants.map(p => p._id.toString());
          calculatedSplits = calculateSplits(splitMode, amount, allParticipantIds, null);
        } else {
          if (participantIds.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'At least one participant must be selected for the split.'
            });
          }

          const validParticipants = participantIds.every(pid =>
            groupDoc.participants.some(p => p._id.toString() === pid.toString())
          );

          if (!validParticipants) {
            return res.status(400).json({
              success: false,
              message: 'All selected participants must be valid participants in the group.'
            });
          }

          const uniqueParticipantIds = [...new Set(participantIds)];
          if (uniqueParticipantIds.length !== participantIds.length) {
            return res.status(400).json({
              success: false,
              message: 'Duplicate participants are not allowed in the split.'
            });
          }

          calculatedSplits = calculateSplits(splitMode, amount, uniqueParticipantIds, null);
        }
      } else if (splitMode === 'percentage') {
        if (!splits || splits.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Splits are required for percentage split mode.'
          });
        }

        const validParticipants = splits.every(split =>
          groupDoc.participants.some(p => p._id.toString() === split.participantId.toString())
        );

        if (!validParticipants) {
          return res.status(400).json({
            success: false,
            message: 'All participant IDs in splits must be valid participants in the group.'
          });
        }

        const participantIdSet = new Set();
        for (const split of splits) {
          if (participantIdSet.has(split.participantId.toString())) {
            return res.status(400).json({
              success: false,
              message: 'Each participant can only appear once in the split.'
            });
          }
          participantIdSet.add(split.participantId.toString());
        }

        calculatedSplits = calculateSplits(splitMode, amount, null, splits);
      } else if (splitMode === 'custom') {
        if (!splits || splits.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Splits are required for custom split mode.'
          });
        }

        const validParticipants = splits.every(split =>
          groupDoc.participants.some(p => p._id.toString() === split.participantId.toString())
        );

        if (!validParticipants) {
          return res.status(400).json({
            success: false,
            message: 'All participant IDs in splits must be valid participants in the group.'
          });
        }

        const participantIdSet = new Set();
        for (const split of splits) {
          if (participantIdSet.has(split.participantId.toString())) {
            return res.status(400).json({
              success: false,
              message: 'Each participant can only appear once in the split.'
            });
          }
          participantIdSet.add(split.participantId.toString());
        }

        calculatedSplits = calculateSplits(splitMode, amount, null, splits);
      }
    } catch (splitError) {
      return res.status(400).json({
        success: false,
        message: splitError.message || 'Invalid split configuration.'
      });
    }

    if (!calculatedSplits || calculatedSplits.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one split is required.'
      });
    }

    const expense = new Expense({
      amount: parseFloat(amount),
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      payer,
      group,
      splitMode,
      splits: calculatedSplits,
      createdBy: req.user._id
    });

    await expense.save();

    await expense.populate('createdBy', 'name email');
    await expense.populate('group', 'name');
    await expense.populate('payer', 'name');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully.',
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
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      success: false,
      message
    });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, date, payer, splitMode, participantIds, splits } = req.body;

    const expense = await Expense.findById(id).populate('group');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

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
      if (description.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Expense description cannot exceed 200 characters.'
        });
      }
      expense.description = description.trim();
    }

    if (date !== undefined) {
      expense.date = new Date(date);
    }

    if (payer !== undefined) {
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

    if (splitMode !== undefined || participantIds !== undefined || splits !== undefined) {
      const modeToUse = splitMode || expense.splitMode;
      const amountToUse = amount !== undefined ? parseFloat(amount) : expense.amount;

      let calculatedSplits;
      try {
        if (modeToUse === 'equal') {
          const idsToUse = participantIds || expense.splits.map(s => s.participantId);
          if (!idsToUse || idsToUse.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'At least one participant must be selected for the split.'
            });
          }
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

    await expense.populate('createdBy', 'name email');
    await expense.populate('group', 'name');
    await expense.populate('payer', 'name');

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
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      success: false,
      message
    });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id).populate('group');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    const group = await Group.findById(expense.group._id);
    const hasAccess = expense.createdBy.toString() === req.user._id.toString() ||
      group.createdBy.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this expense.'
      });
    }

    await Expense.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.'
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
