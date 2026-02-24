/**
 * Contrato backend (frontend apenas consome):
 * GET /support/tickets — paginação + filtros
 * Params: search, status, type, priority?, context_type?, school_id?, franchisor_id?, from, to, page, page_size
 * Retorno itens: id, subject, requester_name?, requester_email, context_type (SCHOOL | FRANCHISOR | NONE),
 *   school_id?, school_name?, franchisor_id?, franchisor_name?, status, type, priority?, updated_at, created_at
 * Policy: Admin-only. Auditoria: Admin_ListSupportTickets.
 */

const STATUS_LIST = ['open', 'in_progress', 'resolved', 'closed']
const TYPE_LIST = ['duvida', 'problema', 'financeiro', 'cadastro', 'outros']
const PRIORITY_LIST = ['low', 'medium', 'high']
const CONTEXT_TYPES = { SCHOOL: 'SCHOOL', FRANCHISOR: 'FRANCHISOR', NONE: 'NONE' }

/** Mock: tickets para Central de Suporte (Admin). */
const MOCK_TICKETS = [
  {
    id: 'TKT-001',
    subject: 'Dúvida sobre renovação de assinatura',
    requester_name: 'Carlos Silva',
    requester_email: 'carlos@redearena.com.br',
    context_type: CONTEXT_TYPES.FRANCHISOR,
    school_id: null,
    school_name: null,
    franchisor_id: '1',
    franchisor_name: 'Rede Arena',
    status: 'open',
    type: 'duvida',
    priority: 'medium',
    updated_at: '2025-02-24T10:30:00Z',
    created_at: '2025-02-24T09:00:00Z',
  },
  {
    id: 'TKT-002',
    subject: 'Erro ao gerar relatório de turmas',
    requester_name: 'João Silva',
    requester_email: 'joao@arenasp.com.br',
    context_type: CONTEXT_TYPES.SCHOOL,
    school_id: 'e1',
    school_name: 'Arena São Paulo',
    franchisor_id: '1',
    franchisor_name: 'Rede Arena',
    status: 'in_progress',
    type: 'problema',
    priority: 'high',
    updated_at: '2025-02-24T11:00:00Z',
    created_at: '2025-02-23T14:20:00Z',
  },
  {
    id: 'TKT-003',
    subject: 'Solicitação de alteração de dados bancários',
    requester_name: 'Ana Costa',
    requester_email: 'admin@brasilsports.com.br',
    context_type: CONTEXT_TYPES.FRANCHISOR,
    school_id: null,
    school_name: null,
    franchisor_id: '2',
    franchisor_name: 'Brasil Sports',
    status: 'resolved',
    type: 'financeiro',
    priority: 'medium',
    updated_at: '2025-02-22T16:00:00Z',
    created_at: '2025-02-20T08:00:00Z',
  },
  {
    id: 'TKT-004',
    subject: 'Cadastro de nova escola na rede',
    requester_name: 'Roberto Lima',
    requester_email: 'roberto@champions.com.br',
    context_type: CONTEXT_TYPES.FRANCHISOR,
    school_id: null,
    school_name: null,
    franchisor_id: '3',
    franchisor_name: 'Academia Champions',
    status: 'closed',
    type: 'cadastro',
    priority: 'low',
    updated_at: '2025-02-21T12:00:00Z',
    created_at: '2025-02-18T10:00:00Z',
  },
  {
    id: 'TKT-005',
    subject: 'Problema no login do portal escola',
    requester_name: 'Maria Costa',
    requester_email: 'maria@arenacampinas.com.br',
    context_type: CONTEXT_TYPES.SCHOOL,
    school_id: 'e2',
    school_name: 'Arena Campinas',
    franchisor_id: '1',
    franchisor_name: 'Rede Arena',
    status: 'open',
    type: 'problema',
    priority: 'high',
    updated_at: '2025-02-24T08:15:00Z',
    created_at: '2025-02-24T08:15:00Z',
  },
  {
    id: 'TKT-006',
    subject: 'Outros - Informações gerais',
    requester_name: 'Fernanda Souza',
    requester_email: 'fernanda@redfuturo.com.br',
    context_type: CONTEXT_TYPES.NONE,
    school_id: null,
    school_name: null,
    franchisor_id: null,
    franchisor_name: null,
    status: 'resolved',
    type: 'outros',
    priority: 'low',
    updated_at: '2025-02-19T09:00:00Z',
    created_at: '2025-02-17T11:00:00Z',
  },
]

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Formata data/hora para exibição (updated_at / created_at).
 */
