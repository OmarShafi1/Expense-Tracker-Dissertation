const mongoose = require('mongoose');

const CATEGORIES = [
  'Food',
  'Transport',
  'Groceries',
  'Entertainment',
  'Bills',
  'Education',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
      default: 'Other',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    wasAutoCategorised: {
      type: Boolean,
      default: false,
    },
    wasOverridden: {
      type: Boolean,
      default: false,
    },
    suggestedCategory: {
      type: String,
      enum: [...CATEGORIES, null],
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index speeds up queries that filter by user and date range.
expenseSchema.index({ userId: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
module.exports.CATEGORIES = CATEGORIES;
