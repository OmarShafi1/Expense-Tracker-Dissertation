import { useState, useEffect } from 'react'
import client from '../api/client'
import Navbar from '../components/Navbar'

export default function RulesPage() {
  const [personal, setPersonal] = useState([])
  const [global, setGlobal] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client.get('/rules')
      .then(res => {
        setPersonal(res.data.personal || [])
        setGlobal(res.data.global || [])
      })
      .catch(() => setError('Failed to load rules'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this rule? The system will no longer use it to categorise your expenses.')) return
    try {
      await client.delete(`/rules/${id}`)
      setPersonal(prev => prev.filter(r => r._id !== id))
    } catch {
      setError('Failed to delete rule')
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <div className="page-header">
          <div>
            <h2>Categorisation Rules</h2>
            <p className="page-subtitle">
              These are the rules the system uses to suggest categories.
              Personal rules are created automatically when you correct a suggestion.
            </p>
          </div>
        </div>

        {loading && <p className="loading">Loading rules…</p>}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && (
          <>
            {/* ── Personal rules ── */}
            <section className="rules-section">
              <div className="rules-section-header">
                <h3>Your Personal Rules</h3>
                <span className="rules-count">{personal.length}</span>
              </div>

              {personal.length === 0 ? (
                <div className="rules-empty">
                  <p>You haven't taught the system anything yet.</p>
                  <p className="rules-empty-hint">
                    Go to <strong>Expenses</strong>, add an expense, and change the suggested
                    category — a personal rule will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="rules-table">
                  <div className="rules-table-head">
                    <span>Keyword</span>
                    <span>Category</span>
                    <span>Corrections</span>
                    <span>Learnt on</span>
                    <span></span>
                  </div>
                  {personal.map(rule => (
                    <div key={rule._id} className="rules-row rules-row-personal">
                      <span className="rule-keyword">{rule.keyword}</span>
                      <span className="rule-category tag">{rule.category}</span>
                      <span className="rule-corrections">
                        {rule.correctionCount} time{rule.correctionCount !== 1 ? 's' : ''}
                      </span>
                      <span className="rule-date">
                        {new Date(rule.createdAt).toLocaleDateString('en-GB')}
                      </span>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(rule._id)}
                        title="Delete this rule"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Default (global) rules ── */}
            <section className="rules-section">
              <div className="rules-section-header">
                <h3>Default Rules</h3>
                <span className="rules-count">{global.length}</span>
              </div>
              <p className="rules-section-desc">
                Built-in rules shared by all users. These provide the cold-start behaviour
                before the system learns your preferences. Read-only.
              </p>

              <div className="rules-table">
                <div className="rules-table-head">
                  <span>Keyword</span>
                  <span>Category</span>
                </div>
                {global.map(rule => (
                  <div key={rule._id} className="rules-row">
                    <span className="rule-keyword">{rule.keyword}</span>
                    <span className="rule-category tag">{rule.category}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
