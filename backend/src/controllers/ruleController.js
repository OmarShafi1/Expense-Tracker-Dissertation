const Rule = require('../models/Rule');

const listRules = async (req, res, next) => {
  try {
    const personal = await Rule.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    const global = await Rule.find({ userId: null }).sort({ keyword: 1 });
    res.json({ personal, global });
  } catch (error) {
    next(error);
  }
};

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
