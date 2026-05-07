import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { DEMO_EXPENSES, randomDateWithin } from '../utils/demoData'

async function seedDemoExpenses() {
  const requests = DEMO_EXPENSES.map(exp =>
    client.post('/expenses', {
      description: exp.description,
      amount:      exp.amount,
      category:    exp.category,
      date:        randomDateWithin(30),
    })
  )
  const results = await Promise.allSettled(requests)
  // Count how many actually succeeded
  return results.filter(r => r.status === 'fulfilled').length
}

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await client.post('/auth/register', form)
      // Store token first so the demo seeding calls include the auth header
      login(res.data.token, res.data.user)

      // Seed demo data and store the count so the dashboard can show a notice
      const count = await seedDemoExpenses()
      localStorage.setItem('demoCount', String(count))

      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">Expense Tracker</h1>
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={form.username} onChange={handleChange} required autoFocus />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
            <small className="hint">At least 6 characters</small>
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Setting up your account…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
