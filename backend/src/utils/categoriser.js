/**
 * Adaptive Rule-Based Categorisation Engine
 * =========================================
 *
 * This module implements the core adaptive categorisation logic
 * described in the project's literature review and design chapters.
 *
 * It uses a transparent rule-based approach (Sommerville, 2015)
 * augmented with adaptive learning from user corrections (Amershi
 * et al., 2014; Fails and Olsen, 2003). Unlike machine-learning
 * classifiers, this approach:
 *
 *   - Requires no training data (cold-start friendly)
 *   - Is fully explainable to the user
 *   - Adapts immediately to a single correction
 *   - Remains efficient on small datasets
 *
 * Matching strategy:
 *   1. Tokenise the description (lowercase, alphanumeric only)
 *   2. Look up rules whose keyword is a substring of any token
 *      OR a substring of the full description.
 *   3. Personal (user-owned) rules outrank global default rules.
 *   4. Among rules of equal priority, the rule with the LONGEST
 *      keyword wins (most-specific-match heuristic).
 *   5. Ties are broken by correctionCount (most reinforced wins).
 */

const Rule = require('../models/Rule');

/**
 * Tokenises an expense description into lowercase alphanumeric tokens.
 * Also returns the raw lowercased description for substring fallback.
 */
const tokenise = (description) => {
  const lower = description.toLowerCase().trim();
  const tokens = lower
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
  return { tokens, lower };
};

/**
 * Suggests a category for the given description.
 *
 * @param {string} description - The expense description entered by the user.
 * @param {string|null} userId - The current user's ID (or null for unauth).
 * @returns {Promise<{category: string, matchedKeyword: string|null,
 *                    confidence: number, ruleId: string|null}>}
 */
const suggestCategory = async (description, userId) => {
  if (!description || description.trim().length === 0) {
    return { category: 'Other', matchedKeyword: null, confidence: 0, ruleId: null };
  }

  const { tokens, lower } = tokenise(description);

  // Fetch both personal rules (priority 10) and global rules (priority 1).
  const candidateRules = await Rule.find({
    $or: [{ userId: userId }, { userId: null }],
  }).lean();

  // Score each rule against the description.
  let best = null;

  for (const rule of candidateRules) {
    const kw = rule.keyword.toLowerCase();
    const matches =
      tokens.some((t) => t.includes(kw) || kw.includes(t)) ||
      lower.includes(kw);

    if (!matches) continue;

    // Build a comparable score:
    // priority * 1000 (personal rules dominate)
    // + keyword length (more specific wins)
    // + correctionCount * 0.1 (reinforcement breaks ties)
    const score =
      rule.priority * 1000 + kw.length + rule.correctionCount * 0.1;

    if (!best || score > best.score) {
      best = { rule, score };
    }
  }

  if (!best) {
    return {
      category: 'Other',
      matchedKeyword: null,
      confidence: 0,
      ruleId: null,
    };
  }

  // Confidence heuristic: scaled by priority + reinforcement.
  // 1.0 means high confidence personal rule reinforced by user.
  // 0.5 means a generic global rule with no reinforcement.
  const confidence = Math.min(
    1,
    0.4 +
      best.rule.priority * 0.05 +
      Math.min(best.rule.correctionCount, 5) * 0.1
  );

  return {
    category: best.rule.category,
    matchedKeyword: best.rule.keyword,
    confidence: parseFloat(confidence.toFixed(2)),
    ruleId: best.rule._id.toString(),
  };
};

/**
 * Records that a user has overridden the suggested category.
 *
 * Strategy:
 *   1. Pick the most distinctive token from the description
 *      (longest token, with a sensible minimum length).
 *   2. If a personal rule for that token already exists, update
 *      its category to the new one and increment correctionCount.
 *   3. Otherwise create a new personal rule with priority 10.
 *
 * This is the adaptive step described in section 2.4 of the
 * literature review.
 */
const learnFromCorrection = async (description, newCategory, userId) => {
  const { tokens } = tokenise(description);
  if (tokens.length === 0) return null;

  // Pick the longest token as the most distinctive keyword.
  // Prefer tokens of length >= 3 to avoid noise like "uk", "01".
  const candidateTokens = tokens
    .filter((t) => t.length >= 3)
    .sort((a, b) => b.length - a.length);
  const keyword = candidateTokens[0] || tokens[0];

  // Look for an existing personal rule on this keyword.
  const existing = await Rule.findOne({ userId, keyword });

  if (existing) {
    existing.category = newCategory;
    existing.correctionCount += 1;
    await existing.save();
    return existing;
  }

  const created = await Rule.create({
    userId,
    keyword,
    category: newCategory,
    priority: 10,
    correctionCount: 1,
  });
  return created;
};

module.exports = {
  suggestCategory,
  learnFromCorrection,
  tokenise, // exported for unit tests
};
