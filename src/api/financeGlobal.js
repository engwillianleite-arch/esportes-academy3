/**
 * Contrato backend (frontend apenas consome):
 * GET /finance/global/summary — params: from, to, franchisor_id?, school_id?, status?
 *   retorno: received_total, open_total, overdue_total, delinquency_rate
 * GET /finance/global/by-franchisor — params: from, to, status?, page, page_size, sort?
 *   itens: franchisor_id, franchisor_name, schools_count, received_total, open_total, overdue_total, delinquency_rate
 * GET /finance/global/by-school — params: from, to, franchisor_id?, status?, page, page_size, sort?
 *   itens: school_id, school_name, franchisor_id, franchisor_name, received_total, open_total, overdue_total, delinquency_rate
 * Policy: Admin-only. Queries filtradas por school_id; auditoria Admin_ViewGlobalFinance opcional.
 */

// Mock: valores financeiros por escola (school_id) — recebido, em aberto, em atraso (valores em centavos ou reais)
const MOCK_FINANCE_BY_SCHOOL = {
  e1: { received: 12500, open: 2500, overdue: 800 },
  e2: { received: 0, open: 0, overdue: 3200 },
  e3: { received: 0, open: 1800, overdue: 0 },
  e4: { received: 4200, open: 600, overdue: 0 },
  e5: { received: 15800, open: 0, overdue: 0 },
  e6: { received: 9200, open: 1200, overdue: 400 },
  e7: { received: 0, open: 900, overdue: 900 },
  e8: { received: 3100, open: 500, overdue: 0 },
}

const MOCK_FRANQUEADORES_NAMES = {
  '1': 'Rede Arena',
  '2': 'Brasil Sports',
  '3': 'Academia Champions',
  '4': 'Escola do Atleta',
  '5': 'Centro Esportivo Alpha',
  '6': 'Rede Futuro',
}

const MOCK_ESCOLAS = [
  { school_id: 'e1', school_name: 'Arena São Paulo', franchisor_id: '1', franchisor_name: 'Rede Arena' },
  { school_id: 'e2', school_name: 'Arena Campinas', franchisor_id: '1', franchisor_name: 'Rede Arena' },
  { school_id: 'e3', school_name: 'Arena Santos', franchisor_id: '1', franchisor_name: 'Rede Arena' },
  { school_id: 'e4', school_name: 'Arena Ribeirão', franchisor_id: '1', franchisor_name: 'Rede Arena' },
  { school_id: 'e5', school_name: 'Brasil Sports Curitiba', franchisor_id: '2', franchisor_name: 'Brasil Sports' },
  { school_id: 'e6', school_name: 'Brasil Sports Londrina', franchisor_id: '2', franchisor_name: 'Brasil Sports' },
  { school_id: 'e7', school_name: 'Champions Belo Horizonte', franchisor_id: '3', franchisor_name: 'Academia Champions' },
  { school_id: 'e8', school_name: 'Futuro Porto Alegre', franchisor_id: '6', franchisor_name: 'Rede Futuro' },
]

function getFinanceForSchool(schoolId) {
  const f = MOCK_FINANCE_BY_SCHOOL[String(schoolId)]
  return f || { received: 0, open: 0, overdue: 0 }
}

function delinquencyRate(received, open, overdue) {
  const total = received + open + overdue
  if (total <= 0) return 0
  return Math.round((overdue / total) * 1000) / 10
}

/**
 * Filtra escolas pelo status financeiro (simplificado: todos, pago, em_aberto, atrasado).
 * "pago" = só quem tem received > 0 e overdue === 0 e open === 0 (opcional)
 * "em_aberto" = open > 0 e overdue === 0
 * "atrasado" = overdue > 0
 */
function matchStatus(fin, statusFilter) {
  if (!statusFilter || statusFilter === 'todos') return true
  const s = (statusFilter || '').toLowerCase()
  if (s === 'pago') return fin.received > 0 && fin.overdue === 0 && fin.open === 0
  if (s === 'em_aberto') return fin.open > 0 && fin.overdue === 0
  if (s === 'atrasado') return fin.overdue > 0
  return true
}

