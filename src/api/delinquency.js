/**
 * Contrato backend (frontend apenas consome):
 * GET /finance/delinquency/summary — params: from, to, franchisor_id?, school_id?, bucket?
 *   retorno: overdue_total_amount, overdue_items_count, schools_with_overdue_count, max_overdue_days
 * GET /finance/delinquency/by-franchisor — params: from, to, bucket?, franchisor_id?, school_id?, metric?, page, page_size, sort?
 *   itens: franchisor_id, franchisor_name, schools_with_overdue_count, overdue_total_amount, overdue_items_count, max_overdue_days
 * GET /finance/delinquency/by-school — params: from, to, bucket?, franchisor_id?, metric?, page, page_size, sort?
 *   itens: school_id, school_name, franchisor_id, franchisor_name, overdue_total_amount, overdue_items_count, max_overdue_days
 * (Opcional) GET /finance/delinquency/by-bucket — params: from, to, franchisor_id?, school_id?
 *   itens: bucket_label, overdue_total_amount, overdue_items_count
 * Policy: Admin-only. Agregações derivadas de registros com school_id e datas de vencimento.
 */

import { formatCurrency as formatCurrencyFromGlobal } from './financeGlobal'

// Reutilizar estrutura de escolas do financeGlobal (overdue por escola)
const MOCK_ESCOLAS_DELINQUENCY = [
  { school_id: 'e1', school_name: 'Arena São Paulo', franchisor_id: '1', franchisor_name: 'Rede Arena', overdue_total: 800, overdue_items_count: 2, max_overdue_days: 15 },
  { school_id: 'e2', school_name: 'Arena Campinas', franchisor_id: '1', franchisor_name: 'Rede Arena', overdue_total: 3200, overdue_items_count: 5, max_overdue_days: 45 },
  { school_id: 'e3', school_name: 'Arena Santos', franchisor_id: '1', franchisor_name: 'Rede Arena', overdue_total: 0, overdue_items_count: 0, max_overdue_days: 0 },
  { school_id: 'e4', school_name: 'Arena Ribeirão', franchisor_id: '1', franchisor_name: 'Rede Arena', overdue_total: 0, overdue_items_count: 0, max_overdue_days: 0 },
  { school_id: 'e5', school_name: 'Brasil Sports Curitiba', franchisor_id: '2', franchisor_name: 'Brasil Sports', overdue_total: 0, overdue_items_count: 0, max_overdue_days: 0 },
  { school_id: 'e6', school_name: 'Brasil Sports Londrina', franchisor_id: '2', franchisor_name: 'Brasil Sports', overdue_total: 400, overdue_items_count: 1, max_overdue_days: 8 },
  { school_id: 'e7', school_name: 'Champions Belo Horizonte', franchisor_id: '3', franchisor_name: 'Academia Champions', overdue_total: 900, overdue_items_count: 3, max_overdue_days: 62 },
  { school_id: 'e8', school_name: 'Futuro Porto Alegre', franchisor_id: '6', franchisor_name: 'Rede Futuro', overdue_total: 0, overdue_items_count: 0, max_overdue_days: 0 },
]

const BUCKETS = [
  { value: '', label: 'Todos' },
  { value: '1_7', label: '1–7 dias' },
  { value: '8_30', label: '8–30 dias' },
  { value: '31_60', label: '31–60 dias' },
  { value: '61_plus', label: '61+ dias' },
]

function matchBucket(maxDays, bucket) {
  if (!bucket || bucket === '') return true
  const d = Number(maxDays) || 0
  if (bucket === '1_7') return d >= 1 && d <= 7
  if (bucket === '8_30') return d >= 8 && d <= 30
  if (bucket === '31_60') return d >= 31 && d <= 60
  if (bucket === '61_plus') return d >= 61
  return true
}

function filterSchools(schools, franchisorId, schoolId, bucket) {
  let list = schools.filter((s) => (s.overdue_total || 0) > 0)
  if (franchisorId) list = list.filter((s) => String(s.franchisor_id) === String(franchisorId))
  if (schoolId) list = list.filter((s) => String(s.school_id) === String(schoolId))
  if (bucket) list = list.filter((s) => matchBucket(s.max_overdue_days, bucket))
  return list
}

/**
 * GET /finance/delinquency/summary
 */
export async function getDelinquencySummary(params = {}) {
  const { from, to, franchisor_id: fid, school_id: sid, bucket } = params
  await new Promise((r) => setTimeout(r, 400))

  const list = filterSchools([...MOCK_ESCOLAS_DELINQUENCY], fid, sid, bucket)
  let overdue_total_amount = 0
  let overdue_items_count = 0
  let max_overdue_days = 0
  for (const s of list) {
    overdue_total_amount += s.overdue_total || 0
    overdue_items_count += s.overdue_items_count || 0
    if ((s.max_overdue_days || 0) > max_overdue_days) max_overdue_days = s.max_overdue_days
  }
  const schools_with_overdue_count = list.length

  return {
    overdue_total_amount,
    overdue_items_count,
    schools_with_overdue_count,
    max_overdue_days: max_overdue_days || null,
  }
}