export function formatTicketDate(iso) {
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

/**
 * Lista tickets com filtros e paginação (mock; backend fará com policy Admin).
 * Em caso de 403, lança erro com err.status === 403 para o front redirecionar para Acesso Negado.
 */
export async function listTickets(params = {}) {
  const {
    search = '',
    status = '',
    type = '',
    priority = '',
    context_type = '',
    school_id = '',
    franchisor_id = '',
    from = '',
    to = '',
    page = 1,
    page_size = 10,
  } = params

  await new Promise((r) => setTimeout(r, 500))

  let list = [...MOCK_TICKETS]

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (t) =>
        (t.subject && t.subject.toLowerCase().includes(searchLower)) ||
        (t.id && String(t.id).toLowerCase().includes(searchLower)) ||
        (t.requester_email && t.requester_email.toLowerCase().includes(searchLower)) ||
        (t.requester_name && t.requester_name.toLowerCase().includes(searchLower))
    )
  }

  if (status && status !== 'todos') {
    list = list.filter((t) => (t.status || '').toLowerCase() === status.toLowerCase())
  }
  if (type && type !== 'todos') {
    list = list.filter((t) => (t.type || '').toLowerCase() === type.toLowerCase())
  }
  if (priority && priority !== 'todos') {
    list = list.filter((t) => (t.priority || '').toLowerCase() === priority.toLowerCase())
  }
  if (context_type && context_type !== 'todos') {
    list = list.filter((t) => (t.context_type || 'NONE') === context_type)
  }
  if (school_id && school_id.trim()) {
    list = list.filter((t) => t.school_id && String(t.school_id) === String(school_id).trim())
  }
  if (franchisor_id && franchisor_id.trim()) {
    list = list.filter((t) => t.franchisor_id && String(t.franchisor_id) === String(franchisor_id).trim())
  }

  if (from || to) {
    list = list.filter((t) => {
      const created = parseDate(t.created_at)
      if (!created) return false
      const fromDate = from ? parseDate(from) : null
      const toDate = to ? parseDate(to) : null
      if (fromDate && created < fromDate) return false
      if (toDate) {
        const toEnd = new Date(toDate)
        toEnd.setHours(23, 59, 59, 999)
        if (created > toEnd) return false
      }
      return true
    })
  }

  const total = list.length
  const total_pages = Math.max(1, Math.ceil(total / page_size))
  const pageSafe = Math.max(1, Math.min(page, total_pages))
  const start = (pageSafe - 1) * page_size
  const data = list.slice(start, start + page_size)

  return {
    data,
    total,
    page: pageSafe,
    page_size,
    total_pages,
  }
}

// ——— Detalhe do ticket (GET/PATCH) e timeline (GET/POST) ———

/** Mock: timeline por ticket_id. Append-only; POST e PATCH adicionam itens aqui. */
const MOCK_TIMELINE_BY_TICKET = {}

