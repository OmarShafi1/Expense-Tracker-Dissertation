import { useState, useEffect, useMemo } from 'react'
import client from '../api/client'
import Navbar from '../components/Navbar'
import { useEval } from '../context/EvalContext'

const EMPTY_FORM = {
  description: '',
  amount: '',
  category: '',
  date: new Date().toISOString().split('T')[0],
}

export default function ExpensesPage() {
  const { mode } = useEval()
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  useEffect(() => {
    Promise.all([
      client.get('/expenses'),
      client.get('/expenses/categories'),
    ]).then(([expRes, catRes]) => {
      setExpenses(expRes.data || [])
      setCategories(catRes.data.categories || [])
    }).catch(() => setError('Failed to load expenses'))
      .finally(() => setLoading(false))
  }, [])

  const recurringDescriptions = useMemo(() => {
    const counts = {}
    for (const exp of expenses) {
      const key = exp.description.toLowerCase()
      counts[key] = (counts[key] || 0) + 1
    }
    return new Set(Object.keys(counts).filter(k => counts[k] >= 2))
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = search === '' ||
        exp.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = filterCategory === 'All' || exp.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [expenses, search, filterCategory])

  const expenseStats = useMemo(() => {
    if (filteredExpenses.length === 0) return null
    const total = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const avg = total / filteredExpenses.length
    const catMap = {}
    for (const exp of filteredExpenses) {
      catMap[exp.category] = (catMap[exp.category] || 0) + Number(exp.amount)
    }
    const topCats = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, amt]) => ({ cat, amt, pct: Math.round((amt / total) * 100) }))
    return { total, avg, count: filteredExpenses.length, topCats }
  }, [filteredExpenses])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleDescriptionBlur() {
    if (mode === 'manual') return
    if (!form.description || form.description.length < 3) return
    setSuggesting(true)
    try {
      const res = await client.post('/expenses/suggest', { description: form.description })
      setSuggestion(res.data)
      if (!form.category) setForm(f => ({ ...f, category: res.data.category }))
    } catch {
      // suggestion is optional
    } finally {
      setSuggesting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        const res = await client.put(`/expenses/${editingId}`, form)
        setExpenses(expenses.map(ex => ex._id === editingId ? res.data : ex))
      } else {
        const payload = { ...form, suggestedCategory: suggestion?.category ?? null }
        const res = await client.post('/expenses', payload)
        setExpenses([res.data, ...expenses])
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
      setShowForm(false)
      setSuggestion(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(expense) {
    setForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    })
    setEditingId(expense._id)
    setShowForm(true)
    setSuggestion(null)
    window.scrollTo(0, 0)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return
    try {
      await client.delete(`/expenses/${id}`)
      setExpenses(expenses.filter(ex => ex._id !== id))
    } catch {
      setError('Failed to delete expense')
    }
  }

  function handleCancel() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setSuggestion(null)
    setError('')
  }

  const isFiltered = search !== '' || filterCategory !== 'All'

  return (
    <div className="page">
      <Navbar />
      <main className="container-wide">
        <div className="expenses-layout">

          {/* ── Main column ── */}
          <div className="expenses-main">
            <div className="page-header">
              <h2>Expenses</h2>
              {!showForm && (
                <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Expense</button>
              )}
            </div>

            {showForm && (
              <div className="form-card">
                <h3>{editingId ? 'Edit Expense' : 'New Expense'}</h3>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      onBlur={handleDescriptionBlur}
                      placeholder="e.g. Tesco, Uber, Netflix..."
                      required
                      autoFocus
                    />
                    {suggesting && <small className="hint">Detecting category…</small>}

                    {suggestion && !suggesting && (
                      <div className="suggestion-box">
                        <div className="suggestion-main">
                          <span>Suggested: <strong>{suggestion.category}</strong></span>
                          <span className={`confidence-badge ${
                            suggestion.confidence >= 0.70 ? 'conf-high' :
                            suggestion.confidence >= 0.40 ? 'conf-medium' : 'conf-low'
                          }`}>
                            {Math.round(suggestion.confidence * 100)}% confident
                          </span>
                        </div>
                        {suggestion.matchedKeyword && (
                          <small className="matched-keyword">
                            matched: '<em>{suggestion.matchedKeyword}</em>'
                          </small>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Amount (£)</label>
                      <input type="number" name="amount" value={form.amount} onChange={handleChange}
                        step="0.01" min="0.01" placeholder="0.00" required />
                    </div>
                    <div className="form-group">
                      <label>Date</label>
                      <input type="date" name="date" value={form.date} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={form.category} onChange={handleChange} required>
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : editingId ? 'Update Expense' : 'Add Expense'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {!loading && expenses.length > 0 && (
              <div className="search-filter-bar">
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search expenses…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className="filter-chips">
                  {['All', ...categories].map(cat => (
                    <button
                      key={cat}
                      className={`filter-chip ${filterCategory === cat ? 'filter-chip-active' : ''}`}
                      onClick={() => setFilterCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && <p className="loading">Loading expenses...</p>}

            {!loading && expenses.length === 0 && !showForm && (
              <div className="empty-state">
                <p>No expenses yet. Add your first one!</p>
              </div>
            )}

            {!loading && filteredExpenses.length === 0 && expenses.length > 0 && (
              <div className="empty-state">
                <p>No expenses match your search.</p>
              </div>
            )}

            {filteredExpenses.length > 0 && (
              <div className="expense-list">
                {filteredExpenses.map(expense => {
                  const recurring = recurringDescriptions.has(expense.description.toLowerCase())
                  return (
                    <div key={expense._id} className="expense-item">
                      <div className="expense-info">
                        <div className="expense-desc-row">
                          <span className="expense-desc">{expense.description}</span>
                          {recurring && (
                            <span className="recurring-badge" title="This description appears regularly">
                              Recurring
                            </span>
                          )}
                        </div>
                        <span className="expense-category tag">{expense.category}</span>
                      </div>
                      <div className="expense-meta">
                        <span className="expense-date">
                          {new Date(expense.date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className="expense-right">
                        <span className="expense-amount">£{Number(expense.amount).toFixed(2)}</span>
                        <button className="btn-edit" onClick={() => handleEdit(expense)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete(expense._id)}>Delete</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Stats sidebar ── */}
          {!loading && expenses.length > 0 && (
            <aside className="expenses-sidebar">
              <div className="exp-stats-card">
                <p className="insights-heading">
                  {isFiltered ? 'Filtered View' : 'Summary'}
                </p>

                {expenseStats ? (
                  <>
                    <div className="exp-stat-row">
                      <span>Total</span>
                      <strong>£{expenseStats.total.toFixed(2)}</strong>
                    </div>
                    <div className="exp-stat-row">
                      <span>Expenses</span>
                      <strong>{expenseStats.count}</strong>
                    </div>
                    <div className="exp-stat-row">
                      <span>Average</span>
                      <strong>£{expenseStats.avg.toFixed(2)}</strong>
                    </div>

                    {expenseStats.topCats.length > 1 && (
                      <>
                        <p className="exp-cats-title">By Category</p>
                        {expenseStats.topCats.map(({ cat, amt, pct }) => (
                          <div key={cat} className="exp-cat-row">
                            <div className="exp-cat-header">
                              <span className="exp-cat-name">{cat}</span>
                              <span className="exp-cat-pct">{pct}%</span>
                            </div>
                            <div className="exp-cat-bar-track">
                              <div className="exp-cat-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <p className="insight-empty">No expenses match</p>
                )}
              </div>
            </aside>
          )}

        </div>
      </main>
    </div>
  )
}