/**
 * GET /finance/delinquency/by-franchisor (paginação)
 */
export async function getDelinquencyByFranchisor(params = {}) {
  const {
    from,
    to,
    bucket,
    franchisor_id: fid,
    school_id: sid,
    metric = 'amount',
    page = 1,
    page_size = 10,
    sort = 'overdue_desc',
  } = params
  await new Promise((r) => setTimeout(r, 450))

  let schools = filterSchools([...MOCK_ESCOLAS_DELINQUENCY], fid, sid, bucket)
  const byFranchisor = {}
  for (const s of schools) {
    const id = s.franchisor_id
    if (!byFranchisor[id]) {
      byFranchisor[id] = {
        franchisor_id: id,
        franchisor_name: s.franchisor_name,
        schools_with_overdue_count: 0,
        overdue_total_amount: 0,
        overdue_items_count: 0,
        max_overdue_days: 0,
      }
    }
    byFranchisor[id].schools_with_overdue_count += 1
    byFranchisor[id].overdue_total_amount += s.overdue_total || 0
    byFranchisor[id].overdue_items_count += s.overdue_items_count || 0
    if ((s.max_overdue_days || 0) > (byFranchisor[id].max_overdue_days || 0)) {
      byFranchisor[id].max_overdue_days = s.max_overdue_days
    }
  }

  let list = Object.values(byFranchisor)
  if (sort === 'overdue_desc' || sort === 'amount_desc') {
    list.sort((a, b) => (b.overdue_total_amount || 0) - (a.overdue_total_amount || 0))
  } else if (sort === 'items_desc') {
    list.sort((a, b) => (b.overdue_items_count || 0) - (a.overdue_items_count || 0))
  } else if (sort === 'name_asc') {
    list.sort((a, b) => (a.franchisor_name || '').localeCompare(b.franchisor_name || ''))
  }

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
 * GET /finance/delinquency/by-school (paginação)
 */
export async function getDelinquencyBySchool(params = {}) {
  const {
    from,
    to,
    bucket,
    franchisor_id: fid,
    metric = 'amount',
    page = 1,
    page_size = 10,
    sort = 'overdue_desc',
  } = params
  await new Promise((r) => setTimeout(r, 450))

  let list = filterSchools([...MOCK_ESCOLAS_DELINQUENCY], fid, null, bucket).map((s) => ({
    school_id: s.school_id,
    school_name: s.school_name,
    franchisor_id: s.franchisor_id,
    franchisor_name: s.franchisor_name,
    overdue_total_amount: s.overdue_total || 0,
    overdue_items_count: s.overdue_items_count || 0,
    max_overdue_days: s.max_overdue_days || 0,
  }))

  if (sort === 'overdue_desc' || sort === 'amount_desc') {
    list.sort((a, b) => (b.overdue_total_amount || 0) - (a.overdue_total_amount || 0))
  } else if (sort === 'items_desc') {
    list.sort((a, b) => (b.overdue_items_count || 0) - (a.overdue_items_count || 0))
  } else if (sort === 'school_name_asc') {
    list.sort((a, b) => (a.school_name || '').localeCompare(b.school_name || ''))
  }

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
 * GET /finance/delinquency/by-bucket (opcional)
 */
export async function getDelinquencyByBucket(params = {}) {
  const { from, to, franchisor_id: fid, school_id: sid } = params
  await new Promise((r) => setTimeout(r, 350))
  const list = filterSchools([...MOCK_ESCOLAS_DELINQUENCY], fid, sid, null)
  const buckets = [
    { bucket_label: '1–7 dias', min: 1, max: 7 },
    { bucket_label: '8–30 dias', min: 8, max: 30 },
    { bucket_label: '31–60 dias', min: 31, max: 60 },
    { bucket_label: '61+ dias', min: 61, max: 9999 },
  ]
  const result = buckets.map(({ bucket_label, min, max }) => {
    const inRange = list.filter((s) => (s.max_overdue_days || 0) >= min && (s.max_overdue_days || 0) <= max)
    return {
      bucket_label,
      overdue_total_amount: inRange.reduce((acc, s) => acc + (s.overdue_total || 0), 0),
      overdue_items_count: inRange.reduce((acc, s) => acc + (s.overdue_items_count || 0), 0),
    }
  })
  return result
}

export const BUCKET_OPTIONS = BUCKETS
export const formatCurrency = formatCurrencyFromGlobal