function ensureTimeline(ticketId) {
  if (!MOCK_TIMELINE_BY_TICKET[ticketId]) {
    const t = MOCK_TICKETS.find((x) => String(x.id) === String(ticketId))
    const base = [
      {
        id: `tl-${ticketId}-1`,
        occurred_at: t?.created_at || new Date().toISOString(),
        author_type: 'REQUESTER',
        author_name: t?.requester_name || null,
        content: 'Mensagem inicial do solicitante (abertura do ticket).',
        entry_type: 'MESSAGE',
        visibility: 'PUBLIC',
      },
    ]
    if (t && t.updated_at !== t.created_at) {
      base.push({
        id: `tl-${ticketId}-2`,
        occurred_at: t.updated_at,
        author_type: 'SYSTEM',
        author_name: null,
        content: `Status alterado para ${getStatusLabelForApi(t.status)}.`,
        entry_type: 'STATUS_CHANGE',
        visibility: 'PUBLIC',
      })
    }
    MOCK_TIMELINE_BY_TICKET[ticketId] = base
  }
  return MOCK_TIMELINE_BY_TICKET[ticketId]
}

function getStatusLabelForApi(value) {
  const map = { open: 'Aberto', in_progress: 'Em andamento', resolved: 'Resolvido', closed: 'Fechado' }
  return map[value] || value || '—'
}

/**
 * GET /support/tickets/{ticket_id}
 * Retorno: id, subject, status, type, priority?, requester_name?, requester_email,
 *   context_type, school_id?, school_name?, franchisor_id?, franchisor_name?, created_at, updated_at
 * 403 → Acesso Negado; 404 → não encontrado.
 */
export async function getTicket(ticketId) {
  await new Promise((r) => setTimeout(r, 400))
  const t = MOCK_TICKETS.find((x) => String(x.id) === String(ticketId))
  if (!t) {
    const err = new Error('Ticket não encontrado.')
    err.status = 404
    throw err
  }
  return {
    id: t.id,
    subject: t.subject,
    status: t.status,
    type: t.type,
    priority: t.priority,
    requester_name: t.requester_name,
    requester_email: t.requester_email,
    context_type: t.context_type || 'NONE',
    school_id: t.school_id ?? null,
    school_name: t.school_name ?? null,
    franchisor_id: t.franchisor_id ?? null,
    franchisor_name: t.franchisor_name ?? null,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }
}

/**
 * GET /support/tickets/{ticket_id}/timeline
 * Retorno: items[] com id, occurred_at, author_type, author_name?, content, entry_type, visibility?
 * Ordenação: mais antigo primeiro (cronológica).
 */
export async function getTicketTimeline(ticketId) {
  await new Promise((r) => setTimeout(r, 300))
  const list = ensureTimeline(ticketId)
  const sorted = [...list].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))
  return { items: sorted }
}

/**
 * POST /support/tickets/{ticket_id}/messages
 * Payload: { content, visibility? }
 * Retorno: item criado (mesmo formato da timeline).
 * 403 → Acesso Negado.
 */
export async function postTicketMessage(ticketId, payload) {
  await new Promise((r) => setTimeout(r, 350))
  const list = ensureTimeline(ticketId)
  const newItem = {
    id: `tl-${ticketId}-${Date.now()}`,
    occurred_at: new Date().toISOString(),
    author_type: 'ADMIN',
    author_name: 'Admin',
    content: (payload.content || '').trim() || '(sem texto)',
    entry_type: 'MESSAGE',
    visibility: payload.visibility || 'INTERNAL',
  }
  list.push(newItem)
  const t = MOCK_TICKETS.find((x) => String(x.id) === String(ticketId))
  if (t) {
    t.updated_at = newItem.occurred_at
  }
  return newItem
}

/**
 * PATCH /support/tickets/{ticket_id} (status)
 * Payload: { status }
 * Retorno: ticket atualizado.
 * 403 → Acesso Negado; 404 → não encontrado.
 */
