import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolDashboardSummary,
  createSchoolReportExport,
  listSchoolReportExports,
  downloadSchoolReportExport,
  schoolReportSupportsPdf,
} from '../../api/schoolPortal'
import { useAuth } from '../../contexts/AuthContext'

const GRID = 8
const PAGE_SIZE_OPTIONS = [10, 25, 50]
const STATUS_LABELS = {
  processing: 'Processando',
  ready: 'Pronto',
  failed: 'Falhou',
  expired: 'Expirado',
}

function getSchoolRole(memberships) {
  if (!Array.isArray(memberships)) return null
  const school = memberships.find((m) => m.portal === 'SCHOOL' && m.school_id)
  return school?.role ?? null
}

/** Roles que podem acessar exportações (mesmo escopo dos relatórios). */
const ALLOWED_ROLES = ['SchoolOwner', 'SchoolStaff', 'Finance', 'Coach']

function canAccessExports(userRole) {
  return userRole && ALLOWED_ROLES.includes(userRole)
}

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)
const IconDoc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    marginBottom: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  breadcrumbLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
  },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  newExportCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 4,
  },
  newExportContext: {
    marginBottom: GRID * 2,
    padding: GRID * 2,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  newExportContextTitle: { fontWeight: 600, marginBottom: GRID },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: GRID },
  filterLabel: { fontSize: 12, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  input: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    minWidth: 140,
  },
  select: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    minWidth: 180,
  },
  actionsRow: { display: 'flex', flexWrap: 'wrap', gap: GRID * 2, marginTop: GRID * 2 },
  btn: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  btnPrimary: { background: 'var(--azul-arena)', color: '#fff' },
  btnSecondary: { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' },
  btnSmall: {
    padding: `${GRID / 2}px ${GRID}px`,
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID / 2,
  },
  sectionTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  tableWrap: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    background: 'var(--cinza-arquibancada)',
    borderBottom: '1px solid #eee',
  },
  td: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderBottom: '1px solid #eee',
    color: 'var(--grafite-tecnico)',
  },
  pagination: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    padding: GRID * 2,
    borderTop: '1px solid #eee',
  },
  paginationInfo: { fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  paginationControls: { display: 'flex', alignItems: 'center', gap: GRID },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  successMsg: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: '#065F46',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 3,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 4,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 15, fontWeight: 600, color: '#991B1B' },
  errorText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#991B1B', opacity: 0.9 },
  pdfUnavailable: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.7, marginTop: GRID },
}

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

/** Resumo legível dos filtros para exibição. */
function filtersSummary(filters) {
  if (!filters || typeof filters !== 'object') return '—'
  const parts = []
  if (filters.from_date) parts.push(`De ${filters.from_date}`)
  if (filters.to_date) parts.push(`Até ${filters.to_date}`)
  if (filters.month) parts.push(`Mês ${filters.month}`)
  if (filters.team_id) parts.push('Turma filtrada')
  if (filters.student_id) parts.push('Aluno filtrado')
  if (filters.status) parts.push(`Status: ${filters.status}`)
  return parts.length ? parts.join(' · ') : 'Nenhum filtro'
}

