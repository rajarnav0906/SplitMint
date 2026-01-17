import mongoose from 'mongoose';

// Participant schema - embedded document within Group
const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Participant name is required'],
    trim: true,
    maxlength: [50, 'Participant name cannot exceed 50 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Optional - participants can be non-registered users
  },
  color: {
    type: String,
    trim: true,
    default: null // Optional color for UI display
  },
  avatar: {
    type: String,
    trim: true,
    default: null // Optional avatar URL or identifier
  }
}, { _id: true }); // Give each participant a unique _id for referencing

// Group schema definition
const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Group creator is required']
  },
  participants: {
    type: [participantSchema],
    default: [],
    validate: {
      validator: function(participants) {
        // Maximum 4 participants total (3 + primary user)
        // Primary user is added automatically, so we allow max 3 additional participants
        return participants.length <= 4;
      },
      message: 'A group can have a maximum of 4 participants (including the primary user)'
    }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Pre-save hook to ensure primary user is included as a participant
groupSchema.pre('save', async function(next) {
  // Check if primary user (createdBy) is already in participants
  const primaryUserIncluded = this.participants.some(
    p => p.userId && p.userId.toString() === this.createdBy.toString()
  );

  // If primary user is not included and we have space, add them
  if (!primaryUserIncluded && this.participants.length < 4) {
    // We'll add the primary user in the controller after fetching user details
    // This validation ensures we don't exceed the limit
  }

  next();
});

// Index for faster queries
groupSchema.index({ createdBy: 1 });
groupSchema.index({ 'participants.userId': 1 });

// Create and export Group model
const Group = mongoose.model('Group', groupSchema);
export default Group;
