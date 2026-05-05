/**
 * InsightsPanel
 * =============
 * Shows three data-driven insights derived from the user's expenses and
 * the adaptive categorisation engine. Placed on the dashboard sidebar.
 *
 * Props:
 *   summary          — byCategory array from /api/expenses/summary
 *   adaptiveAccuracy — 0-1 float from /api/expenses/summary (or null)
 */

import { useState, useEffect } from 'react'
import client from '../api/client'

export default function InsightsPanel({ summary, adaptiveAccuracy }) {
  const [topRule, setTopRule] = useState(null)
  const [rulesLoading, setRulesLoading] = useState(true)

  // Fetch personal rules to find the most reinforced one
  useEffect(() => {
    client.get('/rules')
      .then(res => {
        const personal = res.data.personal || []
        if (personal.length === 0) {
          setTopRule(null)
        } else {
          // The rule the user has corrected the most times is the most "taught" rule
          const most = personal.reduce((best, r) =>
            r.correctionCount > best.correctionCount ? r : best
          )
          setTopRule(most)
        }
      })
      .catch(() => {})
      .finally(() => setRulesLoading(false))
  }, [])

  // summary is already sorted by total desc, so index 0 is the top category
  const topCategory = summary[0] ?? null
  const total = summary.reduce((sum, item) => sum + item.total, 0)
  const topPct = topCategory && total > 0
    ? Math.round((topCategory.total / total) * 100)
    : 0

  // Convert the 0-1 float to a readable percentage
  const accuracyPct = adaptiveAccuracy != null
    ? Math.round(adaptiveAccuracy * 100)
    : null

  return (
    <div className="insights-panel">
      <p className="insights-heading">Insights</p>

      {/* ── Insight 1: Top spending category ── */}
      <div className="insight-card">
        <span className="insight-icon">📈</span>
        <div className="insight-body">
          <p className="insight-label">Top Category</p>
          {topCategory ? (
            <>
              <p className="insight-value">{topCategory._id}</p>
              <p className="insight-sub">
                £{topCategory.total.toFixed(2)} · {topPct}% of total
              </p>
            </>
          ) : (
            <p className="insight-empty">No data for this period</p>
          )}
        </div>
      </div>

      {/* ── Insight 2: Most reinforced personal rule ── */}
      <div className="insight-card">
        <span className="insight-icon">🧠</span>
        <div className="insight-body">
          <p className="insight-label">Most Reinforced Rule</p>
          {!rulesLoading && topRule ? (
            <>
              <p className="insight-value">
                '{topRule.keyword}' → {topRule.category}
              </p>
              <p className="insight-sub">
                {topRule.correctionCount} correction{topRule.correctionCount !== 1 ? 's' : ''}
              </p>
            </>
          ) : !rulesLoading ? (
            <p className="insight-empty">
              No personal rules yet — override a suggestion to teach the system
            </p>
          ) : (
            <p className="insight-empty">Loading…</p>
          )}
        </div>
      </div>
    </div>
  )
}
