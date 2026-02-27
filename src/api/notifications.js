/**
 * Contrato mínimo do backend — Notificações do usuário (frontend apenas consome).
 *
 * GET /me/notifications
 *   Query: status? (all|unread), type? (se existir), page, page_size ou cursor
 *   Retorno: items: [{ id, title, body_preview, body_full?, type?, created_at, read_at?, target_url? }], next_cursor? ou page, page_size, total
 *
 * PATCH /me/notifications/:notificationId
 *   Body: { read: true|false }
 *   Retorno: { id, read_at? }
 *
 * POST /me/notifications/mark-all-read
 *   Retorno: { updated_count }
 *
 * POST /me/notifications/clear-read (opcional Fase 2)
 *   Retorno: { removed_count }
 *
 * Segurança: backend valida que a notificação pertence ao user_id da sessão.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * Lista notificações do usuário autenticado.
 * @param {{ status?: 'all'|'unread', type?: string, page?: number, page_size?: number, cursor?: string }} params
 * @returns {Promise<{ items: Array<{ id: string, title: string, body_preview: string, body_full?: string, type?: string, created_at: string, read_at?: string, target_url?: string }>, next_cursor?: string, page?: number, page_size?: number, total?: number }>}
 */
export async function getNotifications(params = {}) {
  const q = new URLSearchParams()
  if (params.status && params.status !== 'all') q.set('status', params.status)
  if (params.type) q.set('type', params.type)
  if (params.page != null) q.set('page', String(params.page))
  if (params.page_size != null) q.set('page_size', String(params.page_size))
  if (params.cursor) q.set('cursor', params.cursor)
  const url = `${API_BASE}/me/notifications${q.toString() ? `?${q.toString()}` : ''}`
  const res = await fetch(url, { method: 'GET', credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar suas notificações.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return { items: data.items ?? [], next_cursor: data.next_cursor, page: data.page, page_size: data.page_size, total: data.total }
}

/**
 * Marca notificação como lida ou não lida.
 * @param {string} notificationId
 * @param {{ read: boolean }} payload
 * @returns {Promise<{ id: string, read_at?: string }>}
 */
export async function patchNotification(notificationId, payload) {
  const res = await fetch(`${API_BASE}/me/notifications/${encodeURIComponent(notificationId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível atualizar a notificação.')
    err.code = data.code
    throw err
  }
  return data
}

/**
 * Marca todas as notificações como lidas.
 * @returns {Promise<{ updated_count: number }>}
 */
export async function markAllNotificationsRead() {
  const res = await fetch(`${API_BASE}/me/notifications/mark-all-read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível marcar todas como lidas.')
    err.code = data.code
    throw err
  }
  return data
}

/**
 * (Opcional Fase 2) Limpa/arquiva notificações lidas.
 * @returns {Promise<{ removed_count: number }>}
 */
export async function clearReadNotifications() {
  const res = await fetch(`${API_BASE}/me/notifications/clear-read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível limpar as notificações.')
    err.code = data.code
    throw err
  }
  return data
}
