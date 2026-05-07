const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Rule = require('../src/models/Rule');
const {
  suggestCategory,
  learnFromCorrection,
  tokenise,
} = require('../src/utils/categoriser');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Rule.deleteMany({});
});

describe('tokenise()', () => {
  test('lowercases and splits on non-alphanumeric characters', () => {
    const { tokens } = tokenise('Uber-Eats Order #1234');
    expect(tokens).toEqual(['uber', 'eats', 'order', '1234']);
  });

  test('drops tokens shorter than 2 characters', () => {
    const { tokens } = tokenise('a Tesco trip');
    expect(tokens).toEqual(['tesco', 'trip']);
  });
});

describe('suggestCategory()', () => {
  test('returns Other with confidence 0 when no rules exist', async () => {
    const result = await suggestCategory('mystery shop', null);
    expect(result.category).toBe('Other');
    expect(result.confidence).toBe(0);
  });

  test('matches a global rule via substring', async () => {
    await Rule.create({ userId: null, keyword: 'tesco', category: 'Groceries', priority: 1 });
    const result = await suggestCategory('Tesco Express Aldgate', null);
    expect(result.category).toBe('Groceries');
    expect(result.matchedKeyword).toBe('tesco');
  });

  test('most-specific keyword wins (uber eats beats uber)', async () => {
    await Rule.create({ userId: null, keyword: 'uber', category: 'Transport', priority: 1 });
    await Rule.create({ userId: null, keyword: 'uber eats', category: 'Food', priority: 1 });

    const result = await suggestCategory('Uber Eats Friday dinner', null);
    expect(result.category).toBe('Food');
    expect(result.matchedKeyword).toBe('uber eats');
  });

  test('personal rules outrank global rules', async () => {
    const userId = new mongoose.Types.ObjectId();
    await Rule.create({ userId: null, keyword: 'amazon', category: 'Other', priority: 1 });
    await Rule.create({ userId, keyword: 'amazon', category: 'Education', priority: 10 });

    const result = await suggestCategory('Amazon textbook', userId);
    expect(result.category).toBe('Education');
  });
});

describe('learnFromCorrection()', () => {
  test('creates a new personal rule on first correction', async () => {
    const userId = new mongoose.Types.ObjectId();
    const rule = await learnFromCorrection('Spoons night out', 'Entertainment', userId);

    expect(rule).not.toBeNull();
    expect(rule.category).toBe('Entertainment');
    expect(rule.userId.toString()).toBe(userId.toString());
    expect(rule.priority).toBe(10);
    expect(rule.correctionCount).toBe(1);
  });

  test('updates an existing rule and increments correctionCount', async () => {
    const userId = new mongoose.Types.ObjectId();
    await learnFromCorrection('Spoons night out', 'Entertainment', userId);
    await learnFromCorrection('Spoons brunch', 'Food', userId);

    const all = await Rule.find({ userId });
    expect(all).toHaveLength(1);
    expect(all[0].category).toBe('Food');
    expect(all[0].correctionCount).toBe(2);
  });

  test('after correction, suggestCategory returns the learned category', async () => {
    const userId = new mongoose.Types.ObjectId();
    await Rule.create({ userId: null, keyword: 'gym', category: 'Other', priority: 1 });

    const before = await suggestCategory('Gym membership', userId);
    expect(before.category).toBe('Other');

    await learnFromCorrection('Gym membership', 'Bills', userId);
    const after = await suggestCategory('Gym membership renewal', userId);
    expect(after.category).toBe('Bills');
  });
});
