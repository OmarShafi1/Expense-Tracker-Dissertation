const mongoose = require('mongoose');

/**
 * Records data points for the comparative usability evaluation
 * (manual vs adaptive categorisation). Each row is one task
 * completed by one participant in one mode.
 *
 * This data feeds directly into the Testing chapter of the
 * dissertation: task completion time, categorisation accuracy,
 * and (optionally) NASA-TLX / SUS scores recorded after the session.
 */
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
      required: true, // Groups tasks belonging to one test session
    },
    mode: {
      type: String,
      enum: ['manual', 'adaptive'],
      required: true,
    },
    taskId: {
      type: String,
      required: true, // e.g. "task_1_add_uber_expense"
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
