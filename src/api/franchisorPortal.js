/**
 * Contrato mínimo do backend — Portal Franqueador (frontend apenas consome).
 *
 * GET /franchisor/me
 *   retorno: { franchisor_id, user_role, scope_school_ids? (array), scope_type? }
 *
 * GET /franchisor/schools
 *   retorno: { items: [{ school_id, school_name, status, city?, state? }] }
 *   Policy: só escolas onde school.franchisor_id = franchisor_id do usuário; respeita scope_school_ids.
 *
 * GET /franchisor/dashboard/summary?school_id= (opcional)
 *   retorno: { schools_active_count, students_count?, received_total?, overdue_total? }
 *   Se school_id ausente: consolidado. Backend valida franchisor_id e scope_school_ids.
 */

const GRID = 8

// Mock: usuário franqueador logado (franchisor_id = 1, Rede Arena)
const MOCK_ME = {
  franchisor_id: '1',
  franchisor_name: 'Rede Arena',
  user_role: 'FranchisorOwner',
  scope_school_ids: null, // null = todas as escolas do franqueador
  scope_type: 'all',
}

// Mock: escolas do franqueador 1 (detalhe com campos opcionais)
const MOCK_SCHOOLS_DETAIL = [
  {
    school_id: 'e1',
    school_name: 'Arena São Paulo',
    status: 'ativo',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua Exemplo, 100',
    responsible_name: 'Maria Silva',
    email: 'contato@arena-sp.com.br',
    phone: '(11) 3456-7890',
    notes: null,
    created_at: '2023-01-15T10:00:00Z',
    can_access_school_portal: true,
  },
  {
    school_id: 'e2',
    school_name: 'Arena Campinas',
    status: 'suspenso',
    city: 'Campinas',
    state: 'SP',
    address: null,
    responsible_name: 'João Santos',
    email: null,
    phone: '(19) 98765-4321',
    notes: 'Observação interna.',
    created_at: '2023-03-20T14:00:00Z',
    can_access_school_portal: false,
  },
  {
    school_id: 'e3',
    school_name: 'Arena Santos',
    status: 'pendente',
    city: 'Santos',
    state: 'SP',
    address: null,
    responsible_name: null,
    email: 'arena.santos@email.com',
    phone: null,
    notes: null,
    created_at: '2024-01-10T09:00:00Z',
    can_access_school_portal: true,
  },
  {
    school_id: 'e4',
    school_name: 'Arena Ribeirão',
    status: 'ativo',
    city: 'Ribeirão Preto',
    state: 'SP',
    address: 'Av. Brasil, 500',
    responsible_name: 'Ana Costa',
    email: 'ana@arena-rp.com.br',
    phone: '(16) 3333-4444',
    notes: null,
    created_at: '2023-06-01T08:00:00Z',
    can_access_school_portal: true,
  },
]

// Lista resumida (para switcher e lista)
const MOCK_SCHOOLS = MOCK_SCHOOLS_DETAIL.map(({ school_id, school_name, status, city, state }) => ({
  school_id,
  school_name,
  status,
  city,
  state,
}))

// Mock: totais consolidados (todas as escolas)
const MOCK_SUMMARY_ALL = {
  schools_active_count: 2,
  students_count: 265,
  received_total: 89450.0,
  overdue_total: 3200.0,
}

// Mock: por escola (exemplo e1) — dashboard
const MOCK_SUMMARY_BY_SCHOOL = {
  e1: { schools_active_count: 1, students_count: 120, received_total: 45000.0, overdue_total: 800.0 },
  e2: { schools_active_count: 1, students_count: 85, received_total: 0, overdue_total: 1200.0 },
  e3: { schools_active_count: 0, students_count: 0, received_total: null, overdue_total: null },
  e4: { schools_active_count: 1, students_count: 45, received_total: 44450.0, overdue_total: 0 },
}

// Mock: resumo por escola para tela Detalhe (students_count, teams_count, overdue_total)
const MOCK_SCHOOL_SUMMARY = {
  e1: { students_count: 120, teams_count: 8, overdue_total: 800.0 },
  e2: { students_count: 85, teams_count: 5, overdue_total: 1200.0 },
  e3: { students_count: 0, teams_count: 0, overdue_total: null },
  e4: { students_count: 45, teams_count: 3, overdue_total: 0 },
}

function applyScope(items, scopeSchoolIds) {
  if (!scopeSchoolIds || scopeSchoolIds.length === 0) return items
  const set = new Set(scopeSchoolIds)
  return items.filter((s) => set.has(s.school_id))
}

/**
 * Identidade e escopo do usuário franqueador logado.
 */
export async function getFranchisorMe() {
  await new Promise((r) => setTimeout(r, 300))
  return { ...MOCK_ME }
}

/**
 * Lista de escolas permitidas (para School Switcher e lista rápida).
 * Backend aplica franchisor_id e scope_school_ids.
 */
export async function getFranchisorSchools() {
  await new Promise((r) => setTimeout(r, 400))
  const scopeIds = MOCK_ME.scope_school_ids
  const items = applyScope([...MOCK_SCHOOLS], scopeIds)
  return { items }
}

/**
 * Lista paginada de escolas do franqueador (tela Lista de Escolas).
 * GET /franchisor/schools?search=&status=&page=&page_size=
 * Backend aplica franchisor_id e scope_school_ids.
 * @param {{ search?: string, status?: string, page?: number, page_size?: number }} params
 * @returns {{ items: Array<{ school_id, school_name, status, city?, state? }>, total: number }}
 */
export async function getFranchisorSchoolsList(params = {}) {
  await new Promise((r) => setTimeout(r, 350))
  const scopeIds = MOCK_ME.scope_school_ids
  let items = applyScope([...MOCK_SCHOOLS], scopeIds)

  const search = (params.search || '').toLowerCase().trim()
  if (search) {
    items = items.filter(
      (s) =>
        (s.school_name && s.school_name.toLowerCase().includes(search)) ||
        (s.city && s.city.toLowerCase().includes(search)) ||
        (s.state && s.state.toLowerCase().includes(search))
    )
  }

  const statusFilter = (params.status || '').toLowerCase()
  if (statusFilter) {
    const map = { ativa: 'ativo', pendente: 'pendente', suspensa: 'suspenso' }
    const statusValue = map[statusFilter] || statusFilter
    items = items.filter((s) => (s.status || '').toLowerCase() === statusValue)
  }

  const total = items.length
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 10))
  const start = (page - 1) * pageSize
  items = items.slice(start, start + pageSize)

  return { items, total }
}

/**
 * Detalhe de uma escola (GET /franchisor/schools/{school_id}).
 * Backend valida franchisor_id e scope_school_ids; 404 se não permitido.
 * @returns { Promise<{ school_id, school_name, status, city?, state?, responsible_name?, email?, phone?, created_at?, can_access_school_portal? } | null> }
 */
export async function getFranchisorSchoolById(schoolId) {
  await new Promise((r) => setTimeout(r, 350))
  const scopeIds = MOCK_ME.scope_school_ids
  let list = MOCK_SCHOOLS_DETAIL
  if (scopeIds && scopeIds.length > 0) {
    const set = new Set(scopeIds)
    list = list.filter((s) => set.has(s.school_id))
  }
  const school = list.find((s) => s.school_id === schoolId) || null
  return school ? { ...school } : null
}

/**
 * Resumo/KPIs da escola (GET /franchisor/schools/{school_id}/summary) — opcional no MVP.
 * @returns { Promise<{ students_count?, teams_count?, overdue_total? } | null> }
 */
export async function getFranchisorSchoolSummary(schoolId) {
  await new Promise((r) => setTimeout(r, 280))
  const scopeIds = MOCK_ME.scope_school_ids
  if (scopeIds && scopeIds.length > 0 && !scopeIds.includes(schoolId)) return null
  const summary = MOCK_SCHOOL_SUMMARY[schoolId]
  return summary ? { ...summary } : null
}

/**
 * Resumo do dashboard (KPIs). school_id opcional; se ausente, consolidado.
 */
export async function getFranchisorDashboardSummary(schoolId = null) {
  await new Promise((r) => setTimeout(r, 500))
  if (schoolId) {
    const bySchool = MOCK_SUMMARY_BY_SCHOOL[schoolId]
    if (!bySchool) return { schools_active_count: 0, students_count: null, received_total: null, overdue_total: null }
    return { ...bySchool }
  }
  return { ...MOCK_SUMMARY_ALL }
}

// --- Relatórios consolidados (por escola/período) ---
// GET /franchisor/reports/summary — params: from, to, school_id? (opcional)
// GET /franchisor/reports/by-school — params: from, to, school_status?, page, page_size, sort
// Backend aplica franchisor_id + scope_school_ids em todas as agregações.

// Mock: resumo por escola para relatórios (inclui attendances_count para MVP se existir)
const MOCK_REPORTS_BY_SCHOOL_ROW = {
  e1: { students_count: 120, teams_count: 8, received_total: 45000.0, overdue_total: 800.0, attendances_count: 320 },
  e2: { students_count: 85, teams_count: 5, received_total: 0, overdue_total: 1200.0, attendances_count: 0 },
  e3: { students_count: 0, teams_count: 0, received_total: null, overdue_total: null, attendances_count: null },
  e4: { students_count: 45, teams_count: 3, received_total: 44450.0, overdue_total: 0, attendances_count: 90 },
}

/**
 * GET /franchisor/reports/summary — KPIs do período (consolidado ou por escola).
 * @param {{ from: string, to: string, school_id?: string }} params
 * @returns { Promise<{ students_count?, teams_count?, received_total?, overdue_total?, attendances_count? }> }
 */
export async function getFranchisorReportsSummary(params = {}) {
  await new Promise((r) => setTimeout(r, 400))
  const scopeIds = MOCK_ME.scope_school_ids
  let schools = applyScope([...MOCK_SCHOOLS], scopeIds)
  const schoolId = params.school_id || null
  if (schoolId) {
    schools = schools.filter((s) => s.school_id === schoolId)
    if (schools.length === 0) {
      return { students_count: null, teams_count: null, received_total: null, overdue_total: null, attendances_count: null }
    }
    const row = MOCK_REPORTS_BY_SCHOOL_ROW[schoolId]
    if (!row) return { students_count: null, teams_count: null, received_total: null, overdue_total: null, attendances_count: null }
    return { ...row }
  }
  // Consolidado
  let students_count = 0
  let teams_count = 0
  let received_total = 0
  let overdue_total = 0
  let attendances_count = 0
  schools.forEach((s) => {
    const row = MOCK_REPORTS_BY_SCHOOL_ROW[s.school_id]
    if (row) {
      if (row.students_count != null) students_count += row.students_count
      if (row.teams_count != null) teams_count += row.teams_count
      if (row.received_total != null) received_total += row.received_total
      if (row.overdue_total != null) overdue_total += row.overdue_total
      if (row.attendances_count != null) attendances_count += row.attendances_count
    }
  })
  return { students_count, teams_count, received_total, overdue_total, attendances_count }
}