export async function patchTicketStatus(ticketId, payload) {
  await new Promise((r) => setTimeout(r, 350))
  const t = MOCK_TICKETS.find((x) => String(x.id) === String(ticketId))
  if (!t) {
    const err = new Error('Ticket não encontrado.')
    err.status = 404
    throw err
  }
  const oldStatus = t.status
  const newStatus = payload.status
  if (STATUS_LIST.includes(newStatus)) {
    t.status = newStatus
  }
  t.updated_at = new Date().toISOString()
  const list = ensureTimeline(ticketId)
  list.push({
    id: `tl-${ticketId}-status-${Date.now()}`,
    occurred_at: t.updated_at,
    author_type: 'SYSTEM',
    author_name: null,
    content: `Status alterado de ${getStatusLabelForApi(oldStatus)} para ${getStatusLabelForApi(newStatus)}.`,
    entry_type: 'STATUS_CHANGE',
    visibility: 'PUBLIC',
  })
  return {
    id: t.id,
    subject: t.subject,
    status: t.status,
    type: t.type,
    priority: t.priority,
    requester_name: t.requester_name,
    requester_email: t.requester_email,
    context_type: t.context_type || 'NONE',
    school_id: t.school_id ?? null,
    school_name: t.school_name ?? null,
    franchisor_id: t.franchisor_id ?? null,
    franchisor_name: t.franchisor_name ?? null,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }
}

/** Labels para tipo e prioridade (exibição). */
export const TYPE_LABELS = {
  duvida: 'Dúvida',
  problema: 'Problema',
  financeiro: 'Financeiro',
  cadastro: 'Cadastro',
  outros: 'Outros',
}
export const PRIORITY_LABELS = { low: 'Baixa', medium: 'Média', high: 'Alta' }
export const STATUS_LABELS = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

// ——— Categorias de Suporte (Fase 2) ———
// Contrato: GET /support/categories (search, status, page, page_size)
// POST /support/categories — name, description?, status, sort_order?
// PATCH /support/categories/{id} — name?, description?, status?, sort_order?
// Policy: Admin-only. Sem DELETE no MVP (inativação apenas).

const CATEGORY_STATUS_ACTIVE = 'active'
const CATEGORY_STATUS_INACTIVE = 'inactive'

/** Mock: categorias de suporte (Admin). */
let MOCK_SUPPORT_CATEGORIES = [
  { id: 'cat-1', name: 'Dúvida', description: 'Dúvidas gerais', status: CATEGORY_STATUS_ACTIVE, sort_order: 1, created_at: '2025-02-01T10:00:00Z' },
  { id: 'cat-2', name: 'Problema', description: 'Problemas técnicos ou operacionais', status: CATEGORY_STATUS_ACTIVE, sort_order: 2, created_at: '2025-02-01T10:00:00Z' },
  { id: 'cat-3', name: 'Financeiro', description: 'Cobrança, pagamento, dados bancários', status: CATEGORY_STATUS_ACTIVE, sort_order: 3, created_at: '2025-02-01T10:00:00Z' },
  { id: 'cat-4', name: 'Cadastro', description: 'Alteração de dados, nova escola', status: CATEGORY_STATUS_ACTIVE, sort_order: 4, created_at: '2025-02-01T10:00:00Z' },
  { id: 'cat-5', name: 'Outros', description: 'Outros assuntos', status: CATEGORY_STATUS_ACTIVE, sort_order: 5, created_at: '2025-02-01T10:00:00Z' },
]

function nextCategoryId() {
  const nums = MOCK_SUPPORT_CATEGORIES.map((c) => {
    const m = (c.id || '').match(/cat-(\d+)/)
    return m ? parseInt(m[1], 10) : 0
  })
  const max = Math.max(0, ...nums)
  return `cat-${max + 1}`
}

/**
 * GET /support/categories — listagem com paginação e filtros.
 * Retorno: { data, total, page, page_size, total_pages }
 * 403 → Acesso Negado.
 */
