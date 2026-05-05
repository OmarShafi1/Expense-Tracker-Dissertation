/**
 * Default seed rules for the categorisation engine.
 *
 * These global rules (userId = null) provide the "cold start"
 * categorisation behaviour before the system has learnt any
 * user-specific preferences. The list is deliberately UK-centric
 * (Tesco, Sainsbury's, Greggs, TfL, etc.) since the target
 * population is UK university students.
 */

const DEFAULT_RULES = [
  // --- Transport ---
  { keyword: 'uber', category: 'Transport' },
  { keyword: 'bolt', category: 'Transport' },
  { keyword: 'taxi', category: 'Transport' },
  { keyword: 'train', category: 'Transport' },
  { keyword: 'rail', category: 'Transport' },
  { keyword: 'tfl', category: 'Transport' },
  { keyword: 'oyster', category: 'Transport' },
  { keyword: 'bus', category: 'Transport' },
  { keyword: 'petrol', category: 'Transport' },
  { keyword: 'fuel', category: 'Transport' },
  { keyword: 'parking', category: 'Transport' },
  { keyword: 'national express', category: 'Transport' },
  { keyword: 'megabus', category: 'Transport' },

  // --- Groceries ---
  { keyword: 'tesco', category: 'Groceries' },
  { keyword: 'sainsbury', category: 'Groceries' },
  { keyword: 'asda', category: 'Groceries' },
  { keyword: 'aldi', category: 'Groceries' },
  { keyword: 'lidl', category: 'Groceries' },
  { keyword: 'morrisons', category: 'Groceries' },
  { keyword: 'waitrose', category: 'Groceries' },
  { keyword: 'iceland', category: 'Groceries' },
  { keyword: 'co-op', category: 'Groceries' },
  { keyword: 'coop', category: 'Groceries' },
  { keyword: 'marks and spencer', category: 'Groceries' },
  { keyword: 'groceries', category: 'Groceries' },
  { keyword: 'supermarket', category: 'Groceries' },

  // --- Food (eating out / takeaway) ---
  { keyword: 'mcdonalds', category: 'Food' },
  { keyword: 'kfc', category: 'Food' },
  { keyword: 'subway', category: 'Food' },
  { keyword: 'greggs', category: 'Food' },
  { keyword: 'starbucks', category: 'Food' },
  { keyword: 'costa', category: 'Food' },
  { keyword: 'nero', category: 'Food' },
  { keyword: 'pizza', category: 'Food' },
  { keyword: 'dominos', category: 'Food' },
  { keyword: 'nandos', category: 'Food' },
  { keyword: 'wagamama', category: 'Food' },
  { keyword: 'deliveroo', category: 'Food' },
  { keyword: 'just eat', category: 'Food' },
  { keyword: 'uber eats', category: 'Food' }, // beats "uber" via longer keyword
  { keyword: 'restaurant', category: 'Food' },
  { keyword: 'cafe', category: 'Food' },
  { keyword: 'lunch', category: 'Food' },
  { keyword: 'dinner', category: 'Food' },
  { keyword: 'breakfast', category: 'Food' },
  { keyword: 'coffee', category: 'Food' },

  // --- Entertainment ---
  { keyword: 'netflix', category: 'Entertainment' },
  { keyword: 'spotify', category: 'Entertainment' },
  { keyword: 'disney', category: 'Entertainment' },
  { keyword: 'cinema', category: 'Entertainment' },
  { keyword: 'odeon', category: 'Entertainment' },
  { keyword: 'vue', category: 'Entertainment' },
  { keyword: 'cineworld', category: 'Entertainment' },
  { keyword: 'steam', category: 'Entertainment' },
  { keyword: 'playstation', category: 'Entertainment' },
  { keyword: 'xbox', category: 'Entertainment' },
  { keyword: 'concert', category: 'Entertainment' },
  { keyword: 'pub', category: 'Entertainment' },
  { keyword: 'bar', category: 'Entertainment' },
  { keyword: 'club', category: 'Entertainment' },

  // --- Bills ---
  { keyword: 'rent', category: 'Bills' },
  { keyword: 'electric', category: 'Bills' },
  { keyword: 'gas bill', category: 'Bills' },
  { keyword: 'water', category: 'Bills' },
  { keyword: 'wifi', category: 'Bills' },
  { keyword: 'broadband', category: 'Bills' },
  { keyword: 'mobile', category: 'Bills' },
  { keyword: 'phone bill', category: 'Bills' },
  { keyword: 'council tax', category: 'Bills' },
  { keyword: 'insurance', category: 'Bills' },

  // --- Education ---
  { keyword: 'tuition', category: 'Education' },
  { keyword: 'textbook', category: 'Education' },
  { keyword: 'stationery', category: 'Education' },
  { keyword: 'waterstones', category: 'Education' },
  { keyword: 'library', category: 'Education' },
  { keyword: 'university', category: 'Education' },
  { keyword: 'course', category: 'Education' },
  { keyword: 'wh smith', category: 'Education' },
];

module.exports = DEFAULT_RULES;
