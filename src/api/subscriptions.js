/**
 * Contrato esperado do backend (frontend apenas consome):
 * GET /subscriptions — params: search, franchisor_id, school_id, plan_id, status, start_from?, start_to?, page, page_size
 * Resposta: { data: [...], total_pages }
 * Item: id, school_id, school_name, franchisor_id, franchisor_name, plan_id, plan_name, status, start_date, next_renewal_date?, created_at
 * Policy: Admin-only. Auditoria: Admin_ListSubscriptions.
 */

const MOCK_ASSINATURAS = [
  { id: 'sub1', school_id: 'e1', school_name: 'Arena São Paulo', franchisor_id: '1', franchisor_name: 'Rede Arena', plan_id: '1', plan_name: 'Plano Básico', status: 'ativa', start_date: '2024-02-01', next_renewal_date: '2025-03-01', created_at: '2024-02-01T09:00:00Z' },
  { id: 'sub2', school_id: 'e2', school_name: 'Arena Campinas', franchisor_id: '1', franchisor_name: 'Rede Arena', plan_id: '2', plan_name: 'Plano Profissional', status: 'inativa', start_date: '2024-03-15', next_renewal_date: null, created_at: '2024-03-15T10:00:00Z' },
  { id: 'sub3', school_id: 'e3', school_name: 'Arena Santos', franchisor_id: '1', franchisor_name: 'Rede Arena', plan_id: '4', plan_name: 'Plano Starter', status: 'pendente', start_date: '2024-05-20', next_renewal_date: '2024-06-20', created_at: '2024-05-20T14:00:00Z' },
  { id: 'sub4', school_id: 'e4', school_name: 'Arena Ribeirão', franchisor_id: '1', franchisor_name: 'Rede Arena', plan_id: '1', plan_name: 'Plano Básico', status: 'ativa', start_date: '2024-06-10', next_renewal_date: '2025-07-10', created_at: '2024-06-10T08:00:00Z' },
  { id: 'sub5', school_id: 'e5', school_name: 'Brasil Sports Curitiba', franchisor_id: '2', franchisor_name: 'Brasil Sports', plan_id: '2', plan_name: 'Plano Profissional', status: 'ativa', start_date: '2024-04-01', next_renewal_date: '2025-04-01', created_at: '2024-04-01T11:00:00Z' },
  { id: 'sub6', school_id: 'e6', school_name: 'Brasil Sports Londrina', franchisor_id: '2', franchisor_name: 'Brasil Sports', plan_id: '1', plan_name: 'Plano Básico', status: 'ativa', start_date: '2024-07-01', next_renewal_date: '2025-07-01', created_at: '2024-07-01T09:00:00Z' },
  { id: 'sub7', school_id: 'e7', school_name: 'Champions Belo Horizonte', franchisor_id: '3', franchisor_name: 'Academia Champions', plan_id: '4', plan_name: 'Plano Starter', status: 'cancelada', start_date: '2025-01-15', next_renewal_date: null, created_at: '2025-01-15T10:00:00Z' },
  { id: 'sub8', school_id: 'e8', school_name: 'Futuro Porto Alegre', franchisor_id: '6', franchisor_name: 'Rede Futuro', plan_id: '1', plan_name: 'Plano Básico', status: 'ativa', start_date: '2025-02-05', next_renewal_date: '2026-02-05', created_at: '2025-02-05T08:00:00Z' },
]

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

export function formatSubscriptionDate(isoOrYmd) {
  const d = parseDate(isoOrYmd)
  return d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}

export function formatSubscriptionDateTime(isoStr) {
  const d = parseDate(isoStr)
  return d ? d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

/**
 * Lista assinaturas com paginação e filtros (mock; backend fará com policy Admin).
 */
export async function listSubscriptions(params = {}) {
  const {
    search = '',
    franchisor_id: franchisorId = '',
    school_id: schoolId = '',
    plan_id: planId = '',
    status = '',
    start_from: startFrom = '',
    start_to: startTo = '',
    page = 1,
    page_size: pageSize = 10,
  } = params

  await new Promise((r) => setTimeout(r, 500))

  let list = [...MOCK_ASSINATURAS]

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (s) =>
        (s.school_name && s.school_name.toLowerCase().includes(searchLower)) ||
        (s.franchisor_name && s.franchisor_name.toLowerCase().includes(searchLower)) ||
        (s.id && String(s.id).toLowerCase().includes(searchLower))
    )
  }

  if (franchisorId) {
    list = list.filter((s) => String(s.franchisor_id) === String(franchisorId))
  }
  if (schoolId) {
    list = list.filter((s) => String(s.school_id) === String(schoolId))
  }
  if (planId) {
    list = list.filter((s) => String(s.plan_id) === String(planId))
  }
  if (status && status !== 'todos') {
    list = list.filter((s) => (s.status || '').toLowerCase() === status.toLowerCase())
  }

  const fromDate = startFrom ? parseDate(startFrom) : null
  const toDate = startTo ? parseDate(startTo) : null
  if (fromDate || toDate) {
    list = list.filter((s) => {
      const start = parseDate(s.start_date) || parseDate(s.created_at)
      if (!start) return false
      if (fromDate && start < fromDate) return false
      if (toDate && start > toDate) return false
      return true
    })
  }

  const total = list.length
  const total_pages = Math.max(1, Math.ceil(total / pageSize))
  const pageSafe = Math.max(1, Math.min(page, total_pages))
  const start = (pageSafe - 1) * pageSize
  const data = list.slice(start, start + pageSize)

  return { data, total_pages, total }
}