/**
 * GET /franchisor/reports/by-school — lista paginada por escola (comparativo).
 * @param {{ from?: string, to?: string, school_status?: string, page?: number, page_size?: number, sort?: string }} params
 * @returns {{ items: Array<{ school_id, school_name, school_status, students_count?, teams_count?, received_total?, overdue_total?, attendances_count? }>, total: number, page: number, page_size: number }}
 */
export async function getFranchisorReportsBySchool(params = {}) {
  await new Promise((r) => setTimeout(r, 450))
  const scopeIds = MOCK_ME.scope_school_ids
  let items = applyScope([...MOCK_SCHOOLS], scopeIds).map((s) => {
    const row = MOCK_REPORTS_BY_SCHOOL_ROW[s.school_id] || {}
    return {
      school_id: s.school_id,
      school_name: s.school_name,
      school_status: s.status || '',
      students_count: row.students_count ?? null,
      teams_count: row.teams_count ?? null,
      received_total: row.received_total ?? null,
      overdue_total: row.overdue_total ?? null,
      attendances_count: row.attendances_count ?? null,
    }
  })

  const statusFilter = (params.school_status || '').toLowerCase().trim()
  if (statusFilter) {
    const map = { ativa: 'ativo', ativo: 'ativo', pendente: 'pendente', suspensa: 'suspenso', suspenso: 'suspenso' }
    const statusValue = map[statusFilter] || statusFilter
    items = items.filter((s) => (s.school_status || '').toLowerCase() === statusValue)
  }

  const sortParam = (params.sort || 'received_total_desc').toLowerCase()
  const hasReceived = items.some((i) => i.received_total != null)
  const sortKey = hasReceived && (sortParam.startsWith('received') || sortParam === 'received_total_desc')
    ? 'received_total'
    : 'students_count'
  const desc = sortParam.includes('_desc') || sortParam === 'received_total_desc' || sortParam === 'students_count_desc'
  items = [...items].sort((a, b) => {
    const va = a[sortKey] ?? -Infinity
    const vb = b[sortKey] ?? -Infinity
    return desc ? vb - va : va - vb
  })

  const total = items.length
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 10))
  const start = (page - 1) * pageSize
  items = items.slice(start, start + pageSize)

  return { items, total, page, page_size: pageSize }
}

// --- Detalhe do relatório por escola (drilldown) — Fase 2 ---
// GET /franchisor/reports/schools/{school_id}/detail — params: from, to
// Backend valida franchisor_id + scope_school_ids; auditoria Franchisor_ViewSchoolReportDetail.

// Mock: drilldown por escola (summary + breakdowns opcionais)
const MOCK_REPORT_DETAIL_ATTENDANCE = {
  e1: { presencas_registradas: 320, faltas_registradas: 12, percentual_presenca: 96.4 },
  e2: { presencas_registradas: 0, faltas_registradas: 0, percentual_presenca: null },
  e3: { presencas_registradas: null, faltas_registradas: null, percentual_presenca: null },
  e4: { presencas_registradas: 90, faltas_registradas: 3, percentual_presenca: 96.8 },
}
const MOCK_REPORT_DETAIL_FINANCE = {
  e1: { received_total: 45000, em_aberto: 1200, em_atraso: 800, maior_atraso_dias: 15 },
  e2: { received_total: 0, em_aberto: 800, em_atraso: 1200, maior_atraso_dias: 45 },
  e3: { received_total: null, em_aberto: null, em_atraso: null, maior_atraso_dias: null },
  e4: { received_total: 44450, em_aberto: 0, em_atraso: 0, maior_atraso_dias: null },
}
const MOCK_REPORT_DETAIL_TEAMS = {
  e1: { qtde_turmas: 8, turmas_ativas: 8, capacidade_media: 15 },
  e2: { qtde_turmas: 5, turmas_ativas: 4, capacidade_media: 17 },
  e3: { qtde_turmas: 0, turmas_ativas: 0, capacidade_media: null },
  e4: { qtde_turmas: 3, turmas_ativas: 3, capacidade_media: 15 },
}

/**
 * GET /franchisor/reports/schools/{school_id}/detail
 * @param {string} schoolId
 * @param {{ from: string, to: string }} params
 * @returns { Promise<{ school_name?: string, summary?: object, attendance_breakdown?: object, finance_breakdown?: object, teams_breakdown?: object }> }
 */
export async function getFranchisorReportSchoolDetail(schoolId, params = {}) {
  await new Promise((r) => setTimeout(r, 400))
  const scopeIds = MOCK_ME.scope_school_ids
  let list = applyScope([...MOCK_SCHOOLS], scopeIds)
  const school = list.find((s) => s.school_id === schoolId) || null
  if (!school) {
    const err = new Error('Escola não encontrada ou sem permissão.')
    err.status = 404
    throw err
  }

  const row = MOCK_REPORTS_BY_SCHOOL_ROW[schoolId] || {}
  const summary = {
    students_count: row.students_count ?? null,
    teams_count: row.teams_count ?? null,
    attendances_count: row.attendances_count ?? null,
    received_total: row.received_total ?? null,
    overdue_total: row.overdue_total ?? null,
  }

  const attendance = MOCK_REPORT_DETAIL_ATTENDANCE[schoolId]
  const finance = MOCK_REPORT_DETAIL_FINANCE[schoolId]
  const teams = MOCK_REPORT_DETAIL_TEAMS[schoolId]

  return {
    school_name: school.school_name,
    summary: Object.keys(summary).some((k) => summary[k] != null) ? summary : undefined,
    attendance_breakdown: attendance && (attendance.presencas_registradas != null || attendance.faltas_registradas != null) ? attendance : undefined,
    finance_breakdown: finance && (finance.received_total != null || finance.em_atraso != null || finance.em_aberto != null) ? finance : undefined,
    teams_breakdown: teams && (teams.qtde_turmas != null) ? teams : undefined,
  }
}

// --- Financeiro consolidado (mensalidades / inadimplência por escola) ---
// GET /franchisor/finance/summary — params: from, to, school_id?, status?, bucket?
// GET /franchisor/finance/by-school — params: from, to, status?, bucket?, page, page_size, sort
// GET /franchisor/finance/by-bucket (opcional) — params: from, to, school_id?
// Backend aplica franchisor_id + scope_school_ids em toda consulta.

const MOCK_FINANCE_BY_SCHOOL = {
  e1: { received_total: 45000, open_total: 1200, overdue_total: 800, max_overdue_days: 15 },
  e2: { received_total: 0, open_total: 800, overdue_total: 1200, max_overdue_days: 45 },
  e3: { received_total: null, open_total: null, overdue_total: null, max_overdue_days: null },
  e4: { received_total: 44450, open_total: 0, overdue_total: 0, max_overdue_days: null },
}

function delinquencyRate(received, open, overdue) {
  const total = (received ?? 0) + (open ?? 0) + (overdue ?? 0)
  if (total <= 0) return null
  return ((overdue ?? 0) / total) * 100
}

/**
 * GET /franchisor/finance/summary
 * @param {{ from: string, to: string, school_id?: string, status?: string, bucket?: string }} params
 * @returns { Promise<{ received_total, open_total, overdue_total, delinquency_rate }> }
 */
export async function getFranchisorFinanceSummary(params = {}) {
  await new Promise((r) => setTimeout(r, 400))
  const scopeIds = MOCK_ME.scope_school_ids
  let schools = applyScope([...MOCK_SCHOOLS], scopeIds)
  const schoolId = params.school_id || null
  if (schoolId) {
    schools = schools.filter((s) => s.school_id === schoolId)
    if (schools.length === 0) {
      return { received_total: 0, open_total: 0, overdue_total: 0, delinquency_rate: null }
    }
  }

  let received_total = 0
  let open_total = 0
  let overdue_total = 0
  schools.forEach((s) => {
    const row = MOCK_FINANCE_BY_SCHOOL[s.school_id]
    if (row) {
      if (row.received_total != null) received_total += row.received_total
      if (row.open_total != null) open_total += row.open_total
      if (row.overdue_total != null) overdue_total += row.overdue_total
    }
  })

  const rate = delinquencyRate(received_total, open_total, overdue_total)
  return { received_total, open_total, overdue_total, delinquency_rate: rate }
}

/**
 * GET /franchisor/finance/by-school (paginação)
 * @param {{ from?: string, to?: string, status?: string, bucket?: string, page?: number, page_size?: number, sort?: string }} params
 * @returns {{ items: Array<{ school_id, school_name, school_status, received_total, open_total, overdue_total, delinquency_rate, max_overdue_days? }>, total: number, page: number, page_size: number }}
 */
export async function getFranchisorFinanceBySchool(params = {}) {
  await new Promise((r) => setTimeout(r, 450))
  const scopeIds = MOCK_ME.scope_school_ids
  let items = applyScope([...MOCK_SCHOOLS], scopeIds).map((s) => {
    const row = MOCK_FINANCE_BY_SCHOOL[s.school_id] || {}
    const received = row.received_total ?? 0
    const open = row.open_total ?? 0
    const overdue = row.overdue_total ?? 0
    const rate = delinquencyRate(received, open, overdue)
    return {
      school_id: s.school_id,
      school_name: s.school_name,
      school_status: s.status || '',
      received_total: row.received_total ?? null,
      open_total: row.open_total ?? null,
      overdue_total: row.overdue_total ?? null,
      delinquency_rate: rate,
      max_overdue_days: row.max_overdue_days ?? null,
    }
  })

  const sortParam = (params.sort || 'overdue_total_desc').toLowerCase()
  const sortKey = sortParam.startsWith('overdue') ? 'overdue_total' : sortParam.startsWith('received') ? 'received_total' : sortParam.startsWith('delinquency') ? 'delinquency_rate' : 'overdue_total'
  const desc = sortParam.includes('_desc')
  items = [...items].sort((a, b) => {
    const va = a[sortKey] ?? -Infinity
    const vb = b[sortKey] ?? -Infinity
    return desc ? (vb - va) : (va - vb)
  })

  const total = items.length
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 10))
  const start = (page - 1) * pageSize
  items = items.slice(start, start + pageSize)

  return { items, total, page, page_size: pageSize }
}

const BUCKET_LABELS = [
  { key: '1_7', label: '1–7 dias' },
  { key: '8_30', label: '8–30 dias' },
  { key: '31_60', label: '31–60 dias' },
  { key: '61_plus', label: '61+ dias' },
]

