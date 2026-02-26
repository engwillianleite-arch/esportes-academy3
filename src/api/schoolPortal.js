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
