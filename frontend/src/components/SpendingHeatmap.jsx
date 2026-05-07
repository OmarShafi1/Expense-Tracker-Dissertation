import { useMemo } from 'react'

const WEEKS = 52

export default function SpendingHeatmap({ allExpenses = [] }) {
  const { weeks, monthLabels, maxDay } = useMemo(() => {
    const byDay = {}
    for (const e of allExpenses) {
      const k = (e.date || '').split('T')[0]
      if (k) byDay[k] = parseFloat(((byDay[k] || 0) + Number(e.amount)).toFixed(2))
    }
    const max = Math.max(...Object.values(byDay), 1)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cells = []
    for (let i = WEEKS * 7 - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const k = d.toISOString().split('T')[0]
      cells.push({ date: d, key: k, amount: byDay[k] || 0 })
    }

    const wks = Array.from({ length: WEEKS }, (_, w) => cells.slice(w * 7, w * 7 + 7))

    const labels = wks.map(w =>
      w[0].date.getDate() <= 7
        ? w[0].date.toLocaleDateString('en-GB', { month: 'short' })
        : ''
    )

    return { weeks: wks, monthLabels: labels, maxDay: max }
  }, [allExpenses])

  function level(amt) {
    if (!amt) return 'hm-0'
    const r = amt / maxDay
    if (r < 0.25) return 'hm-1'
    if (r < 0.50) return 'hm-2'
    if (r < 0.75) return 'hm-3'
    return 'hm-4'
  }

  return (
    <div className="heatmap-card">
      <h3 className="chart-title">Spending Calendar — Last 12 Months</h3>
      <div className="heatmap-month-row">
        {monthLabels.map((lbl, i) => (
          <span key={i} className="heatmap-month-label">{lbl}</span>
        ))}
      </div>
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-col">
            {week.map((cell, di) => (
              <div
                key={di}
                className={`heatmap-cell ${level(cell.amount)}`}
                title={
                  cell.amount > 0
                    ? `${cell.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}: £${cell.amount.toFixed(2)}`
                    : cell.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        {['hm-0', 'hm-1', 'hm-2', 'hm-3', 'hm-4'].map(c => (
          <div key={c} className={`heatmap-cell ${c}`} />
        ))}
        <span className="heatmap-legend-label">More</span>
      </div>
    </div>
  )
}
