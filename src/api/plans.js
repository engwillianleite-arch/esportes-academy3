/**
 * Contrato esperado do backend (frontend apenas consome):
 * GET /plans — params: search, status, billing_cycle, page, page_size
 * Resposta: { data: [...], total_pages }
 * Item: id, name, status, billing_cycle, price_amount, price_currency, schools_limit?, created_at
 * Policy: Admin-only. Auditoria: Admin_ListPlans.
 */

const MOCK_PLANOS = [
  { id: '1', name: 'Plano Básico', status: 'ativo', billing_cycle: 'mensal', price_amount: 29900, price_currency: 'BRL', schools_limit: 5, created_at: '2024-01-10T08:00:00Z' },
  { id: '2', name: 'Plano Profissional', status: 'ativo', billing_cycle: 'mensal', price_amount: 59900, price_currency: 'BRL', schools_limit: 20, created_at: '2024-01-10T08:00:00Z' },
  { id: '3', name: 'Plano Enterprise', status: 'ativo', billing_cycle: 'anual', price_amount: 599900, price_currency: 'BRL', schools_limit: null, created_at: '2024-02-15T10:00:00Z' },
  { id: '4', name: 'Plano Starter', status: 'inativo', billing_cycle: 'mensal', price_amount: 14900, price_currency: 'BRL', schools_limit: 2, created_at: '2024-03-01T12:00:00Z' },
  { id: '5', name: 'Plano Anual Básico', status: 'ativo', billing_cycle: 'anual', price_amount: 299000, price_currency: 'BRL', schools_limit: 5, created_at: '2024-04-20T09:00:00Z' },
]

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

export function formatCreatedAt(iso) {
  const d = parseDate(iso)
  return d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}

/**
 * Formata preço para exibição (valor em centavos → R$ X.XXX,XX).
 * Backend envia price_amount em centavos; nunca confiar no front para regras de preço.
 */
export function formatPrice(amount, currency = 'BRL') {
  if (amount == null) return '—'
  const value = Number(amount) / 100
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(value)
}

/**
 * Lista planos com paginação e filtros (mock; backend fará com policy Admin).
 */
export async function listPlans(params = {}) {
  const {
    search = '',
    status = '',
    billing_cycle = '',
    page = 1,
    page_size = 10,
  } = params

  await new Promise((r) => setTimeout(r, 500))

  let list = [...MOCK_PLANOS]

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(searchLower)) ||
        (p.id && String(p.id).includes(searchLower))
    )
  }

  if (status && status !== 'todos') {
    list = list.filter((p) => (p.status || '').toLowerCase() === status.toLowerCase())
  }

  if (billing_cycle && billing_cycle !== 'todas') {
    list = list.filter((p) => (p.billing_cycle || '').toLowerCase() === billing_cycle.toLowerCase())
  }

  const total = list.length
  const total_pages = Math.max(1, Math.ceil(total / page_size))
  const pageSafe = Math.max(1, Math.min(page, total_pages))
  const start = (pageSafe - 1) * page_size
  const data = list.slice(start, start + page_size)

  return { data, total_pages, total }
}

/**
 * GET /plans/{plan_id} — Admin-only. Retorno: id, name, description?, status, billing_cycle,
 * price_amount, price_currency, schools_limit?, notes_internal?, created_at
 */
export async function getPlan(planId) {
  if (!planId) throw new Error('plan_id obrigatório')
  await new Promise((r) => setTimeout(r, 400))
  const plan = MOCK_PLANOS.find((p) => String(p.id) === String(planId))
  if (!plan) {
    const err = new Error('Plano não encontrado')
    err.status = 404
    throw err
  }
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? '',
    status: plan.status,
    billing_cycle: plan.billing_cycle,
    price_amount: plan.price_amount,
    price_currency: plan.price_currency || 'BRL',
    schools_limit: plan.schools_limit ?? null,
    notes_internal: plan.notes_internal ?? '',
    created_at: plan.created_at,
  }
}

/**
 * POST /plans — payload: name, description?, status, billing_cycle, price_amount, price_currency,
 * schools_limit?, notes_internal?. Retorno: plan_id + campos principais.
 * Policy: Admin-only. Auditoria: Admin_CreatePlan.
 */
export async function createPlan(payload) {
  await new Promise((r) => setTimeout(r, 600))
  const id = String(MOCK_PLANOS.length + 1)
  const plan = {
    id,
    name: payload.name || '',
    description: payload.description ?? '',
    status: payload.status || 'ativo',
    billing_cycle: payload.billing_cycle || 'mensal',
    price_amount: payload.price_amount ?? 0,
    price_currency: payload.price_currency || 'BRL',
    schools_limit: payload.schools_limit ?? null,
    notes_internal: payload.notes_internal ?? '',
    created_at: new Date().toISOString(),
  }
  MOCK_PLANOS.push(plan)
  return { id: plan.id, ...plan }
}

/**
 * PATCH /plans/{plan_id} — payload: campos editáveis. Policy: Admin-only. Auditoria: Admin_UpdatePlan.
 */
export async function updatePlan(planId, payload) {
  if (!planId) throw new Error('plan_id obrigatório')
  await new Promise((r) => setTimeout(r, 600))
  const idx = MOCK_PLANOS.findIndex((p) => String(p.id) === String(planId))
  if (idx === -1) {
    const err = new Error('Plano não encontrado')
    err.status = 404
    throw err
  }
  const plan = MOCK_PLANOS[idx]
  const updated = {
    ...plan,
    name: payload.name !== undefined ? payload.name : plan.name,
    description: payload.description !== undefined ? payload.description : plan.description,
    status: payload.status !== undefined ? payload.status : plan.status,
    billing_cycle: payload.billing_cycle !== undefined ? payload.billing_cycle : plan.billing_cycle,
    price_amount: payload.price_amount !== undefined ? payload.price_amount : plan.price_amount,
    price_currency: payload.price_currency !== undefined ? payload.price_currency : plan.price_currency,
    schools_limit: payload.schools_limit !== undefined ? payload.schools_limit : plan.schools_limit,
    notes_internal: payload.notes_internal !== undefined ? payload.notes_internal : plan.notes_internal,
  }
  MOCK_PLANOS[idx] = updated
  return updated
}