/**
 * GET /franchisor/finance/by-bucket (opcional MVP)
 * @param {{ from?: string, to?: string, school_id?: string }} params
 * @returns { Promise<Array<{ bucket_label: string, overdue_total: number, overdue_count: number }>> }
 */
export async function getFranchisorFinanceByBucket(params = {}) {
  await new Promise((r) => setTimeout(r, 350))
  const scopeIds = MOCK_ME.scope_school_ids
  const schoolId = params.school_id || null
  let schools = applyScope([...MOCK_SCHOOLS], scopeIds)
  if (schoolId) schools = schools.filter((s) => s.school_id === schoolId)

  const totals = { '1_7': { overdue_total: 200, overdue_count: 2 }, '8_30': { overdue_total: 800, overdue_count: 5 }, '31_60': { overdue_total: 600, overdue_count: 3 }, '61_plus': { overdue_total: 400, overdue_count: 1 } }
  return BUCKET_LABELS.map((b) => ({
    bucket_label: b.label,
    overdue_total: totals[b.key]?.overdue_total ?? 0,
    overdue_count: totals[b.key]?.overdue_count ?? 0,
  }))
}

// --- Detalhe financeiro por escola (Fase 2) ---
// GET /franchisor/finance/schools/{school_id}/summary — params: from, to, status?, bucket?
// GET /franchisor/finance/schools/{school_id}/by-bucket — params: from, to (usa getFranchisorFinanceByBucket com school_id)
// GET /franchisor/finance/schools/{school_id}/by-period — params: from, to, granularity=MONTH (opcional)

/**
 * GET /franchisor/finance/schools/{school_id}/summary
 * Resumo financeiro de uma escola no período. Backend valida franchisor_id + scope_school_ids.
 * @param {string} schoolId
 * @param {{ from: string, to: string, status?: string, bucket?: string }} params
 * @returns { Promise<{ received_total, open_total, overdue_total, delinquency_rate, max_overdue_days? }> }
 */
export async function getFranchisorFinanceSchoolSummary(schoolId, params = {}) {
  const data = await getFranchisorFinanceSummary({
    from: params.from,
    to: params.to,
    school_id: schoolId,
    status: params.status || undefined,
    bucket: params.bucket || undefined,
  })
  const row = MOCK_FINANCE_BY_SCHOOL[schoolId] || {}
  return {
    received_total: data.received_total ?? row.received_total ?? 0,
    open_total: data.open_total ?? row.open_total ?? 0,
    overdue_total: data.overdue_total ?? row.overdue_total ?? 0,
    delinquency_rate: data.delinquency_rate ?? null,
    max_overdue_days: row.max_overdue_days ?? null,
  }
}

// Mock: evolução por mês (por escola) para by-period
const MOCK_FINANCE_BY_PERIOD = {
  e1: [
    { period_label: '2026-01', received_total: 22000, overdue_total: 400 },
    { period_label: '2026-02', received_total: 23000, overdue_total: 400 },
  ],
  e2: [
    { period_label: '2026-01', received_total: 0, overdue_total: 600 },
    { period_label: '2026-02', received_total: 0, overdue_total: 600 },
  ],
  e3: [],
  e4: [
    { period_label: '2026-01', received_total: 22225, overdue_total: 0 },
    { period_label: '2026-02', received_total: 22225, overdue_total: 0 },
  ],
}

/**
 * GET /franchisor/finance/schools/{school_id}/by-period (opcional Fase 2)
 * @param {string} schoolId
 * @param {{ from?: string, to?: string, granularity?: string }} params
 * @returns { Promise<Array<{ period_label: string, received_total: number, overdue_total: number }>> }
 */
export async function getFranchisorFinanceSchoolByPeriod(schoolId, params = {}) {
  await new Promise((r) => setTimeout(r, 320))
  const scopeIds = MOCK_ME.scope_school_ids
  let list = applyScope([...MOCK_SCHOOLS], scopeIds)
  if (!list.find((s) => s.school_id === schoolId)) return []
  const items = MOCK_FINANCE_BY_PERIOD[schoolId] || []
  return items.map((i) => ({ ...i }))
}

// --- Usuários do Franqueador (self-service) ---
// GET /franchisor/users (paginação + filtros); GET /franchisor/users/{user_id}; POST /franchisor/users; PATCH /franchisor/users/{user_id}; DELETE /franchisor/users/{user_id}
// Backend valida franchisor_id do usuário logado; policy e anti-escalonamento no backend.

const SCOPE_ALL = 'ALL'
const SCOPE_LIST = 'SCHOOL_LIST'

const MOCK_FRANCHISOR_USERS = [
  { user_id: 'u1', name: 'Carlos Silva', email: 'carlos@redearena.com.br', role: 'FranchisorOwner', scope_type: 'ALL', scope_school_ids: null, scope_school_count: 4, status: 'ativo', last_login_at: '2025-02-20T14:00:00Z' },
  { user_id: 'u2', name: 'Maria Oliveira', email: 'maria@redearena.com.br', role: 'FranchisorStaff', scope_type: 'SCHOOL_LIST', scope_school_ids: ['e1', 'e2'], scope_school_count: 2, status: 'ativo', last_login_at: '2025-02-18T09:00:00Z' },
  { user_id: 'u3', name: 'João Pendente', email: 'joao@redearena.com.br', role: 'FranchisorStaff', scope_type: 'ALL', scope_school_ids: null, scope_school_count: 4, status: 'convidado', last_login_at: null },
]

function getFranchisorId() {
  return MOCK_ME.franchisor_id
}

function parseIsoDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/**
 * GET /franchisor/users — lista paginada. Params: search, role, scope_type?, page, page_size.
 * Retorno: { items, total, page, page_size, total_pages }
 */
export async function getFranchisorUsers(params = {}) {
  await new Promise((r) => setTimeout(r, 400))
  let list = [...MOCK_FRANCHISOR_USERS]
  const search = (params.search || '').toLowerCase().trim()
  if (search) {
    list = list.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(search)) ||
        (u.email && u.email.toLowerCase().includes(search))
    )
  }
  const roleFilter = (params.role || '').trim()
  if (roleFilter && roleFilter !== 'todos') {
    list = list.filter((u) => u.role === roleFilter)
  }
  const scopeTypeFilter = (params.scope_type || '').trim()
  if (scopeTypeFilter && scopeTypeFilter !== 'todos') {
    if (scopeTypeFilter === 'all' || scopeTypeFilter === 'ALL' || scopeTypeFilter === 'ALL_SCHOOLS') list = list.filter((u) => u.scope_type === 'ALL' || u.scope_type === 'ALL_SCHOOLS')
    else if (scopeTypeFilter === 'school_list' || scopeTypeFilter === 'SCHOOL_LIST') list = list.filter((u) => u.scope_type === 'SCHOOL_LIST')
  }
  const total = list.length
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(100, Math.max(10, parseInt(params.page_size, 10) || 10))
  const start = (page - 1) * pageSize
  const items = list.slice(start, start + pageSize)
  return {
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize) || 1,
  }
}

/**
 * GET /franchisor/users/{user_id} — um usuário (para edição).
 */
export async function getFranchisorUserById(userId) {
  await new Promise((r) => setTimeout(r, 300))
  const user = MOCK_FRANCHISOR_USERS.find((u) => String(u.user_id) === String(userId))
  if (!user) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  return { ...user }
}

/**
 * POST /franchisor/users — criar/convidar usuário. Payload: name, email, role, scope_type, scope_school_ids?
 */
export async function createFranchisorUser(payload) {
  await new Promise((r) => setTimeout(r, 500))
  const maxId = MOCK_FRANCHISOR_USERS.reduce((acc, u) => Math.max(acc, parseInt(String(u.user_id).replace('u', ''), 10) || 0), 0)
  const user_id = `u${maxId + 1}`
  const scope_type = payload.scope_type === SCOPE_LIST ? SCOPE_LIST : SCOPE_ALL
  const scope_school_ids = scope_type === SCOPE_LIST ? (payload.scope_school_ids || []) : null
  const scope_school_count = scope_type === SCOPE_ALL ? MOCK_SCHOOLS.length : (scope_school_ids?.length || 0)
  const newUser = {
    user_id,
    name: (payload.name || '').trim(),
    email: (payload.email || '').trim(),
    role: payload.role === 'FranchisorOwner' ? 'FranchisorOwner' : 'FranchisorStaff',
    scope_type,
    scope_school_ids,
    scope_school_count,
    status: 'convidado',
    last_login_at: null,
  }
  MOCK_FRANCHISOR_USERS.push(newUser)
  return newUser
}

/**
 * PATCH /franchisor/users/{user_id} — atualizar role e escopo.
 */
export async function updateFranchisorUser(userId, payload) {
  await new Promise((r) => setTimeout(r, 400))
  const idx = MOCK_FRANCHISOR_USERS.findIndex((u) => String(u.user_id) === String(userId))
  if (idx === -1) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  const current = MOCK_FRANCHISOR_USERS[idx]
  const scope_type = payload.scope_type === SCOPE_LIST ? SCOPE_LIST : SCOPE_ALL
  const scope_school_ids = scope_type === SCOPE_LIST ? (payload.scope_school_ids || []) : null
  const scope_school_count = scope_type === SCOPE_ALL ? MOCK_SCHOOLS.length : (scope_school_ids?.length || 0)
  const updated = {
    ...current,
    role: payload.role === 'FranchisorOwner' ? 'FranchisorOwner' : payload.role === 'FranchisorStaff' ? 'FranchisorStaff' : current.role,
    scope_type,
    scope_school_ids,
    scope_school_count,
  }
  MOCK_FRANCHISOR_USERS[idx] = updated
  return updated
}

/**
 * DELETE /franchisor/users/{user_id} — remover acesso ao franqueador.
 */
export async function deleteFranchisorUser(userId) {
  await new Promise((r) => setTimeout(r, 400))
  const idx = MOCK_FRANCHISOR_USERS.findIndex((u) => String(u.user_id) === String(userId))
  if (idx === -1) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  MOCK_FRANCHISOR_USERS.splice(idx, 1)
  return { ok: true }
}

export function getFranchisorRoleLabel(role) {
  return role === 'FranchisorOwner' ? 'FranchisorOwner' : role === 'FranchisorStaff' ? 'FranchisorStaff' : role || '—'
}

export function getFranchisorScopeSummary(user) {
  if (!user) return '—'
  if (user.scope_type === 'ALL' || user.scope_type === 'ALL_SCHOOLS') return 'Todas as escolas'
  const n = user.scope_school_count ?? user.scope_school_ids?.length ?? 0
  return n === 1 ? '1 escola' : `${n} escolas`
}

