export const DEMO_EXPENSES = [
  // Groceries
  { description: 'Tesco weekly shop',     amount: 34.50, category: 'Groceries' },
  { description: "Sainsbury's",           amount: 22.80, category: 'Groceries' },
  { description: 'Aldi top-up',           amount: 15.20, category: 'Groceries' },
  { description: 'Lidl',                  amount: 18.60, category: 'Groceries' },
  { description: 'Co-op snacks',          amount: 5.40,  category: 'Groceries' },
  { description: 'Tesco Express',         amount: 11.30, category: 'Groceries' },
  { description: 'Morrisons',             amount: 28.90, category: 'Groceries' },

  // Food & eating out
  { description: 'Greggs sausage roll',   amount: 1.50,  category: 'Food' },
  { description: 'Starbucks coffee',      amount: 4.75,  category: 'Food' },
  { description: "McDonald's",            amount: 7.99,  category: 'Food' },
  { description: 'Deliveroo',             amount: 14.50, category: 'Food' },
  { description: "Nando's",              amount: 16.80, category: 'Food' },
  { description: 'Costa coffee',          amount: 3.80,  category: 'Food' },
  { description: 'KFC',                   amount: 9.20,  category: 'Food' },
  { description: 'Just Eat pizza',        amount: 18.99, category: 'Food' },
  { description: 'Greggs breakfast',      amount: 2.50,  category: 'Food' },
  { description: 'Wagamama dinner',       amount: 22.50, category: 'Food' },
  { description: 'Cafe lunch',            amount: 6.80,  category: 'Food' },
  { description: 'Subway',               amount: 6.49,  category: 'Food' },
  { description: 'Dominos pizza',         amount: 17.99, category: 'Food' },

  // Transport
  { description: 'Uber to town',          amount: 9.40,  category: 'Transport' },
  { description: 'Train ticket',          amount: 22.50, category: 'Transport' },
  { description: 'TfL Oyster top-up',     amount: 20.00, category: 'Transport' },
  { description: 'Bus fare',              amount: 2.50,  category: 'Transport' },
  { description: 'Uber',                  amount: 11.20, category: 'Transport' },
  { description: 'National Express',      amount: 18.00, category: 'Transport' },
  { description: 'Parking fee',           amount: 4.00,  category: 'Transport' },

  // Entertainment
  { description: 'Netflix',               amount: 10.99, category: 'Entertainment' },
  { description: 'Spotify Premium',       amount: 9.99,  category: 'Entertainment' },
  { description: 'Disney+',              amount: 7.99,  category: 'Entertainment' },
  { description: 'Odeon cinema',          amount: 14.50, category: 'Entertainment' },
  { description: 'Pub drinks',            amount: 18.00, category: 'Entertainment' },
  { description: 'Steam game',            amount: 12.99, category: 'Entertainment' },

  // Bills
  { description: 'Mobile phone bill',     amount: 20.00, category: 'Bills' },
  { description: 'WiFi broadband',        amount: 25.00, category: 'Bills' },
  { description: 'Electric bill',         amount: 45.00, category: 'Bills' },

  // Education
  { description: 'Waterstones textbook',  amount: 32.99, category: 'Education' },
  { description: 'Library fine',          amount: 2.40,  category: 'Education' },
  { description: 'WH Smith stationery',   amount: 8.50,  category: 'Education' },
  { description: 'University printing',   amount: 3.60,  category: 'Education' },
]

export function randomDateWithin(maxDays = 30) {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * maxDays))
  return d.toISOString().split('T')[0]
}
