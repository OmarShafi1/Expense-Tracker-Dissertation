import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip as BarTooltip, ResponsiveContainer,
} from 'recharts'
import client from '../api/client'
import Navbar from '../components/Navbar'
import InsightsPanel from '../components/InsightsPanel'
import { useAuth } from '../context/AuthContext'

const PALETTE = [
  '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00c9ff',
  '#43e97b', '#fa709a', '#fee140', '#a18cd1', '#fd79a8',
]

const FILTERS = [
  { id: 'week',  label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all',   label: 'All Time' },
]

// Returns startDate / endDate query params for the selected filter
function getDateRange(filter) {
  const now = new Date()
  const end = now.toISOString().split('T')[0]
  if (filter === 'week') {
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    return { startDate: start.toISOString().split('T')[0], endDate: end }
  }
  if (filter === 'month') {
    const start = new Date(now)
    start.setDate(start.getDate() - 29)
    return { startDate: start.toISOString().split('T')[0], endDate: end }
  }
  return {}
}

// Builds daily bar data for the past `days` days
function buildDailyData(expenses, days, shortLabels = false) {
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = shortLabels
      ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
    const total = expenses
      .filter(e => (e.date || '').startsWith(key))
      .reduce((sum, e) => sum + Number(e.amount), 0)
    result.push({ date: label, total: parseFloat(total.toFixed(2)) })
  }
  return result
}

// Groups all expenses by calendar month for the All Time bar chart
function buildMonthlyData(expenses) {
  const map = {}
  for (const exp of expenses) {
    if (!exp.date) continue
    const d = new Date(exp.date)
    const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    map[key] = parseFloat(((map[key] || 0) + Number(exp.amount)).toFixed(2))
  }
  return Object.entries(map).map(([date, total]) => ({ date, total }))
}

// Filters expenses to a date range (used for bar chart scoping)
function filterExpensesByRange(expenses, range) {
  if (!range.startDate) return expenses
  return expenses.filter(e => {
    const d = (e.date || '').split('T')[0]
    return d >= range.startDate && d <= range.endDate
  })
}

/**
 * Returns a human-readable relative date string.
 * e.g. "Today", "Yesterday", "3 days ago", "2 weeks ago", "12 Apr"
 * Used in the Recent Expenses list to show when each expense was added.
 */