/**
 * Contrato backend: GET /subscriptions/{subscription_id}
 * Retorno: id, status, start_date, next_renewal_date?, created_at, school_id, school_name, franchisor_id, franchisor_name, plan_id, plan_name, school_suspended?
 * Policy: Admin-only. Auditoria: Admin_ViewSubscription.
 */
export async function getSubscription(subscriptionId) {
  await new Promise((r) => setTimeout(r, 400))
  const sub = MOCK_ASSINATURAS.find((s) => String(s.id) === String(subscriptionId))
  if (!sub) {
    const err = new Error('Assinatura não encontrada')
    err.status = 404
    throw err
  }
  return {
    ...sub,
    school_suspended: false,
  }
}

/**
 * Mock: histórico por assinatura. Backend: GET /subscriptions/{id}/history?page=&page_size=
 * items: occurred_at, event_type, from_value?, to_value?, actor, reason_category?, reason_details?
 */
const MOCK_HISTORY_BY_SUB = {}
function getMockHistory(subId) {
  if (MOCK_HISTORY_BY_SUB[subId]) return MOCK_HISTORY_BY_SUB[subId]
  const sub = MOCK_ASSINATURAS.find((s) => String(s.id) === String(subId))
  const list = [
    {
      occurred_at: sub?.created_at || new Date().toISOString(),
      event_type: 'created',
      from_value: null,
      to_value: sub?.status || 'ativa',
      actor: 'Admin (Sistema)',
      reason_category: null,
      reason_details: null,
    },
  ]
  if (sub?.status === 'cancelada' || sub?.status === 'inativa') {
    list.push({
      occurred_at: sub.created_at ? new Date(new Date(sub.created_at).getTime() + 86400000).toISOString() : new Date().toISOString(),
      event_type: 'status_changed',
      from_value: 'ativa',
      to_value: sub.status,
      actor: 'Admin (Sistema)',
      reason_category: 'Ajuste administrativo',
      reason_details: 'Registro de teste.',
    })
  }
  MOCK_HISTORY_BY_SUB[subId] = list
  return list
}

export async function getSubscriptionHistory(subscriptionId, params = {}) {
  const { page = 1, page_size: pageSize = 10 } = params
  await new Promise((r) => setTimeout(r, 300))
  const list = getMockHistory(subscriptionId)
  const total = list.length
  const total_pages = Math.max(1, Math.ceil(total / pageSize))
  const pageSafe = Math.max(1, Math.min(page, total_pages))
  const start = (pageSafe - 1) * pageSize
  const items = list.slice(start, start + pageSize)
  return { items, total_pages, total }
}

/** Transições permitidas (state machine simples): ativa->cancelada, inativa->ativa. Cancelada sem reativar. */
const TRANSICOES = {
  ativa: [{ action: 'cancelar', to_value: 'cancelada', label: 'Cancelar' }],
  inativa: [{ action: 'ativar', to_value: 'ativa', label: 'Ativar' }],
  cancelada: [],
  expirada: [],
  pendente: [{ action: 'ativar', to_value: 'ativa', label: 'Ativar' }, { action: 'cancelar', to_value: 'cancelada', label: 'Cancelar' }],
}

const MOTIVOS = [
  'Solicitação do cliente',
  'Inadimplência',
  'Ajuste administrativo',
  'Outros',
]

export function getTransicoesPermitidas(status) {
  return TRANSICOES[(status || '').toLowerCase()] || []
}

export function getMotivos() {
  return MOTIVOS
}

/**
 * Contrato backend: POST /subscriptions/{subscription_id}/transition
 * payload: { action, reason_category, reason_details, confirmed }
 * Policy: Admin-only. Auditoria: Admin_ChangeSubscriptionStatus.
 */
export async function transitionSubscription(subscriptionId, payload) {
  const { action, reason_category, reason_details, confirmed } = payload || {}
  await new Promise((r) => setTimeout(r, 500))
  if (!confirmed) {
    const err = new Error('Confirmação obrigatória')
    err.status = 400
    throw err
  }
  const sub = MOCK_ASSINATURAS.find((s) => String(s.id) === String(subscriptionId))
  if (!sub) {
    const err = new Error('Assinatura não encontrada')
    err.status = 404
    throw err
  }
  const statusAtual = (sub.status || '').toLowerCase()
  const transicoes = getTransicoesPermitidas(statusAtual)
  const t = transicoes.find((x) => (x.action || '').toLowerCase() === (action || '').toLowerCase())
  if (!t) {
    const err = new Error('Transição de status inválida')
    err.status = 400
    throw err
  }
  sub.status = t.to_value
  const novoItem = {
    occurred_at: new Date().toISOString(),
    event_type: 'status_changed',
    from_value: statusAtual,
    to_value: t.to_value,
    actor: 'Admin (Sistema)',
    reason_category: reason_category || 'Outros',
    reason_details: reason_details || '',
  }
  const hist = getMockHistory(subscriptionId)
  hist.unshift(novoItem)
  return { ...sub }
}
