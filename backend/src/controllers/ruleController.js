const Rule = require('../models/Rule');

/**
 * GET /api/rules
 * Returns the authenticated user's personal rules and all global rules.
 * Showing the rules to the user is the "transparency" pillar of the
 * adaptive design (Amershi et al., 2014).
 */
const listRules = async (req, res, next) => {
  try {
    const personal = await Rule.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    const global = await Rule.find({ userId: null }).sort({ keyword: 1 });
    res.json({ personal, global });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rules/:id
 * Lets a user delete one of their personal rules (e.g. they corrected
 * an expense by accident and want to undo the learning step).
 */
const deleteRule = async (req, res, next) => {
  try {
    const rule = await Rule.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id, // can only delete YOUR rules
    });
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    res.json({ message: 'Rule deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listRules, deleteRule };
