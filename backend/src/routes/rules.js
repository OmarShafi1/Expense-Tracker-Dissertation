const express = require('express');
const { protect } = require('../middleware/auth');
const { listRules, deleteRule } = require('../controllers/ruleController');

const router = express.Router();
router.use(protect);

router.get('/', listRules);
router.delete('/:id', deleteRule);

module.exports = router;
