/**
 * Contrato mínimo do backend — Autenticação (frontend apenas consome).
 * Quando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidos, usa Supabase Auth + tabelas (profiles, franchisor_members, school_members).
 * Caso contrário, usa contas demo ou API REST.
 *
 * POST /auth/login (quando sem Supabase)
 *   payload: { email, password }
 *   retorno sucesso: user, memberships, default_redirect
 *   erros: INVALID_CREDENTIALS | ACCOUNT_DISABLED | NO_PORTAL_ACCESS
 */

import {
  loginWithSupabase,
  getPostLoginOptionsFromSupabase,
  selectAccessFromSupabase,
  logoutSupabase,
} from './supabaseAuth'
import { supabase } from '../lib/supabase'

/** Base URL da API (quando não usa Supabase) */
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/** True quando Supabase está configurado (usa auth + DB direto). */
const USE_SUPABASE = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

/**
 * Contas mocadas para acesso temporário/demo (apenas frontend).
 * Remover ou desativar em produção.
 */
const MOCK_ACCOUNTS = [
  {
    email: 'admin@demo.com',
    password: 'demo123',
    user: { id: 'mock-admin-1', name: 'Admin Demo', email: 'admin@demo.com' },
    memberships: [{ portal: 'ADMIN', role: 'Admin', scope: { all: true } }],
    default_redirect: { portal: 'ADMIN', path: '/admin/dashboard' },
  },
  {
    email: 'franqueador@demo.com',
    password: 'demo123',
    user: { id: 'mock-franchisor-1', name: 'Franqueador Demo', email: 'franqueador@demo.com' },
    memberships: [{ portal: 'FRANCHISOR', role: 'FranchisorOwner', franchisor_id: 'demo-franqueador-1' }],
    default_redirect: { portal: 'FRANCHISOR', path: '/franchisor/dashboard' },
  },
  {
    email: 'franqueado@demo.com',
    password: 'demo123',
    user: { id: 'mock-school-1', name: 'Franqueado Demo', email: 'franqueado@demo.com' },
    memberships: [{ portal: 'SCHOOL', role: 'SchoolStaff', school_id: 'demo-school-1' }],
    default_redirect: { portal: 'SCHOOL', path: '/school/dashboard', context: { school_id: 'demo-school-1' } },
  },
]

/**
 * Faz login e retorna user, memberships e default_redirect.
 * Com Supabase: signInWithPassword + profiles/franchisor_members/school_members.
 * Sem Supabase: mock demo ou POST /auth/login.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, memberships: array, default_redirect: object }>}
 * @throws {Error} com .code (INVALID_CREDENTIALS | ACCOUNT_DISABLED | NO_PORTAL_ACCESS) e .message
 */
export async function login(email, password) {
  if (USE_SUPABASE) {
    return loginWithSupabase(email, password)
  }

  const trimmed = email.trim().toLowerCase()
  const mock = MOCK_ACCOUNTS.find((m) => m.email === trimmed && m.password === password)
  if (mock) {
    return {
      user: mock.user,
      memberships: mock.memberships,
      default_redirect: mock.default_redirect,
    }
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
    credentials: 'include',
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const code = data.code || (res.status === 401 ? 'INVALID_CREDENTIALS' : 'UNKNOWN')
    const message =
      code === 'INVALID_CREDENTIALS'
        ? 'Email ou senha inválidos.'
        : code === 'ACCOUNT_DISABLED'
          ? 'Sua conta está desativada. Contate o suporte.'
          : code === 'NO_PORTAL_ACCESS'
            ? 'Você não possui acesso a nenhum portal no momento.'
            : data.message || 'Erro ao entrar. Tente novamente.'
    const err = new Error(message)
    err.code = code
    throw err
  }

  const { user, memberships = [], default_redirect } = data
  if (!user) {
    const err = new Error('Resposta de login inválida.')
    err.code = 'NO_PORTAL_ACCESS'
    throw err
  }
  if (!memberships || memberships.length === 0) {
    const err = new Error('Você não possui acesso a nenhum portal no momento.')
    err.code = 'NO_PORTAL_ACCESS'
    throw err
  }

  return { user, memberships, default_redirect: default_redirect || null }
}

/**
 * Retorna o path de redirecionamento pós-login com base em default_redirect.
 * @param {{ portal: string, path?: string, context?: object }} defaultRedirect
 * @returns {string} path absoluto (ex: /admin/dashboard, /franchisor/dashboard, /school/dashboard)
 */
export function getRedirectPath(defaultRedirect) {
  if (!defaultRedirect || !defaultRedirect.portal) return '/admin/dashboard'
  const portal = defaultRedirect.portal.toUpperCase()
  if (portal === 'ADMIN') return defaultRedirect.path || '/admin/dashboard'
  if (portal === 'FRANCHISOR') return defaultRedirect.path || '/franchisor/dashboard'
  if (portal === 'SCHOOL') {
    const path = defaultRedirect.path || '/school/dashboard'
    const schoolId = defaultRedirect.context?.school_id
    if (schoolId) return `${path}?school_id=${encodeURIComponent(schoolId)}`
    return path
  }
  return '/admin/dashboard'
}

/**
 * Opções pós-login para tela de seleção de portal/contexto.
 * Com Supabase: lê da sessão + profiles/franchisor_members/school_members.
 * @returns {Promise<{ portals: array, default_redirect?: object }>}
 */
export async function getPostLoginOptions() {
  if (USE_SUPABASE) {
    const data = await getPostLoginOptionsFromSupabase()
    return data ?? { portals: [], default_redirect: null }
  }

  const res = await fetch(`${API_BASE}/auth/post-login-options`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar as opções de acesso.')
    err.code = data.code || 'UNKNOWN'
    throw err
  }
  return {
    portals: data.portals || [],
    default_redirect: data.default_redirect ?? null,
  }
}

/**
 * Confirma acesso e obtém path seguro para redirecionamento.
 * Com Supabase: valida client-side e retorna redirect_to.
 * @param {{ portal: string, context?: { school_id?: string, franchisor_id?: string }, returnTo?: string }} payload
 * @returns {Promise<{ redirect_to: string }>}
 */
export async function selectAccess(payload) {
  if (USE_SUPABASE) {
    const data = await selectAccessFromSupabase(payload)
    if (data?.redirect_to) return data
  }

  const res = await fetch(`${API_BASE}/auth/select-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível validar seu acesso. Tente novamente.')
    err.code = data.code || 'UNKNOWN'
    throw err
  }
  const redirect_to = data.redirect_to
  if (!redirect_to || typeof redirect_to !== 'string') {
    throw new Error('Resposta inválida do servidor.')
  }
  return { redirect_to }
}

/**
 * Solicita recuperação de senha (link por e-mail).
 * Com Supabase: supabase.auth.resetPasswordForEmail.
 * @param {string} email
 * @returns {Promise<{ message?: string }>}
 */
export async function forgotPassword(email) {
  const trimmed = (email || '').trim().toLowerCase()
  if (!trimmed) {
    const err = new Error('Informe o e-mail.')
    err.code = 'UNKNOWN'
    throw err
  }

  if (USE_SUPABASE && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) {
      const err = new Error(error.message || 'Não foi possível enviar o e-mail. Tente novamente.')
      err.code = 'UNKNOWN'
      throw err
    }
    return { message: 'Se existir uma conta com esse e-mail, você receberá um link para redefinir a senha.' }
  }

  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: trimmed }),
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível enviar a solicitação. Tente novamente.')
    err.code = data.code || 'UNKNOWN'
    throw err
  }
  return data
}