export async function listSupportCategories(params = {}) {
  const { search = '', status = '', page = 1, page_size = 10 } = params

  await new Promise((r) => setTimeout(r, 400))

  let list = [...MOCK_SUPPORT_CATEGORIES]

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(searchLower)) ||
        (c.description && c.description.toLowerCase().includes(searchLower))
    )
  }

  if (status && status !== 'todos') {
    const s = status.toLowerCase()
    list = list.filter((c) => (c.status || '').toLowerCase() === s)
  }

  list.sort((a, b) => {
    const oa = a.sort_order != null ? Number(a.sort_order) : 999
    const ob = b.sort_order != null ? Number(b.sort_order) : 999
    if (oa !== ob) return oa - ob
    return (a.name || '').localeCompare(b.name || '')
  })

  const total = list.length
  const total_pages = Math.max(1, Math.ceil(total / page_size))
  const pageSafe = Math.max(1, Math.min(page, total_pages))
  const start = (pageSafe - 1) * page_size
  const data = list.slice(start, start + page_size)

  return { data, total, page: pageSafe, page_size, total_pages }
}

/**
 * POST /support/categories
 * Payload: { name, description?, status, sort_order? }
 * 403 → Acesso Negado.
 */
export async function createSupportCategory(payload) {
  await new Promise((r) => setTimeout(r, 350))
  const name = (payload.name || '').trim()
  if (!name) {
    const err = new Error('Nome é obrigatório.')
    err.status = 400
    throw err
  }
  const item = {
    id: nextCategoryId(),
    name,
    description: (payload.description || '').trim() || null,
    status: payload.status === CATEGORY_STATUS_INACTIVE ? CATEGORY_STATUS_INACTIVE : CATEGORY_STATUS_ACTIVE,
    sort_order: payload.sort_order != null ? Number(payload.sort_order) : null,
    created_at: new Date().toISOString(),
  }
  MOCK_SUPPORT_CATEGORIES.push(item)
  MOCK_SUPPORT_CATEGORIES.sort((a, b) => {
    const oa = a.sort_order != null ? Number(a.sort_order) : 999
    const ob = b.sort_order != null ? Number(b.sort_order) : 999
    if (oa !== ob) return oa - ob
    return (a.name || '').localeCompare(b.name || '')
  })
  return item
}

/**
 * PATCH /support/categories/{id}
 * Payload: { name?, description?, status?, sort_order? }
 * 403 → Acesso Negado; 404 → não encontrado.
 */
export async function updateSupportCategory(id, payload) {
  await new Promise((r) => setTimeout(r, 350))
  const c = MOCK_SUPPORT_CATEGORIES.find((x) => String(x.id) === String(id))
  if (!c) {
    const err = new Error('Categoria não encontrada.')
    err.status = 404
    throw err
  }
  if (payload.name !== undefined) c.name = (payload.name || '').trim() || c.name
  if (payload.description !== undefined) c.description = (payload.description || '').trim() || null
  if (payload.status !== undefined) c.status = payload.status === CATEGORY_STATUS_INACTIVE ? CATEGORY_STATUS_INACTIVE : CATEGORY_STATUS_ACTIVE
  if (payload.sort_order !== undefined) c.sort_order = payload.sort_order == null ? null : Number(payload.sort_order)
  return { ...c }
}

/**
 * Alternar status ativa/inativa (PATCH com status invertido).
 * 403 → Acesso Negado; 404 → não encontrado.
 */
export async function toggleSupportCategoryStatus(id) {
  const c = MOCK_SUPPORT_CATEGORIES.find((x) => String(x.id) === String(id))
  if (!c) {
    const err = new Error('Categoria não encontrada.')
    err.status = 404
    throw err
  }
  const newStatus = (c.status || '').toLowerCase() === CATEGORY_STATUS_ACTIVE ? CATEGORY_STATUS_INACTIVE : CATEGORY_STATUS_ACTIVE
  return updateSupportCategory(id, { status: newStatus })
}

/** Lista categorias ativas (para selects em tickets). */
export async function listActiveSupportCategories() {
  const res = await listSupportCategories({ status: CATEGORY_STATUS_ACTIVE, page: 1, page_size: 100 })
  return res.data
}
