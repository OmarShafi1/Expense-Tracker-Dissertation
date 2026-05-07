import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

export default function MonthlyTrendChart({ allExpenses = [] }) {
  const data = useMemo(() => {
    const now = new Date()
    const map = {}

    // Seed the last 12 calendar months with 0 so empty months still show
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      map[key] = 0
    }

    for (const exp of allExpenses) {
      if (!exp.date) continue
      const d = new Date(exp.date)
      const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      if (key in map) map[key] = parseFloat((map[key] + Number(exp.amount)).toFixed(2))
    }

    return Object.entries(map).map(([month, total]) => ({ month, total }))
  }, [allExpenses])

  return (
    <div className="chart-card" style={{ marginTop: '1.5rem' }}>
      <h3 className="chart-title">Monthly Spending — Last 12 Months</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="monthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#667eea" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-mid)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${v}`} />
          <Tooltip formatter={v => [`£${Number(v).toFixed(2)}`, 'Spent']} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#667eea"
            strokeWidth={2}
            fill="url(#monthGradient)"
            dot={{ r: 3, fill: '#667eea', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
