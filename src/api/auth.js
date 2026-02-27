/**
 * Contrato mínimo do backend — Autenticação (frontend apenas consome).
 *
 * POST /auth/login
 *   payload: { email, password }
 *   retorno sucesso:
 *     - token/cookie de sessão (httpOnly recomendado)
 *     - user: { id, name, email }
 *     - memberships: [
 *         { portal: 'ADMIN', role: 'Admin', scope: { all: true } },
 *         { portal: 'FRANCHISOR', role: 'FranchisorOwner', franchisor_id, scope_school_ids? },
 *         { portal: 'SCHOOL', role: 'SchoolStaff', school_id }
 *       ]
 *     - default_redirect: { portal, path, context? }  (portal: ADMIN | FRANCHISOR | SCHOOL)
 *   erros (códigos/keys):
 *     - INVALID_CREDENTIALS -> "Email ou senha inválidos."
 *     - ACCOUNT_DISABLED -> "Sua conta está desativada. Contate o suporte."
 *     - NO_PORTAL_ACCESS -> "Você não possui acesso a nenhum portal no momento."
 */

const GRID = 8

/** Base URL da API (ajustar em produção) */
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * Faz login e retorna user, memberships e default_redirect.
 * Em produção o token vem em cookie httpOnly; o front não armazena segredos.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, memberships: array, default_redirect: object }>}
 * @throws {Error} com propriedade .code (INVALID_CREDENTIALS | ACCOUNT_DISABLED | NO_PORTAL_ACCESS) e .message
 */
export async function login(email, password) {
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
 * GET /auth/post-login-options (autenticado por cookie/sessão).
 * @returns {Promise<{
 *   portals: Array<{ portal: string, label?: string, franchisor_id?: string, franchisor_name?: string, role?: string, scope_school_ids?: string[], schools?: Array<{ school_id: string, school_name: string, city?: string, state?: string, status?: string }> }>,
 *   default_redirect?: { portal: string, path?: string, context?: object }
 * }>}
 */
export async function getPostLoginOptions() {
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
 * POST /auth/select-access (backend valida portal/contexto do usuário).
 * @param {{ portal: string, context?: { school_id?: string, franchisor_id?: string }, returnTo?: string }} payload
 * @returns {Promise<{ redirect_to: string }>}
 */
export async function selectAccess(payload) {
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
 * Solicita recuperação de senha (link/código por e-mail).
 * POST /auth/forgot-password
 * Backend retorna sempre 200/202 com mensagem genérica (não revela se e-mail existe).
 * Rate limit e token com expiração são responsabilidade do backend.
 * @param {string} email
 * @returns {Promise<{ message?: string }>}
 */
export async function forgotPassword(email) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: (email || '').trim().toLowerCase() }),
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
