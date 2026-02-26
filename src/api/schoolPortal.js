/**
 * Contrato mínimo do backend — Portal Escola (frontend apenas consome).
 *
 * GET /school/dashboard/summary
 *   Headers/contexto: school_id derivado da sessão (não enviar no body).
 *   retorno (somente se existirem):
 *     school_id, school_name
 *     students_active_count?
 *     teams_active_count?
 *     attendances_today_count?
 *     overdue_payments_count? ou overdue_total?
 *     pending_today? { presenças_nao_registradas?, mensalidades_vencem_semana? }
 *     upcoming_events? [{ id, title, date }]
 *
 * Policy: user must access only their school_id (derivado da sessão).
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const USE_MOCK = true // remover quando o backend GET /school/dashboard/summary existir

const MOCK_SUMMARY = {
  school_id: 'e1',
  school_name: 'Arena São Paulo',
  students_active_count: 120,
  teams_active_count: 8,
  attendances_today_count: 45,
  overdue_payments_count: 2,
  overdue_total: 800,
  pending_today: {
    presenças_nao_registradas: 12,
    mensalidades_vencem_semana: 5,
  },
  upcoming_events: [
    { id: 'ev1', title: 'Avaliação trimestral', date: '2025-03-05' },
    { id: 'ev2', title: 'Reunião de pais', date: '2025-03-12' },
    { id: 'ev3', title: 'Campeonato interno', date: '2025-03-20' },
  ],
}

/**
 * Resumo do dashboard da escola (KPIs + eventos).
 * Backend deriva school_id do token/sessão.
 * @returns {Promise<{
 *   school_id?: string,
 *   school_name?: string,
 *   students_active_count?: number,
 *   teams_active_count?: number,
 *   attendances_today_count?: number,
 *   overdue_payments_count?: number,
 *   overdue_total?: number,
 *   pending_today?: { presenças_nao_registradas?: number, mensalidades_vencem_semana?: number },
 *   upcoming_events?: Array<{ id: string, title: string, date: string }>
 * }>}
 */
