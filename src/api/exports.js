/**
 * Contrato esperado do backend (frontend apenas consome):
 *
 * GET /exports — paginação + filtros
 *   params: search, status, type, requested_from, requested_to, page, page_size
 *   retorno: { data: [{ id, type, status, requested_by, requested_at, expires_at?, filters_summary?, row_count? }], total_pages, total_count }
 *
 * POST /exports
 *   payload: { type, filters: { from, to, franchisor_id?, school_id?, status?, ... }, selected_fields? }
 *   retorno: { export_id, status }
 *
 * GET /exports/{export_id}
 *   retorno: { id, type, status, requested_by, requested_at, expires_at?, filters, row_count?, error_message? }
 *
 * POST /exports/{export_id}/download-link (ou GET)
 *   retorno: { temporary_download_url }
 *
 * Policy: Admin-only. Auditoria: Admin_CreateExport, Admin_DownloadExport, Admin_ViewExport.
 */

const EXPORT_TYPES = [
  { value: 'schools', label: 'Escolas' },
  { value: 'franchisors', label: 'Franqueadores' },
  { value: 'subscriptions', label: 'Assinaturas' },
  { value: 'finance_global', label: 'Financeiro (global)' },
  { value: 'delinquency', label: 'Inadimplência' },
  { value: 'kpis_summary', label: 'KPIs (resumo)' },
]

let idCounter = 1
const MOCK_EXPORTS = []

function addMockExport(export_) {
  const id = `exp-${idCounter++}`
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const item = {
    id,
    type: export_.type,
    status: 'pending',
    requested_by: 'Admin',
    requested_at: now,
    expires_at: export_.status === 'completed' ? expiresAt : null,
    filters_summary: buildFiltersSummary(export_.filters),
    filters: export_.filters || {},
    row_count: null,
    error_message: null,
  }
  MOCK_EXPORTS.unshift(item)
  // Simular transição para processando e depois concluída (mock)
  setTimeout(() => {
    const idx = MOCK_EXPORTS.findIndex((e) => e.id === id)
    if (idx !== -1) {
      MOCK_EXPORTS[idx].status = 'processing'
    }
  }, 1500)
  setTimeout(() => {
    const idx = MOCK_EXPORTS.findIndex((e) => e.id === id)
    if (idx !== -1) {
      MOCK_EXPORTS[idx].status = 'completed'
      MOCK_EXPORTS[idx].expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      MOCK_EXPORTS[idx].row_count = Math.floor(Math.random() * 500) + 10
    }
  }, 4000)
  return { export_id: id, status: 'pending' }
}

function buildFiltersSummary(filters) {
  if (!filters || typeof filters !== 'object') return '—'
  const parts = []
  if (filters.from && filters.to) parts.push(`${filters.from} a ${filters.to}`)
  if (filters.franchisor_id) parts.push(`Franq. ${filters.franchisor_id}`)
  if (filters.school_id) parts.push(`Escola ${filters.school_id}`)
  if (filters.status) parts.push(`Status: ${filters.status}`)
  return parts.length ? parts.join(' · ') : '—'
}

export function getExportTypes() {
  return Promise.resolve(EXPORT_TYPES)
}

export async function listExports(params = {}) {
  const {
    search = '',
    status = '',
    type = '',
    requested_from = '',
    requested_to = '',
    page = 1,
    page_size = 10,
  } = params

  await new Promise((r) => setTimeout(r, 500))

  let list = [...MOCK_EXPORTS]

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (e) =>
        (e.id && String(e.id).toLowerCase().includes(searchLower)) ||
        (e.type && e.type.toLowerCase().includes(searchLower)) ||
        (e.requested_by && e.requested_by.toLowerCase().includes(searchLower))
    )
  }
  if (status && status !== 'todos') {
    list = list.filter((e) => (e.status || '').toLowerCase() === status.toLowerCase())
  }
  if (type && type !== 'todos') {
    list = list.filter((e) => e.type === type)
  }
  if (requested_from) {
    list = list.filter((e) => e.requested_at && e.requested_at.slice(0, 10) >= requested_from)
  }
  if (requested_to) {
    list = list.filter((e) => e.requested_at && e.requested_at.slice(0, 10) <= requested_to)
  }

  const total_count = list.length
  const total_pages = Math.max(1, Math.ceil(total_count / page_size))
  const start = (page - 1) * page_size
  const data = list.slice(start, start + page_size)

  return { data, total_pages, total_count }
}

export async function createExport(payload) {
  await new Promise((r) => setTimeout(r, 300))
  const result = addMockExport({
    type: payload.type,
    filters: payload.filters || {},
    selected_fields: payload.selected_fields,
    status: 'pending',
  })
  return result
}

export async function getExport(exportId) {
  await new Promise((r) => setTimeout(r, 400))
  const item = MOCK_EXPORTS.find((e) => e.id === exportId)
  if (!item) {
    const err = new Error('Exportação não encontrada')
    err.status = 404
    throw err
  }
  return { ...item }
}

export async function getDownloadLink(exportId) {
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
  // Mock: URL fictícia; backend deve retornar URL assinada/temporária
  return {
    temporary_download_url: `https://api.example.com/exports/${exportId}/download?token=mock-token-${Date.now()}`,
  }
}

export function formatExportDate(iso) {
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
