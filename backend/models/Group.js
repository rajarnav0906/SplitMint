import mongoose from 'mongoose';

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
    default: null
  },
  color: {
    type: String,
    trim: true,
    default: null
  },
  avatar: {
    type: String,
    trim: true,
    default: null
  }
}, { _id: true });

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
        return participants.length <= 4;
      },
      message: 'A group can have a maximum of 4 participants (including the primary user)'
    }
  }
}, {
  timestamps: true
});

groupSchema.index({ createdBy: 1 });
groupSchema.index({ 'participants.userId': 1 });

const Group = mongoose.model('Group', groupSchema);
export default Group;