/**
 * GET /finance/global/summary
 */
export async function getFinanceGlobalSummary(params = {}) {
  const { from, to, franchisor_id: fid, school_id: sid, status: statusFilter } = params
  await new Promise((r) => setTimeout(r, 400))

  let schools = MOCK_ESCOLAS
  if (fid) schools = schools.filter((s) => String(s.franchisor_id) === String(fid))
  if (sid) schools = schools.filter((s) => String(s.school_id) === String(sid))

  let received_total = 0
  let open_total = 0
  let overdue_total = 0
  for (const s of schools) {
    const fin = getFinanceForSchool(s.school_id)
    if (!matchStatus(fin, statusFilter)) continue
    received_total += fin.received
    open_total += fin.open
    overdue_total += fin.overdue
  }
  const total = received_total + open_total + overdue_total
  const delinquency_rate = total > 0 ? Math.round((overdue_total / total) * 1000) / 10 : 0

  return {
    received_total,
    open_total,
    overdue_total,
    delinquency_rate,
  }
}

/**
 * GET /finance/global/by-franchisor (paginação)
 */
export async function getFinanceGlobalByFranchisor(params = {}) {
  const { from, to, status: statusFilter, page = 1, page_size = 10, sort = 'overdue_desc' } = params
  await new Promise((r) => setTimeout(r, 450))

  const byFranchisor = {}
  for (const esc of MOCK_ESCOLAS) {
    const fin = getFinanceForSchool(esc.school_id)
    if (!matchStatus(fin, statusFilter)) continue
    const id = esc.franchisor_id
    if (!byFranchisor[id]) {
      byFranchisor[id] = {
        franchisor_id: id,
        franchisor_name: MOCK_FRANQUEADORES_NAMES[id] || esc.franchisor_name,
        schools_count: 0,
        received_total: 0,
        open_total: 0,
        overdue_total: 0,
      }
    }
    byFranchisor[id].schools_count += 1
    byFranchisor[id].received_total += fin.received
    byFranchisor[id].open_total += fin.open
    byFranchisor[id].overdue_total += fin.overdue
  }

  let list = Object.values(byFranchisor).map((row) => ({
    ...row,
    delinquency_rate: delinquencyRate(row.received_total, row.open_total, row.overdue_total),
  }))

  if (sort === 'overdue_desc') list.sort((a, b) => (b.overdue_total || 0) - (a.overdue_total || 0))
  else if (sort === 'received_desc') list.sort((a, b) => b.received_total - a.received_total)
  else if (sort === 'name_asc') list.sort((a, b) => (a.franchisor_name || '').localeCompare(b.franchisor_name || ''))

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
 * GET /finance/global/by-school (paginação)
 */
export async function getFinanceGlobalBySchool(params = {}) {
  const {
    from,
    to,
    franchisor_id: fid,
    status: statusFilter,
    page = 1,
    page_size = 10,
    sort = 'overdue_desc',
  } = params
  await new Promise((r) => setTimeout(r, 450))

  let list = MOCK_ESCOLAS.map((s) => {
    const fin = getFinanceForSchool(s.school_id)
    return {
      school_id: s.school_id,
      school_name: s.school_name,
      franchisor_id: s.franchisor_id,
      franchisor_name: s.franchisor_name,
      received_total: fin.received,
      open_total: fin.open,
      overdue_total: fin.overdue,
      delinquency_rate: delinquencyRate(fin.received, fin.open, fin.overdue),
    }
  }).filter((row) => matchStatus(
    { received: row.received_total, open: row.open_total, overdue: row.overdue_total },
    statusFilter
  ))

  if (fid) list = list.filter((r) => String(r.franchisor_id) === String(fid))

  if (sort === 'overdue_desc') list.sort((a, b) => (b.overdue_total || 0) - (a.overdue_total || 0))
  else if (sort === 'received_desc') list.sort((a, b) => b.received_total - a.received_total)
  else if (sort === 'school_name_asc') list.sort((a, b) => (a.school_name || '').localeCompare(b.school_name || ''))

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

/** Formata valor monetário para exibição */
export function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}
