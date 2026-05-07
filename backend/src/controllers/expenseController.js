const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const { CATEGORIES } = require('../models/Expense');
const {
  suggestCategory,
  learnFromCorrection,
} = require('../utils/categoriser');

const suggest = async (req, res, next) => {
  try {
    const { description } = req.body;
    const result = await suggestCategory(description, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { amount, description, category, date, suggestedCategory } = req.body;

    const wasAutoCategorised = Boolean(suggestedCategory) && suggestedCategory === category;
    const wasOverridden =
      Boolean(suggestedCategory) && suggestedCategory !== category;

    const expense = await Expense.create({
      userId: req.user._id,
      amount,
      description,
      category,
      date: date || new Date(),
      wasAutoCategorised,
      wasOverridden,
      suggestedCategory: suggestedCategory || null,
    });

    if (wasOverridden) {
      await learnFromCorrection(description, category, req.user._id);
    }

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

const listExpenses = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    const filter = { userId: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (category && category !== 'All') {
      filter.category = category;
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const match = { userId };
    if (Object.keys(dateFilter).length) match.date = dateFilter;

    const byCategory = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalAgg = await Expense.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const total = totalAgg[0]?.total || 0;
    const count = totalAgg[0]?.count || 0;

    const accuracyAgg = await Expense.aggregate([
      { $match: { ...match, suggestedCategory: { $ne: null } } },
      {
        $group: {
          _id: null,
          suggested: { $sum: 1 },
          accepted: { $sum: { $cond: ['$wasAutoCategorised', 1, 0] } },
        },
      },
    ]);

    const acc = accuracyAgg[0];
    const accuracy = acc && acc.suggested > 0 ? acc.accepted / acc.suggested : null;

    res.json({
      total,
      count,
      byCategory,
      adaptiveAccuracy: accuracy,
    });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ _id: id, userId: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const previousCategory = expense.category;
    const { amount, description, category, date } = req.body;

    if (amount !== undefined) expense.amount = amount;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = date;

    if (category !== undefined && category !== previousCategory) {
      expense.category = category;
      expense.wasOverridden = true;
      await learnFromCorrection(expense.description, category, req.user._id);
    }

    await expense.save();
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Expense.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });
    if (!result) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
};

const deleteAllExpenses = async (req, res, next) => {
  try {
    await Expense.deleteMany({ userId: req.user._id });
    res.json({ message: 'All expenses deleted' });
  } catch (error) {
    next(error);
  }
};

const getCategories = (req, res) => {
  res.json({ categories: CATEGORIES });
};

module.exports = {
  suggest,
  createExpense,
  listExpenses,
  getSummary,
  updateExpense,
  deleteExpense,
  deleteAllExpenses,
  getCategories,
};