function TableSkeleton({ rows = 5 }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}><div style={{ ...styles.skeleton, width: 100 }} /></th>
            <th style={styles.th}><div style={{ ...styles.skeleton, width: 140 }} /></th>
            <th style={styles.th}><div style={{ ...styles.skeleton, width: 60 }} /></th>
            <th style={styles.th}><div style={{ ...styles.skeleton, width: 90 }} /></th>
            <th style={styles.th}><div style={{ ...styles.skeleton, width: 120 }} /></th>
            <th style={styles.th}><div style={{ ...styles.skeleton, width: 140 }} /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {[1, 2, 3, 4, 5, 6].map((_, j) => (
                <td key={j} style={styles.td}>
                  <div style={{ ...styles.skeleton, width: j === 0 ? '80%' : '60%' }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SchoolReportExports() {
  const location = useLocation()
  const navigate = useNavigate()
  const { memberships } = useAuth()

  const state = location.state || {}
  const fromReport = state.fromReport === true
  const reportKey = state.reportKey || ''
  const reportTitle = state.reportTitle || reportKey || 'Relatório'
  const initialFilters = state.filters || {}

  const [schoolName, setSchoolName] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState({ items: [], page: 1, page_size: 25, total: 0 })
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [filterFormat, setFilterFormat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [createFormat, setCreateFormat] = useState('csv')
  const [createFileName, setCreateFileName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const schoolRole = getSchoolRole(memberships)
  const allowed = canAccessExports(schoolRole)
  const supportsPdf = reportKey ? schoolReportSupportsPdf(reportKey) : true

  const defaultFileName = reportKey
    ? `${reportKey}-${new Date().toISOString().slice(0, 10)}`
    : ''

  const fetchList = useCallback(() => {
    setLoading(true)
    const params = {
      page,
      page_size: pageSize,
      ...(fromDate && { from_date: fromDate }),
      ...(toDate && { to_date: toDate }),
      ...(filterFormat && { format: filterFormat }),
      ...(filterStatus && { status: filterStatus }),
    }
    listSchoolReportExports(params)
      .then(setList)
      .catch(() => setList({ items: [], page: 1, page_size: pageSize, total: 0 }))
      .finally(() => setLoading(false))
  }, [page, pageSize, fromDate, toDate, filterFormat, filterStatus, refreshKey])

  useEffect(() => {
    getSchoolDashboardSummary()
      .then((d) => setSchoolName(d?.school_name ?? ''))
      .catch((err) => {
        if (err?.status === 403 || err?.code === 'FORBIDDEN') setPermissionDenied(true)
      })
  }, [])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
      return
    }
    if (!allowed) return
    fetchList()
  }, [permissionDenied, navigate, allowed, fetchList])

  useEffect(() => {
    setPage(1)
  }, [fromDate, toDate, filterFormat, filterStatus])

  const handleBack = () => {
    if (fromReport && reportKey) {
      navigate(`/school/reports/${reportKey}`, { state: { filters: initialFilters }, replace: false })
    } else {
      navigate('/school/reports')
    }
  }

  const handleGenerate = () => {
    if (!reportKey) return
    setCreateError(null)
    setCreateSuccess(false)
    setCreating(true)
    const filters = { ...initialFilters }
    const file_name = createFileName.trim() || undefined
    createSchoolReportExport({
      report_key: reportKey,
      format: createFormat,
      filters,
      file_name: file_name || defaultFileName,
    })
      .then(() => {
        setCreateSuccess(true)
        setRefreshKey((k) => k + 1)
      })
      .catch((err) => {
        setCreateError(err?.message || 'Não foi possível gerar a exportação. Tente novamente.')
      })
      .finally(() => setCreating(false))
  }

  const handleCancelNew = () => {
    handleBack()
  }

  const handleDownload = (exportId) => {
    downloadSchoolReportExport(exportId)
  }

  const handleRefreshItem = () => {
    setRefreshKey((k) => k + 1)
  }

  const goToReport = (item) => {
    const filters = item.filters || {}
    navigate(`/school/reports/${item.report_key}`, { state: { filters } })
  }

  const totalPages = Math.max(1, Math.ceil((list.total || 0) / (list.page_size || 25)))

  if (permissionDenied) return null

  if (!allowed) {
    return (
      <SchoolLayout schoolName={schoolName}>
        <header style={styles.header}>
          <nav style={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/school/reports" style={styles.breadcrumbLink} className="btn-hover">
              <IconArrowLeft />
              Relatórios
            </Link>
            {' / '}
            <span>Exportações</span>
          </nav>
          <h1 style={styles.title}>Exportações</h1>
        </header>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Acesso Negado.</p>
          <Link to="/school/reports" style={styles.breadcrumbLink}>
            Voltar aos relatórios
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <nav style={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/school/reports" style={styles.breadcrumbLink} className="btn-hover">
            <IconArrowLeft />
            Relatórios
          </Link>
          {' / '}
          <span>Exportações</span>
        </nav>
        <h1 style={styles.title}>Exportações</h1>
        <p style={styles.subtitle}>CSV/PDF gerados a partir dos relatórios</p>
      </header>

      {fromReport && reportKey && (
        <div style={styles.newExportCard}>
          <div style={styles.newExportContext}>
            <div style={styles.newExportContextTitle}>{reportTitle}</div>
            <div>Filtros aplicados: {filtersSummary(initialFilters)}</div>
          </div>
          <div style={styles.filtersRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel} htmlFor="export-format">
                Formato
              </label>
              <select
                id="export-format"
                style={styles.select}
                value={createFormat}
                onChange={(e) => setCreateFormat(e.target.value)}
                disabled={creating}
              >
                <option value="csv">CSV</option>
                <option value="pdf" disabled={!supportsPdf}>
                  PDF
                </option>
              </select>
              {!supportsPdf && (
                <span style={styles.pdfUnavailable}>PDF indisponível para este relatório.</span>
              )}
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel} htmlFor="export-filename">
                Nome do arquivo (opcional)
              </label>
              <input
                id="export-filename"
                type="text"
                style={{ ...styles.input, minWidth: 220 }}
                placeholder={defaultFileName}
                value={createFileName}
                onChange={(e) => setCreateFileName(e.target.value)}
                disabled={creating}
              />
            </div>
          </div>
          {createSuccess && (
            <div style={styles.successMsg} role="status">
              Exportação iniciada. Ela aparecerá na lista com status.
            </div>
          )}
          {createError && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}><IconAlert /></span>
              <div style={styles.errorContent}>
                <div style={styles.errorTitle}>Erro</div>
                <div style={styles.errorText}>{createError}</div>
              </div>
            </div>
          )}
          <div style={styles.actionsRow}>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleGenerate}
              disabled={creating}
            >
              Gerar exportação
            </button>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleCancelNew}
              disabled={creating}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <section aria-label="Minhas exportações">
        <h2 style={styles.sectionTitle}>Minhas exportações</h2>

        <div style={{ ...styles.newExportCard, padding: GRID * 2, marginBottom: GRID * 2 }}>
          <div style={styles.filtersRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel} htmlFor="filter-from">De</label>
              <input
                id="filter-from"
                type="date"
                style={styles.input}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel} htmlFor="filter-to">Até</label>
              <input
                id="filter-to"
                type="date"
                style={styles.input}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel} htmlFor="filter-format">Formato</label>
              <select
                id="filter-format"
                style={styles.select}
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel} htmlFor="filter-status">Status</label>
              <select
                id="filter-status"
                style={styles.select}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="processing">Processando</option>
                <option value="ready">Pronto</option>
                <option value="failed">Falhou</option>
                <option value="expired">Expirado</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} />
        ) : !list.items || list.items.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Nenhuma exportação encontrada.</p>
            <Link to="/school/reports" style={styles.breadcrumbLink}>
              Ir para relatórios
            </Link>
          </div>
        ) : (
          <>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Data/Hora</th>
                    <th style={styles.th}>Relatório</th>
                    <th style={styles.th}>Formato</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Criado por</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((item) => (
                    <tr key={item.export_id}>
                      <td style={styles.td}>{formatDateTime(item.created_at)}</td>
                      <td style={styles.td}>{item.report_title || item.report_key || '—'}</td>
                      <td style={styles.td}>{(item.format || '').toUpperCase()}</td>
                      <td style={styles.td}>
                        {STATUS_LABELS[item.status] || item.status}
                        {item.status === 'failed' && item.error_message && (
                          <span style={{ display: 'block', fontSize: 12, opacity: 0.9, marginTop: 4 }}>
                            {item.error_message}
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {item.created_by?.name ?? '—'}
                      </td>
                      <td style={styles.td}>
                        <span style={{ display: 'flex', flexWrap: 'wrap', gap: GRID }}>
                          {item.status === 'ready' && (
                            <button
                              type="button"
                              style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }}
                              onClick={() => handleDownload(item.export_id)}
                            >
                              <IconDownload />
                              Baixar
                            </button>
                          )}
                          {item.status === 'processing' && (
                            <button
                              type="button"
                              style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }}
                              onClick={handleRefreshItem}
                            >
                              <IconRefresh />
                              Atualizar status
                            </button>
                          )}
                          {item.status === 'failed' && (
                            <button
                              type="button"
                              style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }}
                              onClick={handleRefreshItem}
                            >
                              Tentar novamente
                            </button>
                          )}
                          <button
                            type="button"
                            style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }}
                            onClick={() =>
                              navigate('/school/reports/exports', {
                                state: {
                                  fromReport: true,
                                  reportKey: item.report_key,
                                  reportTitle: item.report_title || item.report_key,
                                  filters: item.filters || {},
                                },
                                replace: true,
                              })
                            }
                          >
                            <IconRefresh />
                            Regerar
                          </button>
                          <button
                            type="button"
                            style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }}
                            onClick={() => goToReport(item)}
                          >
                            <IconDoc />
                            Ver relatório
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(totalPages > 1 || pageSize !== PAGE_SIZE_OPTIONS[0]) && (
              <div style={styles.pagination}>
                <span style={styles.paginationInfo}>
                  {list.total} resultado(s) · Página {list.page} de {totalPages}
                </span>
                <div style={styles.paginationControls}>
                  <select
                    aria-label="Itens por página"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    style={styles.select}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} por página
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    style={{ ...styles.btn, ...styles.btnSecondary }}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.btn, ...styles.btnSecondary }}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </SchoolLayout>
  )
}
