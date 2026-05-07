const Rule = require('../models/Rule');

const tokenise = (description) => {
  const lower = description.toLowerCase().trim();
  const tokens = lower
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
  return { tokens, lower };
};

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
