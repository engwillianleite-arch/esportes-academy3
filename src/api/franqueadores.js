/**
 * Contrato esperado do backend (frontend apenas consome):
 * - List: id, name, owner_name, email, schools_count, status, created_at
 * - Params: search, status, created_from, created_to, page, page_size
 * - Backend autoriza por policy Admin (RBAC); auditoria Admin_ListFranchisors.
 */

// Mock mutável para criar/editar (em produção o backend persiste)
let MOCK_FRANQUEADORES = [
  { id: '1', name: 'Rede Arena', owner_name: 'Carlos Silva', email: 'contato@redearena.com.br', phone: '(11) 98765-4321', document: '12.345.678/0001-90', schools_count: 24, status: 'ativo', created_at: '2024-01-15T10:00:00Z', notes_internal: null },
  { id: '2', name: 'Brasil Sports', owner_name: 'Ana Costa', email: 'admin@brasilsports.com.br', phone: '(41) 3333-4444', document: '98.765.432/0001-10', schools_count: 18, status: 'ativo', created_at: '2024-03-22T14:30:00Z', notes_internal: null },
  { id: '3', name: 'Academia Champions', owner_name: 'Roberto Lima', email: 'roberto@champions.com.br', phone: null, document: null, schools_count: 8, status: 'pendente', created_at: '2025-01-10T09:00:00Z', notes_internal: 'Aguardando documentação.' },
  { id: '4', name: 'Escola do Atleta', owner_name: 'Maria Santos', email: 'maria@escoladoatleta.com.br', phone: '(21) 99999-0000', document: '11.222.333/0001-44', schools_count: 12, status: 'ativo', created_at: '2024-06-05T11:20:00Z', notes_internal: null },
  { id: '5', name: 'Centro Esportivo Alpha', owner_name: 'Paulo Oliveira', email: 'contato@alphaesportes.com.br', phone: null, document: null, schools_count: 0, status: 'suspenso', created_at: '2024-09-12T08:00:00Z', notes_internal: null },
  { id: '6', name: 'Rede Futuro', owner_name: 'Fernanda Souza', email: 'fernanda@redfuturo.com.br', phone: '(51) 3333-5555', document: null, schools_count: 5, status: 'pendente', created_at: '2025-02-01T16:45:00Z', notes_internal: null },
]

/** Mock: escolas por franqueador (franchisor_id). Backend: GET schools by franchisor_id com policy Admin. */
const MOCK_ESCOLAS_POR_FRANQUEADOR = {
  '1': [
    { id: 'e1', name: 'Arena São Paulo', responsible_name: 'João Silva', email: 'contato@arenasp.com.br', phone: '(11) 3333-1111', city: 'São Paulo', state: 'SP', address: 'Rua das Arenas, 100', status: 'ativo', created_at: '2024-02-01T09:00:00Z', notes_internal: null, students_count: 120 },
    { id: 'e2', name: 'Arena Campinas', responsible_name: 'Maria Costa', email: null, phone: null, city: 'Campinas', state: 'SP', address: null, status: 'suspenso', created_at: '2024-03-15T10:00:00Z', notes_internal: null, students_count: 85 },
    { id: 'e3', name: 'Arena Santos', responsible_name: null, email: null, phone: null, city: 'Santos', state: 'SP', address: null, status: 'pendente', created_at: '2024-05-20T14:00:00Z', notes_internal: null, students_count: null },
    { id: 'e4', name: 'Arena Ribeirão', responsible_name: null, email: null, phone: null, city: 'Ribeirão Preto', state: 'SP', address: null, status: 'ativo', created_at: '2024-06-10T08:00:00Z', notes_internal: null, students_count: 45 },
  ],
  '2': [
    { id: 'e5', name: 'Brasil Sports Curitiba', responsible_name: 'Ana Lima', email: 'curitiba@brasilsports.com.br', phone: '(41) 3333-4444', city: 'Curitiba', state: 'PR', address: null, status: 'ativo', created_at: '2024-04-01T11:00:00Z', notes_internal: null, students_count: 90 },
    { id: 'e6', name: 'Brasil Sports Londrina', responsible_name: null, email: null, phone: null, city: 'Londrina', state: 'PR', address: null, status: 'ativo', created_at: '2024-07-01T09:00:00Z', notes_internal: null, students_count: 60 },
  ],
  '3': [
    { id: 'e7', name: 'Champions Belo Horizonte', responsible_name: null, email: null, phone: null, city: 'Belo Horizonte', state: 'MG', address: null, status: 'pendente', created_at: '2025-01-15T10:00:00Z', notes_internal: null, students_count: null },
  ],
  '4': [],
  '5': [],
  '6': [
    { id: 'e8', name: 'Futuro Porto Alegre', responsible_name: null, email: null, phone: null, city: 'Porto Alegre', state: 'RS', address: null, status: 'ativo', created_at: '2025-02-05T08:00:00Z', notes_internal: null, students_count: 30 },
  ],
}

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function formatCreatedAt(iso) {
  const d = parseDate(iso)
  return d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}

/**
 * Simula listagem com filtros e paginação (mock; backend fará o mesmo com policy Admin).
 */
