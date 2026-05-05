/**
 * Seeds the database with the default global categorisation rules.
 *
 * Run from the backend folder:
 *   node src/utils/seedRules.js
 *
 * Existing global rules are not duplicated thanks to the unique
 * (userId, keyword) index in the Rule model.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Rule = require('../models/Rule');
const DEFAULT_RULES = require('./defaultRules');

const seed = async () => {
  await connectDB();
  let inserted = 0;
  let skipped = 0;

  for (const r of DEFAULT_RULES) {
    try {
      await Rule.create({ ...r, userId: null, priority: 1 });
      inserted++;
    } catch (err) {
      if (err.code === 11000) {
        skipped++;
      } else {
        console.error('Failed to insert rule', r, err.message);
      }
    }
  }

  console.log(`Seed complete. Inserted: ${inserted}, skipped (already exists): ${skipped}`);
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
