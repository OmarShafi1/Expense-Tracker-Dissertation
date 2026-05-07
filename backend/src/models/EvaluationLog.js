const mongoose = require('mongoose');

const evaluationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ['manual', 'adaptive'],
      required: true,
    },
    taskId: {
      type: String,
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMs: { type: Number, required: true },
    correctCategory: { type: String },
    chosenCategory: { type: String },
    wasCorrect: { type: Boolean },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EvaluationLog', evaluationLogSchema);