export async function listFranqueadores(params = {}) {
  const {
    search = '',
    status = '',
    created_from = '',
    created_to = '',
    page = 1,
    page_size = 10,
  } = params

  // Simula latência de rede
  await new Promise((r) => setTimeout(r, 600))

  let list = [...MOCK_FRANQUEADORES]

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (f) =>
        (f.name && f.name.toLowerCase().includes(searchLower)) ||
        (f.owner_name && f.owner_name.toLowerCase().includes(searchLower)) ||
        (f.email && f.email.toLowerCase().includes(searchLower)) ||
        (f.id && String(f.id).includes(searchLower))
    )
  }

  if (status && status !== 'todos') {
    list = list.filter((f) => (f.status || '').toLowerCase() === status.toLowerCase())
  }

  const fromDate = created_from ? parseDate(created_from) : null
  const toDate = created_to ? parseDate(created_to) : null
  if (fromDate || toDate) {
    list = list.filter((f) => {
      const created = parseDate(f.created_at)
      if (!created) return false
      if (fromDate && created < fromDate) return false
      if (toDate && created > toDate) return false
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
 * GET franchisor by id. Contrato: id, name, owner_name, email, phone?, document?, status, created_at.
 * Backend valida policy Admin; 403 se sem permissão.
 */
export async function getFranqueadorById(id) {
  await new Promise((r) => setTimeout(r, 500))
  const f = MOCK_FRANQUEADORES.find((x) => String(x.id) === String(id))
  if (!f) {
    const err = new Error('Franqueador não encontrado')
    err.status = 404
    throw err
  }
  const escolas = MOCK_ESCOLAS_POR_FRANQUEADOR[String(id)] || []
  const active = escolas.filter((s) => (s.status || '').toLowerCase() === 'ativo').length
  const pending = escolas.filter((s) => (s.status || '').toLowerCase() === 'pendente').length
  return {
    id: f.id,
    name: f.name,
    owner_name: f.owner_name,
    email: f.email,
    phone: f.phone ?? null,
    document: f.document ?? null,
    status: f.status,
    notes_internal: f.notes_internal ?? null,
    created_at: f.created_at,
    schools_count: escolas.length,
    schools_active_count: active,
    schools_pending_count: pending,
  }
}

/**
 * GET schools by franchisor_id. Params: search, status, page, page_size.
 * Retorno: id, name, city?, state?, status, created_at, students_count? (opcional).
 */
export async function listEscolasByFranqueador(franchisorId, params = {}) {
  const { search = '', status: statusFilter = '', page = 1, page_size = 10 } = params
  await new Promise((r) => setTimeout(r, 400))
  let list = [...(MOCK_ESCOLAS_POR_FRANQUEADOR[String(franchisorId)] || [])]
  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(searchLower)) ||
        (s.city && s.city.toLowerCase().includes(searchLower))
    )
  }
  if (statusFilter && statusFilter !== 'todos') {
    list = list.filter((s) => (s.status || '').toLowerCase() === statusFilter.toLowerCase())
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
 * GET /schools — lista todas as escolas (Admin). Params: search, status, franchisor_id?, page, page_size.
 * Retorno: data[] com id, name, city?, state?, status, created_at, franchisor_id, franchisor_name, students_count?.
 */
export async function listEscolas(params = {}) {
  const {
    search = '',
    status: statusFilter = '',
    franchisor_id: franchisorIdFilter = '',
    page = 1,
    page_size = 10,
  } = params

  await new Promise((r) => setTimeout(r, 500))

  const list = []
  for (const [fid, escolas] of Object.entries(MOCK_ESCOLAS_POR_FRANQUEADOR)) {
    const f = MOCK_FRANQUEADORES.find((x) => String(x.id) === fid)
    const franchisorName = f ? f.name : ''
    for (const s of escolas) {
      list.push({
        ...s,
        franchisor_id: fid,
        franchisor_name: franchisorName,
      })
    }
  }

  let filtered = list

  if (franchisorIdFilter) {
    filtered = filtered.filter((s) => String(s.franchisor_id) === String(franchisorIdFilter))
  }

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    filtered = filtered.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(searchLower)) ||
        (s.city && s.city.toLowerCase().includes(searchLower)) ||
        (s.franchisor_name && s.franchisor_name.toLowerCase().includes(searchLower))
    )
  }

  if (statusFilter && statusFilter !== 'todos') {
    filtered = filtered.filter((s) => (s.status || '').toLowerCase() === statusFilter.toLowerCase())
  }

  const total = filtered.length
  const start = (Number(page) - 1) * Number(page_size)
  const pageList = filtered.slice(start, start + Number(page_size))

  return {
    data: pageList,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

/**
 * GET /schools/{school_id} — detalhe da escola. Contrato: id, name, status, franchisor_id, franchisor_name,
 * responsible_name?, email?, phone?, city?, state?, address?, notes_internal?, created_at. Policy: Admin-only.
 */
export async function getSchoolById(schoolId) {
  await new Promise((r) => setTimeout(r, 400))
  for (const [fid, escolas] of Object.entries(MOCK_ESCOLAS_POR_FRANQUEADOR)) {
    const esc = escolas.find((s) => String(s.id) === String(schoolId))
    if (!esc) continue
    const f = MOCK_FRANQUEADORES.find((x) => String(x.id) === fid)
    return {
      id: esc.id,
      name: esc.name || '',
      status: esc.status || '',
      franchisor_id: fid,
      franchisor_name: f ? f.name : '',
      responsible_name: esc.responsible_name ?? null,
      email: esc.email ?? null,
      phone: esc.phone ?? null,
      city: esc.city ?? null,
      state: esc.state ?? null,
      address: esc.address ?? null,
      notes_internal: esc.notes_internal ?? null,
      created_at: esc.created_at || null,
      org_id: esc.org_id ?? null,
    }
  }
  const err = new Error('Escola não encontrada')
  err.status = 404
  throw err
}

/**
 * GET /schools/{school_id}/summary — resumo operacional (opcional no MVP).
 * Retorno: students_count, teams_count?, open_invoices_count?
 */
export async function getSchoolSummary(schoolId) {
  await new Promise((r) => setTimeout(r, 300))
  for (const escolas of Object.values(MOCK_ESCOLAS_POR_FRANQUEADOR)) {
    const esc = escolas.find((s) => String(s.id) === String(schoolId))
    if (!esc) continue
    return {
      students_count: esc.students_count ?? null,
      teams_count: esc.teams_count ?? null,
      open_invoices_count: esc.open_invoices_count ?? null,
    }
  }
  return { students_count: null, teams_count: null, open_invoices_count: null }
}

/** Formato data/hora para detalhe (ex.: 15/01/2024 10:00) */
export function formatCreatedAtDateTime(iso) {
  const d = parseDate(iso)
  return d ? d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

// ——— Escolas: criar e editar (Admin) ———
// Contrato: GET /franchisors (id, name, status) para select; POST /schools; GET /schools/{id}; PATCH /schools/{id}

/**
 * Lista franqueadores para select (Ativo e Pendente). Retorno: id, name, status.
 */
export async function listFranchisorsForSelect() {
  await new Promise((r) => setTimeout(r, 200))
  const list = MOCK_FRANQUEADORES.filter(
    (f) => (f.status || '').toLowerCase() === 'ativo' || (f.status || '').toLowerCase() === 'pendente'
  )
  return list.map((f) => ({ id: f.id, name: f.name, status: f.status }))
}

function nextSchoolId() {
  let max = 0
  for (const escolas of Object.values(MOCK_ESCOLAS_POR_FRANQUEADOR)) {
    for (const s of escolas) {
      const n = parseInt(String(s.id).replace(/^e/i, ''), 10)
      if (!isNaN(n) && n > max) max = n
    }
  }
  return `e${max + 1}`
}

/**
 * POST /schools — criar escola. Payload: name, franchisor_id, status, responsible_name?, email?, phone?, city?, state?, address?, notes_internal?
 * Backend policy Admin; valida franchisor_id. Retorno: school com id e campos principais.
 */
export async function createSchool(payload) {
  await new Promise((r) => setTimeout(r, 600))
  const fid = String(payload.franchisor_id || '')
  const f = MOCK_FRANQUEADORES.find((x) => String(x.id) === fid)
  if (!f) {
    const err = new Error('Franqueador não encontrado')
    err.status = 400
    throw err
  }
  const id = nextSchoolId()
  const created_at = new Date().toISOString()
  const status = (payload.status || 'pendente').toLowerCase()
  const school = {
    id,
    name: payload.name || '',
    franchisor_id: fid,
    status: status === 'ativa' ? 'ativo' : status,
    responsible_name: payload.responsible_name || null,
    email: payload.email || null,
    phone: payload.phone || null,
    city: payload.city || null,
    state: payload.state || null,
    address: payload.address || null,
    notes_internal: payload.notes_internal || null,
    created_at,
    students_count: null,
  }
  if (!MOCK_ESCOLAS_POR_FRANQUEADOR[fid]) MOCK_ESCOLAS_POR_FRANQUEADOR[fid] = []
  MOCK_ESCOLAS_POR_FRANQUEADOR[fid].push(school)
  return {
    id: school.id,
    name: school.name,
    franchisor_id: school.franchisor_id,
    franchisor_name: f.name,
    status: school.status,
    responsible_name: school.responsible_name,
    email: school.email,
    phone: school.phone,
    city: school.city,
    state: school.state,
    address: school.address,
    notes_internal: school.notes_internal,
    created_at: school.created_at,
  }
}

/**
 * PATCH /schools/{school_id} — atualizar escola. Payload: campos editáveis. Backend policy Admin.
 */
export async function updateSchool(schoolId, payload) {
  await new Promise((r) => setTimeout(r, 500))
  for (const [fid, escolas] of Object.entries(MOCK_ESCOLAS_POR_FRANQUEADOR)) {
    const idx = escolas.findIndex((s) => String(s.id) === String(schoolId))
    if (idx === -1) continue
    const current = escolas[idx]
    const statusVal = payload.status !== undefined ? (String(payload.status).toLowerCase() === 'ativa' ? 'ativo' : payload.status.toLowerCase()) : current.status
    const updated = {
      ...current,
      name: payload.name !== undefined ? payload.name : current.name,
      status: statusVal,
      responsible_name: payload.responsible_name !== undefined ? payload.responsible_name : current.responsible_name,
      email: payload.email !== undefined ? payload.email : current.email,
      phone: payload.phone !== undefined ? payload.phone : current.phone,
      city: payload.city !== undefined ? payload.city : current.city,
      state: payload.state !== undefined ? payload.state : current.state,
      address: payload.address !== undefined ? payload.address : current.address,
      notes_internal: payload.notes_internal !== undefined ? payload.notes_internal : current.notes_internal,
    }
    MOCK_ESCOLAS_POR_FRANQUEADOR[fid][idx] = updated
    const f = MOCK_FRANQUEADORES.find((x) => String(x.id) === fid)
    return {
      id: updated.id,
      name: updated.name,
      franchisor_id: fid,
      franchisor_name: f ? f.name : '',
      status: updated.status,
      responsible_name: updated.responsible_name,
      email: updated.email,
      phone: updated.phone,
      city: updated.city,
      state: updated.state,
      address: updated.address,
      notes_internal: updated.notes_internal,
      created_at: updated.created_at,
    }
  }
  const err = new Error('Escola não encontrada')
  err.status = 404
  throw err
}

/**
 * POST /franchisors — criar franqueador.
 * Payload: name, owner_name, email, phone?, document?, status, notes_internal?
 * Backend retorna id + campos principais; policy Admin.
 */
export async function createFranqueador(payload) {
  await new Promise((r) => setTimeout(r, 600))
  const id = String(Math.max(...MOCK_FRANQUEADORES.map((f) => Number(f.id) || 0), 0) + 1)
  const created_at = new Date().toISOString()
  const newItem = {
    id,
    name: payload.name || '',
    owner_name: payload.owner_name || '',
    email: payload.email || '',
    phone: payload.phone || null,
    document: payload.document || null,
    status: payload.status || 'pendente',
    notes_internal: payload.notes_internal || null,
    created_at,
    schools_count: 0,
  }
  MOCK_FRANQUEADORES = [...MOCK_FRANQUEADORES, newItem]
  return { id, ...newItem }
}

/**
 * PATCH /franchisors/{id} — atualizar franqueador.
 * Payload: campos editáveis. Backend policy Admin.
 */
export async function updateFranqueador(id, payload) {
  await new Promise((r) => setTimeout(r, 500))
  const idx = MOCK_FRANQUEADORES.findIndex((x) => String(x.id) === String(id))
  if (idx === -1) {
    const err = new Error('Franqueador não encontrado')
    err.status = 404
    throw err
  }
  const current = MOCK_FRANQUEADORES[idx]
  const updated = {
    ...current,
    name: payload.name !== undefined ? payload.name : current.name,
    owner_name: payload.owner_name !== undefined ? payload.owner_name : current.owner_name,
    email: payload.email !== undefined ? payload.email : current.email,
    phone: payload.phone !== undefined ? payload.phone : current.phone,
    document: payload.document !== undefined ? payload.document : current.document,
    status: payload.status !== undefined ? payload.status : current.status,
    notes_internal: payload.notes_internal !== undefined ? payload.notes_internal : current.notes_internal,
  }
  MOCK_FRANQUEADORES = MOCK_FRANQUEADORES.slice(0, idx).concat(updated, MOCK_FRANQUEADORES.slice(idx + 1))
  return updated
}

export { formatCreatedAt }

// ——— Usuários do Franqueador (RBAC + scope) ———
// Contrato: GET /franchisors/{id}/users (search, role, status?, page, page_size)
// GET /franchisors/{id}/schools já existe (listEscolasByFranqueador)
// POST /franchisors/{id}/users — name, email, role, scope_type, scope_school_ids?
// PATCH /franchisors/{id}/users/{user_id} — role, scope_type, scope_school_ids?
// DELETE /franchisors/{id}/users/{user_id} — revogar membership

const ROLES_FRANQUEADOR = ['FranchisorOwner', 'FranchisorStaff']
const SCOPE_ALL = 'ALL_SCHOOLS'
const SCOPE_LIST = 'SCHOOL_LIST'

/** Mock: usuários por franqueador. user_id, name, email, role, scope_type, scope_school_ids?, status, last_login_at? */
const MOCK_USUARIOS_FRANQUEADOR = {
  '1': [
    { user_id: 'u1', name: 'Carlos Silva', email: 'carlos@redearena.com.br', role: 'FranchisorOwner', scope_type: SCOPE_ALL, scope_school_ids: null, scope_school_count: 4, status: 'ativo', last_login_at: '2025-02-20T14:00:00Z' },
    { user_id: 'u2', name: 'Maria Oliveira', email: 'maria@redearena.com.br', role: 'FranchisorStaff', scope_type: SCOPE_LIST, scope_school_ids: ['e1', 'e2'], scope_school_count: 2, status: 'ativo', last_login_at: '2025-02-18T09:00:00Z' },
    { user_id: 'u3', name: 'João Pendente', email: 'joao@redearena.com.br', role: 'FranchisorStaff', scope_type: SCOPE_ALL, scope_school_ids: null, scope_school_count: 4, status: 'convidado', last_login_at: null },
  ],
  '2': [
    { user_id: 'u4', name: 'Ana Costa', email: 'admin@brasilsports.com.br', role: 'FranchisorOwner', scope_type: SCOPE_ALL, scope_school_ids: null, scope_school_count: 2, status: 'ativo', last_login_at: '2025-02-22T10:00:00Z' },
  ],
  '3': [],
  '4': [],
  '5': [],
  '6': [],
}

function getUsersByFranchisor(franchisorId) {
  return [...(MOCK_USUARIOS_FRANQUEADOR[String(franchisorId)] || [])]
}

/**
 * GET /franchisors/{franchisor_id}/users
 * Params: search, role, status?, page, page_size
 * Retorno: data[], total, page, page_size, total_pages
 */
export async function listFranchisorUsers(franchisorId, params = {}) {
  const { search = '', role: roleFilter = '', status: statusFilter = '', page = 1, page_size = 10 } = params
  await new Promise((r) => setTimeout(r, 400))
  let list = getUsersByFranchisor(franchisorId)
  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
    )
  }
  if (roleFilter && roleFilter !== 'todos') {
    list = list.filter((u) => u.role === roleFilter)
  }
  if (statusFilter && statusFilter !== 'todos') {
    list = list.filter((u) => (u.status || 'ativo').toLowerCase() === statusFilter.toLowerCase())
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
 * GET /franchisors/{franchisor_id}/schools — para multi-select de escopo (já existe listEscolasByFranqueador)
 * Retorno mínimo: id, name, status. Usar listEscolasByFranqueador com page_size alto.
 */
export async function listFranchisorSchoolsForScope(franchisorId) {
  const res = await listEscolasByFranqueador(franchisorId, { page: 1, page_size: 500 })
  return res.data || []
}

/**
 * POST /franchisors/{franchisor_id}/users
 * Payload: name, email, role, scope_type, scope_school_ids?
 */
export async function createFranchisorUser(franchisorId, payload) {
  await new Promise((r) => setTimeout(r, 500))
  const list = getUsersByFranchisor(franchisorId)
  const maxId = list.reduce((acc, u) => Math.max(acc, parseInt(String(u.user_id).replace('u', ''), 10) || 0), 0)
  const user_id = `u${maxId + 1}`
  const scope_type = payload.scope_type === SCOPE_LIST ? SCOPE_LIST : SCOPE_ALL
  const scope_school_ids = scope_type === SCOPE_LIST ? (payload.scope_school_ids || []) : null
  const schools = MOCK_ESCOLAS_POR_FRANQUEADOR[String(franchisorId)] || []
  const scope_school_count = scope_type === SCOPE_ALL ? schools.length : (scope_school_ids?.length || 0)
  const newUser = {
    user_id,
    name: payload.name || '',
    email: payload.email || '',
    role: ROLES_FRANQUEADOR.includes(payload.role) ? payload.role : 'FranchisorStaff',
    scope_type,
    scope_school_ids,
    scope_school_count,
    status: 'convidado',
    last_login_at: null,
  }
  if (!MOCK_USUARIOS_FRANQUEADOR[String(franchisorId)]) MOCK_USUARIOS_FRANQUEADOR[String(franchisorId)] = []
  MOCK_USUARIOS_FRANQUEADOR[String(franchisorId)].push(newUser)
  return newUser
}

/**
 * GET /franchisors/{franchisor_id}/users/{user_id} — um usuário (para edição)
 */
export async function getFranchisorUser(franchisorId, userId) {
  await new Promise((r) => setTimeout(r, 300))
  const list = MOCK_USUARIOS_FRANQUEADOR[String(franchisorId)] || []
  const user = list.find((u) => String(u.user_id) === String(userId))
  if (!user) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  return { ...user }
}

/**
 * PATCH /franchisors/{franchisor_id}/users/{user_id}
 * Payload: role, scope_type, scope_school_ids?
 */
export async function updateFranchisorUser(franchisorId, userId, payload) {
  await new Promise((r) => setTimeout(r, 400))
  const list = MOCK_USUARIOS_FRANQUEADOR[String(franchisorId)] || []
  const idx = list.findIndex((u) => String(u.user_id) === String(userId))
  if (idx === -1) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  const current = list[idx]
  const scope_type = payload.scope_type === SCOPE_LIST ? SCOPE_LIST : SCOPE_ALL
  const scope_school_ids = scope_type === SCOPE_LIST ? (payload.scope_school_ids || []) : null
  const schools = MOCK_ESCOLAS_POR_FRANQUEADOR[String(franchisorId)] || []
  const scope_school_count = scope_type === SCOPE_ALL ? schools.length : (scope_school_ids?.length || 0)
  const updated = {
    ...current,
    role: ROLES_FRANQUEADOR.includes(payload.role) ? payload.role : current.role,
    scope_type,
    scope_school_ids,
    scope_school_count,
  }
  MOCK_USUARIOS_FRANQUEADOR[String(franchisorId)][idx] = updated
  return updated
}

/**
 * DELETE /franchisors/{franchisor_id}/users/{user_id} — revogar membership
 */
export async function deleteFranchisorUser(franchisorId, userId) {
  await new Promise((r) => setTimeout(r, 400))
  const list = MOCK_USUARIOS_FRANQUEADOR[String(franchisorId)] || []
  const idx = list.findIndex((u) => String(u.user_id) === String(userId))
  if (idx === -1) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  MOCK_USUARIOS_FRANQUEADOR[String(franchisorId)] = list.slice(0, idx).concat(list.slice(idx + 1))
  return { ok: true }
}

export function getRoleLabel(role) {
  return role === 'FranchisorOwner' ? 'FranchisorOwner' : role === 'FranchisorStaff' ? 'FranchisorStaff' : role || '—'
}

export function getScopeSummary(user, totalSchools) {
  if (!user) return '—'
  if (user.scope_type === 'ALL_SCHOOLS') return 'Todas as escolas do franqueador'
  const n = user.scope_school_count ?? user.scope_school_ids?.length ?? 0
  return n === 1 ? '1 escola' : `${n} escolas`
}

// ——— Status do Franqueador (Fase 2 — Aprovação/Suspensão/Reativação) ———
// Contrato: GET /franchisors/{id}/status, GET .../status/history, POST .../status/transition
// Policy Admin-only; backend valida state machine e auditoria.

export const FRANCHISOR_STATUS_ACTIONS = {
  APPROVE: 'APPROVE',
  SUSPEND: 'SUSPEND',
  REACTIVATE: 'REACTIVATE',
}

export const REASON_CATEGORIES = [
  { value: 'documentacao_pendente', label: 'Documentação pendente' },
  { value: 'violacao_politicas', label: 'Violação de políticas' },
  { value: 'solicitacao_franqueador', label: 'Solicitação do franqueador' },
  { value: 'inadimplencia', label: 'Inadimplência' },
  { value: 'outros', label: 'Outros' },
]

/** Mock: histórico de status por franchisor_id. Backend persiste e retorna paginado. */
const MOCK_STATUS_HISTORY = {}

function getStatusHistory(franchisorId) {
  const key = String(franchisorId)
  if (!MOCK_STATUS_HISTORY[key]) MOCK_STATUS_HISTORY[key] = []
  return MOCK_STATUS_HISTORY[key]
}

/**
 * GET /franchisors/{franchisor_id}/status
 * Retorno: current_status, last_changed_at, last_changed_by (nome/email), last_reason_category, last_reason_details
 */
export async function getFranchisorStatus(franchisorId) {
  await new Promise((r) => setTimeout(r, 400))
  const f = MOCK_FRANQUEADORES.find((x) => String(x.id) === String(franchisorId))
  if (!f) {
    const err = new Error('Franqueador não encontrado')
    err.status = 404
    throw err
  }
  const history = getStatusHistory(franchisorId)
  const last = history[0] || null
  return {
    current_status: (f.status || 'pendente').toLowerCase(),
    last_changed_at: last?.changed_at ?? null,
    last_changed_by: last ? { name: last.actor_name, email: last.actor_email } : null,
    last_reason_category: last?.reason_category ?? null,
    last_reason_details: last?.reason_details ?? null,
  }
}

/**
 * GET /franchisors/{franchisor_id}/status/history
 * Params: page, page_size
 * Retorno: items (changed_at, from_status, to_status, actor, reason_category, reason_details), total, page, total_pages
 */
export async function getFranchisorStatusHistory(franchisorId, params = {}) {
  const { page = 1, page_size = 10 } = params
  await new Promise((r) => setTimeout(r, 350))
  const f = MOCK_FRANQUEADORES.find((x) => String(x.id) === String(franchisorId))
  if (!f) {
    const err = new Error('Franqueador não encontrado')
    err.status = 404
    throw err
  }
  const history = getStatusHistory(franchisorId)
  const total = history.length
  const start = (Number(page) - 1) * Number(page_size)
  const items = history.slice(start, start + Number(page_size))
  return {
    items,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

/**
 * POST /franchisors/{franchisor_id}/status/transition
 * Payload: action (APPROVE | SUSPEND | REACTIVATE), reason_category, reason_details
 * Backend valida transição (Pendente->Ativo; Ativo->Suspenso; Suspenso->Ativo) e policy Admin.
 */
export async function postFranchisorStatusTransition(franchisorId, payload) {
  await new Promise((r) => setTimeout(r, 600))
  const idx = MOCK_FRANQUEADORES.findIndex((x) => String(x.id) === String(franchisorId))
  if (idx === -1) {
    const err = new Error('Franqueador não encontrado')
    err.status = 404
    throw err
  }
  const current = MOCK_FRANQUEADORES[idx]
  const currentStatus = (current.status || 'pendente').toLowerCase()
  const action = payload.action
  let toStatus = null
  if (action === FRANCHISOR_STATUS_ACTIONS.APPROVE && currentStatus === 'pendente') toStatus = 'ativo'
  if (action === FRANCHISOR_STATUS_ACTIONS.SUSPEND && currentStatus === 'ativo') toStatus = 'suspenso'
  if (action === FRANCHISOR_STATUS_ACTIONS.REACTIVATE && currentStatus === 'suspenso') toStatus = 'ativo'
  if (!toStatus) {
    const err = new Error('Transição inválida de status.')
    err.status = 400
    throw err
  }
  const actor_name = 'Admin (mock)'
  const actor_email = 'admin@plataforma.com'
  const record = {
    changed_at: new Date().toISOString(),
    from_status: currentStatus,
    to_status: toStatus,
    actor_name,
    actor_email,
    reason_category: payload.reason_category || '',
    reason_details: payload.reason_details || '',
  }
  getStatusHistory(franchisorId).unshift(record)
  const updated = { ...current, status: toStatus }
  MOCK_FRANQUEADORES[idx] = updated
  return {
    current_status: toStatus,
    last_changed_at: record.changed_at,
    last_changed_by: { name: actor_name, email: actor_email },
    last_reason_category: record.reason_category,
    last_reason_details: record.reason_details,
  }
}

// ——— Status da Escola (Admin — Suspender/Reativar) ———
// Contrato: GET /schools/{school_id}/status, GET .../status/history, POST .../status/transition
// Policy Admin-only; transições: Ativa -> Suspensa (SUSPEND), Suspensa -> Ativa (REACTIVATE).

export const SCHOOL_STATUS_ACTIONS = {
  SUSPEND: 'SUSPEND',
  REACTIVATE: 'REACTIVATE',
}

/** Categorias de motivo para alteração de status da escola (PRD). */
export const REASON_CATEGORIES_SCHOOL = [
  { value: 'violacao_politicas', label: 'Violação de políticas' },
  { value: 'inadimplencia', label: 'Inadimplência' },
  { value: 'solicitacao_escola', label: 'Solicitação da escola' },
  { value: 'encerramento_temporario', label: 'Encerramento temporário' },
  { value: 'outros', label: 'Outros' },
]

const MOCK_SCHOOL_STATUS_HISTORY = {}

function getSchoolStatusHistoryArray(schoolId) {
  const key = String(schoolId)
  if (!MOCK_SCHOOL_STATUS_HISTORY[key]) MOCK_SCHOOL_STATUS_HISTORY[key] = []
  return MOCK_SCHOOL_STATUS_HISTORY[key]
}

function findSchoolInMock(schoolId) {
  for (const [, escolas] of Object.entries(MOCK_ESCOLAS_POR_FRANQUEADOR)) {
    const idx = escolas.findIndex((s) => String(s.id) === String(schoolId))
    if (idx >= 0) return { escolas, idx, school: escolas[idx] }
  }
  return null
}

/**
 * GET /schools/{school_id}/status
 * Retorno: current_status, last_changed_at, last_changed_by, last_reason_category, last_reason_details
 */
export async function getSchoolStatus(schoolId) {
  await new Promise((r) => setTimeout(r, 400))
  const found = findSchoolInMock(schoolId)
  if (!found) {
    const err = new Error('Escola não encontrada')
    err.status = 404
    throw err
  }
  const history = getSchoolStatusHistoryArray(schoolId)
  const last = history[0] || null
  const currentStatus = (found.school.status || 'ativo').toLowerCase()
  return {
    current_status: currentStatus,
    last_changed_at: last?.changed_at ?? null,
    last_changed_by: last ? { name: last.actor_name, email: last.actor_email } : null,
    last_reason_category: last?.reason_category ?? null,
    last_reason_details: last?.reason_details ?? null,
  }
}

/**
 * GET /schools/{school_id}/status/history
 * Params: page, page_size
 */
export async function getSchoolStatusHistory(schoolId, params = {}) {
  const { page = 1, page_size = 10 } = params
  await new Promise((r) => setTimeout(r, 350))
  const found = findSchoolInMock(schoolId)
  if (!found) {
    const err = new Error('Escola não encontrada')
    err.status = 404
    throw err
  }
  const history = getSchoolStatusHistoryArray(schoolId)
  const total = history.length
  const start = (Number(page) - 1) * Number(page_size)
  const items = history.slice(start, start + Number(page_size))
  return {
    items,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

/**
 * POST /schools/{school_id}/status/transition
 * Payload: action (SUSPEND | REACTIVATE), reason_category, reason_details
 */
export async function postSchoolStatusTransition(schoolId, payload) {
  await new Promise((r) => setTimeout(r, 600))
  const found = findSchoolInMock(schoolId)
  if (!found) {
    const err = new Error('Escola não encontrada')
    err.status = 404
    throw err
  }
  const { escolas, idx, school } = found
  const currentStatus = (school.status || 'ativo').toLowerCase()
  const action = payload.action
  let toStatus = null
  if (action === SCHOOL_STATUS_ACTIONS.SUSPEND && currentStatus === 'ativo') toStatus = 'suspenso'
  if (action === SCHOOL_STATUS_ACTIONS.REACTIVATE && currentStatus === 'suspenso') toStatus = 'ativo'
  if (!toStatus) {
    const err = new Error('A escola não está no status esperado. Atualize a página.')
    err.status = 400
    throw err
  }
  const actor_name = 'Admin (mock)'
  const actor_email = 'admin@plataforma.com'
  const record = {
    changed_at: new Date().toISOString(),
    from_status: currentStatus,
    to_status: toStatus,
    actor_name,
    actor_email,
    reason_category: payload.reason_category || '',
    reason_details: payload.reason_details || '',
  }
  getSchoolStatusHistoryArray(schoolId).unshift(record)
  const updated = { ...school, status: toStatus }
  escolas[idx] = updated
  return {
    current_status: toStatus,
    last_changed_at: record.changed_at,
    last_changed_by: { name: actor_name, email: actor_email },
    last_reason_category: record.reason_category,
    last_reason_details: record.reason_details,
  }
}

// ——— Usuários da Escola (Admin — RBAC + scope) ———
// Contrato: GET /schools/{school_id}/users (search, role, status?, page, page_size)
// POST /schools/{school_id}/users — name, email, role, scope_type, scope_school_ids?
// PATCH /schools/{school_id}/users/{user_id} — role, scope_type, scope_school_ids?
// DELETE /schools/{school_id}/users/{user_id} — revogar membership
// Scope default: SINGLE_SCHOOL (somente esta escola). Policy: Admin-only.

const ROLES_ESCOLA = ['SchoolOwner', 'SchoolStaff', 'Coach', 'Finance']
const SCOPE_SINGLE = 'SINGLE_SCHOOL'
const SCOPE_SCHOOL_LIST = 'SCHOOL_LIST'

/** Mock: usuários por escola. user_id, name, email, role, scope_type, scope_school_ids?, scope_school_count, status?, last_login_at? */
const MOCK_USUARIOS_ESCOLA = {
  e1: [
    { user_id: 'su1', name: 'João Silva', email: 'joao@arenasp.com.br', role: 'SchoolOwner', scope_type: SCOPE_SINGLE, scope_school_ids: ['e1'], scope_school_count: 1, status: 'ativo', last_login_at: '2025-02-22T09:00:00Z' },
    { user_id: 'su2', name: 'Maria Treino', email: 'maria@arenasp.com.br', role: 'Coach', scope_type: SCOPE_SINGLE, scope_school_ids: ['e1'], scope_school_count: 1, status: 'ativo', last_login_at: '2025-02-20T14:00:00Z' },
    { user_id: 'su3', name: 'Pedro Financeiro', email: 'pedro@arenasp.com.br', role: 'Finance', scope_type: SCOPE_SINGLE, scope_school_ids: ['e1'], scope_school_count: 1, status: 'convidado', last_login_at: null },
  ],
  e2: [
    { user_id: 'su4', name: 'Maria Costa', email: 'maria@arenacampinas.com.br', role: 'SchoolOwner', scope_type: SCOPE_SINGLE, scope_school_ids: ['e2'], scope_school_count: 1, status: 'ativo', last_login_at: '2025-02-21T11:00:00Z' },
  ],
  e3: [],
  e4: [],
  e5: [],
  e6: [],
  e7: [],
  e8: [],
}

function getUsersBySchool(schoolId) {
  return [...(MOCK_USUARIOS_ESCOLA[String(schoolId)] || [])]
}

/**
 * GET /schools/{school_id}/users
 * Params: search, role, status?, page, page_size
 */
export async function listSchoolUsers(schoolId, params = {}) {
  const { search = '', role: roleFilter = '', status: statusFilter = '', page = 1, page_size = 10 } = params
  await new Promise((r) => setTimeout(r, 400))
  let list = getUsersBySchool(schoolId)
  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
    )
  }
  if (roleFilter && roleFilter !== 'todos') {
    list = list.filter((u) => u.role === roleFilter)
  }
  if (statusFilter && statusFilter !== 'todos') {
    list = list.filter((u) => (u.status || 'ativo').toLowerCase() === statusFilter.toLowerCase())
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
 * POST /schools/{school_id}/users
 * Payload: name, email, role, scope_type, scope_school_ids? (default SINGLE_SCHOOL = esta escola)
 */
export async function createSchoolUser(schoolId, payload) {
  await new Promise((r) => setTimeout(r, 500))
  const list = getUsersBySchool(schoolId)
  const maxId = list.reduce((acc, u) => Math.max(acc, parseInt(String(u.user_id).replace('su', ''), 10) || 0), 0)
  const user_id = `su${maxId + 1}`
  const scope_type = payload.scope_type === SCOPE_SCHOOL_LIST ? SCOPE_SCHOOL_LIST : SCOPE_SINGLE
  const scope_school_ids = scope_type === SCOPE_SCHOOL_LIST ? (payload.scope_school_ids || []).filter(Boolean) : [String(schoolId)]
  const scope_school_count = scope_school_ids.length
  const newUser = {
    user_id,
    name: payload.name || '',
    email: payload.email || '',
    role: ROLES_ESCOLA.includes(payload.role) ? payload.role : 'SchoolStaff',
    scope_type,
    scope_school_ids,
    scope_school_count,
    status: 'convidado',
    last_login_at: null,
  }
  if (!MOCK_USUARIOS_ESCOLA[String(schoolId)]) MOCK_USUARIOS_ESCOLA[String(schoolId)] = []
  MOCK_USUARIOS_ESCOLA[String(schoolId)].push(newUser)
  return newUser
}

/**
 * GET /schools/{school_id}/users/{user_id}
 */
export async function getSchoolUser(schoolId, userId) {
  await new Promise((r) => setTimeout(r, 300))
  const list = MOCK_USUARIOS_ESCOLA[String(schoolId)] || []
  const user = list.find((u) => String(u.user_id) === String(userId))
  if (!user) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  return { ...user }
}

/**
 * PATCH /schools/{school_id}/users/{user_id}
 * Payload: role, scope_type, scope_school_ids? (deve incluir school_id atual quando gerenciado por esta tela)
 */
export async function updateSchoolUser(schoolId, userId, payload) {
  await new Promise((r) => setTimeout(r, 400))
  const list = MOCK_USUARIOS_ESCOLA[String(schoolId)] || []
  const idx = list.findIndex((u) => String(u.user_id) === String(userId))
  if (idx === -1) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  const current = list[idx]
  const scope_type = payload.scope_type === SCOPE_SCHOOL_LIST ? SCOPE_SCHOOL_LIST : SCOPE_SINGLE
  let scope_school_ids = scope_type === SCOPE_SCHOOL_LIST ? (payload.scope_school_ids || []) : [String(schoolId)]
  if (!scope_school_ids.includes(String(schoolId))) scope_school_ids = [String(schoolId), ...scope_school_ids]
  const scope_school_count = scope_school_ids.length
  const updated = {
    ...current,
    role: ROLES_ESCOLA.includes(payload.role) ? payload.role : current.role,
    scope_type,
    scope_school_ids,
    scope_school_count,
  }
  MOCK_USUARIOS_ESCOLA[String(schoolId)][idx] = updated
  return updated
}

/**
 * DELETE /schools/{school_id}/users/{user_id} — revogar membership
 */
export async function deleteSchoolUser(schoolId, userId) {
  await new Promise((r) => setTimeout(r, 400))
  const list = MOCK_USUARIOS_ESCOLA[String(schoolId)] || []
  const idx = list.findIndex((u) => String(u.user_id) === String(userId))
  if (idx === -1) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  MOCK_USUARIOS_ESCOLA[String(schoolId)] = list.slice(0, idx).concat(list.slice(idx + 1))
  return { ok: true }
}

export function getSchoolRoleLabel(role) {
  const labels = { SchoolOwner: 'SchoolOwner', SchoolStaff: 'SchoolStaff', Coach: 'Coach', Finance: 'Finance' }
  return labels[role] || role || '—'
}

/** Resumo de escopo para usuário da escola: "Somente esta escola" ou "N escolas" */
export function getSchoolScopeSummary(user, currentSchoolId) {
  if (!user) return '—'
  const n = user.scope_school_count ?? user.scope_school_ids?.length ?? 0
  const onlyThis = user.scope_type === SCOPE_SINGLE || (n === 1 && user.scope_school_ids?.includes(String(currentSchoolId)))
  return onlyThis ? 'Somente esta escola' : `${n} escolas`
}

export { ROLES_ESCOLA, SCOPE_SINGLE, SCOPE_SCHOOL_LIST }
