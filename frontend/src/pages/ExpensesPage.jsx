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
  // Stores the full suggestion object: { category, confidence, matchedKeyword }
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Search & filter state
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

  // Recurring detection — any description appearing 2+ times is recurring
  const recurringDescriptions = useMemo(() => {
    const counts = {}
    for (const exp of expenses) {
      const key = exp.description.toLowerCase()
      counts[key] = (counts[key] || 0) + 1
    }
    return new Set(Object.keys(counts).filter(k => counts[k] >= 2))
  }, [expenses])

  // Apply search + category filter to the expense list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = search === '' ||
        exp.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = filterCategory === 'All' || exp.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [expenses, search, filterCategory])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleDescriptionBlur() {
    // In manual mode, skip suggestions entirely — user must choose category themselves
    if (mode === 'manual') return
    if (!form.description || form.description.length < 3) return
    setSuggesting(true)
    try {
      const res = await client.post('/expenses/suggest', { description: form.description })
      // Store the full result so we can show confidence + matched keyword
      setSuggestion(res.data)
      if (!form.category) setForm(f => ({ ...f, category: res.data.category }))
    } catch {
      // Suggestion is optional — silent failure is acceptable
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
        // Include suggestedCategory so the backend can detect overrides
        // and trigger the adaptive learning step (learnFromCorrection)
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

  return (
    <div className="page">
      <Navbar />
      <main className="container">
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

                {/* Confidence indicator — the transparency feature of the adaptive engine */}
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

        {/* ── Search & filter bar ── */}
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
                      {/* Recurring badge — shown when the same description appears 2+ times */}
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
      </main>
    </div>
  )
}
