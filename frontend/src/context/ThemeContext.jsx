/**
 * ThemeContext
 * ============
 * Manages the light / dark colour scheme for the entire app.
 * Persists the user's choice in localStorage so it survives page refreshes.
 *
 * The chosen theme is applied by setting data-theme="dark" on <html>.
 * All colours are defined as CSS custom properties in index.css and swap
 * automatically when the attribute changes — no JavaScript colour logic needed.
 */

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  )

  // Apply the theme attribute to <html> whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => (t === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
