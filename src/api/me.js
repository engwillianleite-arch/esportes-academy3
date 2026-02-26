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
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}/me/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível atualizar a senha. Verifique os campos.')
    err.code = data.code
    throw err
  }
  return data
}
