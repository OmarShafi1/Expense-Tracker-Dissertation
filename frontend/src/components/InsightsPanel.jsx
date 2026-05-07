/**
 * InsightsPanel
 * =============
 * Three data-driven insights on the dashboard sidebar.
 *
 * Props:
 *   summary     — byCategory array from /api/expenses/summary (current period)
 *   allExpenses — flat list of all expenses (used for biggest-expense insight)
 */

import { useState, useEffect } from 'react'
import client from '../api/client'

export default function InsightsPanel({ summary, allExpenses = [] }) {
  const [lastSummary, setLastSummary] = useState([])

  // Fetch the previous 30-day window so we can compare spending period-over-period
  useEffect(() => {
    const now   = new Date()
    const end   = new Date(now);  end.setDate(end.getDate() - 30)
    const start = new Date(end); start.setDate(start.getDate() - 30)
    const params = `startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`
    client.get(`/expenses/summary?${params}`)
      .then(res => setLastSummary(res.data.byCategory || []))
      .catch(() => {})
  }, [])

  // ── Insight 1: Top category ──
  const topCategory = summary[0] ?? null
  const total       = summary.reduce((s, i) => s + i.total, 0)
  const topPct      = topCategory && total > 0
    ? Math.round((topCategory.total / total) * 100) : 0

  // ── Insight 2: Biggest period-over-period change ──
  const comparisons = summary.map(curr => {
    const prev = lastSummary.find(p => p._id === curr._id)
    if (!prev || prev.total === 0) return null
    const pct = Math.round(((curr.total - prev.total) / prev.total) * 100)
    return { category: curr._id, pct, curr: curr.total, prev: prev.total }
  }).filter(Boolean)

  const biggestChange = comparisons.length > 0
    ? comparisons.reduce((best, c) => Math.abs(c.pct) > Math.abs(best.pct) ? c : best)
    : null

  // ── Insight 3: Single biggest expense ──
  const biggest = allExpenses.length > 0
    ? allExpenses.reduce((best, e) => Number(e.amount) > Number(best.amount) ? e : best)
    : null

  return (
    <div className="insights-panel">
      <p className="insights-heading">Insights</p>

      {/* Top category */}
      <div className="insight-card">
        <span className="insight-icon">📈</span>
        <div className="insight-body">
          <p className="insight-label">Top Category</p>
          {topCategory ? (
            <>
              <p className="insight-value">{topCategory._id}</p>
              <p className="insight-sub">£{topCategory.total.toFixed(2)} · {topPct}% of total</p>
            </>
          ) : (
            <p className="insight-empty">No data for this period</p>
          )}
        </div>
      </div>

      {/* Period-over-period change */}
      <div className="insight-card">
        <span className="insight-icon">{biggestChange && biggestChange.pct > 0 ? '📊' : '📉'}</span>
        <div className="insight-body">
          <p className="insight-label">vs. Previous Period</p>
          {biggestChange ? (
            <>
              <p className="insight-value insight-change"
                style={{ color: biggestChange.pct > 0 ? '#e74c3c' : '#27ae60' }}>
                {biggestChange.pct > 0 ? '+' : ''}{biggestChange.pct}% on {biggestChange.category}
              </p>
              <p className="insight-sub">
                £{biggestChange.curr.toFixed(2)} vs £{biggestChange.prev.toFixed(2)} last period
              </p>
            </>
          ) : (
            <p className="insight-empty">Not enough history to compare yet</p>
          )}
        </div>
      </div>

      {/* Biggest single expense */}
      <div className="insight-card">
        <span className="insight-icon">💸</span>
        <div className="insight-body">
          <p className="insight-label">Biggest Expense</p>
          {biggest ? (
            <>
              <p className="insight-value">{biggest.description}</p>
              <p className="insight-sub">£{Number(biggest.amount).toFixed(2)} · {biggest.category}</p>
            </>
          ) : (
            <p className="insight-empty">No expenses yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
