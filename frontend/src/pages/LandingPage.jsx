import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  {
    icon: '🔍',
    title: 'Smart Categorisation',
    desc: 'Type a description like "Tesco" or "Netflix" and the system instantly suggests the right category — no manual setup required.',
  },
  {
    icon: '🧠',
    title: 'Learns From You',
    desc: 'Correct a suggestion once and the system remembers it forever, growing more accurate with every expense you add.',
  },
  {
    icon: '📊',
    title: 'Visual Spending Insights',
    desc: 'Pie and bar charts show exactly where your money goes, filterable by this week, this month, or all time.',
  },
]

export default function LandingPage() {
  const { token, loading } = useAuth()

  if (loading) return null
  if (token) return <Navigate to="/dashboard" replace />

  return (
    <div className="landing">

      <header className="landing-nav">
        <span className="landing-nav-brand">Expense Tracker</span>
        <div className="landing-nav-links">
          <Link to="/login" className="btn-secondary">Sign In</Link>
          <Link to="/register" className="btn-primary">Sign Up Free</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-title">Expense Tracker</h1>
          <p className="landing-pitch">
            Effortless expense tracking that learns from you.
          </p>
          <div className="landing-cta">
            <Link to="/register" className="btn-primary btn-lg">Get Started Free</Link>
            <Link to="/login" className="btn-ghost btn-lg">Sign In →</Link>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <h2 className="landing-features-title">Why Expense Tracker?</h2>
        <div className="landing-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-footer-cta">
        <h2>Ready to take control of your spending?</h2>
        <Link to="/register" className="btn-primary btn-lg">Create Your Free Account</Link>
      </section>

    </div>
  )
}
