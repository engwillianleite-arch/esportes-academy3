import { createContext, useContext, useState, useCallback } from 'react'

const FranchisorSidebarContext = createContext(null)

export function FranchisorSidebarProvider({ children }) {
  const [franchisorName, setFranchisorNameState] = useState('')

  const setFranchisorName = useCallback((name) => {
    setFranchisorNameState(typeof name === 'string' ? name : '')
  }, [])

  return (
    <FranchisorSidebarContext.Provider value={{ franchisorName, setFranchisorName }}>
      {children}
    </FranchisorSidebarContext.Provider>
  )
}

export function useFranchisorSidebar() {
  const ctx = useContext(FranchisorSidebarContext)
  return ctx || { franchisorName: '', setFranchisorName: () => {} }
}
