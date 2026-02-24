/**
 * Contrato backend (frontend apenas consome):
 * GET /reports/strategic/summary — params: from, to, franchisor_id?, school_id?, school_status?
 *   retorno: schools_active_count, schools_pending_count, franchisors_active_count, subscriptions_active_count, received_total?, overdue_total?
 * GET /reports/strategic/top-franchisors — params: from, to, metric, franchisor_id?, school_status?, page, page_size
 *   itens: franchisor_id, franchisor_name, metric_value
 * GET /reports/strategic/top-schools — params: from, to, metric, franchisor_id?, school_status?, page, page_size
 *   itens: school_id, school_name, franchisor_id, franchisor_name, metric_value
 * GET /reports/strategic/by-school-status — params: from, to, franchisor_id?
 *   itens: status, count
 * Policy: Admin-only. Agregações com school_id. Mock abaixo até backend existir.
 */

import { listFranqueadores, listEscolas } from './franqueadores'
import { listSubscriptions } from './subscriptions'
import { getFinanceGlobalSummary, getFinanceGlobalByFranchisor, getFinanceGlobalBySchool } from './financeGlobal'

const PAGE_SIZE_MAX = 500

function normalizeSchoolStatus(v) {
  if (!v || v === 'todos') return null
  const s = String(v).toLowerCase()
  if (s === 'ativa') return 'ativo'
  if (s === 'pendente' || s === 'suspensa') return s
  return s
}

/**
 * GET /reports/strategic/summary
 */
export async function getStrategicSummary(params = {}) {
  const { from, to, franchisor_id: fid, school_id: sid, school_status: schoolStatus } = params
  await new Promise((r) => setTimeout(r, 400))

  const statusNorm = normalizeSchoolStatus(schoolStatus)

  const [franqueadoresRes, escolasRes, subsRes, financeSummary] = await Promise.all([
    listFranqueadores({ page: 1, page_size: PAGE_SIZE_MAX }),
    listEscolas({
      page: 1,
      page_size: PAGE_SIZE_MAX,
      franchisor_id: fid || undefined,
      status: statusNorm || undefined,
    }),
    listSubscriptions({ page: 1, page_size: PAGE_SIZE_MAX, status: 'ativa' }),
    getFinanceGlobalSummary({ from, to, franchisor_id: fid, school_id: sid }),
  ])

  let escolas = escolasRes.data || []
  if (sid) escolas = escolas.filter((e) => String(e.id) === String(sid))
  if (fid) escolas = escolas.filter((e) => String(e.franchisor_id) === String(fid))
  if (statusNorm) escolas = escolas.filter((e) => (e.status || '').toLowerCase() === statusNorm)

  const schools_active_count = escolas.filter((e) => (e.status || '').toLowerCase() === 'ativo').length
  const schools_pending_count = escolas.filter((e) => (e.status || '').toLowerCase() === 'pendente').length
  const franchisors = franqueadoresRes.data || []
  const franchisors_active_count = fid
    ? (franchisors.some((f) => String(f.id) === String(fid) && (f.status || '').toLowerCase() === 'ativo') ? 1 : 0)
    : franchisors.filter((f) => (f.status || '').toLowerCase() === 'ativo').length
  let subscriptions_active_count = (subsRes.data || []).length
  if (fid || sid) {
    const subs = (subsRes.data || []).filter((s) => {
      if (fid && String(s.franchisor_id) !== String(fid)) return false
      if (sid && String(s.school_id) !== String(sid)) return false
      return true
    })
    subscriptions_active_count = subs.length
  }

  const result = {
    schools_active_count,
    schools_pending_count,
    franchisors_active_count,
    subscriptions_active_count,
  }
  if (financeSummary.received_total != null) result.received_total = financeSummary.received_total
  if (financeSummary.overdue_total != null) result.overdue_total = financeSummary.overdue_total
  return result
}

/** Métricas disponíveis para ranking de franqueadores */
export const TOP_FRANCHISORS_METRICS = [
  { value: 'schools_active', label: 'Escolas ativas' },
  { value: 'received_total', label: 'Recebido no período' },
  { value: 'overdue_total', label: 'Valor em atraso' },
]

/** Métricas disponíveis para ranking de escolas */
export const TOP_SCHOOLS_METRICS = [
  { value: 'students', label: 'Alunos' },
  { value: 'received_total', label: 'Recebido no período' },
  { value: 'overdue_total', label: 'Valor em atraso' },
]

/**
 * GET /reports/strategic/top-franchisors
 * metric: schools_active | received_total | overdue_total
 */
