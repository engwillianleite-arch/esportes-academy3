import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getAttendanceHistory,
  exportAttendanceHistory,
  getSchoolDashboardSummary,
  getSchoolStudents,
  getSchoolTeamsList,
} from '../../api/schoolPortal'

const GRID = 8
const MODE_STUDENT = 'student'
const MODE_TEAM = 'team'
const PAGE_SIZES = [10, 25, 50]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
  breadcrumb: { marginBottom: GRID * 2, fontSize: 14 },
  breadcrumbLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  tabs: {
    display: 'flex',
    gap: 0,
    marginBottom: GRID * 3,
    borderBottom: '1px solid #eee',
  },
  tab: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    marginBottom: -1,
  },
  tabActive: { borderBottomColor: 'var(--azul-arena)', color: 'var(--azul-arena)' },
  section: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
  },
  sectionTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  field: { display: 'flex', flexDirection: 'column', gap: GRID / 2, minWidth: 140 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  input: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
  },
  select: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    minWidth: 200,
  },
  btn: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
  },
  btnPrimary: { background: 'var(--azul-arena)', color: '#fff' },
  btnSecondary: { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' },
  shortcutRow: { display: 'flex', flexWrap: 'wrap', gap: GRID, marginBottom: GRID * 2 },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  summaryCard: {
    padding: GRID * 2,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 'var(--radius)',
    textAlign: 'center',
  },
  summaryLabel: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.8, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: 700, color: 'var(--grafite-tecnico)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    background: 'var(--cinza-arquibancada)',
    borderBottom: '1px solid #eee',
  },
  td: { padding: `${GRID * 2}px ${GRID * 3}px`, borderBottom: '1px solid #eee', color: 'var(--grafite-tecnico)' },
  link: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  badgePresent: { background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500 },
  badgeAbsent: { background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500 },
  pagination: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginTop: GRID * 3,
    paddingTop: GRID * 2,
    borderTop: '1px solid #eee',
  },
  paginationLeft: { display: 'flex', alignItems: 'center', gap: GRID * 2 },
  paginationRight: { display: 'flex', alignItems: 'center', gap: GRID },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    fontSize: 14,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 4,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#991B1B', opacity: 0.9 },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  contextLocked: { fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9, marginBottom: GRID * 2 },
}

function TableSkeleton() {
  return (
    <div style={styles.section}>
      <div style={{ ...styles.skeleton, width: 160, marginBottom: GRID * 2 }} />
      <div style={{ ...styles.skeleton, width: '100%', height: 48, marginBottom: GRID * 2 }} />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} style={{ ...styles.skeleton, width: '100%', height: 44, marginBottom: GRID }} />
      ))}
    </div>
  )
}