export function formatFranchisorLastLogin(iso) {
  const d = parseIsoDate(iso)
  return d ? d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

/**
 * Formata valor monetário para exibição.
 */
export function formatCurrency(value) {
  if (value == null || value === '') return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value)
}

/**
 * Criar escola no franqueador (POST /franchisor/schools).
 * Backend define franchisor_id pelo usuário; retorna school_id, status (ex.: pendente), created_at.
 * @param {{ name: string, responsible_name?: string, email?: string, phone?: string, city?: string, state?: string, address?: string, notes?: string }} payload
 * @returns { Promise<{ school_id: string, status: string, created_at: string }> }
 */
export async function createFranchisorSchool(payload) {
  await new Promise((r) => setTimeout(r, 400))
  const id = 'e' + String(Date.now()).slice(-6)
  const school = {
    school_id: id,
    school_name: (payload.name || '').trim(),
    status: 'pendente',
    city: (payload.city || '').trim() || null,
    state: (payload.state || '').trim() || null,
    address: (payload.address || '').trim() || null,
    responsible_name: (payload.responsible_name || '').trim() || null,
    email: (payload.email || '').trim() || null,
    phone: (payload.phone || '').trim() || null,
    notes: (payload.notes || '').trim() || null,
    created_at: new Date().toISOString(),
    can_access_school_portal: false,
  }
  MOCK_SCHOOLS_DETAIL.push(school)
  MOCK_SCHOOLS.push({ school_id: school.school_id, school_name: school.school_name, status: school.status, city: school.city, state: school.state })
  return { school_id: id, status: school.status, created_at: school.created_at }
}

/**
 * Atualizar escola (PATCH /franchisor/schools/{school_id}).
 * Backend valida franchisor_id e scope; só campos permitidos.
 * @param {string} schoolId
 * @param {{ name?: string, responsible_name?: string, email?: string, phone?: string, city?: string, state?: string, address?: string, notes?: string }} payload
 */
export async function updateFranchisorSchool(schoolId, payload) {
  await new Promise((r) => setTimeout(r, 350))
  const scopeIds = MOCK_ME.scope_school_ids
  let list = MOCK_SCHOOLS_DETAIL
  if (scopeIds && scopeIds.length > 0) {
    const set = new Set(scopeIds)
    list = list.filter((s) => set.has(s.school_id))
  }
  const idx = list.findIndex((s) => s.school_id === schoolId)
  const globalIdx = MOCK_SCHOOLS_DETAIL.findIndex((s) => s.school_id === schoolId)
  if (idx < 0 || globalIdx < 0) {
    const err = new Error('Escola não encontrada ou sem permissão.')
    err.status = 404
    throw err
  }
  const school = MOCK_SCHOOLS_DETAIL[globalIdx]
  if (payload.name !== undefined) school.school_name = (payload.name || '').trim()
  ;['responsible_name', 'email', 'phone', 'city', 'state', 'address', 'notes'].forEach((key) => {
    if (payload[key] !== undefined) school[key] = (payload[key] || '').trim() || null
  })
  const listItem = MOCK_SCHOOLS.find((s) => s.school_id === schoolId)
  if (listItem) {
    listItem.school_name = school.school_name
    listItem.city = school.city
    listItem.state = school.state
  }
  return { school_id: schoolId }
}

// --- Onboarding (Fase 2) - mock em memória por school_id ---
const MOCK_ONBOARDING_STATE = {} // { [school_id]: { approval_request_status, checklist_manual: { [item_id]: state }, history?: [] } }

function getSchoolForOnboarding(schoolId) {
  const scopeIds = MOCK_ME.scope_school_ids
  let list = MOCK_SCHOOLS_DETAIL
  if (scopeIds && scopeIds.length > 0) {
    const set = new Set(scopeIds)
    list = list.filter((s) => set.has(s.school_id))
  }
  return list.find((s) => s.school_id === schoolId) || null
}

/**
 * GET /franchisor/schools/{school_id}/onboarding
 * Retorno: school_id, status, checklist_items, approval_request_status, updated_at
 */
export async function getFranchisorSchoolOnboarding(schoolId) {
  await new Promise((r) => setTimeout(r, 350))
  const school = getSchoolForOnboarding(schoolId)
  if (!school) {
    const err = new Error('Escola não encontrada ou sem permissão.')
    err.status = 404
    throw err
  }

  const state = MOCK_ONBOARDING_STATE[schoolId] || {}
  const approvalStatus = state.approval_request_status || 'NONE'
  const manualStates = state.checklist_manual || {}

  const hasBasicData = !!(school.school_name && (school.city || school.state) && (school.email || school.phone))
  const hasResponsible = !!school.responsible_name

  const checklistItems = [
    {
      id: 'cadastro-basico',
      title: 'Cadastro básico completo',
      state: hasBasicData ? 'CONCLUDED' : 'PENDING',
      type: 'AUTO',
      action_link: `/franchisor/schools/${schoolId}/edit`,
    },
    {
      id: 'responsavel',
      title: 'Responsável definido',
      state: hasResponsible ? 'CONCLUDED' : 'PENDING',
      type: 'AUTO',
      action_link: `/franchisor/schools/${schoolId}/edit`,
    },
    {
      id: 'revisao-franqueador',
      title: 'Revisão do franqueador',
      state: manualStates['revisao-franqueador'] || 'PENDING',
      type: 'MANUAL',
      action_link: null,
    },
  ]

  return {
    school_id: schoolId,
    status: (school.status || 'pendente').toLowerCase() === 'ativo' ? 'ativo' : (school.status || 'pendente').toLowerCase() === 'suspenso' ? 'suspenso' : 'pendente',
    checklist_items: checklistItems,
    approval_request_status: approvalStatus,
    updated_at: state.updated_at || school.created_at,
  }
}

/**
 * PATCH /franchisor/schools/{school_id}/onboarding/checklist/{item_id}
 * Apenas itens MANUAL. payload: { state: 'CONCLUDED' | 'PENDING' }
 */
export async function patchFranchisorSchoolOnboardingChecklist(schoolId, itemId, payload) {
  await new Promise((r) => setTimeout(r, 300))
  const school = getSchoolForOnboarding(schoolId)
  if (!school) {
    const err = new Error('Escola não encontrada ou sem permissão.')
    err.status = 404
    throw err
  }
  if (!MOCK_ONBOARDING_STATE[schoolId]) MOCK_ONBOARDING_STATE[schoolId] = { checklist_manual: {} }
  if (!MOCK_ONBOARDING_STATE[schoolId].checklist_manual) MOCK_ONBOARDING_STATE[schoolId].checklist_manual = {}
  MOCK_ONBOARDING_STATE[schoolId].checklist_manual[itemId] = payload.state === 'CONCLUDED' ? 'CONCLUDED' : 'PENDING'
  MOCK_ONBOARDING_STATE[schoolId].updated_at = new Date().toISOString()
  return { school_id: schoolId, item_id: itemId, state: MOCK_ONBOARDING_STATE[schoolId].checklist_manual[itemId] }
}

/**
 * POST /franchisor/schools/{school_id}/onboarding/request-approval
 * payload: { message?, confirmed: boolean }
 * Retorno: approval_request_status = REQUESTED
 */
export async function postFranchisorSchoolRequestApproval(schoolId, payload) {
  await new Promise((r) => setTimeout(r, 400))
  const school = getSchoolForOnboarding(schoolId)
  if (!school) {
    const err = new Error('Escola não encontrada ou sem permissão.')
    err.status = 404
    throw err
  }
  if (!payload.confirmed) {
    const err = new Error('É necessário confirmar que as pendências foram revisadas.')
    err.status = 400
    throw err
  }
  if (!MOCK_ONBOARDING_STATE[schoolId]) MOCK_ONBOARDING_STATE[schoolId] = {}
  if (MOCK_ONBOARDING_STATE[schoolId].approval_request_status === 'REQUESTED') {
    const err = new Error('Já existe uma solicitação de aprovação em análise.')
    err.status = 409
    throw err
  }
  MOCK_ONBOARDING_STATE[schoolId].approval_request_status = 'REQUESTED'
  MOCK_ONBOARDING_STATE[schoolId].updated_at = new Date().toISOString()
  return { school_id: schoolId, approval_request_status: 'REQUESTED' }
}

// --- Padrões de Metodologia (MVP) ---
// Mock em memória; backend valida franchisor_id em todas as operações.
let MOCK_METHODOLOGY_STANDARDS = [
  {
    id: 'std1',
    title: 'Metodologia Arena 2024',
    content: 'Conteúdo da metodologia: princípios, etapas e avaliação.',
    version: 'v3',
    status: 'ativo',
    updated_at: '2024-02-20T14:30:00Z',
    updated_by: 'Franqueador',
  },
  {
    id: 'std2',
    title: 'Metodologia Arena 2023',
    content: 'Versão anterior da metodologia.',
    version: 'v2',
    status: 'inativo',
    updated_at: '2024-01-15T10:00:00Z',
    updated_by: 'Franqueador',
  },
]
let _nextVersionNum = 4

/**
 * GET /franchisor/standards/methodology?search=&status=&page=&page_size=
 * Retorno: { items: [{ id, title, version, status, updated_at }], total }
 */
export async function getMethodologyStandardsList(params = {}) {
  await new Promise((r) => setTimeout(r, 350))
  let items = [...MOCK_METHODOLOGY_STANDARDS]

  const search = (params.search || '').toLowerCase().trim()
  if (search) {
    items = items.filter((s) => (s.title && s.title.toLowerCase().includes(search)))
  }

  const statusFilter = (params.status || '').toLowerCase()
  if (statusFilter && statusFilter !== 'todos') {
    items = items.filter((s) => (s.status || '').toLowerCase() === statusFilter)
  }

  const total = items.length
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 10))
  const start = (page - 1) * pageSize
  items = items.slice(start, start + pageSize).map(({ id, title, version, status, updated_at }) => ({
    id,
    title,
    version,
    status,
    updated_at,
  }))

  return { items, total }
}

/**
 * GET /franchisor/standards/methodology/{id}
 */
export async function getMethodologyStandardById(id) {
  await new Promise((r) => setTimeout(r, 280))
  const item = MOCK_METHODOLOGY_STANDARDS.find((s) => s.id === id) || null
  return item ? { ...item } : null
}

/**
 * POST /franchisor/standards/methodology
 * payload: { title, content, status }
 * Versão gerada automaticamente (vN).
 */
