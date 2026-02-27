/**
 * Contrato mínimo do backend — Auditoria pessoal (minhas ações).
 *
 * GET /me/audit
 *   Query: from_date?, to_date?, category?, q?, page, page_size OU cursor
 *   Retorno: items[], next_cursor? OU page, page_size, total
 *   Item: id, created_at, category?, action_key, action_label, entity_type?, entity_id?, entity_label?,
 *         context? { school_id?, school_name?, franchise_id? }, target_url?
 *
 * Segurança: backend filtra por actor_user_id = user_id da sessão.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * Lista as ações do usuário autenticado (auditoria pessoal).
 * @param {{
 *   from_date?: string,
 *   to_date?: string,
 *   category?: string,
 *   q?: string,
 *   page?: number,
 *   page_size?: number,
 *   cursor?: string
 * }} params
 * @returns {Promise<{ items: Array<AuditItem>, next_cursor?: string, page?: number, page_size?: number, total?: number }>}
 */
export async function getMeAudit(params = {}) {
  const search = new URLSearchParams()
  if (params.from_date) search.set('from_date', params.from_date)
  if (params.to_date) search.set('to_date', params.to_date)
  if (params.category) search.set('category', params.category)
  if (params.q) search.set('q', params.q)
  if (params.page != null) search.set('page', String(params.page))
  if (params.page_size != null) search.set('page_size', String(params.page_size))
  if (params.cursor) search.set('cursor', params.cursor)

  const qs = search.toString()
  const url = `${API_BASE}/me/audit${qs ? `?${qs}` : ''}`

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar suas ações.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}
