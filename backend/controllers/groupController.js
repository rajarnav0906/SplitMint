import Group from '../models/Group.js';
import User from '../models/User.js';

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { createdBy: req.user._id },
        { 'participants.userId': req.user._id }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('participants.userId', 'name email')
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      data: { groups }
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

export const getGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id)
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    const hasAccess = group.createdBy._id.toString() === req.user._id.toString() ||
      group.participants.some(p => p.userId && p.userId._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this group.'
      });
    }

    res.status(200).json({
      success: true,
      data: { group }
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

export const createGroup = async (req, res) => {
  try {
    const { name, participants } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required.'
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Group name cannot exceed 100 characters.'
      });
    }

    if (participants && participants.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'A group can have a maximum of 3 additional participants (4 total including the primary user).'
      });
    }

    const participantsArray = participants || [];

    const userIds = new Set();
    for (const p of participantsArray) {
      if (p.userId) {
        if (userIds.has(p.userId.toString())) {
          return res.status(400).json({
            success: false,
            message: 'Duplicate users are not allowed in the group.'
          });
        }
        userIds.add(p.userId.toString());
      }
    }

    const primaryUserIncluded = participantsArray.some(
      p => p.userId && p.userId.toString() === req.user._id.toString()
    );

    if (!primaryUserIncluded) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }
      participantsArray.unshift({
        name: user.name,
        userId: user._id,
        color: null,
        avatar: null
      });
    } else {
      const primaryUserIndex = participantsArray.findIndex(
        p => p.userId && p.userId.toString() === req.user._id.toString()
      );
      if (primaryUserIndex > 0) {
        const primaryUser = participantsArray.splice(primaryUserIndex, 1)[0];
        participantsArray.unshift(primaryUser);
      }
    }

    const group = new Group({
      name: name.trim(),
      createdBy: req.user._id,
      participants: participantsArray.map(p => ({
        name: p.name,
        userId: p.userId || null,
        color: p.color || null,
        avatar: p.avatar || null
      }))
    });

    await group.save();

    await group.populate('createdBy', 'name email');
    await group.populate('participants.userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Group created successfully.',
      data: { group }
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

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, participants } = req.body;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can update the group.'
      });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Group name cannot be empty.'
        });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Group name cannot exceed 100 characters.'
        });
      }
      group.name = name.trim();
    }

    if (participants !== undefined) {
      if (participants.length > 4) {
        return res.status(400).json({
          success: false,
          message: 'A group can have a maximum of 4 participants (including the primary user).'
        });
      }

      const userIds = new Set();
      for (const p of participants) {
        if (p.userId) {
          if (userIds.has(p.userId.toString())) {
            return res.status(400).json({
              success: false,
              message: 'Duplicate users are not allowed in the group.'
            });
          }
          userIds.add(p.userId.toString());
        }
      }

      const primaryUserIncluded = participants.some(
        p => p.userId && p.userId.toString() === req.user._id.toString()
      );

      if (!primaryUserIncluded) {
        const user = await User.findById(req.user._id);
        participants.unshift({
          name: user.name,
          userId: user._id,
          color: null,
          avatar: null
        });
      }

      group.participants = participants.map(p => ({
        name: p.name,
        userId: p.userId || null,
        color: p.color || null,
        avatar: p.avatar || null
      }));
    }

    await group.save();

    await group.populate('createdBy', 'name email');
    await group.populate('participants.userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Group updated successfully.',
      data: { group }
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

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can delete the group.'
      });
    }

    try {
      const { default: Expense } = await import('../models/Expense.js');
      await Expense.deleteMany({ group: id });
    } catch (importError) {
    }

    await Group.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully. All associated expenses have been removed.'
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

export const addParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, userId, color, avatar } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Participant name is required.'
      });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Participant name cannot exceed 50 characters.'
      });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can add participants.'
      });
    }

    if (group.participants.length >= 4) {
      return res.status(400).json({
        success: false,
        message: 'Group already has the maximum number of participants (4).'
      });
    }

    if (userId) {
      const existingUserParticipant = group.participants.find(
        p => p.userId && p.userId.toString() === userId.toString()
      );

      if (existingUserParticipant) {
        return res.status(409).json({
          success: false,
          message: 'This user is already a participant in the group.'
        });
      }
    }

    const existingParticipant = group.participants.find(
      p => (p.name.toLowerCase() === name.toLowerCase().trim()) ||
           (userId && p.userId && p.userId.toString() === userId)
    );

    if (existingParticipant) {
      return res.status(409).json({
        success: false,
        message: 'A participant with this name or user ID already exists in the group.'
      });
    }

    group.participants.push({
      name: name.trim(),
      userId: userId || null,
      color: color || null,
      avatar: avatar || null
    });

    await group.save();

    await group.populate('createdBy', 'name email');
    await group.populate('participants.userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Participant added successfully.',
      data: { group }
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

export const updateParticipant = async (req, res) => {
  try {
    const { id, participantId } = req.params;
    const { name, color, avatar } = req.body;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can update participants.'
      });
    }

    const participant = group.participants.id(participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this group.'
      });
    }

    if (participant.userId && participant.userId.toString() === group.createdBy.toString()) {
      if (name && name.trim() !== participant.name) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change the primary user\'s name. It must match their account name.'
        });
      }
    }

    if (name !== undefined && name.trim()) {
      if (name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Participant name cannot exceed 50 characters.'
        });
      }
      participant.name = name.trim();
    }
    if (color !== undefined) {
      participant.color = color || null;
    }
    if (avatar !== undefined) {
      participant.avatar = avatar || null;
    }

    await group.save();

    await group.populate('createdBy', 'name email');
    await group.populate('participants.userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Participant updated successfully.',
      data: { group }
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

export const removeParticipant = async (req, res) => {
  try {
    const { id, participantId } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can remove participants.'
      });
    }

    const participant = group.participants.id(participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this group.'
      });
    }

    if (participant.userId && participant.userId.toString() === group.createdBy.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the primary user from the group.'
      });
    }

    try {
      const { default: Expense } = await import('../models/Expense.js');
      
      const expensesAsPayer = await Expense.find({ 
        group: id, 
        payer: participantId 
      });

      if (expensesAsPayer.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot remove participant. They are the payer for ${expensesAsPayer.length} expense(s). Please update or delete those expenses first.`
        });
      }

      const expensesWithSplits = await Expense.find({
        group: id,
        'splits.participantId': participantId
      });

      if (expensesWithSplits.length > 0) {
        await Expense.updateMany(
          { group: id },
          { $pull: { splits: { participantId: participantId } } }
        );
      }
    } catch (importError) {
    }

    group.participants.pull(participantId);
    await group.save();

    await group.populate('createdBy', 'name email');
    await group.populate('participants.userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Participant removed successfully. Associated expenses have been updated.',
      data: { group }
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