export async function createMethodologyStandard(payload) {
  await new Promise((r) => setTimeout(r, 400))
  const version = 'v' + String(_nextVersionNum++)
  const newItem = {
    id: 'std' + Date.now(),
    title: (payload.title || '').trim(),
    content: (payload.content || '').trim(),
    version,
    status: (payload.status || 'inativo').toLowerCase() === 'ativo' ? 'ativo' : 'inativo',
    updated_at: new Date().toISOString(),
    updated_by: 'Franqueador',
  }
  if (newItem.status === 'ativo') {
    MOCK_METHODOLOGY_STANDARDS = MOCK_METHODOLOGY_STANDARDS.map((s) => ({
      ...s,
      status: 'inativo',
    }))
  }
  MOCK_METHODOLOGY_STANDARDS.unshift(newItem)
  return { id: newItem.id, title: newItem.title, version: newItem.version, status: newItem.status, updated_at: newItem.updated_at }
}

/**
 * PATCH /franchisor/standards/methodology/{id}
 * payload: { title?, content?, status? }
 * Ao ativar, backend inativa os demais (apenas 1 ativo por vez).
 */
export async function updateMethodologyStandard(id, payload) {
  await new Promise((r) => setTimeout(r, 350))
  const idx = MOCK_METHODOLOGY_STANDARDS.findIndex((s) => s.id === id)
  if (idx < 0) {
    const err = new Error('Padrão não encontrado ou sem permissão.')
    err.status = 404
    throw err
  }
  const item = MOCK_METHODOLOGY_STANDARDS[idx]
  if (payload.title !== undefined) item.title = (payload.title || '').trim()
  if (payload.content !== undefined) item.content = (payload.content || '').trim()
  if (payload.status !== undefined) {
    const newStatus = (payload.status || '').toLowerCase() === 'ativo' ? 'ativo' : 'inativo'
    item.status = newStatus
    if (newStatus === 'ativo') {
      MOCK_METHODOLOGY_STANDARDS.forEach((s, i) => {
        if (s.id !== id) s.status = 'inativo'
      })
    }
  }
  item.updated_at = new Date().toISOString()
  return { id: item.id, title: item.title, version: item.version, status: item.status, updated_at: item.updated_at }
}

/**
 * Ativar padrão (PATCH status=ativo; backend inativa os outros).
 */
export async function activateMethodologyStandard(id) {
  return updateMethodologyStandard(id, { status: 'ativo' })
}

/**
 * Inativar padrão (PATCH status=inativo).
 */
export async function inactivateMethodologyStandard(id) {
  return updateMethodologyStandard(id, { status: 'inativo' })
}

// --- Preços sugeridos (MVP) ---
// Mock em memória; backend valida franchisor_id em listagem e edição.
const CATEGORIAS_PRECO = ['Plano mensal', 'Matrícula', 'Uniforme', 'Evento']
let MOCK_SUGGESTED_PRICING = [
  {
    id: 'price1',
    name: 'Mensalidade padrão',
    category: 'Plano mensal',
    amount: 299.9,
    currency: 'BRL',
    periodicity: 'mensal',
    status: 'ativo',
    notes: null,
    updated_at: '2024-02-20T14:30:00Z',
  },
  {
    id: 'price2',
    name: 'Matrícula',
    category: 'Matrícula',
    amount: 150,
    currency: 'BRL',
    periodicity: 'unico',
    status: 'ativo',
    notes: 'Valor único na adesão.',
    updated_at: '2024-02-18T10:00:00Z',
  },
  {
    id: 'price3',
    name: 'Uniforme completo',
    category: 'Uniforme',
    amount: 189.9,
    currency: 'BRL',
    periodicity: 'unico',
    status: 'inativo',
    notes: null,
    updated_at: '2024-01-15T09:00:00Z',
  },
]

/**
 * GET /franchisor/standards/pricing?search=&status=&category=&page=&page_size=
 * Retorno: { items: [{ id, name, category?, amount, currency, periodicity?, status, updated_at }], total }
 */
export async function getSuggestedPricingList(params = {}) {
  await new Promise((r) => setTimeout(r, 350))
  let items = [...MOCK_SUGGESTED_PRICING]

  const search = (params.search || '').toLowerCase().trim()
  if (search) {
    items = items.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(search)) ||
        (s.category && s.category.toLowerCase().includes(search))
    )
  }

  const statusFilter = (params.status || '').toLowerCase()
  if (statusFilter && statusFilter !== 'todos') {
    items = items.filter((s) => (s.status || '').toLowerCase() === statusFilter)
  }

  const categoryFilter = (params.category || '').trim()
  if (categoryFilter) {
    items = items.filter((s) => (s.category || '') === categoryFilter)
  }

  const total = items.length
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 10))
  const start = (page - 1) * pageSize
  items = items
    .slice(start, start + pageSize)
    .map(({ id, name, category, amount, currency, periodicity, status, updated_at }) => ({
      id,
      name,
      category: category || null,
      amount,
      currency,
      periodicity: periodicity || null,
      status,
      updated_at,
    }))

  return { items, total }
}

/** Categorias disponíveis para o select (opcional). */
export function getSuggestedPricingCategories() {
  return [...CATEGORIAS_PRECO]
}

/**
 * GET /franchisor/standards/pricing/{id} — detalhe para edição.
 */
export async function getSuggestedPriceById(id) {
  await new Promise((r) => setTimeout(r, 280))
  const item = MOCK_SUGGESTED_PRICING.find((s) => s.id === id) || null
  return item ? { ...item } : null
}

/**
 * POST /franchisor/standards/pricing
 * payload: { name, category?, amount, currency, periodicity?, status, notes? }
 * Validação backend: amount >= 0, moeda válida.
 */
export async function createSuggestedPrice(payload) {
  await new Promise((r) => setTimeout(r, 400))
  const amount = Math.max(0, parseFloat(payload.amount) || 0)
  const newItem = {
    id: 'price' + Date.now(),
    name: (payload.name || '').trim(),
    category: (payload.category || '').trim() || null,
    amount,
    currency: (payload.currency || 'BRL').trim().toUpperCase(),
    periodicity: (payload.periodicity || 'unico').toLowerCase() === 'mensal' ? 'mensal' : 'unico',
    status: (payload.status || 'inativo').toLowerCase() === 'ativo' ? 'ativo' : 'inativo',
    notes: (payload.notes || '').trim() || null,
    updated_at: new Date().toISOString(),
  }
  MOCK_SUGGESTED_PRICING.unshift(newItem)
  return {
    id: newItem.id,
    name: newItem.name,
    category: newItem.category,
    amount: newItem.amount,
    currency: newItem.currency,
    periodicity: newItem.periodicity,
    status: newItem.status,
    updated_at: newItem.updated_at,
  }
}

/**
 * PATCH /franchisor/standards/pricing/{id}
 * payload: { name?, category?, amount?, currency?, periodicity?, status?, notes? }
 */
export async function updateSuggestedPrice(id, payload) {
  await new Promise((r) => setTimeout(r, 350))
  const idx = MOCK_SUGGESTED_PRICING.findIndex((s) => s.id === id)
  if (idx < 0) {
    const err = new Error('Preço sugerido não encontrado ou sem permissão.')
    err.status = 404
    throw err
  }
  const item = MOCK_SUGGESTED_PRICING[idx]
  if (payload.name !== undefined) item.name = (payload.name || '').trim()
  if (payload.category !== undefined) item.category = (payload.category || '').trim() || null
  if (payload.amount !== undefined) item.amount = Math.max(0, parseFloat(payload.amount) || 0)
  if (payload.currency !== undefined) item.currency = (payload.currency || 'BRL').trim().toUpperCase()
  if (payload.periodicity !== undefined) {
    item.periodicity = (payload.periodicity || '').toLowerCase() === 'mensal' ? 'mensal' : 'unico'
  }
  if (payload.status !== undefined) {
    item.status = (payload.status || '').toLowerCase() === 'ativo' ? 'ativo' : 'inativo'
  }
  if (payload.notes !== undefined) item.notes = (payload.notes || '').trim() || null
  item.updated_at = new Date().toISOString()
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    amount: item.amount,
    currency: item.currency,
    periodicity: item.periodicity,
    status: item.status,
    updated_at: item.updated_at,
  }
}

/**
 * Ativar item (PATCH status=ativo).
 */
export async function activateSuggestedPrice(id) {
  return updateSuggestedPrice(id, { status: 'ativo' })
}

/**
 * Inativar item (PATCH status=inativo). Não apaga histórico.
 */
export async function inactivateSuggestedPrice(id) {
  return updateSuggestedPrice(id, { status: 'inativo' })
}

// --- Biblioteca de Padrões (Fase 2) ---
// GET /franchisor/standards/library — lista unificada (metodologia + preços) com filtros e paginação.
// GET /franchisor/standards/library/{item_id} — resumo do item.
// GET /franchisor/standards/library/{item_id}/versions — histórico de versões.
// GET /franchisor/standards/library/{item_id}/versions/{version_id} — conteúdo de uma versão.
// Backend valida franchisor_id; conteúdo sanitizado.

const LIBRARY_TYPE_METHODOLOGY = 'METHODOLOGY'
const LIBRARY_TYPE_PRICING = 'PRICING'

function buildLibraryItems() {
  const methodologyItems = MOCK_METHODOLOGY_STANDARDS.map((s) => ({
    item_id: s.id,
    type: LIBRARY_TYPE_METHODOLOGY,
    title_or_name: s.title,
    current_version: s.version || 'v1',
    status: (s.status || 'inativo').toLowerCase(),
    updated_at: s.updated_at,
    updated_by_name: s.updated_by || '—',
    updated_by_email: null,
  }))
  const pricingItems = MOCK_SUGGESTED_PRICING.map((s) => ({
    item_id: s.id,
    type: LIBRARY_TYPE_PRICING,
    title_or_name: s.name,
    current_version: 'v1',
    status: (s.status || 'inativo').toLowerCase(),
    updated_at: s.updated_at,
    updated_by_name: 'Franqueador',
    updated_by_email: null,
  }))
  return [...methodologyItems, ...pricingItems]
}

// Mock: histórico de versões por item (version_id, version_label, created_at, created_by, summary).
const MOCK_LIBRARY_VERSIONS = {}

