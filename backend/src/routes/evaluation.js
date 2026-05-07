const express = require('express');
const { protect } = require('../middleware/auth');
const EvaluationLog = require('../models/EvaluationLog');

const router = express.Router();
router.use(protect);

router.post('/log', async (req, res, next) => {
  try {
    const log = await EvaluationLog.create({
      ...req.body,
      userId: req.user._id,
    });
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});

router.get('/results', async (req, res, next) => {
  try {
    const logs = await EvaluationLog.find({ userId: req.user._id })
      .sort({ createdAt: 1 });

    const summary = {
      manual: { count: 0, totalDurationMs: 0, correct: 0 },
      adaptive: { count: 0, totalDurationMs: 0, correct: 0 },
    };
    for (const log of logs) {
      const m = summary[log.mode];
      if (!m) continue;
      m.count += 1;
      m.totalDurationMs += log.durationMs;
      if (log.wasCorrect) m.correct += 1;
    }

    const finalise = (m) => ({
      count: m.count,
      meanDurationMs: m.count ? Math.round(m.totalDurationMs / m.count) : 0,
      accuracy: m.count ? m.correct / m.count : 0,
    });

    res.json({
      logs,
      summary: {
        manual: finalise(summary.manual),
        adaptive: finalise(summary.adaptive),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