function relativeDate(dateStr) {
  if (!dateStr) return ''
  const exp   = new Date(dateStr)
  const today = new Date()
  // Strip time components for a clean day-level comparison
  const expDay   = new Date(exp.getFullYear(),   exp.getMonth(),   exp.getDate())
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.round((todayDay - expDay) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  }
  return exp.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function DashboardPage() {
  const [summary, setSummary] = useState([])
  const [adaptiveAccuracy, setAdaptiveAccuracy] = useState(null)
  const [allExpenses, setAllExpenses] = useState([])
  const [barData, setBarData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [demoNotice, setDemoNotice] = useState(null)
  const [filter, setFilter] = useState('month')

  // Budgets stored in localStorage: { "Groceries": 200, "Transport": 50, ... }
  const [budgets, setBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('budgets') || '{}') }
    catch { return {} }
  })
  const [editingBudget, setEditingBudget] = useState(null)
  const [budgetInput, setBudgetInput] = useState('')

  const { user } = useAuth()

  function saveBudget(category) {
    const val = parseFloat(budgetInput)
    if (!isNaN(val) && val > 0) {
      const updated = { ...budgets, [category]: val }
      setBudgets(updated)
      localStorage.setItem('budgets', JSON.stringify(updated))
    }
    setEditingBudget(null)
    setBudgetInput('')
  }

  // One-time demo banner after sign-up
  useEffect(() => {
    const count = localStorage.getItem('demoCount')
    if (count) {
      setDemoNotice(Number(count))
      localStorage.removeItem('demoCount')
    }
  }, [])

  // Fetch all expenses once for the Recent Expenses list and bar chart
  useEffect(() => {
    client.get('/expenses')
      .then(res => setAllExpenses(res.data || []))
      .catch(() => {})
  }, [])

  // Re-fetch the category summary (and adaptive accuracy) when filter changes
  useEffect(() => {
    setLoading(true)
    const range = getDateRange(filter)
    const params = new URLSearchParams(range).toString()
    const url = params ? `/expenses/summary?${params}` : '/expenses/summary'

    client.get(url)
      .then(res => {
        setSummary(res.data.byCategory || [])
        // adaptiveAccuracy is a 0-1 float; null if no suggestions have been made yet
        setAdaptiveAccuracy(res.data.adaptiveAccuracy ?? null)
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [filter])

  // Rebuild bar chart whenever filter or expenses change
  useEffect(() => {
    const range  = getDateRange(filter)
    const scoped = filterExpensesByRange(allExpenses, range)
    if (filter === 'week')  setBarData(buildDailyData(scoped, 7))
    if (filter === 'month') setBarData(buildDailyData(scoped, 30, true))
    if (filter === 'all')   setBarData(buildMonthlyData(scoped))
  }, [filter, allExpenses])

  const total = summary.reduce((sum, item) => sum + item.total, 0)

  // 8 most recent expenses sorted newest-first — used in the Recent list
  const recentExpenses = [...allExpenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)

  return (
    <div className="page">
      <Navbar />
      <main className="container">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h2>Dashboard</h2>
            <p className="page-subtitle">Welcome back, {user?.username}</p>
          </div>
          <Link to="/expenses" className="btn-primary">+ Add Expense</Link>
        </div>

        {demoNotice && (
          <div className="demo-notice">
            <span>🎉 {demoNotice} demo expenses added to help you get started.</span>
            <button className="demo-notice-close" onClick={() => setDemoNotice(null)}>✕</button>
          </div>
        )}

        {/* ── Row 1: Total banner ── */}
        <div className="total-card">
          <span className="total-label">Total Spent</span>
          <span className="total-amount">£{total.toFixed(2)}</span>
        </div>

        {/* ── Row 2: Time filter ── */}
        <div className="filter-bar">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`filter-btn ${filter === f.id ? 'filter-btn-active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p className="loading">Loading…</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <>
            {summary.length === 0 ? (
              <div className="empty-state">
                <p>No expenses for this period.</p>
                <Link to="/expenses" className="btn-primary">Add an expense</Link>
              </div>
            ) : (
              <>
                {/* ── Row 3: Charts (2/3) + Insights (1/3) ── */}
                <div className="dashboard-cols">
                  <div className="charts-col">
                    <div className="chart-card">
                      <h3 className="chart-title">Spending by Category</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={summary}
                            dataKey="total"
                            nameKey="_id"
                            cx="50%"
                            cy="50%"
                            outerRadius={95}
                            innerRadius={45}
                          >
                            {summary.map((_, i) => (
                              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                            ))}
                          </Pie>
                          <PieTooltip formatter={v => `£${Number(v).toFixed(2)}`} />
                          <Legend iconType="circle" iconSize={10} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                      <h3 className="chart-title">
                        {filter === 'week'  ? 'Last 7 Days' :
                         filter === 'month' ? 'Last 30 Days' : 'By Month'}
                      </h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <XAxis dataKey="date" tick={{ fontSize: filter === 'month' ? 9 : 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${v}`} />
                          <BarTooltip formatter={v => [`£${Number(v).toFixed(2)}`, 'Spent']} />
                          <Bar dataKey="total" fill="#667eea" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Sidebar insights panel */}
                  <InsightsPanel summary={summary} allExpenses={allExpenses} />
                </div>

                {/* ── Row 4: Category cards with budget progress bars ── */}
                <div className="category-grid">
                  {summary.map(item => {
                    const budget  = budgets[item._id]
                    const pct     = budget ? Math.min(100, Math.round((item.total / budget) * 100)) : null
                    const overBudget = pct !== null && pct >= 100
                    const nearBudget = pct !== null && pct >= 80 && pct < 100
                    return (
                      <div key={item._id} className="category-card">
                        <span className="category-name">{item._id}</span>
                        <span className="category-amount">£{item.total.toFixed(2)}</span>
                        <span className="category-count">{item.count} expense{item.count !== 1 ? 's' : ''}</span>

                        {/* Budget progress bar */}
                        {budget ? (
                          <div className="budget-section">
                            <div className="budget-bar-track">
                              <div
                                className={`budget-bar-fill ${overBudget ? 'budget-over' : nearBudget ? 'budget-near' : ''}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="budget-labels">
                              <span className={overBudget ? 'budget-over-text' : ''}>
                                {pct}% of £{budget}
                              </span>
                              {editingBudget === item._id ? (
                                <span className="budget-edit-row">
                                  <input
                                    className="budget-input"
                                    type="number"
                                    value={budgetInput}
                                    onChange={e => setBudgetInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && saveBudget(item._id)}
                                    autoFocus
                                    min="1"
                                  />
                                  <button className="budget-save" onClick={() => saveBudget(item._id)}>✓</button>
                                  <button className="budget-cancel" onClick={() => setEditingBudget(null)}>✕</button>
                                </span>
                              ) : (
                                <button className="budget-edit-btn" onClick={() => { setEditingBudget(item._id); setBudgetInput(String(budget)) }}>Edit</button>
                              )}
                            </div>
                          </div>
                        ) : (
                          editingBudget === item._id ? (
                            <div className="budget-set-row">
                              <input
                                className="budget-input"
                                type="number"
                                placeholder="Monthly limit £"
                                value={budgetInput}
                                onChange={e => setBudgetInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveBudget(item._id)}
                                autoFocus
                                min="1"
                              />
                              <button className="budget-save" onClick={() => saveBudget(item._id)}>✓</button>
                              <button className="budget-cancel" onClick={() => setEditingBudget(null)}>✕</button>
                            </div>
                          ) : (
                            <button className="budget-set-btn" onClick={() => { setEditingBudget(item._id); setBudgetInput('') }}>
                              + Set budget
                            </button>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* ── Row 5: Recent expenses ── */}
                {recentExpenses.length > 0 && (
                  <div className="recent-section">
                    <div className="recent-header">
                      <h3>Recent Expenses</h3>
                      <Link to="/expenses" className="recent-view-all">View all →</Link>
                    </div>

                    {recentExpenses.map(exp => (
                      <div key={exp._id} className="recent-row">
                        {/*
                          Adaptive status dot:
                          Green  = system suggested correctly (wasAutoCategorised)
                          Amber  = user corrected the suggestion (wasOverridden) — learning happened
                          Grey   = no suggestion involved (manual mode or demo data)
                        */}
                        <span className={`dot ${
                          exp.wasAutoCategorised ? 'dot-green' :
                          exp.wasOverridden      ? 'dot-amber' : 'dot-grey'
                        }`} title={
                          exp.wasAutoCategorised ? 'Auto-categorised correctly' :
                          exp.wasOverridden      ? 'User corrected — rule learnt' :
                          'Manually categorised'
                        } />
                        <span className="recent-desc">{exp.description}</span>
                        <span className="tag recent-cat">{exp.category}</span>
                        <span className="recent-date">{relativeDate(exp.date)}</span>
                        <span className="recent-amount">£{Number(exp.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
