/**
 * Contrato mínimo do backend — Perfil do usuário (frontend apenas consome).
 *
 * GET /me
 *   retorno: id, name, email, phone?, avatar_url?
 *   memberships: [{ portal, role, franchisor_id?, franchisor_name?, school_id?, school_name?, scope_type?, scope_school_count? }]
 *
 * PATCH /me
 *   payload: name?, phone?, avatar_url? (se suportar)
 *
 * POST /me/change-password
 *   payload: { current_password, new_password }
 *
 * Segurança: backend só permite ler/alterar dados do próprio user_id (token).
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * Busca dados do perfil do usuário autenticado.
 * @returns {Promise<{ id, name, email, phone?, avatar_url?, memberships }>}
 */
export async function getMe() {
  const res = await fetch(`${API_BASE}/me`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar seu perfil.')
    err.code = data.code
    throw err
  }
  return data
}

/**
 * Atualiza dados pessoais do perfil.
 * @param {{ name?: string, phone?: string, avatar_url?: string }} payload
 */
export async function patchMe(payload) {
  const res = await fetch(`${API_BASE}/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível atualizar. Tente novamente.')
    err.code = data.code
    throw err
  }
  return data
}

/**
 * Altera a senha do usuário (exige senha atual).
 * Contrato backend: POST /auth/change-password ou /me/change-password
 * Body: current_password, new_password, logout_other_sessions? (boolean)
 * @param {string} currentPassword
 * @param {string} newPassword
 * @param {boolean} [logoutOtherSessions=false] — invalida outras sessões quando o backend suportar
 */
export async function changePassword(currentPassword, newPassword, logoutOtherSessions = false) {
  const res = await fetch(`${API_BASE}/me/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      ...(typeof logoutOtherSessions === 'boolean' && logoutOtherSessions ? { logout_other_sessions: true } : {}),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const code = data.code || (res.status === 401 ? 'INVALID_CURRENT_PASSWORD' : 'UNKNOWN')
    const message =
      code === 'INVALID_CURRENT_PASSWORD' || code === 'INVALID_CURRENT'
        ? 'Senha atual inválida.'
        : code === 'PASSWORD_POLICY' || code === 'WEAK_PASSWORD'
          ? 'A nova senha não atende aos requisitos.'
          : data.message || 'Não foi possível alterar a senha. Tente novamente.'
    const err = new Error(message)
    err.code = code
    throw err
  }
  return data
}
