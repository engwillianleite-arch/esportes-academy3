import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolTrainings, getSchoolTeams } from '../../api/schoolPortal'

const GRID = 8
const PAGE_SIZE_OPTIONS = [10, 25, 50]
const SORT_DEFAULT = 'date_desc'

const IconMore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="18" r="1.5"/>
  </svg>
)
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
  quickPeriod: {
    padding: `${GRID / 2}px ${GRID}px`,
    fontSize: 13,
    color: 'var(--azul-arena)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
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
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
  },
  statusPlanned: { background: '#DBEAFE', color: '#1E40AF' },
  statusCompleted: { background: '#D1FAE5', color: '#065F46' },
  statusCancelled: { background: '#FEE2E2', color: '#991B1B' },
  menuWrap: { position: 'relative', display: 'inline-block' },
  menuBtn: {
    padding: GRID,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 4,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  menuDropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: 4,
    minWidth: 180,
    background: 'var(--branco-luz)',
    border: '1px solid #eee',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    zIndex: 10,
    padding: GRID,
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: `${GRID}px ${GRID * 2}px`,
    textAlign: 'left',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 4,
    textDecoration: 'none',
  },
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

const canCreateTraining = true
const PRESENCA_MVP = true

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatTime(start, end) {
  if (!start && !end) return '—'
  if (start && end) return `${start} – ${end}`
  return start || end || '—'
}

const STATUS_LABEL = { planned: 'Planejado', completed: 'Realizado', cancelled: 'Cancelado' }

function getStatusStyle(s) {
  if (s === 'planned') return styles.statusPlanned
  if (s === 'completed') return styles.statusCompleted
  if (s === 'cancelled') return styles.statusCancelled
  return {}
}

function getToday() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function getWeekRange() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d)
  mon.setDate(diff)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) }
}

function getMonthRange() {
  const d = new Date()
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) }
}

function TrainingRow({ training, onCloseMenu, onNavigateToDetail }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <tr
      style={styles.trClick}
      className="btn-hover"
      onClick={(e) => {
        if (e.target.closest('[data-action-menu]')) return
        onNavigateToDetail?.(training.id)
      }}
    >
      <td style={styles.td}>{formatDate(training.date)}</td>
      <td style={styles.td}>{formatTime(training.start_time, training.end_time)}</td>
      <td style={styles.td}>{training.team_name || '—'}</td>
      <td style={styles.td}>{training.title || `Treino ${formatDate(training.date)}`}</td>
      <td style={styles.td}>
        {training.status != null ? (
          <span style={{ ...styles.statusBadge, ...getStatusStyle(training.status) }}>
            {STATUS_LABEL[training.status] ?? training.status}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td style={styles.td} data-action-menu onClick={(e) => e.stopPropagation()}>
        <div style={styles.menuWrap}>
          <button
            type="button"
            style={styles.menuBtn}
            aria-label="Ações"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <IconMore />
          </button>
          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                aria-hidden
                onClick={() => { setMenuOpen(false); onCloseMenu?.() }}
              />
              <div style={styles.menuDropdown}>
                <Link
                  to={`/school/trainings/${training.id}/edit`}
                  style={styles.menuItem}
                  onClick={() => { setMenuOpen(false); onCloseMenu?.() }}
                >
                  Editar
                </Link>
                {PRESENCA_MVP && (
                  <Link
                    to={`/school/attendance?trainingId=${training.id}`}
                    style={styles.menuItem}
                    onClick={() => { setMenuOpen(false); onCloseMenu?.() }}
                  >
                    Registrar presença
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </td>
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
            <th style={styles.th}>Horário</th>
            <th style={styles.th}>Turma</th>
            <th style={styles.th}>Título</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '70%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 80 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '50%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '60%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 80 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 24 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SchoolTrainings() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [teams, setTeams] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const teamIdFromQuery = searchParams.get('teamId') || ''

  const [teamId, setTeamId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sort] = useState(SORT_DEFAULT)

  useEffect(() => {
    if (teamIdFromQuery && !teamId) setTeamId(teamIdFromQuery)
  }, [teamIdFromQuery])

  const fetchTeams = useCallback(() => {
    getSchoolTeams()
      .then(setTeams)
      .catch(() => setTeams([]))
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const fetchTrainings = useCallback(() => {
    setError(null)
    setLoading(true)
    const params = {
      page,
      page_size: pageSize,
      sort,
      ...(teamId && { team_id: teamId }),
      ...(fromDate && { from_date: fromDate }),
      ...(toDate && { to_date: toDate }),
      ...(status && { status }),
    }
    getSchoolTrainings(params)
      .then((res) => setData(res))
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setError(err?.message || 'Não foi possível carregar os treinos. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [page, pageSize, sort, teamId, fromDate, toDate, status])

  useEffect(() => {
    fetchTrainings()
  }, [fetchTrainings])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const clearFilters = () => {
    setTeamId('')
    setFromDate('')
    setToDate('')
    setStatus('')
    setPage(1)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('teamId')
      return next
    })
  }

  const applyQuickPeriod = (type) => {
    if (type === 'today') {
      const t = getToday()
      setFromDate(t)
      setToDate(t)
    } else if (type === 'week') {
      const { from, to } = getWeekRange()
      setFromDate(from)
      setToDate(to)
    } else if (type === 'month') {
      const { from, to } = getMonthRange()
      setFromDate(from)
      setToDate(to)
    }
    setPage(1)
  }

  const schoolName = data?.school_name ?? ''
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = teamId || fromDate || toDate || status
  const isEmpty = !loading && !error && items.length === 0

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Treinos</h1>
        <p style={styles.subtitle}>Planejamento e histórico de treinos</p>
      </header>

      <div style={styles.toolbar}>
        <div />
        {canCreateTraining && (
          <Link
            to="/school/trainings/new"
            style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none' }}
            className="btn-hover"
          >
            Novo treino
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
          <option value="">Todas as turmas</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
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
        <span style={{ display: 'flex', alignItems: 'center', gap: GRID / 2 }}>
          <button type="button" style={styles.quickPeriod} onClick={() => applyQuickPeriod('today')} disabled={loading}>
            Hoje
          </button>
          <span style={{ opacity: 0.5 }}>|</span>
          <button type="button" style={styles.quickPeriod} onClick={() => applyQuickPeriod('week')} disabled={loading}>
            Esta semana
          </button>
          <span style={{ opacity: 0.5 }}>|</span>
          <button type="button" style={styles.quickPeriod} onClick={() => applyQuickPeriod('month')} disabled={loading}>
            Este mês
          </button>
        </span>
        <select
          aria-label="Status do treino"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          style={styles.select}
          disabled={loading}
        >
          <option value="">Status</option>
          <option value="planned">Planejado</option>
          <option value="completed">Realizado</option>
          <option value="cancelled">Cancelado</option>
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
            <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => fetchTrainings()}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!error && loading && <TableSkeleton rows={8} />}

      {!error && !loading && isEmpty && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            Nenhum treino encontrado para o período selecionado.
          </p>
          {canCreateTraining && (
            <Link
              to="/school/trainings/new"
              style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none', display: 'inline-block', marginTop: GRID }}
              className="btn-hover"
            >
              Novo treino
            </Link>
          )}
        </div>
      )}

      {!error && !loading && items.length > 0 && (
        <>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Horário</th>
                  <th style={styles.th}>Turma</th>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((training) => (
                  <TrainingRow
                    key={training.id}
                    training={training}
                    onNavigateToDetail={(id) => navigate(`/school/trainings/${id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Página {data.page} de {totalPages}
              {' · '}
              {total} {total === 1 ? 'treino' : 'treinos'}
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