function getVersionsForItem(itemId, type) {
  if (MOCK_LIBRARY_VERSIONS[itemId]) return MOCK_LIBRARY_VERSIONS[itemId]
  if (type === LIBRARY_TYPE_METHODOLOGY) {
    const item = MOCK_METHODOLOGY_STANDARDS.find((s) => s.id === itemId)
    if (!item) return []
    const versions = [
      {
        version_id: item.id + '_current',
        version_label: item.version || 'v1',
        created_at: item.updated_at,
        created_by: item.updated_by || 'Franqueador',
        summary: 'Versão atual',
      },
      {
        version_id: item.id + '_v2',
        version_label: 'v2',
        created_at: '2024-01-15T10:00:00Z',
        created_by: 'Franqueador',
        summary: 'Conteúdo atualizado',
      },
    ]
    MOCK_LIBRARY_VERSIONS[itemId] = versions
    return versions
  }
  if (type === LIBRARY_TYPE_PRICING) {
    const item = MOCK_SUGGESTED_PRICING.find((s) => s.id === itemId)
    if (!item) return []
    const versions = [
      {
        version_id: item.id + '_current',
        version_label: 'v1',
        created_at: item.updated_at,
        created_by: 'Franqueador',
        summary: 'Versão atual',
      },
    ]
    MOCK_LIBRARY_VERSIONS[itemId] = versions
    return versions
  }
  return []
}

function getVersionContentSnapshot(itemId, versionId, type) {
  if (type === LIBRARY_TYPE_METHODOLOGY) {
    const item = MOCK_METHODOLOGY_STANDARDS.find((s) => s.id === itemId)
    if (!item) return null
    if (versionId === item.id + '_current' || versionId === item.id)
      return { title: item.title, content: item.content }
    return { title: item.title + ' (versão anterior)', content: (item.content || '').slice(0, 200) + '...' }
  }
  if (type === LIBRARY_TYPE_PRICING) {
    const item = MOCK_SUGGESTED_PRICING.find((s) => s.id === itemId)
    if (!item) return null
    return {
      name: item.name,
      category: item.category,
      amount: item.amount,
      currency: item.currency,
      periodicity: item.periodicity,
      notes: item.notes,
    }
  }
  return null
}

/**
 * GET /franchisor/standards/library?search=&type=&status=&from=&to=&page=&page_size=
 * Retorno: { items: [{ item_id, type, title_or_name, current_version, status, updated_at, updated_by_name, updated_by_email }], total }
 */
export async function getStandardsLibrary(params = {}) {
  await new Promise((r) => setTimeout(r, 350))
  let items = buildLibraryItems()

  const search = (params.search || '').toLowerCase().trim()
  if (search) {
    items = items.filter(
      (i) =>
        (i.title_or_name && i.title_or_name.toLowerCase().includes(search)) ||
        (i.current_version && i.current_version.toLowerCase().includes(search)) ||
        (i.type && i.type.toLowerCase().includes(search))
    )
  }

  const typeFilter = (params.type || '').toUpperCase().replace(/\s+/g, '')
  if (typeFilter && typeFilter !== 'TODOS') {
    if (typeFilter === 'METODOLOGIA' || typeFilter === 'METHODOLOGY') items = items.filter((i) => i.type === LIBRARY_TYPE_METHODOLOGY)
    else if (typeFilter === 'PRECOSSUGERIDOS' || typeFilter === 'PRICING') items = items.filter((i) => i.type === LIBRARY_TYPE_PRICING)
    else items = items.filter((i) => i.type === typeFilter)
  }

  const statusFilter = (params.status || '').toLowerCase()
  if (statusFilter && statusFilter !== 'todos') {
    items = items.filter((i) => (i.status || '').toLowerCase() === statusFilter)
  }

  const from = (params.from || '').trim()
  const to = (params.to || '').trim()
  if (from || to) {
    items = items.filter((i) => {
      const d = i.updated_at ? new Date(i.updated_at).getTime() : 0
      if (from && d < new Date(from).getTime()) return false
      if (to && d > new Date(to + 'T23:59:59.999Z').getTime()) return false
      return true
    })
  }

  const total = items.length
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 10))
  const start = (page - 1) * pageSize
  items = items.slice(start, start + pageSize)

  return { items, total }
}

/**
 * GET /franchisor/standards/library/{item_id}
 * Retorno: { item_id, type, title_or_name, status, current_version }
 */
export async function getStandardsLibraryItem(itemId) {
  await new Promise((r) => setTimeout(r, 280))
  const all = buildLibraryItems()
  const item = all.find((i) => i.item_id === itemId) || null
  if (!item) return null
  return {
    item_id: item.item_id,
    type: item.type,
    title_or_name: item.title_or_name,
    status: item.status,
    current_version: item.current_version,
    updated_at: item.updated_at,
    updated_by_name: item.updated_by_name,
  }
}

/**
 * GET /franchisor/standards/library/{item_id}/versions?page=&page_size=
 * Retorno: { items: [{ version_id, version_label, created_at, created_by, summary }], total }
 */
export async function getStandardsLibraryVersions(itemId, params = {}) {
  await new Promise((r) => setTimeout(r, 300))
  const libItem = buildLibraryItems().find((i) => i.item_id === itemId)
  if (!libItem) return { items: [], total: 0 }
  const versions = getVersionsForItem(itemId, libItem.type)
  const total = versions.length
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 10))
  const start = (page - 1) * pageSize
  const items = versions.slice(start, start + pageSize)
  return { items, total }
}

/**
 * GET /franchisor/standards/library/{item_id}/versions/{version_id}
 * Retorno: { content_snapshot: object (title/content para metodologia; name, amount, etc. para pricing) }
 */
export async function getStandardsLibraryVersionContent(itemId, versionId) {
  await new Promise((r) => setTimeout(r, 280))
  const libItem = buildLibraryItems().find((i) => i.item_id === itemId)
  if (!libItem) return null
  const content_snapshot = getVersionContentSnapshot(itemId, versionId, libItem.type)
  return content_snapshot ? { content_snapshot } : null
}

export { LIBRARY_TYPE_METHODOLOGY, LIBRARY_TYPE_PRICING }

// --- Campanhas (Franqueador) — MVP ---
// GET /franchisor/campaigns?search=&status=&from=&to=&target_type=&page=&page_size=
// Backend: policy franchisor_id; auditoria Franchisor_ListCampaigns.
// itens: id, title, status, start_date, end_date?, target_type (ALL|SCHOOL_LIST), target_schools_count?, updated_at

const CAMPAIGN_STATUSES = ['rascunho', 'ativa', 'encerrada']
const TARGET_TYPE_ALL = 'ALL'
const TARGET_TYPE_SCHOOL_LIST = 'SCHOOL_LIST'

let MOCK_CAMPAIGNS = [
  {
    id: 'camp1',
    title: 'Campanha de volta às aulas 2024',
    description: 'Orientações para o início do ano letivo.',
    content: 'Prezadas escolas, seguem as orientações para a volta às aulas 2024...',
    status: 'ativa',
    start_date: '2024-02-01',
    end_date: '2024-02-28',
    target_type: TARGET_TYPE_ALL,
    target_school_ids: null,
    target_schools_count: null,
    updated_at: '2024-02-20T14:30:00Z',
  },
  {
    id: 'camp2',
    title: 'Orientação de matrículas - Região SP',
    description: 'Diretrizes de matrícula para unidades SP.',
    content: 'Instruções de matrícula para as escolas da região de São Paulo.',
    status: 'ativa',
    start_date: '2024-02-10',
    end_date: null,
    target_type: TARGET_TYPE_SCHOOL_LIST,
    target_school_ids: ['e1', 'e2', 'e3'],
    target_schools_count: 3,
    updated_at: '2024-02-18T10:00:00Z',
  },
  {
    id: 'camp3',
    title: 'Comunicação de feriados',
    description: null,
    content: 'Calendário de feriados e recessos do primeiro trimestre.',
    status: 'encerrada',
    start_date: '2024-01-05',
    end_date: '2024-01-15',
    target_type: TARGET_TYPE_ALL,
    target_school_ids: null,
    target_schools_count: null,
    updated_at: '2024-01-15T18:00:00Z',
  },
  {
    id: 'camp4',
    title: 'Rascunho - Nova ação Q1',
    description: 'Em elaboração.',
    content: 'Conteúdo a ser definido.',
    status: 'rascunho',
    start_date: '2024-03-01',
    end_date: null,
    target_type: TARGET_TYPE_SCHOOL_LIST,
    target_school_ids: ['e1', 'e4'],
    target_schools_count: 2,
    updated_at: '2024-02-19T09:00:00Z',
  },
]

/**
 * GET /franchisor/campaigns
 * params: search, status, from, to, target_type?, page, page_size
 * Retorno: { items: [...], total }
 * Ordenação padrão: updated_at desc.
 */
export async function getFranchisorCampaigns(params = {}) {
  await new Promise((r) => setTimeout(r, 350))
  let items = [...MOCK_CAMPAIGNS]

  const search = (params.search || '').toLowerCase().trim()
  if (search) {
    items = items.filter((c) => (c.title && c.title.toLowerCase().includes(search)))
  }

  const statusFilter = (params.status || '').toLowerCase()
  if (statusFilter && statusFilter !== 'todos') {
    const map = { ativa: 'ativa', encerrada: 'encerrada', rascunho: 'rascunho' }
    const statusValue = map[statusFilter] || statusFilter
    items = items.filter((c) => (c.status || '').toLowerCase() === statusValue)
  }

  const from = (params.from || '').trim()
  const to = (params.to || '').trim()
  if (from || to) {
    items = items.filter((c) => {
      const start = c.start_date ? new Date(c.start_date).getTime() : 0
      if (from && start < new Date(from).getTime()) return false
      if (to && start > new Date(to + 'T23:59:59.999Z').getTime()) return false
      return true
    })
  }

  const targetTypeFilter = (params.target_type || params.segment || '').toUpperCase().replace(/\s+/g, '')
  if (targetTypeFilter && targetTypeFilter !== 'TODAS') {
    if (targetTypeFilter === 'ALL' || targetTypeFilter === 'PARATODASASESCOLAS') {
      items = items.filter((c) => c.target_type === TARGET_TYPE_ALL)
    } else if (targetTypeFilter === 'SCHOOLLIST' || targetTypeFilter === 'PARAESCOLASSELEIONADAS') {
      items = items.filter((c) => c.target_type === TARGET_TYPE_SCHOOL_LIST)
    }
  }

  // Ordenação: updated_at desc
  items.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())

  const total = items.length
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 10))
  const start = (page - 1) * pageSize
  items = items.slice(start, start + pageSize).map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    start_date: c.start_date,
    end_date: c.end_date || null,
    target_type: c.target_type,
    target_schools_count: c.target_schools_count ?? (Array.isArray(c.target_school_ids) ? c.target_school_ids.length : null),
    updated_at: c.updated_at,
  }))

  return { items, total }
}

/**
 * GET /franchisor/campaigns/{campaign_id}
 * Retorno: id, title, description?, content, start_date, end_date?, status, target_type, target_school_ids?, target_schools?
 * target_schools: [{ school_id, school_name, status, city?, state? }] quando target_type = SCHOOL_LIST.
 * Backend valida franchisor_id e scope_school_ids para escolas alvo; 404 se não permitido.
 */
