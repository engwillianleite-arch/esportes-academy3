import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolReport,
  getSchoolDashboardSummary,
  getSchoolTeamsList,
  getSchoolStudents,
  formatCurrency,
} from '../../api/schoolPortal'
import { useAuth } from '../../contexts/AuthContext'

const GRID = 8
const PAGE_SIZE_OPTIONS = [10, 25, 50]

/** Catálogo de relatórios (mesmo da home) para RBAC e títulos. */
const REPORT_CATALOG = [
  { key: 'students_active', title: 'Alunos ativos', required_permissions: ['SchoolOwner', 'SchoolStaff'] },
  { key: 'students_by_team', title: 'Alunos por turma', required_permissions: ['SchoolOwner', 'SchoolStaff', 'Coach'] },
  { key: 'attendance_by_team', title: 'Presença por turma (período)', required_permissions: ['SchoolOwner', 'SchoolStaff', 'Coach'] },
  { key: 'attendance_by_student', title: 'Presença por aluno (período)', required_permissions: ['SchoolOwner', 'SchoolStaff', 'Coach'] },
  { key: 'monthly_summary', title: 'Mensalidades do mês (resumo)', required_permissions: ['SchoolOwner', 'SchoolStaff', 'Finance'] },
  { key: 'delinquency', title: 'Inadimplência (período/mês)', required_permissions: ['SchoolOwner', 'SchoolStaff', 'Finance'] },
]

/** Relatórios que exigem período (from_date/to_date ou month) para aplicar. */
const REPORTS_REQUIRING_PERIOD = ['attendance_by_team', 'attendance_by_student', 'monthly_summary', 'delinquency']

/** Relatórios que usam mês (competência) em vez de from/to. */
const REPORTS_USING_MONTH = ['monthly_summary']

function getSchoolRole(memberships) {
  if (!Array.isArray(memberships)) return null
  const school = memberships.find((m) => m.portal === 'SCHOOL' && m.school_id)
  return school?.role ?? null
}

function canViewReport(reportKey, userRole) {
  const report = REPORT_CATALOG.find((r) => r.key === reportKey)
  if (!report || !userRole) return false
  return report.required_permissions.includes(userRole)
}

function getReportTitle(reportKey) {
  return REPORT_CATALOG.find((r) => r.key === reportKey)?.title || reportKey || 'Relatório'
}

/** Formata data para input date (YYYY-MM-DD). */
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function lastDaysStr(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
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
  filtersCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 4,
  },
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
  atalhosRow: { display: 'flex', flexWrap: 'wrap', gap: GRID, marginBottom: GRID * 2 },
  atalhoBtn: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--azul-arena)',
    background: 'none',
    border: '1px solid var(--azul-arena)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
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
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  kpiCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 2,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  kpiLabel: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.85, marginBottom: GRID },
  kpiValue: { fontSize: 18, fontWeight: 700, color: 'var(--grafite-tecnico)' },
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
  trClick: { cursor: 'pointer' },
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
}

/** Resolve URL de drilldown a partir da linha e do template (ex: /school/students/:student_id). */
function resolveDrilldownUrl(template, row, columnKey) {
  if (!template) return null
  let url = template
  const match = url.match(/:(\w+)/g)
  if (match) {
    match.forEach((place) => {
      const key = place.slice(1)
      const value = row[key] ?? row[columnKey]
      if (value != null) url = url.replace(place, encodeURIComponent(String(value)))
    })
  }
  return url
}

/** Retorna a rota de drilldown para a célula (coluna + linha), se houver. */
function getDrilldownForCell(drilldown, columnKey, row) {
  if (!Array.isArray(drilldown)) return null
  const config = drilldown.find((d) => d.column_key === columnKey)
  if (!config?.target_route_template) return null
  const url = resolveDrilldownUrl(config.target_route_template, row, columnKey)
  return url || null
}

function formatCellValue(value, columnType) {
  if (value == null || value === '') return '—'
  if (columnType === 'currency') return formatCurrency(value)
  if (columnType === 'date' && typeof value === 'string') return value.split('T')[0]
  return String(value)
}

