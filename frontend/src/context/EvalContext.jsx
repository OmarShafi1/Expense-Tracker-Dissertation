import { createContext, useContext, useState } from 'react'

const EvalContext = createContext(null)

export function EvalProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem('evalMode') || 'adaptive'
  )
  const [sessionId, setSessionIdState] = useState(
    () => localStorage.getItem('evalSessionId') || ''
  )

  function toggleMode() {
    const next = mode === 'adaptive' ? 'manual' : 'adaptive'
    setMode(next)
    localStorage.setItem('evalMode', next)
  }

  function setSessionId(id) {
    setSessionIdState(id)
    localStorage.setItem('evalSessionId', id)
  }

  return (
    <EvalContext.Provider value={{ mode, toggleMode, sessionId, setSessionId }}>
      {children}
    </EvalContext.Provider>
  )
}

export function useEval() {
  return useContext(EvalContext)
}