export async function getFranchisorCampaignById(campaignId) {
  await new Promise((r) => setTimeout(r, 350))
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === campaignId) || null
  if (!campaign) return null
  let target_schools = null
  if (campaign.target_type === TARGET_TYPE_SCHOOL_LIST && Array.isArray(campaign.target_school_ids) && campaign.target_school_ids.length > 0) {
    const scopeIds = MOCK_ME.scope_school_ids
    let list = MOCK_SCHOOLS
    if (scopeIds && scopeIds.length > 0) {
      const set = new Set(scopeIds)
      list = list.filter((s) => set.has(s.school_id))
    }
    target_schools = campaign.target_school_ids
      .map((sid) => {
        const s = list.find((x) => x.school_id === sid)
        return s ? { school_id: s.school_id, school_name: s.school_name, status: s.status, city: s.city ?? null, state: s.state ?? null } : null
      })
      .filter(Boolean)
  }
  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description ?? null,
    content: campaign.content ?? '',
    start_date: campaign.start_date,
    end_date: campaign.end_date ?? null,
    status: campaign.status,
    target_type: campaign.target_type,
    target_school_ids: campaign.target_school_ids ? [...campaign.target_school_ids] : null,
    target_schools: target_schools ?? undefined,
    updated_at: campaign.updated_at,
  }
}

/**
 * POST /franchisor/campaigns
 * payload: title, description?, content, start_date, end_date?, status, target_type (ALL|SCHOOL_LIST), target_school_ids?
 * Retorno: id, status, updated_at
 * Backend valida franchisor_id e target_school_ids no escopo.
 */
export async function createFranchisorCampaign(payload) {
  await new Promise((r) => setTimeout(r, 400))
  const id = 'camp' + (MOCK_CAMPAIGNS.length + 1)
  const now = new Date().toISOString()
  const target_school_ids = payload.target_type === TARGET_TYPE_SCHOOL_LIST && Array.isArray(payload.target_school_ids)
    ? payload.target_school_ids
    : null
  const campaign = {
    id,
    title: payload.title || '',
    description: payload.description || null,
    content: payload.content || '',
    start_date: payload.start_date,
    end_date: payload.end_date || null,
    status: payload.status || 'rascunho',
    target_type: payload.target_type || TARGET_TYPE_ALL,
    target_school_ids,
    target_schools_count: target_school_ids ? target_school_ids.length : null,
    updated_at: now,
  }
  MOCK_CAMPAIGNS.push(campaign)
  return { id: campaign.id, status: campaign.status, updated_at: campaign.updated_at }
}

/**
 * PATCH /franchisor/campaigns/{campaign_id}
 * payload: campos editáveis (title, description?, content, start_date, end_date?, status, target_type, target_school_ids?)
 * Retorno: id, status, updated_at
 * Backend valida franchisor_id e target_school_ids.
 */
export async function updateFranchisorCampaign(campaignId, payload) {
  await new Promise((r) => setTimeout(r, 400))
  const idx = MOCK_CAMPAIGNS.findIndex((c) => c.id === campaignId)
  if (idx === -1) return null
  const now = new Date().toISOString()
  const current = MOCK_CAMPAIGNS[idx]
  const hasTargetType = payload.hasOwnProperty('target_type')
  const target_school_ids = hasTargetType
    ? (payload.target_type === TARGET_TYPE_SCHOOL_LIST && Array.isArray(payload.target_school_ids)
        ? payload.target_school_ids
        : null)
    : current.target_school_ids
  const updated = {
    ...current,
    ...payload,
    target_school_ids,
    target_schools_count: target_school_ids ? target_school_ids.length : (current.target_schools_count ?? null),
    updated_at: now,
  }
  MOCK_CAMPAIGNS[idx] = updated
  return { id: updated.id, status: updated.status, updated_at: updated.updated_at }
}

// --- Resultados da Campanha (Fase 2) ---
// GET /franchisor/campaigns/{campaign_id}/results/summary
// GET /franchisor/campaigns/{campaign_id}/results/by-school?search=&execution_status=&confirmation_status=&page=&page_size=&sort=
// Backend: policy franchisor_id + escopo por escola; auditoria Franchisor_ViewCampaignResults.

const CONFIRMATION_CONFIRMED = 'CONFIRMED'
const CONFIRMATION_NOT_CONFIRMED = 'NOT_CONFIRMED'
const EXECUTION_NOT_STARTED = 'NOT_STARTED'
const EXECUTION_IN_PROGRESS = 'IN_PROGRESS'
const EXECUTION_DONE = 'DONE'

// Mock: resultado por campanha -> por escola (school_id -> { confirmation_status?, execution_status?, updated_at? })
const MOCK_CAMPAIGN_RESULTS_BY_SCHOOL = {
  camp1: {
    e1: { confirmation_status: CONFIRMATION_CONFIRMED, execution_status: EXECUTION_DONE, updated_at: '2024-02-20T14:30:00Z' },
    e2: { confirmation_status: CONFIRMATION_NOT_CONFIRMED, execution_status: EXECUTION_IN_PROGRESS, updated_at: '2024-02-19T10:00:00Z' },
    e3: { confirmation_status: null, execution_status: EXECUTION_NOT_STARTED, updated_at: '2024-02-18T09:00:00Z' },
    e4: { confirmation_status: CONFIRMATION_CONFIRMED, execution_status: EXECUTION_DONE, updated_at: '2024-02-20T12:00:00Z' },
  },
  camp2: {
    e1: { confirmation_status: CONFIRMATION_CONFIRMED, execution_status: EXECUTION_DONE, updated_at: '2024-02-18T16:00:00Z' },
    e2: { confirmation_status: CONFIRMATION_NOT_CONFIRMED, execution_status: EXECUTION_NOT_STARTED, updated_at: null },
    e3: { confirmation_status: CONFIRMATION_CONFIRMED, execution_status: EXECUTION_IN_PROGRESS, updated_at: '2024-02-17T11:00:00Z' },
  },
  camp3: {},
  camp4: { e1: { confirmation_status: null, execution_status: EXECUTION_NOT_STARTED, updated_at: null }, e4: { confirmation_status: null, execution_status: EXECUTION_NOT_STARTED, updated_at: null } },
}

/**
 * GET /franchisor/campaigns/{campaign_id}/results/summary
 * Retorno: target_schools_count, confirmed_schools_count?, adoption_rate?, updated_at
 * Backend valida franchisor_id e escopo.
 */
export async function getFranchisorCampaignResultsSummary(campaignId) {
  await new Promise((r) => setTimeout(r, 350))
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === campaignId) || null
  if (!campaign) return null

  let targetSchoolIds = []
  if (campaign.target_type === TARGET_TYPE_ALL) {
    const scopeIds = MOCK_ME.scope_school_ids
    targetSchoolIds = (scopeIds && scopeIds.length > 0)
      ? scopeIds
      : MOCK_SCHOOLS.map((s) => s.school_id)
  } else if (Array.isArray(campaign.target_school_ids)) {
    const scopeIds = MOCK_ME.scope_school_ids
    const list = scopeIds && scopeIds.length > 0
      ? campaign.target_school_ids.filter((id) => scopeIds.includes(id))
      : campaign.target_school_ids
    targetSchoolIds = list
  }

  const bySchool = MOCK_CAMPAIGN_RESULTS_BY_SCHOOL[campaignId] || {}
  let confirmedCount = 0
  let lastUpdated = null
  for (const sid of targetSchoolIds) {
    const r = bySchool[sid]
    if (r && r.confirmation_status === CONFIRMATION_CONFIRMED) confirmedCount++
    if (r && r.updated_at) {
      const t = new Date(r.updated_at).getTime()
      if (!lastUpdated || t > lastUpdated) lastUpdated = r.updated_at
    }
  }
  const total = targetSchoolIds.length
  const adoptionRate = total > 0 ? Math.round((confirmedCount / total) * 100) : null

  return {
    target_schools_count: total,
    confirmed_schools_count: confirmedCount,
    adoption_rate: adoptionRate,
    updated_at: lastUpdated || campaign.updated_at,
  }
}

/**
 * GET /franchisor/campaigns/{campaign_id}/results/by-school
 * params: search, execution_status?, confirmation_status?, page, page_size, sort (name_asc | name_desc | worst_first | best_first)
 * Retorno: { items: [{ school_id, school_name, school_status, confirmation_status?, execution_status?, updated_at? }], total }
 */