export default function SchoolAttendanceHistory() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const studentIdFromUrl = searchParams.get('studentId') || ''
  const teamIdFromUrl = searchParams.get('teamId') || ''

  const [schoolName, setSchoolName] = useState('')
  const [mode, setMode] = useState(MODE_STUDENT)
  const [studentId, setStudentId] = useState(studentIdFromUrl)
  const [teamId, setTeamId] = useState(teamIdFromUrl)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [studentFilter, setStudentFilter] = useState('')

  const [students, setStudents] = useState([])
  const [teams, setTeams] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [exporting, setExporting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const studentLocked = Boolean(studentIdFromUrl)
  const teamLocked = Boolean(teamIdFromUrl)

  const hasRequiredFilter = mode === MODE_STUDENT ? Boolean(studentId) : Boolean(teamId)

  const fetchOptions = useCallback(() => {
    setLoadingOptions(true)
    Promise.all([
      getSchoolStudents({ page: 1, page_size: 200, status: 'active' }),
      getSchoolTeamsList({ page: 1, page_size: 100, status: 'active' }),
    ])
      .then(([studentsRes, teamsRes]) => {
        setStudents(studentsRes.items || [])
        setTeams(teamsRes.items || teamsRes.teams || [])
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false))
  }, [])

  useEffect(() => {
    getSchoolDashboardSummary()
      .then((s) => setSchoolName(s.school_name || ''))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (studentIdFromUrl) {
      setMode(MODE_STUDENT)
      setStudentId(studentIdFromUrl)
    }
    if (teamIdFromUrl) {
      setMode(MODE_TEAM)
      setTeamId(teamIdFromUrl)
    }
  }, [studentIdFromUrl, teamIdFromUrl])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const fetchHistory = useCallback(() => {
    if (!hasRequiredFilter) return
    setError(null)
    setLoading(true)
    const params = {
      page,
      page_size: pageSize,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      status: statusFilter || undefined,
    }
    if (mode === MODE_STUDENT) {
      params.student_id = studentId
      if (teamFilter) params.team_id = teamFilter
    } else {
      params.team_id = teamId
      if (studentFilter) params.student_id = studentFilter
    }
    getAttendanceHistory(params)
      .then((res) => setData(res))
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else setError(err?.message || 'Não foi possível carregar o histórico. Tente novamente.')
      })
      .finally(() => setLoading(false))
  }, [mode, studentId, teamId, fromDate, toDate, statusFilter, teamFilter, studentFilter, page, pageSize, hasRequiredFilter])

  useEffect(() => {
    if (hasRequiredFilter) fetchHistory()
    else setData(null)
  }, [fetchHistory, hasRequiredFilter, refreshKey])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=school', { replace: true })
  }, [permissionDenied, navigate])

  const handleApplyFilters = () => {
    setPage(1)
    setError(null)
    setRefreshKey((k) => k + 1)
  }

  const handleClearFilters = () => {
    if (!studentLocked) setStudentId('')
    if (!teamLocked) setTeamId('')
    setFromDate('')
    setToDate('')
    setStatusFilter('')
    setTeamFilter('')
    setStudentFilter('')
    setPage(1)
    setData(null)
  }

  const setPeriodShortcut = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setFromDate(start.toISOString().slice(0, 10))
    setToDate(end.toISOString().slice(0, 10))
  }

  const handleExport = () => {
    const params = { from_date: fromDate || undefined, to_date: toDate || undefined }
    if (mode === MODE_STUDENT) params.student_id = studentId
    else params.team_id = teamId
    setExporting(true)
    exportAttendanceHistory(params)
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `historico-presencas-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => setError('Não foi possível exportar.'))
      .finally(() => setExporting(false))
  }

  const subtitle = useMemo(() => {
    if (mode === MODE_STUDENT && studentId) {
      const s = students.find((x) => x.id === studentId)
      return s ? `Aluno: ${s.name}` : `Aluno: ${studentId}`
    }
    if (mode === MODE_TEAM && teamId) {
      const t = teams.find((x) => x.id === teamId)
      return t ? `Turma: ${t.name}` : `Turma: ${teamId}`
    }
    return 'Filtre por aluno ou turma'
  }, [mode, studentId, teamId, students, teams])

  const selectedStudentName = students.find((s) => s.id === studentId)?.name || ''
  const selectedTeamName = teams.find((t) => t.id === teamId)?.name || ''

  const goToAttendance = (item) => {
    if (item.training_id) {
      navigate(`/school/attendance?trainingId=${item.training_id}`)
    } else {
      navigate(`/school/attendance?teamId=${item.team_id}&date=${item.date}`)
    }
  }

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <nav style={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/school/dashboard" style={styles.breadcrumbLink} className="btn-hover">
            ← Dashboard
          </Link>
        </nav>
        <h1 style={styles.title}>Histórico de Presenças</h1>
        <p style={styles.subtitle}>{subtitle}</p>
      </header>

      {/* Modo: Por aluno / Por turma */}
      <div style={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === MODE_STUDENT}
          style={{ ...styles.tab, ...(mode === MODE_STUDENT ? styles.tabActive : {}) }}
          onClick={() => {
            setMode(MODE_STUDENT)
            if (!studentLocked) setStudentId('')
            setData(null)
          }}
          className="btn-hover"
        >
          Por aluno
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === MODE_TEAM}
          style={{ ...styles.tab, ...(mode === MODE_TEAM ? styles.tabActive : {}) }}
          onClick={() => {
            setMode(MODE_TEAM)
            if (!teamLocked) setTeamId('')
            setData(null)
          }}
          className="btn-hover"
        >
          Por turma
        </button>
      </div>

      {/* Filtros */}
      <section style={styles.section} aria-label="Filtros">
        <h2 style={styles.sectionTitle}>Filtros</h2>
        {(studentLocked || teamLocked) && (
          <p style={styles.contextLocked}>
            {studentLocked && `Aluno selecionado: ${selectedStudentName}`}
            {teamLocked && `Turma selecionada: ${selectedTeamName}`}
          </p>
        )}
        <div style={styles.shortcutRow}>
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnSecondary }}
            className="btn-hover"
            onClick={() => setPeriodShortcut(7)}
          >
            Últimos 7 dias
          </button>
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnSecondary }}
            className="btn-hover"
            onClick={() => setPeriodShortcut(30)}
          >
            Últimos 30 dias
          </button>
        </div>
        <div style={styles.filtersRow}>
          {mode === MODE_STUDENT && (
            <div style={styles.field}>
              <label style={styles.label} htmlFor="filter-student">Aluno</label>
              <select
                id="filter-student"
                style={styles.select}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={studentLocked || loadingOptions}
                aria-label="Selecionar aluno"
              >
                <option value="">Selecione o aluno</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          {mode === MODE_TEAM && (
            <div style={styles.field}>
              <label style={styles.label} htmlFor="filter-team">Turma</label>
              <select
                id="filter-team"
                style={styles.select}
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={teamLocked || loadingOptions}
                aria-label="Selecionar turma"
              >
                <option value="">Selecione a turma</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {mode === MODE_STUDENT && (
            <div style={styles.field}>
              <label style={styles.label} htmlFor="filter-team-opt">Turma (opcional)</label>
              <select
                id="filter-team-opt"
                style={styles.select}
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                disabled={loadingOptions}
                aria-label="Filtrar por turma"
              >
                <option value="">Todas</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {mode === MODE_TEAM && (
            <div style={styles.field}>
              <label style={styles.label} htmlFor="filter-student-opt">Aluno (opcional)</label>
              <select
                id="filter-student-opt"
                style={styles.select}
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                disabled={loadingOptions}
                aria-label="Filtrar por aluno"
              >
                <option value="">Todos</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="filter-from">De</label>
            <input
              id="filter-from"
              type="date"
              style={styles.input}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="Data início"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="filter-to">Até</label>
            <input
              id="filter-to"
              type="date"
              style={styles.input}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="Data fim"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
              style={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Status da presença"
            >
              <option value="">Todos</option>
              <option value="present">Presente</option>
              <option value="absent">Ausente</option>
              <option value="not_registered">Não registrado</option>
            </select>
          </div>
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnPrimary }}
            className="btn-hover"
            onClick={handleApplyFilters}
            disabled={!hasRequiredFilter || loading}
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnSecondary }}
            className="btn-hover"
            onClick={handleClearFilters}
          >
            Limpar
          </button>
        </div>
      </section>

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorText}>{error}</div>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              className="btn-hover"
              onClick={() => { setError(null); fetchHistory(); }}
            >
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!hasRequiredFilter && (
        <div style={styles.section}>
          <p style={styles.emptyState}>
            Selecione um aluno ou uma turma para visualizar o histórico.
          </p>
        </div>
      )}

      {loading && hasRequiredFilter && <TableSkeleton />}

      {!loading && hasRequiredFilter && data && (
        <>
          {/* Resumo (cards) — opcional */}
          {data.summary && mode === MODE_STUDENT && (
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Total de aulas no período</div>
                <div style={styles.summaryValue}>{data.summary.total_sessions ?? 0}</div>
              </div>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Presenças</div>
                <div style={styles.summaryValue}>{data.summary.present_count ?? 0}</div>
              </div>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Faltas</div>
                <div style={styles.summaryValue}>{data.summary.absent_count ?? 0}</div>
              </div>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>% de presença</div>
                <div style={styles.summaryValue}>{data.summary.attendance_rate ?? 0}%</div>
              </div>
            </div>
          )}

          <section style={styles.section} aria-label="Histórico">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: GRID * 2, marginBottom: GRID * 2 }}>
              <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Registros</h2>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                className="btn-hover"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>

            {!data.items || data.items.length === 0 ? (
              <p style={styles.emptyState}>
                Nenhum registro encontrado para o período selecionado.
              </p>
            ) : (
              <>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Data</th>
                        <th style={styles.th}>Turma</th>
                        <th style={styles.th}>Treino / Aula</th>
                        <th style={styles.th}>Presença</th>
                        <th style={styles.th}>Registrado por</th>
                        <th style={styles.th}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, idx) => (
                        <tr key={item.attendance_id || idx}>
                          <td style={styles.td}>{formatDate(item.date)}</td>
                          <td style={styles.td}>
                            <Link
                              to={`/school/teams/${item.team_id}`}
                              style={styles.link}
                              className="btn-hover"
                            >
                              {item.team_name || '—'}
                            </Link>
                          </td>
                          <td style={styles.td}>{item.training_title ?? 'Aula'}</td>
                          <td style={styles.td}>
                            {item.present !== undefined ? (
                              <span style={item.present ? styles.badgePresent : styles.badgeAbsent}>
                                {item.present ? 'Presente' : 'Ausente'}
                              </span>
                            ) : (
                              item.present_count != null && item.total_students != null
                                ? `${item.present_count}/${item.total_students} presentes`
                                : '—'
                            )}
                          </td>
                          <td style={styles.td}>
                            {item.recorded_by?.name ?? '—'}
                          </td>
                          <td style={styles.td}>
                            <button
                              type="button"
                              style={{ ...styles.btn, ...styles.btnSecondary, padding: `${GRID / 2}px ${GRID}px`, fontSize: 13 }}
                              className="btn-hover"
                              onClick={() => goToAttendance(item)}
                            >
                              Ver chamada
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                <div style={styles.pagination}>
                  <div style={styles.paginationLeft}>
                    <span style={{ fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
                      {data.total} {data.total === 1 ? 'registro' : 'registros'}
                    </span>
                    <select
                      style={{ ...styles.select, minWidth: 70, padding: `${GRID / 2}px ${GRID}px` }}
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                      aria-label="Itens por página"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.paginationRight}>
                    <button
                      type="button"
                      style={{ ...styles.btn, ...styles.btnSecondary }}
                      className="btn-hover"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Anterior
                    </button>
                    <span style={{ fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                      Página {page} de {Math.max(1, Math.ceil((data.total || 0) / pageSize))}
                    </span>
                    <button
                      type="button"
                      style={{ ...styles.btn, ...styles.btnSecondary }}
                      className="btn-hover"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= Math.ceil((data.total || 0) / pageSize)}
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </SchoolLayout>
  )
}
