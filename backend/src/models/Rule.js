const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = global default rule
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minlength: 2,
    },
    category: {
      type: String,
      required: true,
    },
    priority: {
      type: Number,
      default: 1, // Personal rules get priority 10, globals stay at 1
    },
    correctionCount: {
      type: Number,
      default: 0, // Increments each time the user reinforces this rule
    },
  },
  { timestamps: true }
);

// One rule per (user, keyword) pair — prevents duplicates.
ruleSchema.index({ userId: 1, keyword: 1 }, { unique: true });

module.exports = mongoose.model('Rule', ruleSchema);
