import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolAssessments, getSchoolTeams } from '../../api/schoolPortal'

const GRID = 8
const PAGE_SIZE_OPTIONS = [10, 25, 50]

const TYPE_LABELS = {
  tecnica: 'Técnica',
  fisica: 'Física',
  faixa: 'Faixa/Graduação',
  outro: 'Outro',
}

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: `${GRID}px 0 0`,
    fontSize: 15,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  searchInput: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    minWidth: 260,
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  select: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    minWidth: 160,
  },
  input: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    minWidth: 140,
  },
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
    marginTop: GRID * 3,
    padding: `${GRID * 2}px 0`,
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
    marginBottom: GRID * 3,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 15, fontWeight: 600, color: '#991B1B' },
  errorText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#991B1B', opacity: 0.9 },
}

const canCreateAssessment = true // exibir botão apenas se tiver permissão

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function AssessmentRow({ assessment, onNavigateToDetail }) {
  const typeLabel = assessment.type ? (TYPE_LABELS[assessment.type] ?? assessment.type) : '—'
  const titleDisplay = assessment.title || typeLabel || '—'
  return (
    <tr
      style={styles.trClick}
      className="btn-hover"
      onClick={() => onNavigateToDetail?.(assessment.id)}
    >
      <td style={styles.td}>{formatDate(assessment.date)}</td>
      <td style={styles.td}>{assessment.student_name || '—'}</td>
      <td style={styles.td}>{assessment.team_name ?? '—'}</td>
      <td style={styles.td}>{titleDisplay}</td>
      <td style={styles.td}>{assessment.result_summary ?? '—'}</td>
      <td style={styles.td}>{assessment.evaluator?.name ?? '—'}</td>
    </tr>
  )
}

function TableSkeleton({ rows = 5 }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Data</th>
            <th style={styles.th}>Aluno</th>
            <th style={styles.th}>Turma</th>
            <th style={styles.th}>Tipo / Título</th>
            <th style={styles.th}>Resultado</th>
            <th style={styles.th}>Avaliador</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '70%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '60%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '50%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '55%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 60 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '50%' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SchoolAssessments() {
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [teams, setTeams] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [q, setQ] = useState('')
  const [teamId, setTeamId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const fetchAssessments = useCallback(() => {
    setError(null)
    setLoading(true)
    const params = {
      page,
      page_size: pageSize,
      sort: 'date_desc',
      ...(q && { q: q.trim() }),
      ...(teamId && { team_id: teamId }),
      ...(studentId && { student_id: studentId }),
      ...(fromDate && { from_date: fromDate }),
      ...(toDate && { to_date: toDate }),
      ...(type && { type }),
    }
    getSchoolAssessments(params)
      .then((res) => {
        setData(res)
        if (res.teams) setTeams(res.teams)
        if (res.students) setStudents(res.students)
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setError(err?.message || 'Não foi possível carregar as avaliações. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [page, pageSize, q, teamId, studentId, fromDate, toDate, type])

  const fetchTeams = useCallback(() => {
    getSchoolTeams()
      .then(setTeams)
      .catch(() => setTeams([]))
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  useEffect(() => {
    if (data?.teams && data.teams.length > 0) setTeams((prev) => (prev.length ? prev : data.teams))
    if (data?.students && data.students.length > 0) setStudents((prev) => (prev.length ? prev : data.students))
  }, [data])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const clearFilters = () => {
    setQ('')
    setTeamId('')
    setStudentId('')
    setFromDate('')
    setToDate('')
    setType('')
    setPage(1)
  }

  const schoolName = data?.school_name ?? ''
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = q.trim() || teamId || studentId || fromDate || toDate || type
  const isEmpty = !loading && !error && items.length === 0
  const emptyWithFilters = isEmpty && hasFilters

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Avaliações</h1>
        <p style={styles.subtitle}>Resultados e registros por aluno/turma</p>
      </header>

      <div style={styles.toolbar}>
        <label style={{ display: 'flex', alignItems: 'center', gap: GRID, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
          Buscar
          <input
            type="search"
            aria-label="Buscar"
            placeholder="Aluno, turma, tipo de avaliação"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
            style={styles.searchInput}
            disabled={loading}
          />
        </label>
        {canCreateAssessment && (
          <Link
            to="/school/assessments/new"
            style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none' }}
            className="btn-hover"
          >
            Aplicar avaliação
          </Link>
        )}
      </div>

      <div style={styles.filtersRow}>
        <select
          aria-label="Turma"
          value={teamId}
          onChange={(e) => { setTeamId(e.target.value); setPage(1) }}
          style={styles.select}
          disabled={loading}
        >
          <option value="">Turma</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          aria-label="Aluno"
          value={studentId}
          onChange={(e) => { setStudentId(e.target.value); setPage(1) }}
          style={styles.select}
          disabled={loading}
        >
          <option value="">Aluno</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: GRID, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
          De
          <input
            type="date"
            aria-label="Data início"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
            style={styles.input}
            disabled={loading}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: GRID, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
          Até
          <input
            type="date"
            aria-label="Data fim"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1) }}
            style={styles.input}
            disabled={loading}
          />
        </label>
        <select
          aria-label="Tipo"
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1) }}
          style={styles.select}
          disabled={loading}
        >
          <option value="">Tipo</option>
          <option value="tecnica">Técnica</option>
          <option value="fisica">Física</option>
          <option value="faixa">Faixa/Graduação</option>
          <option value="outro">Outro</option>
        </select>
        {hasFilters && (
          <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={clearFilters}>
            Limpar filtros
          </button>
        )}
      </div>

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => fetchAssessments()}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!error && loading && <TableSkeleton rows={8} />}

      {!error && !loading && isEmpty && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            {emptyWithFilters
              ? 'Nenhuma avaliação encontrada com os filtros aplicados.'
              : 'Nenhuma avaliação registrada ainda.'}
          </p>
          {emptyWithFilters ? (
            <button type="button" style={{ ...styles.btn, ...styles.btnSecondary, marginTop: GRID }} onClick={clearFilters}>
              Limpar filtros
            </button>
          ) : canCreateAssessment ? (
            <Link
              to="/school/assessments/new"
              style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none', display: 'inline-block', marginTop: GRID }}
              className="btn-hover"
            >
              Aplicar avaliação
            </Link>
          ) : null}
        </div>
      )}

      {!error && !loading && items.length > 0 && (
        <>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Aluno</th>
                  <th style={styles.th}>Turma</th>
                  <th style={styles.th}>Tipo / Título</th>
                  <th style={styles.th}>Resultado</th>
                  <th style={styles.th}>Avaliador</th>
                </tr>
              </thead>
              <tbody>
                {items.map((assessment) => (
                  <AssessmentRow
                    key={assessment.id}
                    assessment={assessment}
                    onNavigateToDetail={(id) => navigate(`/school/assessments/${id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Página {data.page} de {totalPages}
              {' · '}
              {total} {total === 1 ? 'avaliação' : 'avaliações'}
              {' · '}
              Itens por página:
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                style={{ ...styles.select, marginLeft: GRID, width: 'auto', minWidth: 70 }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div style={styles.paginationControls}>
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
        </>
      )}
    </SchoolLayout>
  )
}
