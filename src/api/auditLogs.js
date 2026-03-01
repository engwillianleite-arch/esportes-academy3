/**
 * Contrato backend (frontend apenas consome):
 * GET /audit-logs — params: search, actor, entity_type, entity_id, school_id, event_type, from, to, page, page_size
 * GET /audit-logs/:id — detalhe do evento (metadata com before/after quando existir)
 * Policy: Admin-only. Com Supabase configurado usa tabela audit_logs.
 */

import { supabase } from '../lib/supabase'

const USE_SUPABASE = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function formatOccurredAt(iso) {
  const d = parseDate(iso)
  return d
    ? d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
}

export { formatOccurredAt }

/** Tipos de entidade suportados no filtro */
export const ENTITY_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'franchisor', label: 'Franqueador' },
  { value: 'school', label: 'Escola' },
  { value: 'plan', label: 'Plano' },
  { value: 'subscription', label: 'Assinatura' },
  { value: 'user', label: 'Usuário' },
  { value: 'system_settings', label: 'Configurações do sistema' },
  { value: 'TEMPLATE', label: 'Template' },
]

/** Tipos de evento (ação) — MVP */
export const EVENT_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'Admin_CreateSchool', label: 'Admin_CreateSchool' },
  { value: 'Admin_UpdateSchool', label: 'Admin_UpdateSchool' },
  { value: 'Admin_ChangeSchoolStatus', label: 'Admin_ChangeSchoolStatus' },
  { value: 'Admin_CreateFranchisor', label: 'Admin_CreateFranchisor' },
  { value: 'Admin_UpdateFranchisor', label: 'Admin_UpdateFranchisor' },
  { value: 'Admin_ChangeFranchisorStatus', label: 'Admin_ChangeFranchisorStatus' },
  { value: 'Admin_CreatePlan', label: 'Admin_CreatePlan' },
  { value: 'Admin_UpdatePlan', label: 'Admin_UpdatePlan' },
  { value: 'Admin_ChangeSubscriptionStatus', label: 'Admin_ChangeSubscriptionStatus' },
  { value: 'Admin_Login', label: 'Admin_Login' },
  { value: 'Admin_UpdateSystemSettings', label: 'Admin_UpdateSystemSettings' },
]

// Mock: lista de eventos de auditoria (em produção o backend persiste)
const MOCK_AUDIT_EVENTS = [
  {
    id: 'al-1',
    occurred_at: '2025-02-24T10:30:00Z',
    actor_user_id: 'u-admin-1',
    actor_name: 'Admin Sistema',
    actor_email: 'admin@esportesacademy.com',
    event_type: 'Admin_CreateSchool',
    entity_type: 'school',
    entity_id: 'e1',
    school_id: 'e1',
    franchisor_id: '1',
    ip_address: '192.168.1.10',
    metadata_summary: 'Nova escola Arena São Paulo',
  },
  {
    id: 'al-2',
    occurred_at: '2025-02-24T09:15:00Z',
    actor_user_id: 'u-admin-1',
    actor_name: 'Admin Sistema',
    actor_email: 'admin@esportesacademy.com',
    event_type: 'Admin_ChangeSchoolStatus',
    entity_type: 'school',
    entity_id: 'e2',
    school_id: 'e2',
    franchisor_id: '1',
    ip_address: '192.168.1.10',
    metadata_summary: 'Status alterado para suspenso',
  },
  {
    id: 'al-3',
    occurred_at: '2025-02-23T16:00:00Z',
    actor_user_id: 'u-admin-1',
    actor_name: 'Admin Sistema',
    actor_email: 'admin@esportesacademy.com',
    event_type: 'Admin_UpdatePlan',
    entity_type: 'plan',
    entity_id: 'p1',
    school_id: null,
    franchisor_id: null,
    ip_address: null,
    metadata_summary: 'Plano Premium atualizado',
  },
  {
    id: 'al-4',
    occurred_at: '2025-02-23T14:20:00Z',
    actor_user_id: 'u-admin-1',
    actor_name: 'Admin Sistema',
    actor_email: 'admin@esportesacademy.com',
    event_type: 'Admin_ChangeFranchisorStatus',
    entity_type: 'franchisor',
    entity_id: '3',
    school_id: null,
    franchisor_id: '3',
    ip_address: '192.168.1.10',
    metadata_summary: 'Status: pendente',
  },
  {
    id: 'al-5',
    occurred_at: '2025-02-22T11:00:00Z',
    actor_user_id: 'u-admin-1',
    actor_name: 'Admin Sistema',
    actor_email: 'admin@esportesacademy.com',
    event_type: 'Admin_ChangeSubscriptionStatus',
    entity_type: 'subscription',
    entity_id: 'sub-1',
    school_id: 'e1',
    franchisor_id: '1',
    ip_address: null,
    metadata_summary: 'Assinatura ativada',
  },
  {
    id: 'al-6',
    occurred_at: '2025-02-21T08:45:00Z',
    actor_user_id: 'u-admin-1',
    actor_name: 'Admin Sistema',
    actor_email: 'admin@esportesacademy.com',
    event_type: 'Admin_CreateFranchisor',
    entity_type: 'franchisor',
    entity_id: '6',
    school_id: null,
    franchisor_id: '6',
    ip_address: '192.168.1.10',
    metadata_summary: 'Rede Futuro cadastrada',
  },
  {
    id: 'al-7',
    occurred_at: '2025-02-20T17:30:00Z',
    actor_user_id: 'u-admin-1',
    actor_name: 'Admin Sistema',
    actor_email: 'admin@esportesacademy.com',
    event_type: 'Admin_UpdateSchool',
    entity_type: 'school',
    entity_id: 'e4',
    school_id: 'e4',
    franchisor_id: '1',
    ip_address: null,
    metadata_summary: 'Dados da escola atualizados',
  },
  {
    id: 'al-8',
    occurred_at: '2025-02-20T10:00:00Z',
    actor_user_id: 'u-admin-1',
    actor_name: 'Admin Sistema',
    actor_email: 'admin@esportesacademy.com',
    event_type: 'Admin_Login',
    entity_type: 'user',
    entity_id: 'u-admin-1',
    school_id: null,
    franchisor_id: null,
    ip_address: '192.168.1.10',
    metadata_summary: 'Login realizado',
  },
]