export async function getSchoolDashboardSummary() {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600))
    return { ...MOCK_SUMMARY }
  }
  const res = await fetch(`${API_BASE}/school/dashboard/summary`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar o dashboard.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/** Formata valor monetário (BRL). */
export function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

// --- Financeiro (resumo do mês) — contrato GET /school/finance/summary ---

const USE_MOCK_FINANCE_SUMMARY = true // remover quando o backend existir

/**
 * Gera resumo financeiro mock por mês (YYYY-MM).
 */
function mockFinanceSummary(month) {
  const [y, m] = (month || '').split('-').map(Number)
  const year = y || new Date().getFullYear()
  const monthNum = m || new Date().getMonth() + 1
  const expected = 12500 + (monthNum % 3) * 500
  const received = Math.round(expected * 0.72)
  const open = expected - received - 800
  const overdue = 800
  const overdueCount = 2
  const openCount = 5
  const dueDay = Math.min(10, 28)
  const dueDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
  const upcoming_due = [
    { invoice_id: 'inv1', student_id: 's1', student_name: 'Ana Silva', due_date: dueDate, amount: 350, status: 'open' },
    { invoice_id: 'inv2', student_id: 's2', student_name: 'Bruno Santos', due_date: dueDate, amount: 350, status: 'paid' },
    { invoice_id: 'inv3', student_id: 's3', student_name: 'Carla Oliveira', due_date: dueDate, amount: 350, status: 'overdue' },
    { invoice_id: 'inv4', student_id: 's4', student_name: 'Diego Lima', due_date: dueDate, amount: 350, status: 'open' },
    { invoice_id: 'inv5', student_id: 's5', student_name: 'Elena Costa', due_date: dueDate, amount: 350, status: 'open' },
  ]
  const alerts = [
    { type: 'overdue', label: 'Mensalidades em atraso', count: overdueCount, link_filter: 'overdue' },
    { type: 'due_soon', label: 'Vencem esta semana', count: 3, link_filter: 'due_soon' },
  ]
  return {
    school_id: MOCK_SUMMARY?.school_id || 'e1',
    school_name: MOCK_SUMMARY?.school_name || 'Arena São Paulo',
    month: month || `${year}-${String(monthNum).padStart(2, '0')}`,
    total_expected: expected,
    total_received: received,
    total_open: open,
    total_open_count: openCount,
    total_overdue: overdue,
    total_overdue_count: overdueCount,
    upcoming_due,
    alerts,
  }
}

/**
 * Resumo financeiro do mês (competência).
 * GET /school/finance/summary?month=YYYY-MM
 * Backend deriva school_id do token/sessão.
 */
export async function getSchoolFinanceSummary(month) {
  if (USE_MOCK_FINANCE_SUMMARY) {
    await new Promise((r) => setTimeout(r, 500))
    const m = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    return mockFinanceSummary(m)
  }
  const search = new URLSearchParams()
  if (month) search.set('month', month)
  const res = await fetch(`${API_BASE}/school/finance/summary?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar o financeiro.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Mensalidades/Cobranças (lista) — contrato GET /school/finance/invoices ---

const USE_MOCK_INVOICES = true // remover quando o backend existir

/**
 * Mock: lista de cobranças com filtros e paginação.
 * status: open | paid | overdue | canceled
 * sort: due_date_asc | due_date_desc
 */
function mockInvoicesList(params) {
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 25))
  const month = params.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const statusFilter = params.status || ''
  const q = (params.q || '').toLowerCase().trim()
  const studentId = params.student_id || ''
  const sort = params.sort || 'due_date_asc'

  const [year, monthNum] = month.split('-').map(Number)
  const dueDay = 10
  const dueDateBase = `${year}-${String(monthNum).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

  const studentsFromList = [
    { id: 's1', name: 'Ana Silva', document: '123.456.789-00' },
    { id: 's2', name: 'Bruno Santos', document: '234.567.890-11' },
    { id: 's3', name: 'Carla Oliveira', document: '345.678.901-22' },
    { id: 's4', name: 'Diego Lima', document: '456.789.012-33' },
    { id: 's5', name: 'Elena Costa', document: '567.890.123-44' },
    { id: 's6', name: 'Felipe Souza', document: '678.901.234-55' },
    { id: 's7', name: 'Gabriela Rocha', document: '789.012.345-66' },
    { id: 's8', name: 'Henrique Alves', document: '890.123.456-77' },
  ]

  const statuses = ['open', 'paid', 'overdue', 'paid', 'open', 'overdue', 'paid', 'open']
  let items = studentsFromList.map((s, i) => {
    const status = statuses[i] || 'open'
    const paidAt = status === 'paid' ? `${year}-${String(monthNum).padStart(2, '0')}-0${(i % 9) + 1}` : null
    return {
      id: `inv-${month}-${s.id}`,
      student_id: s.id,
      student_name: s.name,
      student_document: s.document,
      competence_month: month,
      due_date: dueDateBase,
      amount: 350 + (i % 3) * 50,
      status,
      paid_at: paidAt,
      payment_method: status === 'paid' ? (i % 2 === 0 ? 'pix' : 'boleto') : null,
    }
  })

  // Duplicar para outros meses (competência anterior/próxima) para testes
  const prevMonth = monthNum === 1 ? { y: year - 1, m: 12 } : { y: year, m: monthNum - 1 }
  const prevMonthStr = `${prevMonth.y}-${String(prevMonth.m).padStart(2, '0')}`
  items = items.concat(
    studentsFromList.slice(0, 4).map((s, i) => ({
      id: `inv-${prevMonthStr}-${s.id}`,
      student_id: s.id,
      student_name: s.name,
      student_document: s.document,
      competence_month: prevMonthStr,
      due_date: `${prevMonthStr}-10`,
      amount: 350,
      status: i === 0 ? 'overdue' : i === 1 ? 'paid' : 'open',
      paid_at: i === 1 ? `${prevMonthStr}-05` : null,
      payment_method: i === 1 ? 'pix' : null,
    }))
  )

  items = items.filter((inv) => {
    if (month && inv.competence_month !== month) return false
    if (statusFilter && inv.status !== statusFilter) return false
    if (studentId && inv.student_id !== studentId) return false
    if (q) {
      const searchStr = [inv.student_name, inv.student_document, inv.id].filter(Boolean).join(' ').toLowerCase()
      if (!searchStr.includes(q)) return false
    }
    return true
  })

  if (sort === 'due_date_asc') items.sort((a, b) => a.due_date.localeCompare(b.due_date) || a.student_name.localeCompare(b.student_name))
  if (sort === 'due_date_desc') items.sort((a, b) => b.due_date.localeCompare(a.due_date) || a.student_name.localeCompare(b.student_name))

  const total = items.length
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)

  const openAmount = items.filter((i) => i.status === 'open').reduce((s, i) => s + i.amount, 0)
  const overdueAmount = items.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const totalAmount = items.reduce((s, i) => s + i.amount, 0)

  return {
    items: slice,
    page,
    page_size: pageSize,
    total,
    school_name: MOCK_SUMMARY?.school_name || 'Arena São Paulo',
    aggregates: {
      total_amount: totalAmount,
      open_amount: openAmount,
      overdue_amount: overdueAmount,
    },
  }
}

/**
 * Lista mensalidades/cobranças da escola (school_id derivado da sessão).
 * GET /school/finance/invoices?month=&status=&q=&student_id=&payment_method=&page=&page_size=&sort=
 * Retorno: { items: [{ id, student_id, student_name, competence_month, due_date, amount, status, paid_at?, payment_method? }], aggregates?, page, page_size, total }
 */
export async function getSchoolInvoices(params = {}) {
  if (USE_MOCK_INVOICES) {
    await new Promise((r) => setTimeout(r, 500))
    return mockInvoicesList(params)
  }
  const search = new URLSearchParams()
  if (params.month) search.set('month', params.month)
  if (params.status) search.set('status', params.status)
  if (params.q) search.set('q', params.q)
  if (params.student_id) search.set('student_id', params.student_id)
  if (params.payment_method) search.set('payment_method', params.payment_method)
  if (params.page) search.set('page', String(params.page))
  if (params.page_size) search.set('page_size', String(params.page_size))
  if (params.sort) search.set('sort', params.sort)
  const res = await fetch(`${API_BASE}/school/finance/invoices?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar as mensalidades.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Inadimplência (lista) — contrato GET /school/finance/overdue ---

const USE_MOCK_OVERDUE = true // remover quando o backend existir

const DAYS_OVERDUE_RANGES = {
  '1_7': [1, 7],
  '8_15': [8, 15],
  '16_30': [16, 30],
  '31_plus': [31, 9999],
}

/**
 * Calcula dias em atraso a partir da data de vencimento (hoje - due_date).
 */
function calcDaysOverdue(dueDateStr) {
  if (!dueDateStr) return 0
  const due = new Date(dueDateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  due.setHours(12, 0, 0, 0)
  const diff = Math.floor((today - due) / (24 * 60 * 60 * 1000))
  return Math.max(0, diff)
}

/**
 * Mock: lista de mensalidades em atraso (inadimplência).
 * days_overdue_range: 1_7 | 8_15 | 16_30 | 31_plus
 * sort: days_overdue_desc | due_date_asc
 */
function mockOverdueList(params) {
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 25))
  const month = params.month || ''
  const q = (params.q || '').toLowerCase().trim()
  const studentId = params.student_id || ''
  const daysRangeKey = params.days_overdue_range || ''
  const sort = params.sort || 'days_overdue_desc'

  const now = new Date()
  const monthsToFetch = month
    ? [month]
    : [
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`,
        `${now.getFullYear() - 1}-12`,
      ]
  let allOverdue = []
  for (const m of monthsToFetch) {
    const list = mockInvoicesList({ month: m, status: 'overdue', page: 1, page_size: 200 })
    for (const inv of list.items) {
      const days_overdue = calcDaysOverdue(inv.due_date)
      allOverdue.push({
        invoice_id: inv.id,
        student_id: inv.student_id,
        student_name: inv.student_name,
        student_document: inv.student_document,
        competence_month: inv.competence_month,
        due_date: inv.due_date,
        days_overdue,
        amount: inv.amount,
      })
    }
  }
  // Remover duplicatas por invoice_id (mesmo id em vários meses)
  const seen = new Set()
  allOverdue = allOverdue.filter((row) => {
    if (seen.has(row.invoice_id)) return false
    seen.add(row.invoice_id)
    return true
  })

  if (q) {
    allOverdue = allOverdue.filter(
      (row) =>
        [row.student_name, row.student_document, row.invoice_id].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }
  if (studentId) {
    allOverdue = allOverdue.filter((row) => row.student_id === studentId)
  }
  if (daysRangeKey && DAYS_OVERDUE_RANGES[daysRangeKey]) {
    const [minD, maxD] = DAYS_OVERDUE_RANGES[daysRangeKey]
    allOverdue = allOverdue.filter((row) => row.days_overdue >= minD && row.days_overdue <= maxD)
  }

  if (sort === 'days_overdue_desc') {
    allOverdue.sort((a, b) => b.days_overdue - a.days_overdue || a.due_date.localeCompare(b.due_date))
  }
  if (sort === 'due_date_asc') {
    allOverdue.sort((a, b) => a.due_date.localeCompare(b.due_date) || b.days_overdue - a.days_overdue)
  }

  const total = allOverdue.length
  const start = (page - 1) * pageSize
  const items = allOverdue.slice(start, start + pageSize)

  const totalOverdueAmount = allOverdue.reduce((s, r) => s + r.amount, 0)
  const overdueStudentsSet = new Set(allOverdue.map((r) => r.student_id))

  return {
    items,
    page,
    page_size: pageSize,
    total,
    school_name: MOCK_SUMMARY?.school_name || 'Arena São Paulo',
    aggregates: {
      total_overdue_amount: totalOverdueAmount,
      overdue_invoices_count: total,
      overdue_students_count: overdueStudentsSet.size,
    },
  }
}

/**
 * Lista mensalidades em atraso (inadimplência). school_id derivado da sessão.
 * GET /school/finance/overdue?month=&q=&student_id=&days_overdue_range=&page=&page_size=&sort=
 * Retorno: { items: [{ invoice_id, student_id, student_name, competence_month, due_date, days_overdue, amount }], aggregates?, page, page_size, total }
 */
export async function getSchoolOverdue(params = {}) {
  if (USE_MOCK_OVERDUE) {
    await new Promise((r) => setTimeout(r, 500))
    return mockOverdueList(params)
  }
  const search = new URLSearchParams()
  if (params.month) search.set('month', params.month)
  if (params.q) search.set('q', params.q)
  if (params.student_id) search.set('student_id', params.student_id)
  if (params.days_overdue_range) search.set('days_overdue_range', params.days_overdue_range)
  if (params.page) search.set('page', String(params.page))
  if (params.page_size) search.set('page_size', String(params.page_size))
  if (params.sort) search.set('sort', params.sort)
  const res = await fetch(`${API_BASE}/school/finance/overdue?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar a inadimplência.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Configurações de Mensalidade (Fase 2) — GET /school/finance/settings + PUT/PATCH + POST generate ---

const USE_MOCK_FINANCE_SETTINGS = true // remover quando o backend existir

const MOCK_FINANCE_SETTINGS = {
  school_id: MOCK_SUMMARY?.school_id || 'e1',
  school_name: MOCK_SUMMARY?.school_name || 'Arena São Paulo',
  default_amount: 350,
  default_discount: 0,
  default_extra_fee: 0,
  due_day: 10,
  generation_days_before_due: 5,
  grace_days: 0,
  late_fee_enabled: false,
  late_fee_type: 'percent',
  late_fee_value: 2,
  daily_interest_enabled: false,
  daily_interest_percent: 0.1,
  generation_enabled: true,
  generation_day_of_month: 5,
  apply_to_active_students_only: true,
  create_invoice_on_enrollment: true,
}

/**
 * Carrega configurações de mensalidade da escola (school_id derivado da sessão).
 * GET /school/finance/settings
 * Retorno: default_amount, due_day, generation_enabled, generation_days_before_due?, grace_days?,
 *   late_fee_enabled?, late_fee_value?, late_fee_type?, daily_interest_enabled?, daily_interest_percent?,
 *   apply_to_active_students_only?, default_discount?, default_extra_fee?, generation_day_of_month?, create_invoice_on_enrollment?
 */
export async function getSchoolFinanceSettings() {
  if (USE_MOCK_FINANCE_SETTINGS) {
    await new Promise((r) => setTimeout(r, 500))
    return { ...MOCK_FINANCE_SETTINGS }
  }
  const res = await fetch(`${API_BASE}/school/finance/settings`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar as configurações.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Salva configurações de mensalidade (school_id derivado da sessão).
 * PUT/PATCH /school/finance/settings
 * Body: mesmos campos do GET (parcial se PATCH).
 */
export async function updateSchoolFinanceSettings(body) {
  if (USE_MOCK_FINANCE_SETTINGS) {
    await new Promise((r) => setTimeout(r, 600))
    Object.assign(MOCK_FINANCE_SETTINGS, body)
    return { ...MOCK_FINANCE_SETTINGS }
  }
  const res = await fetch(`${API_BASE}/school/finance/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar as configurações. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Geração manual de mensalidades (Fase 2).
 * POST /school/finance/invoices/generate
 * Body: month? (YYYY-MM, default atual)
 * Retorno: generated_count, skipped_count, details?
 */
export async function generateSchoolInvoices(params = {}) {
  if (USE_MOCK_FINANCE_SETTINGS) {
    await new Promise((r) => setTimeout(r, 800))
    const month = params.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    return {
      generated_count: 12,
      skipped_count: 3,
      month,
      details: { already_existing: 3, new_created: 12 },
    }
  }
  const res = await fetch(`${API_BASE}/school/finance/invoices/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params.month ? { month: params.month } : {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível gerar as mensalidades. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Mensalidade (detalhe) — contrato GET /school/finance/invoices/:invoiceId ---

const USE_MOCK_INVOICE_DETAIL = true // remover quando o backend existir

/**
 * Mock: detalhe de uma mensalidade com histórico.
 * Busca na lista mock por id; se não achar, tenta construir a partir de id "inv-YYYY-MM-sid".
 */
function mockInvoiceDetail(invoiceId) {
  // Tenta vários meses para achar o item na lista mock
  const months = []
  const now = new Date()
  for (let i = -2; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  let base = null
  for (const month of months) {
    const list = mockInvoicesList({ month, page: 1, page_size: 100 })
    const found = list.items.find((inv) => inv.id === invoiceId)
    if (found) {
      base = found
      break
    }
  }
  // Também aceita ids do finance summary (ex: inv1, inv2)
  if (!base) {
    const summary = mockFinanceSummary(months[2])
    const upcoming = summary?.upcoming_due || []
    const fromSummary = upcoming.find((u) => u.invoice_id === invoiceId)
    if (fromSummary) {
      base = {
        id: fromSummary.invoice_id,
        student_id: fromSummary.student_id,
        student_name: fromSummary.student_name,
        competence_month: (fromSummary.due_date || '').slice(0, 7),
        due_date: fromSummary.due_date,
        amount: fromSummary.amount,
        status: fromSummary.status || 'open',
        paid_at: fromSummary.status === 'paid' ? fromSummary.due_date : null,
        payment_method: fromSummary.status === 'paid' ? 'pix' : null,
      }
    }
  }
  if (!base) return null

  const amountOriginal = base.amount ?? 350
  const discount = base.discount ?? (base.status === 'paid' ? 0 : 0)
  const fees = base.fees ?? 0
  const amountFinal = base.amount_final ?? (amountOriginal - discount + fees)

  const payment =
    base.status === 'paid'
      ? {
          payment_id: `pay-${base.id}`,
          paid_at: base.paid_at || new Date().toISOString().slice(0, 10),
          amount_paid: amountFinal,
          method: base.payment_method || 'pix',
          reference: base.payment_reference || `REF-${base.id}`,
        }
      : undefined

  const daysOverdue =
    base.status === 'overdue'
      ? Math.max(0, Math.floor((new Date() - new Date((base.due_date || '') + 'T12:00:00')) / (24 * 60 * 60 * 1000)))
      : undefined

  const history = [
    {
      id: 'ev1',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      event_type: 'created',
      label: 'Cobrança criada',
      details: `Mensalidade gerada para competência ${base.competence_month || ''}.`,
      actor: { user_id: 'sys', name: 'Sistema' },
    },
  ]
  if (base.status === 'paid' && payment) {
    history.unshift({
      id: 'ev2',
      created_at: (payment.paid_at && new Date(payment.paid_at + 'T12:00:00').toISOString()) || new Date().toISOString(),
      event_type: 'payment_registered',
      label: 'Pagamento registrado',
      details: `Pagamento de ${formatCurrency(payment.amount_paid)} via ${(payment.method || '').toUpperCase()}.${payment.reference ? ` Ref: ${payment.reference}` : ''}`,
      actor: { user_id: 'u1', name: 'Maria Financeira' },
    })
  }
  if (base.status === 'overdue') {
    history.unshift({
      id: 'ev0',
      created_at: new Date().toISOString(),
      event_type: 'overdue',
      label: 'Em atraso',
      details: daysOverdue != null ? `${daysOverdue} dia(s) em atraso.` : 'Vencimento ultrapassado.',
      actor: null,
    })
  }
  // Ordenar por data decrescente (mais recente primeiro)
  history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return {
    id: base.id,
    school_id: MOCK_SUMMARY?.school_id || 'e1',
    school_name: MOCK_SUMMARY?.school_name || 'Arena São Paulo',
    student_id: base.student_id,
    student_name: base.student_name,
    competence_month: base.competence_month,
    due_date: base.due_date,
    amount_original: amountOriginal,
    discount,
    fees,
    amount_final: amountFinal,
    status: base.status,
    payment,
    days_overdue: daysOverdue,
    billing_method: base.billing_method ?? null,
    notes: base.notes ?? null,
    history,
    can_register_payment: base.status !== 'paid' && base.status !== 'canceled',
  }
}

/**
 * Detalhe da mensalidade/cobrança (status, pagamento, histórico).
 * GET /school/finance/invoices/:invoiceId
 * Policy: invoiceId deve pertencer à school_id do usuário (derivado da sessão).
 * Retorno: id, school_id, student_id, student_name, competence_month, due_date, amount_original,
 *   discount?, fees?, amount_final, status (open|paid|overdue|canceled?), payment? { payment_id, paid_at, amount_paid, method?, reference? },
 *   days_overdue?, history: [{ id, created_at, event_type, label, details?, actor? { user_id, name } }]
 */
export async function getSchoolInvoiceDetail(invoiceId) {
  if (USE_MOCK_INVOICE_DETAIL) {
    await new Promise((r) => setTimeout(r, 500))
    const invoice = mockInvoiceDetail(invoiceId)
    if (!invoice) {
      const err = new Error('Mensalidade não encontrada.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return invoice
  }
  const res = await fetch(`${API_BASE}/school/finance/invoices/${encodeURIComponent(invoiceId)}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar a mensalidade.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Registrar pagamento — contrato POST /school/finance/payments ---

const USE_MOCK_PAYMENTS = true // remover quando o backend existir

/**
 * Registra pagamento de uma mensalidade (school_id derivado da sessão; invoice_id deve pertencer à escola).
 * POST /school/finance/payments
 * Body: invoice_id (obrigatório), paid_at, amount_paid, method (cash|pix|transfer|card|other), note?
 * Retorno: { payment_id, invoice_id, new_invoice_status: "paid", paid_at }
 */
export async function createSchoolPayment(body) {
  if (USE_MOCK_PAYMENTS) {
    await new Promise((r) => setTimeout(r, 600))
    if (!body?.invoice_id) {
      const err = new Error('Mensalidade não informada.')
      err.status = 400
      err.code = 'VALIDATION_ERROR'
      throw err
    }
    return {
      payment_id: `pay-${body.invoice_id}-${Date.now()}`,
      invoice_id: body.invoice_id,
      new_invoice_status: 'paid',
      paid_at: body.paid_at || new Date().toISOString().slice(0, 10),
    }
  }
  const res = await fetch(`${API_BASE}/school/finance/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      invoice_id: body.invoice_id,
      paid_at: body.paid_at,
      amount_paid: body.amount_paid,
      method: body.method,
      note: body.note,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível registrar o pagamento. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Alunos (lista) — contrato GET /school/students + PATCH status ---

const USE_MOCK_STUDENTS = true // remover quando o backend existir

const MOCK_TEAMS = [
  { id: 't1', name: 'Turma A - Iniciantes' },
  { id: 't2', name: 'Turma B - Intermediários' },
  { id: 't3', name: 'Turma C - Avançados' },
]

function mockStudentsList(params) {
  const total = 47
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 25))
  const q = (params.q || '').toLowerCase().trim()
  const status = params.status || ''
  const teamId = params.team_id || ''
  const financialStatus = params.financial_status || ''

  const base = [
    { id: 's1', name: 'Ana Silva', status: 'active', teams: [MOCK_TEAMS[0]], contact_phone: '(11) 98765-4321', contact_name: 'Maria Silva', financial_status: 'up_to_date' },
    { id: 's2', name: 'Bruno Santos', status: 'active', teams: [MOCK_TEAMS[0], MOCK_TEAMS[1]], contact_phone: '(11) 91234-5678', contact_name: 'João Santos', financial_status: 'up_to_date' },
    { id: 's3', name: 'Carla Oliveira', status: 'inactive', teams: [], contact_phone: '(11) 99876-5432', contact_name: 'Paulo Oliveira', financial_status: 'overdue' },
    { id: 's4', name: 'Diego Lima', status: 'active', teams: [MOCK_TEAMS[1]], contact_phone: '(11) 97654-3210', contact_name: 'Fernanda Lima', financial_status: 'up_to_date' },
    { id: 's5', name: 'Elena Costa', status: 'active', teams: [MOCK_TEAMS[2]], contact_phone: '(11) 96543-2109', contact_name: 'Roberto Costa', financial_status: 'overdue' },
    { id: 's6', name: 'Felipe Souza', status: 'active', teams: [MOCK_TEAMS[0]], contact_phone: '(11) 95432-1098', contact_name: 'Sandra Souza', financial_status: 'up_to_date' },
    { id: 's7', name: 'Gabriela Rocha', status: 'inactive', teams: [MOCK_TEAMS[1]], contact_phone: '(11) 94321-0987', contact_name: 'Carlos Rocha', financial_status: 'up_to_date' },
    { id: 's8', name: 'Henrique Alves', status: 'active', teams: [], contact_phone: '(11) 93210-9876', contact_name: 'Lucia Alves', financial_status: 'up_to_date' },
    { id: 's9', name: 'Isabela Martins', status: 'active', teams: [MOCK_TEAMS[2]], contact_phone: '(11) 92109-8765', contact_name: 'Pedro Martins', financial_status: 'overdue' },
    { id: 's10', name: 'Julio Ferreira', status: 'active', teams: [MOCK_TEAMS[0], MOCK_TEAMS[2]], contact_phone: '(11) 91098-7654', contact_name: 'Cintia Ferreira', financial_status: 'up_to_date' },
  ]
  let items = []
  for (let i = 0; i < 5; i++) {
    base.forEach((s, j) => {
      items.push({
        ...s,
        id: `s${i * 10 + j + 1}`,
        name: i === 0 ? s.name : `${s.name} (${i + 1})`,
      })
    })
  }

  items = items.filter((s) => {
    if (q) {
      const search = [s.name, s.contact_phone, s.contact_name].filter(Boolean).join(' ').toLowerCase()
      if (!search.includes(q)) return false
    }
    if (status === 'active' && s.status !== 'active') return false
    if (status === 'inactive' && s.status !== 'inactive') return false
    if (teamId && !s.teams.some((t) => t.id === teamId)) return false
    if (financialStatus === 'up_to_date' && s.financial_status !== 'up_to_date') return false
    if (financialStatus === 'overdue' && s.financial_status !== 'overdue') return false
    return true
  })

  const sort = params.sort || 'name_asc'
  if (sort === 'name_asc') items.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'name_desc') items.sort((a, b) => b.name.localeCompare(a.name))

  const totalFiltered = items.length
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)

  return {
    items: slice,
    page,
    page_size: pageSize,
    total: totalFiltered,
    school_name: 'Arena São Paulo',
    teams: MOCK_TEAMS,
  }
}

/**
 * Lista alunos da escola (school_id derivado da sessão).
 * GET /school/students
 * @param {{ q?: string, status?: string, team_id?: string, financial_status?: string, page?: number, page_size?: number, sort?: string }} params
 */
export async function getSchoolStudents(params = {}) {
  if (USE_MOCK_STUDENTS) {
    await new Promise((r) => setTimeout(r, 400))
    return mockStudentsList(params)
  }
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.status) search.set('status', params.status)
  if (params.team_id) search.set('team_id', params.team_id)
  if (params.financial_status) search.set('financial_status', params.financial_status)
  if (params.page) search.set('page', String(params.page))
  if (params.page_size) search.set('page_size', String(params.page_size))
  if (params.sort) search.set('sort', params.sort)
  const res = await fetch(`${API_BASE}/school/students?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar os alunos.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Detalhe do aluno (dados + vínculos).
 * GET /school/students/:studentId
 * Retorno: id, school_id, name, status, birth_date?, document?, email?, phone?, address?,
 *   guardian? { name?, phone?, email?, relation? }, teams: [{ team_id, team_name, schedule?, active }],
 *   operational_summary? { last_attendance_date?, financial_status? }
 */
function mockStudentDetail(studentId) {
  const list = mockStudentsList({ page: 1, page_size: 50 })
  const found = list.items.find((s) => s.id === studentId)
  if (!found) return null
  return {
    id: found.id,
    school_id: 'e1',
    school_name: 'Arena São Paulo',
    name: found.name,
    status: found.status,
    birth_date: '2010-05-15',
    document: '123.456.789-00',
    email: found.name.toLowerCase().replace(/\s/g, '.') + '@email.com',
    phone: found.contact_phone || null,
    address: 'Rua Exemplo, 100 – São Paulo, SP',
    guardian: {
      name: found.contact_name || null,
      phone: found.contact_phone || null,
      email: found.contact_name ? found.contact_name.toLowerCase().replace(/\s/g, '.') + '@email.com' : null,
      relation: 'pai',
    },
    teams: (found.teams || []).map((t) => ({
      team_id: t.id,
      team_name: t.name,
      schedule: 'Seg/Qua 14h',
      active: true,
    })),
    operational_summary: {
      last_attendance_date: '2025-02-24',
      financial_status: found.financial_status || 'up_to_date',
    },
  }
}

export async function getSchoolStudent(studentId) {
  if (USE_MOCK_STUDENTS) {
    await new Promise((r) => setTimeout(r, 500))
    const student = mockStudentDetail(studentId)
    if (!student) {
      const err = new Error('Aluno não encontrado.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return student
  }
  const res = await fetch(`${API_BASE}/school/students/${encodeURIComponent(studentId)}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar os dados do aluno.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Atualiza status do aluno (ativo/inativo).
 * PATCH /school/students/:studentId/status
 * Body: { status: "active" | "inactive" }
 */
export async function updateStudentStatus(studentId, status) {
  if (USE_MOCK_STUDENTS) {
    await new Promise((r) => setTimeout(r, 300))
    return { id: studentId, status }
  }
  const res = await fetch(`${API_BASE}/school/students/${encodeURIComponent(studentId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível atualizar o status.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Lista turmas da escola (para filtro e multi-select). GET /school/teams -> [{ id, name }]
 */
export async function getSchoolTeams() {
  if (USE_MOCK_STUDENTS) {
    const r = await getSchoolStudents({ page: 1, page_size: 1 })
    return r.teams || []
  }
  const res = await fetch(`${API_BASE}/school/teams`, { method: 'GET', credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Não foi possível carregar as turmas.')
  return data.items || data.teams || []
}

// --- Turmas (lista) — contrato GET /school/teams (lista paginada) + PATCH status ---

const USE_MOCK_TEAMS_LIST = true // remover quando o backend existir

const MOCK_COACHES = [
  { id: 'c1', name: 'Prof. Ricardo' },
  { id: 'c2', name: 'Prof. Fernanda' },
  { id: 'c3', name: 'Prof. Marcos' },
]

function mockTeamsList(params) {
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 25))
  const q = (params.q || '').toLowerCase().trim()
  const status = params.status || ''
  const coachId = params.coach_id || ''
  const sport = params.sport || ''
  const sort = params.sort || 'name_asc'

  const base = [
    { id: 't1', name: 'Turma A - Iniciantes', status: 'active', coach_id: 'c1', coach_name: 'Prof. Ricardo', schedule_summary: 'Seg/Qua 14h', students_count: 18 },
    { id: 't2', name: 'Turma B - Intermediários', status: 'active', coach_id: 'c2', coach_name: 'Prof. Fernanda', schedule_summary: 'Ter/Qui 16h', students_count: 22 },
    { id: 't3', name: 'Turma C - Avançados', status: 'active', coach_id: 'c1', coach_name: 'Prof. Ricardo', schedule_summary: 'Sáb 10h', students_count: 15 },
    { id: 't4', name: 'Turma Kids', status: 'active', coach_id: 'c3', coach_name: 'Prof. Marcos', schedule_summary: 'Sáb 09h', students_count: 12 },
    { id: 't5', name: 'Turma Experimental', status: 'inactive', coach_id: 'c2', coach_name: 'Prof. Fernanda', schedule_summary: null, students_count: 0 },
  ]

  let items = base.filter((t) => {
    if (q) {
      const search = [t.name, t.coach_name].filter(Boolean).join(' ').toLowerCase()
      if (!search.includes(q)) return false
    }
    if (status === 'active' && t.status !== 'active') return false
    if (status === 'inactive' && t.status !== 'inactive') return false
    if (coachId && t.coach_id !== coachId) return false
    if (sport) return true // MVP sem modalidade no mock
    return true
  })

  if (sort === 'name_asc') items = [...items].sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'name_desc') items = [...items].sort((a, b) => b.name.localeCompare(a.name))

  const total = items.length
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)

  return {
    items: slice,
    page,
    page_size: pageSize,
    total,
    school_name: 'Arena São Paulo',
    coaches: MOCK_COACHES,
  }
}

/**
 * Lista turmas da escola (paginada, com busca e filtros).
 * GET /school/teams?q=&status=&coach_id=&sport=&page=&page_size=&sort=
 * Retorno: { items: [{ id, name, status, coach_name?, schedule_summary?, students_count? }], page, page_size, total, school_name? }
 */
export async function getSchoolTeamsList(params = {}) {
  if (USE_MOCK_TEAMS_LIST) {
    await new Promise((r) => setTimeout(r, 400))
    return mockTeamsList(params)
  }
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.status) search.set('status', params.status)
  if (params.coach_id) search.set('coach_id', params.coach_id)
  if (params.sport) search.set('sport', params.sport)
  if (params.page) search.set('page', String(params.page))
  if (params.page_size) search.set('page_size', String(params.page_size))
  if (params.sort) search.set('sort', params.sort)
  const res = await fetch(`${API_BASE}/school/teams?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar as turmas.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Detalhe da turma (dados + agenda + alunos).
 * GET /school/teams/:teamId
 * Retorno: id, school_id, name, status, coach? { id, name }, sport?/modality?,
 *   schedule? { items: [{ weekday, start_time, end_time, location? }], summary? },
 *   students: [{ id, name, status?, contact_phone?, guardian_name? }], students_count?
 */
const USE_MOCK_TEAM_DETAIL = true // remover quando o backend existir

function mockTeamDetail(teamId) {
  const list = mockTeamsList({ page: 1, page_size: 50 })
  const team = list.items.find((t) => t.id === teamId)
  if (!team) return null
  const studentsFromList = mockStudentsList({ page: 1, page_size: 100 }).items.filter((s) =>
    s.teams?.some((t) => t.id === teamId)
  )
  const students = studentsFromList.length > 0
    ? studentsFromList.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        contact_phone: s.contact_phone,
        guardian_name: s.contact_name,
      }))
    : (team.students_count > 0
        ? Array.from({ length: Math.min(team.students_count, 5) }, (_, i) => ({
            id: `s${teamId}-${i + 1}`,
            name: `Aluno ${i + 1} da turma`,
            status: 'active',
            contact_phone: null,
            guardian_name: null,
          }))
        : [])
  const scheduleByTeam = {
    t1: {
      items: [
        { weekday: 'monday', start_time: '14:00', end_time: '15:30', location: 'Quadra 1' },
        { weekday: 'wednesday', start_time: '14:00', end_time: '15:30', location: 'Quadra 1' },
      ],
      summary: 'Seg/Qua 14h–15h30',
    },
    t2: {
      items: [
        { weekday: 'tuesday', start_time: '16:00', end_time: '17:30', location: 'Quadra 2' },
        { weekday: 'thursday', start_time: '16:00', end_time: '17:30', location: 'Quadra 2' },
      ],
      summary: 'Ter/Qui 16h–17h30',
    },
    t3: {
      items: [{ weekday: 'saturday', start_time: '10:00', end_time: '11:30', location: 'Quadra 1' }],
      summary: 'Sáb 10h–11h30',
    },
    t4: {
      items: [{ weekday: 'saturday', start_time: '09:00', end_time: '10:00', location: 'Sala Kids' }],
      summary: 'Sáb 09h–10h',
    },
    t5: { items: [], summary: null },
  }
  const schedule = scheduleByTeam[teamId] || { items: [], summary: team.schedule_summary || null }
  const coach = team.coach_id ? { id: team.coach_id, name: team.coach_name } : null
  return {
    id: team.id,
    school_id: 'e1',
    name: team.name,
    status: team.status,
    coach,
    sport: null,
    modality: null,
    schedule,
    students,
    students_count: students.length,
  }
}

export async function getSchoolTeamDetail(teamId) {
  if (USE_MOCK_TEAM_DETAIL) {
    await new Promise((r) => setTimeout(r, 500))
    const team = mockTeamDetail(teamId)
    if (!team) {
      const err = new Error('Turma não encontrada.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return team
  }
  const res = await fetch(`${API_BASE}/school/teams/${encodeURIComponent(teamId)}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar a turma.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Lista treinadores/coaches da escola (para select no criar/editar turma).
 * GET /school/coaches
 * Retorno: [{ id, name }]
 */
export async function getSchoolCoaches() {
  if (USE_MOCK_TEAMS_LIST) {
    await new Promise((r) => setTimeout(r, 200))
    return MOCK_COACHES
  }
  const res = await fetch(`${API_BASE}/school/coaches`, { method: 'GET', credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Não foi possível carregar os treinadores.')
  return Array.isArray(data) ? data : data.items || data.coaches || []
}

// --- Lista de treinadores (paginada) — GET /school/coaches?q=&status=&page=&page_size=&sort= ---

const USE_MOCK_COACHES_LIST = true // remover quando o backend existir

const MOCK_COACHES_LIST = [
  { id: 'c1', name: 'Prof. Ricardo', status: 'active', phone: '(11) 98765-4321', email: 'ricardo@arena.com', teams_count: 2, teams_preview: ['Turma A - Iniciantes', 'Turma C - Avançados'] },
  { id: 'c2', name: 'Prof. Fernanda', status: 'active', phone: '(11) 97654-3210', email: 'fernanda@arena.com', teams_count: 2, teams_preview: ['Turma B - Intermediários', 'Turma Experimental'] },
  { id: 'c3', name: 'Prof. Marcos', status: 'active', phone: '(11) 96543-2109', email: 'marcos@arena.com', teams_count: 1, teams_preview: ['Turma Kids'] },
  { id: 'c4', name: 'Ana Costa', status: 'inactive', phone: null, email: 'ana@arena.com', teams_count: 0, teams_preview: [] },
]

function mockCoachesList(params) {
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 25))
  const q = (params.q || '').toLowerCase().trim()
  const status = params.status || ''
  const sort = params.sort || 'name_asc'

  let items = MOCK_COACHES_LIST.filter((c) => {
    if (q) {
      const search = [c.name, c.phone, c.email].filter(Boolean).join(' ').toLowerCase()
      if (!search.includes(q)) return false
    }
    if (status === 'active' && c.status !== 'active') return false
    if (status === 'inactive' && c.status !== 'inactive') return false
    return true
  })

  if (sort === 'name_asc') items = [...items].sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'name_desc') items = [...items].sort((a, b) => b.name.localeCompare(a.name))

  const total = items.length
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)

  return {
    items: slice,
    page,
    page_size: pageSize,
    total,
    school_name: 'Arena São Paulo',
  }
}

/**
 * Lista treinadores da escola (paginada, busca e filtros).
 * GET /school/coaches?q=&status=&page=&page_size=&sort=
 * Retorno: { items: [{ id, name, status, phone?, email?, teams_count?, teams_preview? }], page, page_size, total, school_name? }
 */
export async function getSchoolCoachesList(params = {}) {
  if (USE_MOCK_COACHES_LIST) {
    await new Promise((r) => setTimeout(r, 400))
    return mockCoachesList(params)
  }
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.status) search.set('status', params.status)
  if (params.page) search.set('page', String(params.page))
  if (params.page_size) search.set('page_size', String(params.page_size))
  if (params.sort) search.set('sort', params.sort)
  const res = await fetch(`${API_BASE}/school/coaches?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar os treinadores. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Detalhe do treinador — GET /school/coaches/:coachId ---

const USE_MOCK_COACH_DETAIL = true // remover quando o backend existir

/** Mock: turmas por coach (team_id, team_name, team_status, schedule_summary) */
const MOCK_COACH_TEAMS = {
  c1: [
    { team_id: 't1', team_name: 'Turma A - Iniciantes', team_status: 'active', schedule_summary: 'Seg/Qua 14h' },
    { team_id: 't3', team_name: 'Turma C - Avançados', team_status: 'active', schedule_summary: 'Sáb 10h' },
  ],
  c2: [
    { team_id: 't2', team_name: 'Turma B - Intermediários', team_status: 'active', schedule_summary: 'Ter/Qui 16h' },
    { team_id: 't5', team_name: 'Turma Experimental', team_status: 'inactive', schedule_summary: null },
  ],
  c3: [
    { team_id: 't4', team_name: 'Turma Kids', team_status: 'active', schedule_summary: 'Sáb 09h' },
  ],
  c4: [],
}

/**
 * Detalhe do treinador (dados + turmas atribuídas).
 * GET /school/coaches/:coachId
 * Retorno: id, school_id, name, status, email?, phone?, specialty?, notes?, teams: [{ team_id, team_name, team_status, schedule_summary? }]
 */
export async function getSchoolCoachDetail(coachId) {
  if (USE_MOCK_COACH_DETAIL) {
    await new Promise((r) => setTimeout(r, 350))
    const coach = MOCK_COACHES_LIST.find((c) => c.id === coachId)
    if (!coach) {
      const err = new Error('Treinador não encontrado.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    const teams = MOCK_COACH_TEAMS[coachId] || []
    return {
      id: coach.id,
      school_id: 'e1',
      name: coach.name,
      status: coach.status,
      email: coach.email ?? null,
      phone: coach.phone ?? null,
      specialty: coach.specialty ?? null,
      notes: coach.notes ?? null,
      school_name: 'Arena São Paulo',
      teams,
    }
  }
  const res = await fetch(`${API_BASE}/school/coaches/${encodeURIComponent(coachId)}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar o treinador.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Atualiza status do treinador (ativo/inativo).
 * PATCH /school/coaches/:coachId/status
 * Body: { status: "active" | "inactive" }
 */
export async function updateCoachStatus(coachId, status) {
  if (USE_MOCK_COACHES_LIST) {
    await new Promise((r) => setTimeout(r, 300))
    return { id: coachId, status }
  }
  const res = await fetch(`${API_BASE}/school/coaches/${encodeURIComponent(coachId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível atualizar o status.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Cria treinador na escola (school_id derivado da sessão).
 * POST /school/coaches
 * Body: { name, email?, phone?, specialty?, notes?, team_ids? [] }
 * Retorno: { id, ... }
 */
export async function createSchoolCoach(body) {
  if (USE_MOCK_COACH_DETAIL || USE_MOCK_COACHES_LIST) {
    await new Promise((r) => setTimeout(r, 400))
    const id = `c${Date.now()}`
    return {
      id,
      name: (body.name || '').trim(),
      status: 'active',
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      specialty: body.specialty?.trim() || null,
      notes: body.notes?.trim() || null,
      team_ids: body.team_ids || [],
    }
  }
  const res = await fetch(`${API_BASE}/school/coaches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar o treinador. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Atualiza treinador.
 * PUT/PATCH /school/coaches/:coachId
 * Body: { name?, email?, phone?, specialty?, notes?, status?, team_ids? [] }
 */
export async function updateSchoolCoach(coachId, body) {
  if (USE_MOCK_COACH_DETAIL || USE_MOCK_COACHES_LIST) {
    await new Promise((r) => setTimeout(r, 400))
    return {
      id: coachId,
      name: body.name !== undefined ? (body.name || '').trim() : undefined,
      status: body.status !== undefined ? body.status : undefined,
      email: body.email !== undefined ? (body.email || '').trim() || null : undefined,
      phone: body.phone !== undefined ? (body.phone || '').trim() || null : undefined,
      specialty: body.specialty !== undefined ? (body.specialty || '').trim() || null : undefined,
      notes: body.notes !== undefined ? (body.notes || '').trim() || null : undefined,
      team_ids: body.team_ids,
    }
  }
  const res = await fetch(`${API_BASE}/school/coaches/${encodeURIComponent(coachId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar o treinador. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Cria turma na escola (school_id derivado da sessão).
 * POST /school/teams
 * Body: { name, coach_id?, modality?, status?, schedule_items?: [{ weekday, start_time, end_time, location? }], student_ids? [] }
 * Retorno: { id, ... }
 */
export async function createSchoolTeam(body) {
  if (USE_MOCK_TEAMS_LIST || USE_MOCK_TEAM_DETAIL) {
    await new Promise((r) => setTimeout(r, 500))
    const id = `t${Date.now()}`
    return {
      id,
      name: body.name || '',
      status: body.status || 'active',
      coach_id: body.coach_id || null,
      modality: body.modality || null,
      schedule_items: body.schedule_items || [],
      student_ids: body.student_ids || [],
    }
  }
  const res = await fetch(`${API_BASE}/school/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar a turma. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Atualiza turma.
 * PUT/PATCH /school/teams/:teamId
 * Body: mesmos campos do criar (parcial se PATCH).
 */
export async function updateSchoolTeam(teamId, body) {
  if (USE_MOCK_TEAMS_LIST || USE_MOCK_TEAM_DETAIL) {
    await new Promise((r) => setTimeout(r, 500))
    const existing = mockTeamDetail(teamId)
    if (!existing) {
      const err = new Error('Turma não encontrada.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return {
      ...existing,
      name: body.name !== undefined ? body.name : existing.name,
      status: body.status !== undefined ? body.status : existing.status,
      coach_id: body.coach_id !== undefined ? body.coach_id : (existing.coach?.id ?? null),
      modality: body.modality !== undefined ? body.modality : (existing.modality || null),
      schedule: body.schedule_items !== undefined
        ? { items: body.schedule_items }
        : existing.schedule,
      student_ids: body.student_ids !== undefined ? body.student_ids : (existing.students || []).map((s) => s.id),
    }
  }
  const res = await fetch(`${API_BASE}/school/teams/${encodeURIComponent(teamId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar a turma. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Atualiza status da turma (ativo/inativo).
 * PATCH /school/teams/:teamId/status
 * Body: { status: "active" | "inactive" }
 */
export async function updateTeamStatus(teamId, status) {
  if (USE_MOCK_TEAMS_LIST || USE_MOCK_TEAM_DETAIL) {
    await new Promise((r) => setTimeout(r, 300))
    return { id: teamId, status }
  }
  const res = await fetch(`${API_BASE}/school/teams/${encodeURIComponent(teamId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível atualizar o status.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Cria aluno na escola (school_id derivado da sessão).
 * POST /school/students
 * Body: { name, birth_date?, document?, email?, phone?, guardian? { name?, phone?, email?, relation? }, team_ids? [] }
 * Retorno: { id, ... }
 */
export async function createSchoolStudent(body) {
  if (USE_MOCK_STUDENTS) {
    await new Promise((r) => setTimeout(r, 500))
    const id = `s${Date.now()}`
    return {
      id,
      name: body.name || '',
      status: 'active',
      birth_date: body.birth_date || null,
      document: body.document || null,
      email: body.email || null,
      phone: body.phone || null,
      guardian: body.guardian || null,
      team_ids: body.team_ids || [],
    }
  }
  const res = await fetch(`${API_BASE}/school/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar o aluno. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Atualiza aluno.
 * PUT/PATCH /school/students/:studentId
 * Body: mesmos campos do criar (parcial se PATCH).
 */
export async function updateSchoolStudent(studentId, body) {
  if (USE_MOCK_STUDENTS) {
    await new Promise((r) => setTimeout(r, 500))
    const existing = mockStudentDetail(studentId)
    if (!existing) {
      const err = new Error('Aluno não encontrado.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return {
      ...existing,
      ...body,
      id: studentId,
    }
  }
  const res = await fetch(`${API_BASE}/school/students/${encodeURIComponent(studentId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar o aluno. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Treinos (lista) — contrato GET /school/trainings ---

const USE_MOCK_TRAININGS = true // remover quando o backend existir

function mockTrainingsList(params) {
  const teams = MOCK_TEAMS
  const total = 24
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 25))
  const teamId = params.team_id || ''
  const fromDate = params.from_date || ''
  const toDate = params.to_date || ''
  const status = params.status || ''
  const sort = params.sort || 'date_desc'

  const base = [
    { id: 'tr1', date: '2025-02-26', start_time: '14:00', end_time: '15:30', team_id: 't1', team_name: 'Turma A - Iniciantes', title: 'Fundamentos e passes', status: 'planned' },
    { id: 'tr2', date: '2025-02-26', start_time: '16:00', end_time: '17:30', team_id: 't2', team_name: 'Turma B - Intermediários', title: 'Táticas defensivas', status: 'planned' },
    { id: 'tr3', date: '2025-02-25', start_time: '14:00', end_time: '15:30', team_id: 't1', team_name: 'Turma A - Iniciantes', title: 'Treino de finalização', status: 'completed' },
    { id: 'tr4', date: '2025-02-24', start_time: '09:00', end_time: '10:30', team_id: 't3', team_name: 'Turma C - Avançados', title: 'Preparação física', status: 'completed' },
    { id: 'tr5', date: '2025-02-23', start_time: '10:00', end_time: '11:30', team_id: 't2', team_name: 'Turma B - Intermediários', title: null, status: 'completed' },
    { id: 'tr6', date: '2025-03-01', start_time: '14:00', end_time: '15:30', team_id: 't1', team_name: 'Turma A - Iniciantes', title: 'Treino livre', status: 'planned' },
    { id: 'tr7', date: '2025-02-20', start_time: '16:00', end_time: '17:00', team_id: 't3', team_name: 'Turma C - Avançados', title: 'Cancelado (chuva)', status: 'cancelled' },
  ]
  let items = [...base]
  for (let i = 0; i < 3; i++) {
    base.forEach((t, j) => {
      items.push({
        ...t,
        id: `tr${i * 10 + j + 8}`,
        date: t.date.replace(/(\d{4})-(\d{2})-(\d{2})/, (_, y, m, d) => {
          const nd = new Date(Number(y), Number(m) - 1, Number(d) + (i + 1) * 7)
          return nd.toISOString().slice(0, 10)
        }),
      })
    })
  }

  items = items.filter((t) => {
    if (teamId && t.team_id !== teamId) return false
    if (fromDate && t.date < fromDate) return false
    if (toDate && t.date > toDate) return false
    if (status && t.status !== status) return false
    return true
  })

  if (sort === 'date_desc') items.sort((a, b) => b.date.localeCompare(a.date))
  if (sort === 'date_asc') items.sort((a, b) => a.date.localeCompare(b.date))

  const totalFiltered = items.length
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)

  return {
    items: slice,
    page,
    page_size: pageSize,
    total: totalFiltered,
    school_name: 'Arena São Paulo',
  }
}

/**
 * Lista treinos da escola (school_id derivado da sessão).
 * GET /school/trainings?team_id=&from_date=&to_date=&status=&page=&page_size=&sort=
 * @param {{ team_id?: string, from_date?: string, to_date?: string, status?: string, page?: number, page_size?: number, sort?: string }} params
 * @returns {Promise<{ items: Array<{ id, date, start_time?, end_time?, team_id, team_name, title?, status? }>, page, page_size, total, school_name? }>}
 */
export async function getSchoolTrainings(params = {}) {
  if (USE_MOCK_TRAININGS) {
    await new Promise((r) => setTimeout(r, 450))
    return mockTrainingsList(params)
  }
  const search = new URLSearchParams()
  if (params.team_id) search.set('team_id', params.team_id)
  if (params.from_date) search.set('from_date', params.from_date)
  if (params.to_date) search.set('to_date', params.to_date)
  if (params.status) search.set('status', params.status)
  if (params.page) search.set('page', String(params.page))
  if (params.page_size) search.set('page_size', String(params.page_size))
  if (params.sort) search.set('sort', params.sort)
  const res = await fetch(`${API_BASE}/school/trainings?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar os treinos.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Treinos (detalhe) — contrato GET /school/trainings/:trainingId ---

const USE_MOCK_TRAINING_DETAIL = true // remover quando o backend existir

function mockTrainingDetail(trainingId) {
  const base = [
    { id: 'tr1', date: '2025-02-26', start_time: '14:00', end_time: '15:30', team_id: 't1', team_name: 'Turma A - Iniciantes', title: 'Fundamentos e passes', status: 'planned', location: 'Quadra 1', description: 'Aquecimento, passes curtos e longos, finalização em duplas.', objectives: ['Melhorar precisão de passes', 'Trabalhar posicionamento'], coach: { id: 'c1', name: 'Prof. Ricardo' }, attendance_summary: { present_count: 12, total_students: 18, attendance_status: 'partial' } },
    { id: 'tr2', date: '2025-02-26', start_time: '16:00', end_time: '17:30', team_id: 't2', team_name: 'Turma B - Intermediários', title: 'Táticas defensivas', status: 'planned', location: 'Quadra 2', description: 'Marcação, cobertura e saída de bola.', objectives: [], coach: { id: 'c2', name: 'Prof. Fernanda' }, attendance_summary: null },
    { id: 'tr3', date: '2025-02-25', start_time: '14:00', end_time: '15:30', team_id: 't1', team_name: 'Turma A - Iniciantes', title: 'Treino de finalização', status: 'completed', location: 'Quadra 1', description: null, objectives: null, coach: { id: 'c1', name: 'Prof. Ricardo' }, attendance_summary: { present_count: 18, total_students: 18, attendance_status: 'complete' } },
    { id: 'tr4', date: '2025-02-24', start_time: '09:00', end_time: '10:30', team_id: 't3', team_name: 'Turma C - Avançados', title: 'Preparação física', status: 'completed', location: null, description: 'Corrida e fortalecimento.', objectives: null, coach: { id: 'c1', name: 'Prof. Ricardo' }, attendance_summary: { present_count: 0, total_students: 15, attendance_status: 'not_started' } },
    { id: 'tr5', date: '2025-02-23', start_time: '10:00', end_time: '11:30', team_id: 't2', team_name: 'Turma B - Intermediários', title: null, status: 'completed', location: 'Quadra 2', description: null, objectives: null, coach: { id: 'c2', name: 'Prof. Fernanda' }, attendance_summary: null },
    { id: 'tr6', date: '2025-03-01', start_time: '14:00', end_time: '15:30', team_id: 't1', team_name: 'Turma A - Iniciantes', title: 'Treino livre', status: 'planned', location: null, description: null, objectives: null, coach: null, attendance_summary: null },
    { id: 'tr7', date: '2025-02-20', start_time: '16:00', end_time: '17:00', team_id: 't3', team_name: 'Turma C - Avançados', title: 'Cancelado (chuva)', status: 'cancelled', location: null, description: null, objectives: null, coach: { id: 'c3', name: 'Prof. Marcos' }, attendance_summary: null },
  ]
  const found = base.find((t) => t.id === trainingId)
  if (!found) return null
  return {
    id: found.id,
    school_id: 'e1',
    team_id: found.team_id,
    team_name: found.team_name,
    date: found.date,
    start_time: found.start_time,
    end_time: found.end_time,
    location: found.location ?? null,
    title: found.title ?? null,
    description: found.description ?? null,
    objectives: found.objectives ?? null,
    status: found.status,
    coach: found.coach ?? null,
    school_name: 'Arena São Paulo',
    attendance_summary: found.attendance_summary ?? null,
  }
}

/**
 * Detalhe do treino (school_id derivado da sessão; trainingId deve pertencer à escola).
 * GET /school/trainings/:trainingId
 * Retorno: id, school_id, team_id, team_name, date, start_time?, end_time?, location?, title?, description?, status?, coach? { id, name }, attendance_summary? { present_count?, total_students?, attendance_status? }
 */
export async function getSchoolTrainingDetail(trainingId) {
  if (USE_MOCK_TRAINING_DETAIL) {
    await new Promise((r) => setTimeout(r, 500))
    const training = mockTrainingDetail(trainingId)
    if (!training) {
      const err = new Error('Treino não encontrado.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return training
  }
  const res = await fetch(`${API_BASE}/school/trainings/${encodeURIComponent(trainingId)}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar o treino.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * (Opcional MVP) Atualiza status do treino.
 * PATCH /school/trainings/:trainingId/status
 * Body: { status: "planned" | "done" | "completed" | "canceled" | "cancelled" }
 */
export async function updateTrainingStatus(trainingId, status) {
  if (USE_MOCK_TRAINING_DETAIL) {
    await new Promise((r) => setTimeout(r, 300))
    const t = mockTrainingDetail(trainingId)
    if (!t) {
      const err = new Error('Treino não encontrado.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    const normalized = status === 'done' ? 'completed' : status === 'canceled' ? 'cancelled' : status
    return { id: trainingId, status: normalized }
  }
  const res = await fetch(`${API_BASE}/school/trainings/${encodeURIComponent(trainingId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível atualizar o status.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Cria treino na escola (school_id derivado da sessão).
 * POST /school/trainings
 * Body: team_id (obrigatório), date (obrigatório), start_time?, end_time?, location?, title?, description?, objectives? [], activities? [{ name, notes? }], status?
 * Retorno: { id, ... }
 */
export async function createSchoolTraining(body) {
  if (USE_MOCK_TRAINING_DETAIL || USE_MOCK_TRAININGS) {
    await new Promise((r) => setTimeout(r, 500))
    const id = `tr${Date.now()}`
    const team = MOCK_TEAMS.find((t) => t.id === body.team_id)
    return {
      id,
      team_id: body.team_id,
      team_name: team?.name ?? '',
      date: body.date || '',
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      location: body.location || null,
      title: body.title || null,
      description: body.description || null,
      objectives: body.objectives ?? null,
      status: body.status || 'planned',
    }
  }
  const res = await fetch(`${API_BASE}/school/trainings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar o treino. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Atualiza treino.
 * PUT/PATCH /school/trainings/:trainingId
 * Body: mesmos campos do criar (parcial se PATCH).
 */
export async function updateSchoolTraining(trainingId, body) {
  if (USE_MOCK_TRAINING_DETAIL || USE_MOCK_TRAININGS) {
    await new Promise((r) => setTimeout(r, 500))
    const existing = mockTrainingDetail(trainingId)
    if (!existing) {
      const err = new Error('Treino não encontrado.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    const team = MOCK_TEAMS.find((t) => t.id === (body.team_id ?? existing.team_id))
    return {
      ...existing,
      team_id: body.team_id !== undefined ? body.team_id : existing.team_id,
      team_name: team?.name ?? existing.team_name,
      date: body.date !== undefined ? body.date : existing.date,
      start_time: body.start_time !== undefined ? body.start_time : existing.start_time,
      end_time: body.end_time !== undefined ? body.end_time : existing.end_time,
      location: body.location !== undefined ? body.location : existing.location,
      title: body.title !== undefined ? body.title : existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      objectives: body.objectives !== undefined ? body.objectives : existing.objectives,
      status: body.status !== undefined ? body.status : existing.status,
    }
  }
  const res = await fetch(`${API_BASE}/school/trainings/${encodeURIComponent(trainingId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar o treino. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Presença (chamada) — contrato GET por treino / por turma+data + POST salvar ---

const USE_MOCK_ATTENDANCE = true // remover quando o backend existir

/** Mock: presença por treino. Usa treino + turma para montar alunos. */
function mockAttendanceByTraining(trainingId) {
  const training = mockTrainingDetail(trainingId)
  if (!training) return null
  const team = mockTeamDetail(training.team_id)
  if (!team) return null
  const students = (team.students || []).map((s) => ({
    student_id: s.id,
    name: s.name,
    status: s.status,
    current_attendance_status: Math.random() > 0.6 ? true : false, // mock: alguns presentes
  }))
  return {
    training_id: training.id,
    team_id: training.team_id,
    team_name: training.team_name,
    date: training.date,
    start_time: training.start_time,
    end_time: training.end_time,
    students,
    attendance_id: `att-${trainingId}`,
    school_name: 'Arena São Paulo',
  }
}

/** Mock: presença por turma + data. */
function mockAttendanceByTeamAndDate(teamId, date) {
  const team = mockTeamDetail(teamId)
  if (!team) return null
  const students = (team.students || []).map((s) => ({
    student_id: s.id,
    name: s.name,
    status: s.status,
    current_attendance_status: false,
  }))
  return {
    team_id: team.id,
    team_name: team.name,
    date: date || new Date().toISOString().slice(0, 10),
    students,
    attendance_id: null,
    school_name: 'Arena São Paulo',
  }
}

/**
 * Carrega contexto e alunos para presença por treino.
 * GET /school/attendance/training/:trainingId
 * Retorno: training_id, team_id, team_name, date, start_time?, end_time?, students: [{ student_id, name, status?, current_attendance_status? }], attendance_id?
 */
export async function getAttendanceByTraining(trainingId) {
  if (USE_MOCK_ATTENDANCE) {
    await new Promise((r) => setTimeout(r, 500))
    const data = mockAttendanceByTraining(trainingId)
    if (!data) {
      const err = new Error('Treino não encontrado.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return data
  }
  const res = await fetch(`${API_BASE}/school/attendance/training/${encodeURIComponent(trainingId)}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar a chamada.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Carrega contexto e alunos para presença por turma + data.
 * GET /school/attendance?team_id=&date=
 * Retorno: team_id, team_name, date, students: [{ student_id, name, status?, current_attendance_status? }], attendance_id?
 */
export async function getAttendanceByTeamAndDate(teamId, date) {
  if (USE_MOCK_ATTENDANCE) {
    await new Promise((r) => setTimeout(r, 500))
    const data = mockAttendanceByTeamAndDate(teamId, date)
    if (!data) {
      const err = new Error('Turma não encontrada.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return data
  }
  const search = new URLSearchParams()
  search.set('team_id', teamId)
  search.set('date', date || new Date().toISOString().slice(0, 10))
  const res = await fetch(`${API_BASE}/school/attendance?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar a chamada.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Salva presença.
 * POST /school/attendance
 * Body: training_id?, team_id, date, items: [{ student_id, present: boolean, note? }]
 * Retorno: { attendance_id, saved_at }
 */
export async function saveAttendance(body) {
  if (USE_MOCK_ATTENDANCE) {
    await new Promise((r) => setTimeout(r, 600))
    return {
      attendance_id: body.training_id ? `att-${body.training_id}` : `att-${body.team_id}-${body.date}`,
      saved_at: new Date().toISOString(),
    }
  }
  const res = await fetch(`${API_BASE}/school/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar a presença. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Histórico de Presenças (Fase 2) — contrato GET /school/attendance/history ---

const USE_MOCK_ATTENDANCE_HISTORY = true // remover quando o backend existir

/**
 * Gera itens de histórico mock (por aluno ou por turma).
 * Por aluno: student_id fixo, várias sessões. Por turma: sessões com present_count/total.
 */
function mockAttendanceHistoryItems(params) {
  const { student_id, team_id, from_date, to_date, status, page, page_size } = params
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const size = Math.min(50, Math.max(10, parseInt(page_size, 10) || 25))
  const teams = MOCK_TEAMS
  const studentsFromList = mockStudentsList({ page: 1, page_size: 100 }).items

  const sessions = []
  const baseDates = ['2025-02-26', '2025-02-25', '2025-02-24', '2025-02-23', '2025-02-20', '2025-02-19', '2025-02-18', '2025-02-17', '2025-02-14', '2025-02-13']
  const trainingsBase = [
    { id: 'tr1', date: '2025-02-26', team_id: 't1', team_name: 'Turma A - Iniciantes', title: 'Fundamentos e passes' },
    { id: 'tr3', date: '2025-02-25', team_id: 't1', team_name: 'Turma A - Iniciantes', title: 'Treino de finalização' },
    { id: 'tr4', date: '2025-02-24', team_id: 't3', team_name: 'Turma C - Avançados', title: 'Preparação física' },
    { id: 'tr5', date: '2025-02-23', team_id: 't2', team_name: 'Turma B - Intermediários', title: null },
    { id: 'tr2', date: '2025-02-26', team_id: 't2', team_name: 'Turma B - Intermediários', title: 'Táticas defensivas' },
  ]
  for (let w = 0; w < 4; w++) {
    trainingsBase.forEach((t) => {
      const d = new Date(t.date)
      d.setDate(d.getDate() + w * 7)
      const dateStr = d.toISOString().slice(0, 10)
      sessions.push({
        date: dateStr,
        team_id: t.team_id,
        team_name: t.team_name,
        training_id: t.id + (w ? `-${w}` : ''),
        training_title: t.title || 'Aula',
        recorded_by: { user_id: 'u1', name: 'Prof. Ricardo' },
        attendance_id: `att-${t.team_id}-${dateStr}`,
      })
    })
  }
  sessions.sort((a, b) => b.date.localeCompare(a.date))

  let items = []
  if (student_id) {
    const student = studentsFromList.find((s) => s.id === student_id)
    const studentName = student?.name || 'Aluno'
    sessions.forEach((s) => {
      const present = Math.random() > 0.25
      if (status === 'present' && !present) return
      if (status === 'absent' && present) return
      if (from_date && s.date < from_date) return
      if (to_date && s.date > to_date) return
      if (team_id && s.team_id !== team_id) return
      items.push({
        date: s.date,
        team_id: s.team_id,
        team_name: s.team_name,
        training_id: s.training_id,
        training_title: s.training_title,
        student_id: student_id,
        student_name: studentName,
        present,
        recorded_by: s.recorded_by,
        attendance_id: s.attendance_id,
      })
    })
  } else if (team_id) {
    sessions.forEach((s) => {
      if (s.team_id !== team_id) return
      if (from_date && s.date < from_date) return
      if (to_date && s.date > to_date) return
      const presentCount = Math.floor(Math.random() * 12) + 5
      const total = 18
      items.push({
        date: s.date,
        team_id: s.team_id,
        team_name: s.team_name,
        training_id: s.training_id,
        training_title: s.training_title,
        present_count: presentCount,
        total_students: total,
        recorded_by: s.recorded_by,
        attendance_id: s.attendance_id,
      })
    })
  }

  const total = items.length
  const start = (pageNum - 1) * size
  const slice = items.slice(start, start + size)
  const presentCount = items.filter((i) => i.present === true).length
  const absentCount = items.filter((i) => i.present === false).length
  const summary = student_id
    ? {
        total_sessions: total,
        present_count: presentCount,
        absent_count: absentCount,
        attendance_rate: total ? Math.round((presentCount / total) * 100) : 0,
      }
    : null

  return {
    items: slice,
    summary,
    page: pageNum,
    page_size: size,
    total,
  }
}

/**
 * Histórico de presenças por aluno ou por turma.
 * GET /school/attendance/history?student_id=&team_id=&from_date=&to_date=&status=&page=&page_size=
 * Retorno: { items: [...], summary?: { total_sessions, present_count, absent_count, attendance_rate }, page, page_size, total }
 */
export async function getAttendanceHistory(params = {}) {
  if (USE_MOCK_ATTENDANCE_HISTORY) {
    await new Promise((r) => setTimeout(r, 500))
    return mockAttendanceHistoryItems(params)
  }
  const search = new URLSearchParams()
  if (params.student_id) search.set('student_id', params.student_id)
  if (params.team_id) search.set('team_id', params.team_id)
  if (params.from_date) search.set('from_date', params.from_date)
  if (params.to_date) search.set('to_date', params.to_date)
  if (params.status) search.set('status', params.status)
  if (params.page) search.set('page', String(params.page))
  if (params.page_size) search.set('page_size', String(params.page_size))
  const res = await fetch(`${API_BASE}/school/attendance/history?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar o histórico.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Exportação CSV do histórico (opcional Fase 2).
 * GET /school/attendance/history/export?student_id=&team_id=&from_date=&to_date=
 * Retorno: blob/stream CSV. Se o endpoint não existir, não exibir botão no front.
 */
export async function exportAttendanceHistory(params = {}) {
  if (USE_MOCK_ATTENDANCE_HISTORY) {
    await new Promise((r) => setTimeout(r, 800))
    return new Blob(['data;mock'], { type: 'text/csv;charset=utf-8' })
  }
  const search = new URLSearchParams()
  if (params.student_id) search.set('student_id', params.student_id)
  if (params.team_id) search.set('team_id', params.team_id)
  if (params.from_date) search.set('from_date', params.from_date)
  if (params.to_date) search.set('to_date', params.to_date)
  const res = await fetch(`${API_BASE}/school/attendance/history/export?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = new Error('Não foi possível exportar.')
    err.status = res.status
    throw err
  }
  return res.blob()
}

// --- Avaliações (lista) — contrato GET /school/assessments ---

const USE_MOCK_ASSESSMENTS = true // remover quando o backend existir

const ASSESSMENT_TYPES = [
  { value: 'tecnica', label: 'Técnica' },
  { value: 'fisica', label: 'Física' },
  { value: 'faixa', label: 'Faixa/Graduação' },
  { value: 'outro', label: 'Outro' },
]

function mockAssessmentsList(params) {
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 25))
  const q = (params.q || '').toLowerCase().trim()
  const teamId = params.team_id || ''
  const studentId = params.student_id || ''
  const fromDate = params.from_date || ''
  const toDate = params.to_date || ''
  const type = params.type || ''
  const sort = params.sort || 'date_desc'

  const studentsFromList = mockStudentsList({ page: 1, page_size: 50 }).items
  const teams = MOCK_TEAMS

  const base = [
    { id: 'a1', date: '2025-02-25', student_id: 's1', student_name: 'Ana Silva', team_id: 't1', team_name: 'Turma A - Iniciantes', type: 'tecnica', title: 'Avaliação técnica - passes', result_summary: 'Aprovado', evaluator: { user_id: 'c1', name: 'Prof. Ricardo' } },
    { id: 'a2', date: '2025-02-24', student_id: 's2', student_name: 'Bruno Santos', team_id: 't1', team_name: 'Turma A - Iniciantes', type: 'fisica', title: 'Teste de resistência', result_summary: '8,5', evaluator: { user_id: 'c1', name: 'Prof. Ricardo' } },
    { id: 'a3', date: '2025-02-23', student_id: 's4', student_name: 'Diego Lima', team_id: 't2', team_name: 'Turma B - Intermediários', type: 'faixa', title: 'Exame de faixa', result_summary: 'Nível 2', evaluator: { user_id: 'c2', name: 'Prof. Fernanda' } },
    { id: 'a4', date: '2025-02-22', student_id: 's5', student_name: 'Elena Costa', team_id: 't3', team_name: 'Turma C - Avançados', type: 'tecnica', title: 'Avaliação técnica', result_summary: 'Reprovado', evaluator: { user_id: 'c1', name: 'Prof. Ricardo' } },
    { id: 'a5', date: '2025-02-20', student_id: 's6', student_name: 'Felipe Souza', team_id: 't1', team_name: 'Turma A - Iniciantes', type: 'outro', title: 'Avaliação comportamental', result_summary: 'Bom', evaluator: { user_id: 'c3', name: 'Prof. Marcos' } },
    { id: 'a6', date: '2025-02-19', student_id: 's1', student_name: 'Ana Silva', team_id: 't1', team_name: 'Turma A - Iniciantes', type: 'fisica', title: null, result_summary: '7,0', evaluator: null },
  ]
  let items = [...base]
  for (let i = 0; i < 4; i++) {
    base.forEach((a, j) => {
      const d = new Date(a.date)
      d.setDate(d.getDate() - (i + 1) * 14)
      items.push({
        ...a,
        id: `a${i * 10 + j + 7}`,
        date: d.toISOString().slice(0, 10),
      })
    })
  }

  items = items.filter((a) => {
    if (q) {
      const searchStr = [a.student_name, a.team_name, a.title, a.type, ASSESSMENT_TYPES.find(t => t.value === a.type)?.label].filter(Boolean).join(' ').toLowerCase()
      if (!searchStr.includes(q)) return false
    }
    if (teamId && a.team_id !== teamId) return false
    if (studentId && a.student_id !== studentId) return false
    if (fromDate && a.date < fromDate) return false
    if (toDate && a.date > toDate) return false
    if (type && a.type !== type) return false
    return true
  })

  if (sort === 'date_desc') items.sort((a, b) => b.date.localeCompare(a.date))
  if (sort === 'date_asc') items.sort((a, b) => a.date.localeCompare(b.date))

  const total = items.length
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)

  return {
    items: slice,
    page,
    page_size: pageSize,
    total,
    school_name: 'Arena São Paulo',
    teams,
    students: studentsFromList.slice(0, 30).map((s) => ({ id: s.id, name: s.name })),
  }
}

/**
 * Lista avaliações da escola (school_id derivado da sessão).
 * GET /school/assessments?q=&team_id=&student_id=&from_date=&to_date=&type=&page=&page_size=&sort=
 * Retorno: { items: [{ id, date, student_id, student_name, team_id?, team_name?, type?, title?, result_summary?, evaluator? }], page, page_size, total }
 */
export async function getSchoolAssessments(params = {}) {
  if (USE_MOCK_ASSESSMENTS) {
    await new Promise((r) => setTimeout(r, 450))
    return mockAssessmentsList(params)
  }
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.team_id) search.set('team_id', params.team_id)
  if (params.student_id) search.set('student_id', params.student_id)
  if (params.from_date) search.set('from_date', params.from_date)
  if (params.to_date) search.set('to_date', params.to_date)
  if (params.type) search.set('type', params.type)
  if (params.page) search.set('page', String(params.page))
  if (params.page_size) search.set('page_size', String(params.page_size))
  if (params.sort) search.set('sort', params.sort)
  const res = await fetch(`${API_BASE}/school/assessments?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar as avaliações.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Avaliações (detalhe) — contrato GET /school/assessments/:assessmentId ---

const USE_MOCK_ASSESSMENT_DETAIL = true // remover quando o backend existir

/**
 * Mock: detalhe de uma avaliação com critérios e resultado final.
 * Retorno conforme contrato: id, school_id, date, type?, title?, student_id, student_name,
 * team_id?, team_name?, evaluator? { user_id, name }, criteria_results?, final_result?
 */
function mockAssessmentDetail(assessmentId) {
  const list = mockAssessmentsList({ page: 1, page_size: 50 })
  const item = list.items.find((a) => a.id === assessmentId)
  if (!item) return null

  // Critérios variados por tipo de avaliação (exemplos)
  const criteriaByType = {
    tecnica: [
      { criterion_id: 'c1', criterion_name: 'Precisão de passes', value: 8, scale_type: 'score', note: 'Bom domínio em curta distância.' },
      { criterion_id: 'c2', criterion_name: 'Posicionamento', value: 7.5, scale_type: 'score', note: null },
      { criterion_id: 'c3', criterion_name: 'Finalização', value: 9, scale_type: 'score', note: 'Destacou-se nos testes.' },
    ],
    fisica: [
      { criterion_id: 'c4', criterion_name: 'Resistência', value: 'Intermediário', scale_type: 'level', note: null },
      { criterion_id: 'c5', criterion_name: 'Velocidade', value: 8.2, scale_type: 'score', note: null },
      { criterion_id: 'c6', criterion_name: 'Flexibilidade', value: true, scale_type: 'boolean', note: 'Atende ao mínimo.' },
    ],
    faixa: [
      { criterion_id: 'c7', criterion_name: 'Conhecimento técnico', value: 'Avançado', scale_type: 'level', note: null },
      { criterion_id: 'c8', criterion_name: 'Apto para próxima faixa', value: true, scale_type: 'boolean', note: null },
    ],
    outro: [
      { criterion_id: 'c9', criterion_name: 'Comportamento', value: 'Bom', scale_type: 'text', note: 'Participativo nas atividades.' },
    ],
  }
  const criteria_results = criteriaByType[item.type] || []

  const final_result = {
    summary: item.result_summary || '—',
    score: typeof item.result_summary === 'string' && /[\d,.]/.test(item.result_summary)
      ? parseFloat(item.result_summary.replace(',', '.'))
      : undefined,
    level: item.type === 'faixa' ? item.result_summary : undefined,
    notes: 'Observações gerais da avaliação podem ser exibidas aqui quando preenchidas pelo avaliador.',
  }

  return {
    id: item.id,
    school_id: 'e1',
    school_name: list.school_name || 'Arena São Paulo',
    date: item.date,
    type: item.type ?? null,
    title: item.title ?? null,
    student_id: item.student_id,
    student_name: item.student_name,
    team_id: item.team_id ?? null,
    team_name: item.team_name ?? null,
    evaluator: item.evaluator ?? null,
    criteria_results,
    final_result,
  }
}

/**
 * Detalhe da avaliação (critérios + resultados).
 * GET /school/assessments/:assessmentId
 * Policy: assessmentId deve pertencer à school_id do usuário (derivado da sessão).
 * Retorno: id, school_id, date, type?, title?, student_id, student_name, team_id?, team_name?,
 *   evaluator? { user_id, name }, criteria_results? [{ criterion_id?, criterion_name, value, scale_type, note? }],
 *   final_result? { summary, score?, level?, notes? }
 */
export async function getSchoolAssessmentDetail(assessmentId) {
  if (USE_MOCK_ASSESSMENT_DETAIL) {
    await new Promise((r) => setTimeout(r, 500))
    const assessment = mockAssessmentDetail(assessmentId)
    if (!assessment) {
      const err = new Error('Avaliação não encontrada.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return assessment
  }
  const res = await fetch(`${API_BASE}/school/assessments/${encodeURIComponent(assessmentId)}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar a avaliação.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Avaliações (criar) — contrato POST /school/assessments ---

/**
 * Cria avaliação na escola (school_id derivado da sessão).
 * POST /school/assessments
 * Body: student_id (obrigatório), team_id?, date (obrigatório), type?, title?,
 *   criteria_results: [{ criterion_id?, criterion_name, scale_type, value, note? }],
 *   final_result? { summary?, score?, level?, notes? }
 * Retorno: { id, ... }
 * Policy: student_id e team_id (se enviado) devem pertencer à school_id do usuário.
 */
export async function createSchoolAssessment(body) {
  if (USE_MOCK_ASSESSMENTS || USE_MOCK_ASSESSMENT_DETAIL) {
    await new Promise((r) => setTimeout(r, 600))
    const list = mockAssessmentsList({ page: 1, page_size: 1 })
    const student = list.items[0]?.student_name || 'Aluno'
    const team = list.items[0]?.team_name || null
    const id = `a${Date.now()}`
    return {
      id,
      student_id: body.student_id,
      student_name: student,
      team_id: body.team_id || null,
      team_name: team,
      date: body.date,
      type: body.type || null,
      title: body.title || null,
      criteria_results: body.criteria_results || [],
      final_result: body.final_result || null,
    }
  }
  const res = await fetch(`${API_BASE}/school/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar a avaliação. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Eventos (lista) — contrato GET /school/events ---

const USE_MOCK_EVENTS = true // remover quando o backend existir

const EVENT_TYPES = [
  { value: 'campeonato', label: 'Campeonato' },
  { value: 'festival', label: 'Festival' },
  { value: 'treino_especial', label: 'Treino especial' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'confraternizacao', label: 'Confraternização' },
  { value: 'outro', label: 'Outro' },
]

/**
 * Gera intervalo padrão: hoje até +30 dias (próximos 30 dias).
 */
function getDefaultEventsPeriod() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + 30)
  return {
    from_date: from.toISOString().slice(0, 10),
    to_date: to.toISOString().slice(0, 10),
  }
}

/**
 * Mock: lista de eventos com filtros e paginação.
 * status (filter): upcoming | past | canceled
 * sort: date_asc | date_desc
 */
function mockEventsList(params) {
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 25))
  const q = (params.q || '').toLowerCase().trim()
  const fromDate = params.from_date || ''
  const toDate = params.to_date || ''
  const typeFilter = params.type || ''
  const statusFilter = params.status || '' // upcoming | past | canceled
  const sort = params.sort || 'date_asc'

  const today = new Date().toISOString().slice(0, 10)

  const base = [
    { id: 'ev1', title: 'Avaliação trimestral', type: 'treino_especial', date: '2025-03-05', start_time: '14:00', end_time: '16:00', location: 'Quadra 1', audience_summary: 'Turma A - Iniciantes', status: 'upcoming' },
    { id: 'ev2', title: 'Reunião de pais', type: 'reuniao', date: '2025-03-12', start_time: '19:00', end_time: '20:30', location: 'Sala de reuniões', audience_summary: 'Todos', status: 'upcoming' },
    { id: 'ev3', title: 'Campeonato interno', type: 'campeonato', date: '2025-03-20', start_time: '09:00', end_time: null, location: 'Quadra principal', audience_summary: 'Selecionados', status: 'upcoming' },
    { id: 'ev4', title: 'Festival de encerramento', type: 'festival', date: '2025-02-15', start_time: '10:00', end_time: '12:00', location: 'Auditório', audience_summary: 'Todos', status: 'past' },
    { id: 'ev5', title: 'Confraternização equipe', type: 'confraternizacao', date: '2025-02-10', start_time: null, end_time: null, location: 'Churrascaria', audience_summary: 'Equipe', status: 'past' },
    { id: 'ev6', title: 'Treino especial - convidados', type: 'treino_especial', date: '2025-03-01', start_time: '15:00', end_time: '17:00', location: 'Quadra 2', audience_summary: 'Turma B - Intermediários', status: 'upcoming' },
    { id: 'ev7', title: 'Evento cancelado (chuva)', type: 'campeonato', date: '2025-02-22', start_time: '08:00', end_time: null, location: 'Quadra externa', audience_summary: null, status: 'canceled' },
    { id: 'ev8', title: 'Reunião pedagógica', type: 'reuniao', date: '2025-03-08', start_time: '14:00', end_time: '15:00', location: 'Sala 1', audience_summary: 'Equipe', status: 'upcoming' },
  ]

  let items = base.filter((ev) => {
    if (q) {
      const searchStr = [ev.title, ev.location, ev.type].filter(Boolean).join(' ').toLowerCase()
      if (!searchStr.includes(q)) return false
    }
    if (fromDate && ev.date < fromDate) return false
    if (toDate && ev.date > toDate) return false
    if (typeFilter && ev.type !== typeFilter) return false
    return true
  })

  if (statusFilter === 'upcoming') {
    items = items.filter((ev) => ev.date >= today && ev.status !== 'canceled')
  }
  if (statusFilter === 'past') {
    items = items.filter((ev) => ev.date < today)
  }
  if (statusFilter === 'canceled') {
    items = items.filter((ev) => ev.status === 'canceled')
  }

  if (sort === 'date_asc') items.sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''))
  if (sort === 'date_desc') items.sort((a, b) => b.date.localeCompare(a.date) || (b.start_time || '').localeCompare(a.start_time || ''))

  const total = items.length
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)

  return {
    items: slice,
    page,
    page_size: pageSize,
    total,
    school_name: MOCK_SUMMARY?.school_name || 'Arena São Paulo',
  }
}

/**
 * Lista eventos da escola (school_id derivado da sessão).
 * GET /school/events?q=&from_date=&to_date=&type=&status=&page=&page_size=&sort=
 * Retorno: { items: [{ id, title, type?, date, start_time?, end_time?, location?, audience_summary?, status? }], page, page_size, total }
 * status (filter): upcoming | past | canceled
 */
export async function getSchoolEvents(params = {}) {
  if (USE_MOCK_EVENTS) {
    await new Promise((r) => setTimeout(r, 450))
    return mockEventsList(params)
  }
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.from_date) search.set('from_date', params.from_date)
  if (params.to_date) search.set('to_date', params.to_date)
  if (params.type) search.set('type', params.type)
  if (params.status) search.set('status', params.status)
  if (params.page) search.set('page', String(params.page))
  if (params.page_size) search.set('page_size', String(params.page_size))
  if (params.sort) search.set('sort', params.sort)
  const res = await fetch(`${API_BASE}/school/events?${search}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar os eventos. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

// --- Eventos (detalhe) — contrato GET /school/events/:eventId + POST cancel (opcional MVP) ---

const USE_MOCK_EVENT_DETAIL = true // remover quando o backend existir

/**
 * Mock: detalhe do evento com resumo, descrição, organizador e público-alvo.
 * Retorno: id, school_id, title, type?, status? (active|canceled), date, start_time?, end_time?, location?, description?, organizer?, audience?, audience_resolved?
 */
function mockEventDetail(eventId) {
  const list = mockEventsList({ page: 1, page_size: 50 })
  const ev = list.items.find((e) => e.id === eventId)
  if (!ev) return null

  const schoolId = MOCK_SUMMARY?.school_id || 'e1'
  const schoolName = MOCK_SUMMARY?.school_name || 'Arena São Paulo'

  // status do contrato: active | canceled
  const status = ev.status === 'canceled' ? 'canceled' : 'active'

  // audience: all | teams | students (mock a partir de audience_summary)
  let audience = null
  let audience_resolved = null
  if (ev.audience_summary === 'Todos' || ev.audience_summary === 'Todos os alunos') {
    audience = { mode: 'all' }
  } else if (ev.audience_summary === 'Turma A - Iniciantes' || ev.id === 'ev1') {
    audience = { mode: 'teams', team_ids: ['t1'] }
    audience_resolved = { teams: [{ id: 't1', name: 'Turma A - Iniciantes' }] }
  } else if (ev.audience_summary === 'Turma B - Intermediários' || ev.id === 'ev6') {
    audience = { mode: 'teams', team_ids: ['t2'] }
    audience_resolved = { teams: [{ id: 't2', name: 'Turma B - Intermediários' }] }
  } else if (ev.audience_summary === 'Selecionados' || ev.id === 'ev3') {
    audience = { mode: 'students', student_ids: ['s1', 's2', 's4'] }
    audience_resolved = {
      students: [
        { id: 's1', name: 'Ana Silva' },
        { id: 's2', name: 'Bruno Santos' },
        { id: 's4', name: 'Diego Lima' },
      ],
    }
  } else if (ev.audience_summary === 'Equipe') {
    audience = { mode: 'all' }
  } else {
    audience = { mode: 'all' }
  }

  const descriptions = {
    ev1: 'Avaliação trimestral de habilidades para todas as turmas de iniciantes. Trazer material de anotação.',
    ev2: 'Reunião para apresentação do planejamento do trimestre e dúvidas dos responsáveis.',
    ev3: 'Campeonato interno entre turmas. Inscrições na secretaria até 15/03.',
    ev4: 'Festival de encerramento do semestre com apresentações e entrega de certificados.',
    ev5: null,
    ev6: 'Treino aberto com convidados das categorias intermediárias.',
    ev7: 'Evento adiado devido às condições climáticas. Nova data a confirmar.',
    ev8: 'Alinhamento pedagógico da equipe.',
  }
  const description = descriptions[ev.id] ?? (ev.id === 'ev5' ? null : 'Descrição do evento.')

  const organizers = {
    ev1: { user_id: 'c1', name: 'Prof. Ricardo' },
    ev2: { user_id: 'u1', name: 'Maria Silva' },
    ev3: { user_id: 'c2', name: 'Prof. Fernanda' },
    ev4: { user_id: 'u1', name: 'Maria Silva' },
    ev8: { user_id: 'u1', name: 'Maria Silva' },
  }
  const organizer = organizers[ev.id] ?? null

  return {
    id: ev.id,
    school_id: schoolId,
    school_name: schoolName,
    title: ev.title,
    type: ev.type ?? null,
    status,
    date: ev.date,
    start_time: ev.start_time ?? null,
    end_time: ev.end_time ?? null,
    location: ev.location ?? null,
    description: description ?? null,
    organizer: organizer ?? null,
    audience: audience ?? null,
    audience_resolved: audience_resolved ?? null,
  }
}

/**
 * Detalhe do evento (school_id derivado da sessão; eventId deve pertencer à escola).
 * GET /school/events/:eventId
 * Retorno: id, school_id, title, type?, status?, date, start_time?, end_time?, location?, description?, organizer?, audience?, audience_resolved?
 */
export async function getSchoolEventDetail(eventId) {
  if (USE_MOCK_EVENT_DETAIL) {
    await new Promise((r) => setTimeout(r, 500))
    const event = mockEventDetail(eventId)
    if (!event) {
      const err = new Error('Evento não encontrado.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return event
  }
  const res = await fetch(`${API_BASE}/school/events/${encodeURIComponent(eventId)}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível carregar o evento.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Cria evento na escola (school_id derivado da sessão).
 * POST /school/events
 * Body: title (obrigatório), type?, date (obrigatório), start_time?, end_time?, location?, description?,
 *   audience? { mode: "all" | "teams" | "students", team_ids? [], student_ids? [] }, status?
 * Retorno: { id, ... }
 */
export async function createSchoolEvent(body) {
  if (USE_MOCK_EVENT_DETAIL || USE_MOCK_EVENTS) {
    await new Promise((r) => setTimeout(r, 600))
    const id = `ev${Date.now()}`
    return {
      id,
      title: body.title || '',
      type: body.type || null,
      date: body.date || '',
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      location: body.location || null,
      description: body.description || null,
      status: body.status ?? 'active',
      audience: body.audience || { mode: 'all' },
    }
  }
  const res = await fetch(`${API_BASE}/school/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar o evento. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * Atualiza evento.
 * PUT/PATCH /school/events/:eventId
 * Body: mesmos campos do criar (parcial se PATCH).
 * Policy: eventId deve pertencer à school_id do usuário (derivado da sessão).
 */
export async function updateSchoolEvent(eventId, body) {
  if (USE_MOCK_EVENT_DETAIL || USE_MOCK_EVENTS) {
    await new Promise((r) => setTimeout(r, 600))
    const existing = mockEventDetail(eventId)
    if (!existing) {
      const err = new Error('Evento não encontrado.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    return {
      ...existing,
      title: body.title !== undefined ? body.title : existing.title,
      type: body.type !== undefined ? body.type : existing.type,
      date: body.date !== undefined ? body.date : existing.date,
      start_time: body.start_time !== undefined ? body.start_time : existing.start_time,
      end_time: body.end_time !== undefined ? body.end_time : existing.end_time,
      location: body.location !== undefined ? body.location : existing.location,
      description: body.description !== undefined ? body.description : existing.description,
      status: body.status !== undefined ? body.status : existing.status,
      audience: body.audience !== undefined ? body.audience : existing.audience,
    }
  }
  const res = await fetch(`${API_BASE}/school/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível salvar o evento. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/**
 * (Opcional MVP) Cancela o evento.
 * POST /school/events/:eventId/cancel
 * Body: { reason? }
 * Policy: eventId deve pertencer à school_id do usuário (derivado da sessão).
 */
export async function cancelSchoolEvent(eventId, body = {}) {
  if (USE_MOCK_EVENT_DETAIL) {
    await new Promise((r) => setTimeout(r, 600))
    const event = mockEventDetail(eventId)
    if (!event) {
      const err = new Error('Evento não encontrado.')
      err.status = 404
      err.code = 'NOT_FOUND'
      throw err
    }
    if (event.status === 'canceled') {
      const err = new Error('Este evento já está cancelado.')
      err.status = 400
      err.code = 'VALIDATION_ERROR'
      throw err
    }
    return { id: eventId, status: 'canceled', canceled_at: new Date().toISOString() }
  }
  const res = await fetch(`${API_BASE}/school/events/${encodeURIComponent(eventId)}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Não foi possível cancelar o evento. Tente novamente.')
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

/** Tipos de evento para selects no front (label por value). */
export function getEventTypeLabel(value) {
  return EVENT_TYPES.find((t) => t.value === value)?.label ?? value ?? '—'
}