function ReportTable({ columns, rows, drilldown, onNavigate }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={styles.th}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={styles.trClick}
              className="btn-hover"
            >
              {columns.map((col) => {
                const url = getDrilldownForCell(drilldown, col.key, row)
                const value = row[col.key]
                const display = formatCellValue(value, col.type)
                const cell = (
                  <td
                    key={col.key}
                    style={styles.td}
                    onClick={() => {
                      if (url && onNavigate) onNavigate(url)
                    }}
                    role={url ? 'link' : undefined}
                  >
                    {display}
                  </td>
                )
                return cell
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TableSkeleton({ columnsCount = 4, rows = 5 }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {Array.from({ length: columnsCount }).map((_, i) => (
              <th key={i} style={styles.th}>
                <div style={{ ...styles.skeleton, width: 80 }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: columnsCount }).map((_, j) => (
                <td key={j} style={styles.td}>
                  <div style={{ ...styles.skeleton, width: j === 0 ? '70%' : '50%' }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div style={styles.kpiGrid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={styles.kpiCard}>
          <div style={{ ...styles.skeleton, width: '60%', marginBottom: GRID }} />
          <div style={{ ...styles.skeleton, width: '40%', height: 24 }} />
        </div>
      ))}
    </div>
  )
}

export default function SchoolReportDetail() {
  const { reportKey } = useParams()
  const navigate = useNavigate()
  const { memberships } = useAuth()

  const [schoolName, setSchoolName] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [fromDate, setFromDate] = useState(lastDaysStr(30))
  const [toDate, setToDate] = useState(todayStr())
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [teamId, setTeamId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [filtersApplied, setFiltersApplied] = useState(false)

  const [teams, setTeams] = useState([])
  const [students, setStudents] = useState([])

  const schoolRole = useMemo(() => getSchoolRole(memberships), [memberships])
  const allowed = useMemo(() => canViewReport(reportKey, schoolRole), [reportKey, schoolRole])
  const reportTitle = getReportTitle(reportKey)

  const requiresPeriod = REPORTS_REQUIRING_PERIOD.includes(reportKey)
  const usesMonth = REPORTS_USING_MONTH.includes(reportKey)
  const canApply =
    !requiresPeriod ||
    (usesMonth && month) ||
    (fromDate && toDate && fromDate <= toDate)

  const fetchReport = useCallback(() => {
    if (!reportKey) return
    setError(null)
    setLoading(true)
    const params = {
      page,
      page_size: pageSize,
      ...(fromDate && { from_date: fromDate }),
      ...(toDate && { to_date: toDate }),
      ...(usesMonth && { month }),
      ...(teamId && { team_id: teamId }),
      ...(studentId && { student_id: studentId }),
      ...(status && { status }),
    }
    getSchoolReport(reportKey, params)
      .then(setData)
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setError(err?.message || 'Não foi possível gerar o relatório. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [reportKey, page, pageSize, fromDate, toDate, month, teamId, studentId, status, usesMonth])

  useEffect(() => {
    getSchoolDashboardSummary()
      .then((d) => setSchoolName(d?.school_name ?? ''))
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
      })
  }, [])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
      return
    }
    if (!allowed || !reportKey) return
    if (filtersApplied || !requiresPeriod) {
      fetchReport()
    } else {
      setLoading(false)
    }
  }, [permissionDenied, navigate, allowed, reportKey, filtersApplied, requiresPeriod, fetchReport])

  useEffect(() => {
    if (!allowed) return
    getSchoolTeamsList({ page: 1, page_size: 100 })
      .then((r) => setTeams(r?.items ?? []))
      .catch(() => setTeams([]))
    getSchoolStudents({ page: 1, page_size: 200 })
      .then((r) => setStudents(r?.items ?? []))
      .catch(() => setStudents([]))
  }, [allowed])

  const handleApply = () => {
    setPage(1)
    setFiltersApplied(true)
  }

  const handleClear = () => {
    setFromDate(lastDaysStr(30))
    setToDate(todayStr())
    setMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
    setTeamId('')
    setStudentId('')
    setStatus('')
    setPage(1)
    setFiltersApplied(false)
  }

  const handleNavigate = (url) => {
    if (url) navigate(url)
  }

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isEmpty = !loading && !error && (!data?.rows?.length || data.rows.length === 0)
  const summary = data?.summary ?? []
  const columns = data?.columns ?? []
  const rows = data?.rows ?? []
  const drilldown = data?.drilldown

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
          </nav>
          <h1 style={styles.title}>{reportTitle}</h1>
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
          <span>{reportTitle}</span>
        </nav>
        <h1 style={styles.title}>{reportTitle}</h1>
        <p style={styles.subtitle}>Aplique filtros para gerar o relatório</p>
      </header>

      <div style={styles.filtersCard}>
        <div style={styles.filtersRow}>
          {!usesMonth && (
            <>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel} htmlFor="report-from">
                  De
                </label>
                <input
                  id="report-from"
                  type="date"
                  style={styles.input}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel} htmlFor="report-to">
                  Até
                </label>
                <input
                  id="report-to"
                  type="date"
                  style={styles.input}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}
          {usesMonth && (
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel} htmlFor="report-month">
                Competência (mês)
              </label>
              <input
                id="report-month"
                type="month"
                style={styles.input}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
          {['students_active', 'students_by_team', 'attendance_by_team', 'attendance_by_student'].includes(reportKey) && (
            <>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel} htmlFor="report-team">
                  Turma
                </label>
                <select
                  id="report-team"
                  style={styles.select}
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Todas</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              {['students_active', 'attendance_by_student'].includes(reportKey) && (
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel} htmlFor="report-student">
                    Aluno
                  </label>
                  <select
                    id="report-student"
                    style={styles.select}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Todos</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          {['students_active', 'delinquency'].includes(reportKey) && (
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel} htmlFor="report-status">
                Status
              </label>
              <select
                id="report-status"
                style={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
              >
                <option value="">Todos</option>
                {reportKey === 'students_active' && (
                  <>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </>
                )}
                {reportKey === 'delinquency' && (
                  <>
                    <option value="overdue">Em atraso</option>
                    <option value="open">Em aberto</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>
        {!usesMonth && (
          <div style={styles.atalhosRow}>
            <button
              type="button"
              style={styles.atalhoBtn}
              onClick={() => {
                setFromDate(lastDaysStr(7))
                setToDate(todayStr())
              }}
              disabled={loading}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              style={styles.atalhoBtn}
              onClick={() => {
                setFromDate(lastDaysStr(30))
                setToDate(todayStr())
              }}
              disabled={loading}
            >
              Últimos 30 dias
            </button>
          </div>
        )}
        <div style={styles.actionsRow}>
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleApply}
            disabled={!canApply || loading}
          >
            Aplicar
          </button>
          <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handleClear} disabled={loading}>
            Limpar
          </button>
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={() =>
              navigate('/school/reports/exports', {
                state: {
                  fromReport: true,
                  reportKey,
                  reportTitle,
                  filters: {
                    ...(fromDate && { from_date: fromDate }),
                    ...(toDate && { to_date: toDate }),
                    ...(usesMonth && month && { month }),
                    ...(teamId && { team_id: teamId }),
                    ...(studentId && { student_id: studentId }),
                    ...(status && { status }),
                  },
                },
              })
            }
            disabled={loading}
          >
            Exportar
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}>
            <IconAlert />
          </span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro</div>
            <div style={styles.errorText}>{error}</div>
            <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => fetchReport()}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!error && (
        <>
          {loading && (
            <>
              <KpiSkeleton />
              <TableSkeleton columnsCount={columns.length || 4} rows={8} />
            </>
          )}

          {!loading && requiresPeriod && !filtersApplied && (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>Aplique os filtros e clique em Aplicar para gerar o relatório.</p>
            </div>
          )}

          {!loading && data && (
            <>
              {summary.length > 0 && (
                <div style={styles.kpiGrid}>
                  {summary.map((s) => (
                    <div key={s.key} style={styles.kpiCard}>
                      <div style={styles.kpiLabel}>{s.label}</div>
                      <div style={styles.kpiValue}>
                        {typeof s.value === 'number' ? formatCurrency(s.value) : String(s.value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isEmpty ? (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>Nenhum dado encontrado para os filtros selecionados.</p>
                  <Link to="/school/reports" style={styles.breadcrumbLink}>
                    Voltar aos relatórios
                  </Link>
                </div>
              ) : (
                <>
                  <ReportTable
                    columns={columns}
                    rows={rows}
                    drilldown={drilldown}
                    onNavigate={handleNavigate}
                  />
                  {totalPages > 1 || pageSize !== PAGE_SIZE_OPTIONS[0] ? (
                    <div style={styles.pagination}>
                      <span style={styles.paginationInfo}>
                        {total} resultado(s) · Página {page} de {totalPages}
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
                  ) : null}
                </>
              )}
            </>
          )}
        </>
      )}
    </SchoolLayout>
  )
}
