/**
 * Evaluation Mode Context
 * =======================
 * Supports the dissertation's comparative usability study.
 *
 * Two conditions:
 *   - "adaptive"  (default): the categorisation engine suggests a category
 *     and confidence score after the user types a description.
 *   - "manual": no suggestion is shown; the user must pick a category
 *     entirely from the dropdown. This replicates a baseline system
 *     with no adaptive behaviour.
 *
 * A Session ID field lets the researcher tag individual test sessions
 * so results logged to /api/evaluation/log can be filtered per participant.
 *
 * Both values are persisted to localStorage so they survive page refreshes.
 */

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
