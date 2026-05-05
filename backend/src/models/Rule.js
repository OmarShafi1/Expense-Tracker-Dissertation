const mongoose = require('mongoose');

/**
 * Stores categorisation rules.
 *
 * - Global rules have userId = null. They are the default seed rules
 *   shipped with the system (e.g. "uber" -> Transport).
 * - Personal rules have a userId. They are created or updated when a
 *   user overrides a suggested category. Personal rules ALWAYS win
 *   over global rules (priority field).
 *
 * The matching algorithm uses substring matching on lowercased
 * description tokens, with longer keywords preferred over shorter ones
 * (most-specific-wins). This is the adaptive rule-based approach
 * described in the literature review.
 */
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
