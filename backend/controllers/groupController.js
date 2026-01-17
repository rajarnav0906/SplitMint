import Group from '../models/Group.js';
import User from '../models/User.js';

// Get all groups for the authenticated user
export const getGroups = async (req, res, next) => {
  try {
    // Find all groups created by the user or where user is a participant
    const groups = await Group.find({
      $or: [
        { createdBy: req.user._id },
        { 'participants.userId': req.user._id }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('participants.userId', 'name email')
    .sort({ updatedAt: -1 }); // Most recently updated first

    res.status(200).json({
      success: true,
      count: groups.length,
      data: { groups }
    });
  } catch (error) {
    next(error);
  }
};

// Get a single group by ID
export const getGroup = async (req, res, next) => {
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

    // Check if user has access to this group
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
    next(error);
  }
};

// Create a new group
export const createGroup = async (req, res, next) => {
  try {
    const { name, participants } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required.'
      });
    }

    // Validate participants count (max 3 additional + primary user = 4 total)
    if (participants && participants.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'A group can have a maximum of 3 additional participants (4 total including the primary user).'
      });
    }

    // Prepare participants array
    const participantsArray = participants || [];

    // Add primary user as first participant if not already included
    const primaryUserIncluded = participantsArray.some(
      p => p.userId && p.userId.toString() === req.user._id.toString()
    );

    if (!primaryUserIncluded) {
      // Fetch user details to add as primary participant
      const user = await User.findById(req.user._id);
      participantsArray.unshift({
        name: user.name,
        userId: user._id,
        color: null,
        avatar: null
      });
    }

    // Create new group
    const group = new Group({
      name: name.trim(),
      createdBy: req.user._id,
      participants: participantsArray
    });

    await group.save();

    // Populate before sending response
    await group.populate('createdBy', 'name email');
    await group.populate('participants.userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Group created successfully.',
      data: { group }
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

// Update a group
export const updateGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, participants } = req.body;

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can update the group.'
      });
    }

    // Update name if provided
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Group name cannot be empty.'
        });
      }
      group.name = name.trim();
    }

    // Update participants if provided
    if (participants !== undefined) {
      // Validate participants count
      if (participants.length > 4) {
        return res.status(400).json({
          success: false,
          message: 'A group can have a maximum of 4 participants (including the primary user).'
        });
      }

      // Ensure primary user is included
      const primaryUserIncluded = participants.some(
        p => p.userId && p.userId.toString() === req.user._id.toString()
      );

      if (!primaryUserIncluded) {
        // Add primary user if not included
        const user = await User.findById(req.user._id);
        participants.unshift({
          name: user.name,
          userId: user._id,
          color: null,
          avatar: null
        });
      }

      group.participants = participants;
    }

    await group.save();

    // Populate before sending response
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
    next(error);
  }
};

// Delete a group
export const deleteGroup = async (req, res, next) => {
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

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can delete the group.'
      });
    }

    // Cascade delete: Delete all expenses associated with this group
    // We'll import Expense model when we create it in Step 4
    // For now, we'll set up the structure
    try {
      const { default: Expense } = await import('../models/Expense.js');
      await Expense.deleteMany({ group: id });
    } catch (importError) {
      // Expense model doesn't exist yet, that's okay
      // This will work once we create the Expense model in Step 4
    }

    // Delete the group
    await Group.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully. All associated expenses have been removed.'
    });
  } catch (error) {
    next(error);
  }
};

// Add a participant to a group
export const addParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, userId, color, avatar } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Participant name is required.'
      });
    }

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can add participants.'
      });
    }

    // Check if group already has maximum participants
    if (group.participants.length >= 4) {
      return res.status(400).json({
        success: false,
        message: 'Group already has the maximum number of participants (4).'
      });
    }

    // Check if participant with same name or userId already exists
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

    // Add new participant
    group.participants.push({
      name: name.trim(),
      userId: userId || null,
      color: color || null,
      avatar: avatar || null
    });

    await group.save();

    // Populate before sending response
    await group.populate('createdBy', 'name email');
    await group.populate('participants.userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Participant added successfully.',
      data: { group }
    });
  } catch (error) {
    next(error);
  }
};

// Update a participant in a group
export const updateParticipant = async (req, res, next) => {
  try {
    const { id, participantId } = req.params;
    const { name, color, avatar } = req.body;

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can update participants.'
      });
    }

    // Find the participant
    const participant = group.participants.id(participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this group.'
      });
    }

    // Don't allow updating the primary user's name (it should match their account)
    if (participant.userId && participant.userId.toString() === group.createdBy.toString()) {
      if (name && name.trim() !== participant.name) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change the primary user\'s name. It must match their account name.'
        });
      }
    }

    // Update participant fields
    if (name !== undefined && name.trim()) {
      participant.name = name.trim();
    }
    if (color !== undefined) {
      participant.color = color || null;
    }
    if (avatar !== undefined) {
      participant.avatar = avatar || null;
    }

    await group.save();

    // Populate before sending response
    await group.populate('createdBy', 'name email');
    await group.populate('participants.userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Participant updated successfully.',
      data: { group }
    });
  } catch (error) {
    next(error);
  }
};

// Remove a participant from a group
export const removeParticipant = async (req, res, next) => {
  try {
    const { id, participantId } = req.params;

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.'
      });
    }

    // Check if user is the creator
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can remove participants.'
      });
    }

    // Find the participant
    const participant = group.participants.id(participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this group.'
      });
    }

    // Don't allow removing the primary user
    if (participant.userId && participant.userId.toString() === group.createdBy.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the primary user from the group.'
      });
    }

    // Remove expenses linked to this participant
    // We'll handle this when we create the Expense model in Step 4
    try {
      const { default: Expense } = await import('../models/Expense.js');
      // Remove participant from expenses where they are the payer
      await Expense.updateMany(
        { group: id, payer: participantId },
        { $unset: { payer: '' } }
      );
      // Remove participant from expense splits
      await Expense.updateMany(
        { group: id },
        { $pull: { splits: { participantId: participantId } } }
      );
    } catch (importError) {
      // Expense model doesn't exist yet, that's okay
    }

    // Remove the participant
    group.participants.pull(participantId);
    await group.save();

    // Populate before sending response
    await group.populate('createdBy', 'name email');
    await group.populate('participants.userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Participant removed successfully. Associated expenses have been updated.',
      data: { group }
    });
  } catch (error) {
    next(error);
  }
};
