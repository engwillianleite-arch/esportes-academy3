import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [memberships, setMembershipsState] = useState([])
  const [defaultRedirect, setDefaultRedirectState] = useState(null)

  const setAuth = useCallback((data) => {
    if (!data) {
      setUserState(null)
      setMembershipsState([])
      setDefaultRedirectState(null)
      return
    }
    setUserState(data.user ?? null)
    setMembershipsState(data.memberships ?? [])
    setDefaultRedirectState(data.default_redirect ?? null)
  }, [])

  const logout = useCallback(() => {
    setAuth(null)
    // Backend deve invalidar cookie em POST /auth/logout; aqui só limpamos estado
  }, [setAuth])

  const value = {
    user,
    memberships,
    defaultRedirect,
    isAuthenticated: !!user,
    setAuth,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    return {
      user: null,
      memberships: [],
      defaultRedirect: null,
      isAuthenticated: false,
      setAuth: () => {},
      logout: () => {},
    }
  }
  return ctx
}
