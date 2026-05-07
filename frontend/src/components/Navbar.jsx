import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEval } from '../context/EvalContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { mode, toggleMode, sessionId, setSessionId } = useEval()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">Expense Tracker</div>

      <div className="navbar-links">
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
        <Link to="/expenses"  className={location.pathname === '/expenses'  ? 'active' : ''}>Expenses</Link>
        <Link to="/rules"     className={location.pathname === '/rules'     ? 'active' : ''}>Rules</Link>
      </div>

      <div className="navbar-right">
        {/* Evaluation mode badge + toggle */}
        <span className={`eval-badge ${mode === 'adaptive' ? 'eval-adaptive' : 'eval-manual'}`}>
          {mode === 'adaptive' ? 'Adaptive Mode' : 'Manual Mode'}
        </span>
        <button className="btn-eval-toggle" onClick={toggleMode}>
          {mode === 'adaptive' ? 'Switch to Manual' : 'Switch to Adaptive'}
        </button>

        {/* Dark / light mode toggle */}
        <button
          className="btn-theme-toggle"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          aria-label="Toggle colour scheme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <span className="navbar-name">{user?.username}</span>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  )
}
