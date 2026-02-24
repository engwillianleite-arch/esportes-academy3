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

// Mock: escolas do franqueador 1 (mesmo estrutura do admin, adaptado ao contrato)
const MOCK_SCHOOLS = [
  { school_id: 'e1', school_name: 'Arena São Paulo', status: 'ativo', city: 'São Paulo', state: 'SP' },
  { school_id: 'e2', school_name: 'Arena Campinas', status: 'suspenso', city: 'Campinas', state: 'SP' },
  { school_id: 'e3', school_name: 'Arena Santos', status: 'pendente', city: 'Santos', state: 'SP' },
  { school_id: 'e4', school_name: 'Arena Ribeirão', status: 'ativo', city: 'Ribeirão Preto', state: 'SP' },
]

// Mock: totais consolidados (todas as escolas)
const MOCK_SUMMARY_ALL = {
  schools_active_count: 2,
  students_count: 265,
  received_total: 89450.0,
  overdue_total: 3200.0,
}

// Mock: por escola (exemplo e1)
const MOCK_SUMMARY_BY_SCHOOL = {
  e1: { schools_active_count: 1, students_count: 120, received_total: 45000.0, overdue_total: 800.0 },
  e2: { schools_active_count: 1, students_count: 85, received_total: 0, overdue_total: 1200.0 },
  e3: { schools_active_count: 0, students_count: 0, received_total: null, overdue_total: null },
  e4: { schools_active_count: 1, students_count: 45, received_total: 44450.0, overdue_total: 0 },
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

/**
 * Formata valor monetário para exibição.
 */
export function formatCurrency(value) {
  if (value == null || value === '') return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value)
}
