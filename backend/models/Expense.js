import mongoose from 'mongoose';

// Split schema - embedded document within Expense
const splitSchema = new mongoose.Schema({
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Participant ID is required for split']
  },
  amount: {
    type: Number,
    required: [true, 'Split amount is required'],
    min: [0, 'Split amount cannot be negative']
  },
  percentage: {
    type: Number,
    default: null // Only used for percentage split mode
  }
}, { _id: false });

// Expense schema definition
const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0.01, 'Expense amount must be greater than 0']
  },
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Payer (participant) is required']
    // References a participant _id from the group
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group is required']
  },
  splitMode: {
    type: String,
    required: [true, 'Split mode is required'],
    enum: {
      values: ['equal', 'custom', 'percentage'],
      message: 'Split mode must be one of: equal, custom, or percentage'
    }
  },
  splits: {
    type: [splitSchema],
    required: [true, 'Splits are required'],
    validate: {
      validator: function(splits) {
        // Ensure at least one split exists
        return splits && splits.length > 0;
      },
      message: 'At least one split is required'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Expense creator is required']
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Index for faster queries
expenseSchema.index({ group: 1 });
expenseSchema.index({ payer: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ createdBy: 1 });

// Create and export Expense model
const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
