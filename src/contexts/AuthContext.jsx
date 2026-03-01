import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getSessionSupabase, buildAuthFromSupabase, logoutSupabase } from '../api/supabaseAuth'
import { clearMockSchoolSession } from '../data/mockSchoolSession'

const USE_SUPABASE = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [memberships, setMembershipsState] = useState([])
  const [defaultRedirect, setDefaultRedirectState] = useState(null)
  const [authReady, setAuthReady] = useState(!USE_SUPABASE)

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

  useEffect(() => {
    if (!USE_SUPABASE || !supabase) {
      setAuthReady(true)
      return () => {}
    }
    let cancelled = false
    getSessionSupabase()
      .then((session) => {
        if (cancelled || !session?.user?.id) {
          setAuthReady(true)
          return
        }
        return buildAuthFromSupabase(session.user.id).then((data) => {
          if (!cancelled && data?.memberships?.length) setAuth(data)
          setAuthReady(true)
        })
      })
      .catch(() => setAuthReady(true))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_OUT') {
        setAuth(null)
        clearMockSchoolSession()
        return
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id) {
          const data = await buildAuthFromSupabase(session.user.id)
          if (!cancelled && data?.memberships?.length) setAuth(data)
        }
      }
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe?.()
    }
  }, [setAuth])

  const logout = useCallback(async () => {
    if (USE_SUPABASE) await logoutSupabase()
    clearMockSchoolSession()
    setAuth(null)
  }, [setAuth])

  const value = {
    user,
    memberships,
    defaultRedirect,
    isAuthenticated: !!user,
    authReady,
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
      authReady: true,
      setAuth: () => {},
      logout: () => {},
    }
  }
  return ctx
}