export async function getFranchisorCampaignResultsBySchool(campaignId, params = {}) {
  await new Promise((r) => setTimeout(r, 400))
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === campaignId) || null
  if (!campaign) return { items: [], total: 0 }

  let targetSchoolIds = []
  if (campaign.target_type === TARGET_TYPE_ALL) {
    const scopeIds = MOCK_ME.scope_school_ids
    targetSchoolIds = (scopeIds && scopeIds.length > 0)
      ? scopeIds
      : MOCK_SCHOOLS.map((s) => s.school_id)
  } else if (Array.isArray(campaign.target_school_ids)) {
    const scopeIds = MOCK_ME.scope_school_ids
    targetSchoolIds = (scopeIds && scopeIds.length > 0)
      ? campaign.target_school_ids.filter((id) => scopeIds.includes(id))
      : [...campaign.target_school_ids]
  }

  const bySchool = MOCK_CAMPAIGN_RESULTS_BY_SCHOOL[campaignId] || {}
  let items = targetSchoolIds.map((sid) => {
    const s = MOCK_SCHOOLS.find((x) => x.school_id === sid)
    if (!s) return null
    const r = bySchool[sid] || {}
    const schoolStatus = (s.status || 'ativo').toLowerCase()
    const statusLabel = schoolStatus === 'ativo' ? 'Ativa' : schoolStatus === 'suspenso' ? 'Suspensa' : 'Pendente'
    return {
      school_id: s.school_id,
      school_name: s.school_name,
      school_status: statusLabel,
      school_status_raw: s.status,
      confirmation_status: r.confirmation_status ?? null,
      execution_status: r.execution_status ?? null,
      updated_at: r.updated_at ?? null,
    }
  }).filter(Boolean)

  const search = (params.search || '').toLowerCase().trim()
  if (search) {
    items = items.filter(
      (i) =>
        (i.school_name && i.school_name.toLowerCase().includes(search))
    )
  }
  const execFilter = (params.execution_status || '').toUpperCase().replace(/\s+/g, '')
  if (execFilter && execFilter !== 'TODOS') {
    const map = { NOT_STARTED: 'NOT_STARTED', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE', EMANDAMENTO: 'IN_PROGRESS', CONCLUIDO: 'DONE', NAOINICIADO: 'NOT_STARTED' }
    const value = map[execFilter] || execFilter
    items = items.filter((i) => (i.execution_status || '') === value)
  }
  const confFilter = (params.confirmation_status || '').toUpperCase().replace(/\s+/g, '')
  if (confFilter && confFilter !== 'TODOS') {
    const map = { CONFIRMED: 'CONFIRMED', NOT_CONFIRMED: 'NOT_CONFIRMED', CONFIRMOU: 'CONFIRMED', NAOCONFIRMOU: 'NOT_CONFIRMED' }
    const value = map[confFilter] || confFilter
    items = items.filter((i) => (i.confirmation_status || '') === value)
  }

  const sort = (params.sort || 'name_asc').toLowerCase()
  if (sort === 'name_desc') {
    items.sort((a, b) => (b.school_name || '').localeCompare(a.school_name || ''))
  } else if (sort === 'worst_first') {
    items.sort((a, b) => {
      const score = (x) => (x.confirmation_status === CONFIRMATION_CONFIRMED ? 1 : 0) + (x.execution_status === EXECUTION_DONE ? 1 : 0)
      return score(a) - score(b)
    })
  } else if (sort === 'best_first') {
    items.sort((a, b) => {
      const score = (x) => (x.confirmation_status === CONFIRMATION_CONFIRMED ? 1 : 0) + (x.execution_status === EXECUTION_DONE ? 1 : 0)
      return score(b) - score(a)
    })
  } else {
    items.sort((a, b) => (a.school_name || '').localeCompare(b.school_name || ''))
  }

  const total = items.length
  const page = Math.max(1, parseInt(params.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(10, parseInt(params.page_size, 10) || 10))
  const start = (page - 1) * pageSize
  items = items.slice(start, start + pageSize)

  return { items, total }
}

// --- Permissões / Matriz de roles (Fase 2) ---
const FRANCHISOR_OWNER_PERMISSIONS = [
  'SCHOOLS_VIEW', 'SCHOOLS_VIEW_DETAIL', 'SCHOOLS_EDIT',
  'STANDARDS_METHODOLOGY_VIEW', 'STANDARDS_METHODOLOGY_EDIT',
  'STANDARDS_PRICING_VIEW', 'STANDARDS_PRICING_EDIT', 'STANDARDS_LIBRARY_VIEW',
  'CAMPAIGNS_VIEW', 'CAMPAIGNS_EDIT', 'CAMPAIGNS_VIEW_RESULTS',
  'USERS_VIEW', 'USERS_EDIT', 'USERS_REMOVE',
  'REPORTS_VIEW', 'FINANCE_VIEW',
  'SETTINGS_VIEW', 'SETTINGS_EDIT', 'PERMISSIONS_VIEW', 'PERMISSIONS_EDIT',
]
const FRANCHISOR_STAFF_DEFAULT_PERMISSIONS = [
  'SCHOOLS_VIEW', 'SCHOOLS_VIEW_DETAIL',
  'STANDARDS_METHODOLOGY_VIEW', 'STANDARDS_PRICING_VIEW', 'STANDARDS_LIBRARY_VIEW',
  'CAMPAIGNS_VIEW', 'CAMPAIGNS_VIEW_RESULTS',
  'USERS_VIEW',
  'REPORTS_VIEW', 'FINANCE_VIEW',
  'SETTINGS_VIEW', 'PERMISSIONS_VIEW',
]
const STAFF_CUSTOMIZABLE_WHITELIST = [
  'SCHOOLS_EDIT',
  'STANDARDS_METHODOLOGY_EDIT', 'STANDARDS_PRICING_EDIT',
  'CAMPAIGNS_EDIT',
]

let MOCK_STAFF_CUSTOM_PERMISSIONS = null

export async function getFranchisorPermissionsMatrix() {
  await new Promise((r) => setTimeout(r, 350))
  const staffPerms = MOCK_STAFF_CUSTOM_PERMISSIONS !== null
    ? MOCK_STAFF_CUSTOM_PERMISSIONS
    : FRANCHISOR_STAFF_DEFAULT_PERMISSIONS
  return {
    roles: [
      { role: 'FranchisorOwner', permissions: [...FRANCHISOR_OWNER_PERMISSIONS] },
      { role: 'FranchisorStaff', permissions: [...staffPerms] },
    ],
    modules_structure: [
      { module: 'Escolas', items: [
        { key: 'SCHOOLS_VIEW', label: 'Listar escolas' },
        { key: 'SCHOOLS_VIEW_DETAIL', label: 'Ver detalhe da escola' },
        { key: 'SCHOOLS_EDIT', label: 'Criar/editar escola' },
      ]},
      { module: 'Padrões', items: [
        { key: 'STANDARDS_METHODOLOGY_VIEW', label: 'Metodologia (visualizar)' },
        { key: 'STANDARDS_METHODOLOGY_EDIT', label: 'Metodologia (criar/editar)' },
        { key: 'STANDARDS_PRICING_VIEW', label: 'Preços sugeridos (visualizar)' },
        { key: 'STANDARDS_PRICING_EDIT', label: 'Preços sugeridos (criar/editar)' },
        { key: 'STANDARDS_LIBRARY_VIEW', label: 'Biblioteca de padrões' },
      ]},
      { module: 'Campanhas', items: [
        { key: 'CAMPAIGNS_VIEW', label: 'Listar campanhas' },
        { key: 'CAMPAIGNS_EDIT', label: 'Criar/editar campanhas' },
        { key: 'CAMPAIGNS_VIEW_RESULTS', label: 'Ver resultados' },
      ]},
      { module: 'Usuários', items: [
        { key: 'USERS_VIEW', label: 'Listar usuários' },
        { key: 'USERS_EDIT', label: 'Criar/editar usuários' },
        { key: 'USERS_REMOVE', label: 'Remover acesso' },
      ]},
      { module: 'Relatórios e Financeiro', items: [
        { key: 'REPORTS_VIEW', label: 'Ver relatórios consolidados' },
        { key: 'FINANCE_VIEW', label: 'Ver financeiro' },
      ]},
      { module: 'Configurações', items: [
        { key: 'SETTINGS_VIEW', label: 'Ver configurações' },
        { key: 'SETTINGS_EDIT', label: 'Alterar configurações' },
        { key: 'PERMISSIONS_VIEW', label: 'Ver matriz de permissões' },
        { key: 'PERMISSIONS_EDIT', label: 'Personalizar permissões do Staff' },
      ]},
    ],
    staff_customized: MOCK_STAFF_CUSTOM_PERMISSIONS !== null,
    staff_customizable_whitelist: STAFF_CUSTOMIZABLE_WHITELIST,
  }
}

export async function patchFranchisorStaffPermissions(payload) {
  await new Promise((r) => setTimeout(r, 400))
  const list = Array.isArray(payload.permissions) ? payload.permissions : []
  const allowed = new Set(STAFF_CUSTOMIZABLE_WHITELIST)
  const filtered = list.filter((p) => allowed.has(p))
  MOCK_STAFF_CUSTOM_PERMISSIONS = filtered.length > 0 ? filtered : null
  return { ok: true, staff_customized: MOCK_STAFF_CUSTOM_PERMISSIONS !== null }
}

export async function resetFranchisorStaffPermissions() {
  await new Promise((r) => setTimeout(r, 300))
  MOCK_STAFF_CUSTOM_PERMISSIONS = null
  return { ok: true }
}

// --- Dados do Franqueador (perfil / marca) — GET /franchisor/settings/profile | PATCH ---
// Backend: policy franchisor_id do usuário; somente Owner pode PATCH (recomendado).
// Campos editáveis em whitelist; upload de logo opcional (POST /franchisor/settings/profile/logo).

let MOCK_FRANCHISOR_PROFILE = {
  franchisor_id: MOCK_ME.franchisor_id,
  name: 'Rede Arena',
  legal_name: 'Rede Arena Esportes Ltda.',
  document_id: '12.345.678/0001-90',
  website: 'https://redearena.com.br',
  contact_email: 'contato@redearena.com.br',
  contact_phone: '(11) 3456-7890',
  address: {
    street: 'Av. Paulista',
    number: '1000',
    complement: 'Sala 101',
    city: 'São Paulo',
    state: 'SP',
    zip: '01310-100',
  },
  brand: {
    display_name: 'Arena',
    logo_url: 'https://placehold.co/120x60?text=Arena',
    primary_color: null,
    secondary_color: null,
  },
  message_to_schools: 'Bem-vindas ao portal. Em caso de dúvidas, utilize o canal de suporte.',
  updated_at: '2024-02-20T14:30:00Z',
}

/**
 * GET /franchisor/settings/profile
 * Retorno: franchisor_id, name, legal_name?, document_id?, website?, contact_email?, contact_phone?,
 * address? { street, number, complement, city, state, zip }, brand? { display_name?, logo_url?, primary_color?, secondary_color? },
 * message_to_schools?, updated_at
 */
export async function getFranchisorSettingsProfile() {
  await new Promise((r) => setTimeout(r, 350))
  const p = MOCK_FRANCHISOR_PROFILE
  return {
    franchisor_id: p.franchisor_id,
    name: p.name || '',
    legal_name: p.legal_name ?? null,
    document_id: p.document_id ?? null,
    website: p.website ?? null,
    contact_email: p.contact_email ?? null,
    contact_phone: p.contact_phone ?? null,
    address: p.address ? { ...p.address } : null,
    brand: p.brand ? { ...p.brand } : null,
    message_to_schools: p.message_to_schools ?? null,
    updated_at: p.updated_at,
  }
}

const FRANCHISOR_PROFILE_WHITELIST = [
  'name', 'legal_name', 'document_id', 'website', 'contact_email', 'contact_phone',
  'address', 'brand', 'message_to_schools',
]

/**
 * PATCH /franchisor/settings/profile
 * payload: apenas campos permitidos (whitelist). address e brand são objetos.
 * Backend valida franchisor_id; somente Owner pode alterar (recomendado).
 */
export async function patchFranchisorSettingsProfile(payload) {
  await new Promise((r) => setTimeout(r, 400))
  const p = MOCK_FRANCHISOR_PROFILE
  FRANCHISOR_PROFILE_WHITELIST.forEach((key) => {
    if (payload[key] === undefined) return
    if (key === 'address' && payload.address != null) {
      p.address = { ...(p.address || {}), ...payload.address }
      return
    }
    if (key === 'brand' && payload.brand != null) {
      p.brand = { ...(p.brand || {}), ...payload.brand }
      return
    }
    if (key !== 'address' && key !== 'brand') p[key] = payload[key]
  })
  p.updated_at = new Date().toISOString()
  return {
    franchisor_id: p.franchisor_id,
    updated_at: p.updated_at,
  }
}
