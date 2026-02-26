/**
 * Contrato mínimo do backend — Portal Franqueador: Exportações (CSV/PDF).
 * Backend valida franchisor_id e scope_school_ids antes de gerar e antes de baixar.
 *
 * GET /franchisor/exports — paginação + filtros
 *   params: search, status, type, format, requested_from, requested_to, page, page_size
 *   retorno: { items: [{ id, type, format, status, filters_summary, requested_at, expires_at, error_message? }], total, page, page_size }
 *
 * POST /franchisor/exports
 *   payload: { type (CONSOLIDATED_REPORT | SCHOOL_REPORT | CAMPAIGN_RESULTS), format (CSV | PDF), filters: { from?, to?, school_id?, campaign_id? } }
 *   retorno: { export_id, status }
 *
 * GET /franchisor/exports/{export_id}
 *   retorno: id, type, format, status, filters, requested_at, started_at?, finished_at?, expires_at, error_message?
 *
 * POST /franchisor/exports/{export_id}/download-link
 *   retorno: { temporary_download_url }
 */

const EXPORT_TYPES = [
  { value: 'CONSOLIDATED_REPORT', label: 'Relatório consolidado', formats: ['CSV', 'PDF'] },
  { value: 'SCHOOL_REPORT', label: 'Relatório por escola', formats: ['CSV', 'PDF'] },
  { value: 'CAMPAIGN_RESULTS', label: 'Resultados de campanha', formats: ['CSV', 'PDF'] },
]

let idCounter = 1
const MOCK_EXPORTS = []

function buildFiltersSummary(filters) {
  if (!filters || typeof filters !== 'object') return '—'
  const parts = []
  if (filters.from && filters.to) parts.push(`${filters.from} a ${filters.to}`)
  if (filters.school_id) parts.push(`Escola ${filters.school_id}`)
  if (filters.campaign_id) parts.push(`Campanha ${filters.campaign_id}`)
  return parts.length ? parts.join(' · ') : '—'
}

function addMockExport(payload) {
  const id = `fexp-${idCounter++}`
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const item = {
    id,
    type: payload.type,
    format: payload.format,
    status: 'pending',
    filters: payload.filters || {},
    filters_summary: buildFiltersSummary(payload.filters),
    requested_at: now,
    started_at: null,
    finished_at: null,
    expires_at: null,
    error_message: null,
  }
  MOCK_EXPORTS.unshift(item)
  setTimeout(() => {
    const idx = MOCK_EXPORTS.findIndex((e) => e.id === id)
    if (idx !== -1) MOCK_EXPORTS[idx].status = 'processing'
  }, 1500)
  setTimeout(() => {
    const idx = MOCK_EXPORTS.findIndex((e) => e.id === id)
    if (idx !== -1) {
      MOCK_EXPORTS[idx].status = 'completed'
      MOCK_EXPORTS[idx].expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      MOCK_EXPORTS[idx].started_at = MOCK_EXPORTS[idx].requested_at
      MOCK_EXPORTS[idx].finished_at = new Date().toISOString()
    }
  }, 4000)
  return { export_id: id, status: 'pending' }
}

export function getFranchisorExportTypes() {
  return Promise.resolve([...EXPORT_TYPES])
}

export async function listFranchisorExports(params = {}) {
  const {
    search = '',
    status = '',
    type = '',
    format = '',
    requested_from = '',
    requested_to = '',
    page = 1,
    page_size = 10,
  } = params

  await new Promise((r) => setTimeout(r, 400))

  let list = [...MOCK_EXPORTS]

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (e) =>
        (e.id && String(e.id).toLowerCase().includes(searchLower)) ||
        (e.type && e.type.toLowerCase().includes(searchLower)) ||
        (e.format && e.format.toLowerCase().includes(searchLower))
    )
  }
  if (status && status !== 'todos') {
    list = list.filter((e) => (e.status || '').toLowerCase() === status.toLowerCase())
  }
  if (type && type !== 'todos') {
    list = list.filter((e) => e.type === type)
  }
  if (format && format !== 'todos') {
    list = list.filter((e) => (e.format || '').toUpperCase() === format.toUpperCase())
  }
  if (requested_from) {
    list = list.filter((e) => e.requested_at && e.requested_at.slice(0, 10) >= requested_from)
  }
  if (requested_to) {
    list = list.filter((e) => e.requested_at && e.requested_at.slice(0, 10) <= requested_to)
  }

  const total = list.length
  const pageSize = Math.min(50, Math.max(10, parseInt(page_size, 10) || 10))
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const start = (pageNum - 1) * pageSize
  const items = list.slice(start, start + pageSize)

  return { items, total, page: pageNum, page_size: pageSize }
}

export async function createFranchisorExport(payload) {
  await new Promise((r) => setTimeout(r, 300))
  const result = addMockExport({
    type: payload.type,
    format: payload.format,
    filters: payload.filters || {},
  })
  return result
}

export async function getFranchisorExport(exportId) {
  await new Promise((r) => setTimeout(r, 350))
  const item = MOCK_EXPORTS.find((e) => e.id === exportId)
  if (!item) {
    const err = new Error('Exportação não encontrada')
    err.status = 404
    throw err
  }
  return { ...item }
}

export async function getFranchisorExportDownloadLink(exportId) {
  await new Promise((r) => setTimeout(r, 300))
  const item = MOCK_EXPORTS.find((e) => e.id === exportId)
  if (!item) {
    const err = new Error('Exportação não encontrada')
    err.status = 404
    throw err
  }
  if (item.status !== 'completed') {
    const err = new Error('Exportação ainda não está pronta para download')
    err.status = 400
    throw err
  }
  const now = new Date()
  const expires = item.expires_at ? new Date(item.expires_at) : null
  if (expires && expires < now) {
    const err = new Error('Link de download expirado')
    err.status = 410
    throw err
  }
  return {
    temporary_download_url: `https://api.example.com/franchisor/exports/${exportId}/download?token=mock-${Date.now()}`,
  }
}

export function formatFranchisorExportDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getFranchisorExportTypeLabel(value) {
  const t = EXPORT_TYPES.find((x) => x.value === value)
  return t ? t.label : value || '—'
}

export function getFranchisorExportFormatLabel(value) {
  return value === 'CSV' ? 'CSV' : value === 'PDF' ? 'PDF' : value || '—'
}