export async function getTopFranchisors(params = {}) {
  const {
    from,
    to,
    metric = 'schools_active',
    franchisor_id: fid,
    school_status: schoolStatus,
    page = 1,
    page_size = 10,
  } = params
  await new Promise((r) => setTimeout(r, 450))

  const statusNorm = normalizeSchoolStatus(schoolStatus)

  if (metric === 'received_total' || metric === 'overdue_total') {
    const sort = metric === 'overdue_total' ? 'overdue_desc' : 'received_desc'
    const res = await getFinanceGlobalByFranchisor({
      from,
      to,
      status: undefined,
      page,
      page_size,
      sort,
    })
    let list = (res.data || []).map((row) => ({
      franchisor_id: row.franchisor_id,
      franchisor_name: row.franchisor_name,
      metric_value: metric === 'overdue_total' ? row.overdue_total : row.received_total,
    }))
    if (fid) list = list.filter((r) => String(r.franchisor_id) === String(fid))
    return {
      data: list.slice(0, page_size),
      total: list.length,
      page: Number(page),
      page_size: Number(page_size),
      total_pages: Math.ceil(list.length / page_size) || 1,
    }
  }

  const escolasRes = await listEscolas({
    page: 1,
    page_size: PAGE_SIZE_MAX,
    franchisor_id: fid || undefined,
    status: statusNorm || undefined,
  })
  const escolas = escolasRes.data || []
  const byFranchisor = {}
  for (const e of escolas) {
    if ((e.status || '').toLowerCase() !== 'ativo') continue
    const id = e.franchisor_id
    if (!byFranchisor[id]) {
      byFranchisor[id] = { franchisor_id: id, franchisor_name: e.franchisor_name || '', metric_value: 0 }
    }
    byFranchisor[id].metric_value += 1
  }
  let list = Object.values(byFranchisor).sort((a, b) => (b.metric_value || 0) - (a.metric_value || 0))
  const total = list.length
  const start = (Number(page) - 1) * Number(page_size)
  const data = list.slice(start, start + Number(page_size))
  return {
    data,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

/**
 * GET /reports/strategic/top-schools
 * metric: students | received_total | overdue_total
 */
export async function getTopSchools(params = {}) {
  const {
    from,
    to,
    metric = 'students',
    franchisor_id: fid,
    school_status: schoolStatus,
    page = 1,
    page_size = 10,
  } = params
  await new Promise((r) => setTimeout(r, 450))

  const statusNorm = normalizeSchoolStatus(schoolStatus)

  if (metric === 'received_total' || metric === 'overdue_total') {
    const sort = metric === 'overdue_total' ? 'overdue_desc' : 'received_desc'
    const res = await getFinanceGlobalBySchool({
      from,
      to,
      franchisor_id: fid || undefined,
      status: undefined,
      page,
      page_size,
      sort,
    })
    const list = (res.data || []).map((row) => ({
      school_id: row.school_id,
      school_name: row.school_name,
      franchisor_id: row.franchisor_id,
      franchisor_name: row.franchisor_name,
      metric_value: metric === 'overdue_total' ? row.overdue_total : row.received_total,
    }))
    return {
      data: list,
      total: res.total || list.length,
      page: res.page || Number(page),
      page_size: res.page_size || Number(page_size),
      total_pages: res.total_pages || 1,
    }
  }

  const escolasRes = await listEscolas({
    page: 1,
    page_size: PAGE_SIZE_MAX,
    franchisor_id: fid || undefined,
    status: statusNorm || undefined,
  })
  let list = (escolasRes.data || [])
    .map((e) => ({
      school_id: e.id,
      school_name: e.name,
      franchisor_id: e.franchisor_id,
      franchisor_name: e.franchisor_name || '',
      metric_value: e.students_count != null ? Number(e.students_count) : 0,
    }))
    .sort((a, b) => (b.metric_value || 0) - (a.metric_value || 0))
  const total = list.length
  const start = (Number(page) - 1) * Number(page_size)
  const data = list.slice(start, start + Number(page_size))
  return {
    data,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

/**
 * GET /reports/strategic/by-school-status
 */
export async function getBySchoolStatus(params = {}) {
  const { from, to, franchisor_id: fid } = params
  await new Promise((r) => setTimeout(r, 350))

  const escolasRes = await listEscolas({
    page: 1,
    page_size: PAGE_SIZE_MAX,
    franchisor_id: fid || undefined,
  })
  const escolas = escolasRes.data || []
  const counts = { ativo: 0, pendente: 0, suspenso: 0 }
  for (const e of escolas) {
    const s = (e.status || '').toLowerCase()
    if (s === 'ativo') counts.ativo += 1
    else if (s === 'pendente') counts.pendente += 1
    else if (s === 'suspenso') counts.suspenso += 1
  }
  return {
    data: [
      { status: 'ativo', count: counts.ativo },
      { status: 'pendente', count: counts.pendente },
      { status: 'suspenso', count: counts.suspenso },
    ],
  }
}

export { formatCurrency } from './financeGlobal'