/** Detalhe expandido (before/after ou diff_list) para alguns eventos */
const MOCK_AUDIT_DETAIL = {
  'al-2': {
    before: { status: 'ativo' },
    after: { status: 'suspenso' },
    diff_list: [
      { field: 'status', before: 'ativo', after: 'suspenso' },
    ],
  },
  'al-3': {
    before: { name: 'Plano Premium', price: 199.9 },
    after: { name: 'Plano Premium Plus', price: 249.9 },
    diff_list: [
      { field: 'name', before: 'Plano Premium', after: 'Plano Premium Plus' },
      { field: 'price', before: 199.9, after: 249.9 },
    ],
  },
  'al-4': {
    before: { status: 'ativo' },
    after: { status: 'pendente' },
  },
  'al-5': {
    before: { status: 'pending' },
    after: { status: 'active' },
  },
}

/** Campos opcionais por evento (user_agent, source_portal, correlation_id) */
const MOCK_AUDIT_EXTRA = {
  'al-1': {
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    source_portal: 'portal_admin',
  },
  'al-2': {
    correlation_id: 'req-abc-123',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    source_portal: 'portal_admin',
  },
  'al-8': {
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    source_portal: 'portal_admin',
  },
}

/**
 * GET /audit-logs — listagem com filtros e paginação (Supabase ou mock).
 * Backend: policy Admin-only.
 */
