const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  suggest,
  createExpense,
  listExpenses,
  getSummary,
  updateExpense,
  deleteExpense,
  deleteAllExpenses,
  getCategories,
} = require('../controllers/expenseController');

const router = express.Router();

// All expense routes require authentication.
router.use(protect);

router.get('/categories', getCategories);
router.get('/summary', getSummary);

router.post('/suggest', suggest);

router.post(
  '/',
  [
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  createExpense
);

router.get('/', listExpenses);
router.delete('/', deleteAllExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