export async function listAuditLogs(params = {}) {
  if (USE_SUPABASE && supabase) {
    const {
      search = '',
      actor = '',
      entity_type = '',
      entity_id = '',
      school_id = '',
      event_type = '',
      from = '',
      to = '',
      page = 1,
      page_size = 10,
    } = params
    let q = supabase.from('audit_logs').select('*', { count: 'exact' }).order('occurred_at', { ascending: false })
    const searchLower = (search || '').toLowerCase().trim()
    if (searchLower) {
      q = q.or(`actor_name.ilike.%${searchLower}%,actor_email.ilike.%${searchLower}%,entity_id.ilike.%${searchLower}%`)
    }
    const actorLower = (actor || '').toLowerCase().trim()
    if (actorLower) {
      q = q.or(`actor_name.ilike.%${actorLower}%,actor_email.ilike.%${actorLower}%`)
    }
    if (entity_type && entity_type !== 'todos') q = q.eq('entity_type', entity_type)
    if (entity_id && entity_id.trim()) q = q.eq('entity_id', entity_id.trim())
    if (school_id && school_id !== '' && school_id !== 'todas') {
      if (school_id === '__empty__') q = q.is('school_id', null)
      else q = q.eq('school_id', school_id)
    }
    if (event_type && event_type !== 'todos') q = q.eq('event_type', event_type)
    if (from) {
      const fromDate = parseDate(from)
      if (fromDate) q = q.gte('occurred_at', fromDate.toISOString())
    }
    if (to) {
      const toDate = parseDate(to)
      if (toDate) q = q.lte('occurred_at', toDate.toISOString())
    }
    const start = (Number(page) - 1) * Number(page_size)
    const { data: rows, error, count } = await q.range(start, start + Number(page_size) - 1)
    if (error) throw new Error(error.message || 'Erro ao listar auditoria')
    const list = (rows || []).map((r) => ({
      id: r.id,
      occurred_at: r.occurred_at,
      actor_user_id: r.actor_user_id,
      actor_name: r.actor_name,
      actor_email: r.actor_email,
      event_type: r.event_type,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      school_id: r.school_id,
      franchisor_id: r.franchisor_id,
      ip_address: r.ip_address,
      metadata_summary: r.metadata_summary,
    }))
    const total = count ?? 0
    return {
      data: list,
      total,
      page: Number(page),
      page_size: Number(page_size),
      total_pages: Math.ceil(total / Number(page_size)) || 1,
    }
  }

  const {
    search = '',
    actor = '',
    entity_type = '',
    entity_id = '',
    school_id = '',
    event_type = '',
    from = '',
    to = '',
    page = 1,
    page_size = 10,
  } = params

  await new Promise((r) => setTimeout(r, 500))

  let list = [...MOCK_AUDIT_EVENTS]

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (e) =>
        (e.id && String(e.id).toLowerCase().includes(searchLower)) ||
        (e.actor_email && e.actor_email.toLowerCase().includes(searchLower)) ||
        (e.actor_name && e.actor_name.toLowerCase().includes(searchLower)) ||
        (e.entity_id && String(e.entity_id).toLowerCase().includes(searchLower))
    )
  }

  if (actor && actor.trim()) {
    const a = actor.trim().toLowerCase()
    list = list.filter(
      (e) =>
        (e.actor_email && e.actor_email.toLowerCase().includes(a)) ||
        (e.actor_name && e.actor_name.toLowerCase().includes(a))
    )
  }

  if (entity_type && entity_type !== 'todos') {
    list = list.filter((e) => (e.entity_type || '') === entity_type)
  }

  if (entity_id && entity_id.trim()) {
    const eid = entity_id.trim()
    list = list.filter((e) => e.entity_id && String(e.entity_id) === eid)
  }

  if (school_id !== undefined && school_id !== '' && school_id !== 'todas') {
    if (school_id === '__empty__') {
      list = list.filter((e) => e.school_id == null || e.school_id === '')
    } else {
      list = list.filter((e) => e.school_id != null && String(e.school_id) === String(school_id))
    }
  }

  if (event_type && event_type !== 'todos') {
    list = list.filter((e) => (e.event_type || '') === event_type)
  }

  const fromDate = from ? parseDate(from) : null
  const toDate = to ? parseDate(to) : null
  if (fromDate || toDate) {
    list = list.filter((e) => {
      const occ = parseDate(e.occurred_at)
      if (!occ) return false
      if (fromDate && occ < fromDate) return false
      if (toDate && occ > toDate) return false
      return true
    })
  }

  const total = list.length
  const start = (Number(page) - 1) * Number(page_size)
  const pageList = list.slice(start, start + Number(page_size))

  return {
    data: pageList,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

/**
 * GET /audit-logs/:id — detalhe do evento (com metadata before/after quando existir).
 * Backend: policy Admin-only; 403 redireciona para Acesso Negado.
 * Contrato: id, occurred_at, event_type, actor_*, entity_*, school_id?, franchisor_id?,
 * ip_address?, user_agent?, source_portal?, changes?, metadata (sanitizada), correlation_id?
 */
export async function getAuditLogEvent(id) {
  if (USE_SUPABASE && supabase) {
    const { data, error } = await supabase.from('audit_logs').select('*').eq('id', id).single()
    if (error || !data) {
      const err = new Error('Evento de auditoria não encontrado')
      err.status = 404
      throw err
    }
    return {
      id: data.id,
      occurred_at: data.occurred_at,
      actor_user_id: data.actor_user_id,
      actor_name: data.actor_name,
      actor_email: data.actor_email,
      event_type: data.event_type,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      school_id: data.school_id,
      franchisor_id: data.franchisor_id,
      ip_address: data.ip_address,
      metadata_summary: data.metadata_summary,
      user_agent: data.user_agent,
      source_portal: data.source_portal,
      correlation_id: data.correlation_id,
      metadata: data.metadata || {},
      changes: data.metadata || undefined,
    }
  }
  await new Promise((r) => setTimeout(r, 400))
  const event = MOCK_AUDIT_EVENTS.find((e) => String(e.id) === String(id))
  if (!event) {
    const err = new Error('Evento de auditoria não encontrado')
    err.status = 404
    throw err
  }
  const detail = MOCK_AUDIT_DETAIL[event.id] || null
  const extra = MOCK_AUDIT_EXTRA[event.id] || {}
  return {
    ...event,
    ...extra,
    metadata: detail || {},
    changes: detail || undefined,
  }
}
