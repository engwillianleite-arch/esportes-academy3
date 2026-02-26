import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolEvents, getEventTypeLabel } from '../../api/schoolPortal'

const GRID = 8
const PAGE_SIZE_OPTIONS = [10, 25, 50]
const SORT_DEFAULT = 'date_asc'

function getDefaultPeriod() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + 30)
  return {
    from_date: from.toISOString().slice(0, 10),
    to_date: to.toISOString().slice(0, 10),
  }
}

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

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'campeonato', label: 'Campeonato' },
  { value: 'festival', label: 'Festival' },
  { value: 'treino_especial', label: 'Treino especial' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'confraternizacao', label: 'Confraternização' },
  { value: 'outro', label: 'Outro' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Passados' },
  { value: 'canceled', label: 'Cancelados' },
]

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
  searchInput: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    minWidth: 220,
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
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
  },
  statusUpcoming: { background: '#DBEAFE', color: '#1E40AF' },
  statusPast: { background: '#E5E7EB', color: '#374151' },
  statusCanceled: { background: '#FEE2E2', color: '#991B1B' },
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
    minWidth: 160,
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

const canCreateEvent = true
const canEditEvent = true

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr, startTime, endTime) {
  const d = formatDate(dateStr)
  if (!startTime && !endTime) return d
  if (startTime && endTime) return `${d} · ${startTime} – ${endTime}`
  return `${d} · ${startTime || endTime || ''}`
}

function getStatusLabel(s, dateStr) {
  if (s === 'canceled') return 'Cancelado'
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr >= today) return 'Próximo'
  return 'Passado'
}

function getStatusStyle(s, dateStr) {
  if (s === 'canceled') return styles.statusCanceled
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr >= today) return styles.statusUpcoming
  return styles.statusPast
}

function EventRow({ event, onCloseMenu, onNavigateToDetail }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <tr
      style={styles.trClick}
      className="btn-hover"
      onClick={(e) => {
        if (e.target.closest('[data-action-menu]')) return
        onNavigateToDetail?.(event.id)
      }}
    >
      <td style={styles.td}>{formatDateTime(event.date, event.start_time, event.end_time)}</td>
      <td style={styles.td}>{event.title || '—'}</td>
      <td style={styles.td}>{getEventTypeLabel(event.type)}</td>
      <td style={styles.td}>{event.location || '—'}</td>
      <td style={styles.td}>{event.audience_summary || '—'}</td>
      <td style={styles.td}>
        <span style={{ ...styles.statusBadge, ...getStatusStyle(event.status, event.date) }}>
          {getStatusLabel(event.status, event.date)}
        </span>
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
                {canEditEvent && event.status !== 'canceled' && (
                  <Link
                    to={`/school/events/${event.id}/edit`}
                    style={styles.menuItem}
                    onClick={() => { setMenuOpen(false); onCloseMenu?.() }}
                  >
                    Editar
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
            <th style={styles.th}>Título</th>
            <th style={styles.th}>Tipo</th>
            <th style={styles.th}>Local</th>
            <th style={styles.th}>Público</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '70%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '50%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 90 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '40%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 60 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 70 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 24 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SchoolEvents() {
  const navigate = useNavigate()
  const defaultPeriod = getDefaultPeriod()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [q, setQ] = useState('')
  const [fromDate, setFromDate] = useState(defaultPeriod.from_date)
  const [toDate, setToDate] = useState(defaultPeriod.to_date)
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sort] = useState(SORT_DEFAULT)

  const fetchEvents = useCallback(() => {
    setError(null)
    setLoading(true)
    const params = {
      page,
      page_size: pageSize,
      sort,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      ...(q.trim() && { q: q.trim() }),
      ...(type && { type }),
      ...(status && { status }),
    }
    getSchoolEvents(params)
      .then((res) => setData(res))
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setError(err?.message || 'Não foi possível carregar os eventos. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [page, pageSize, sort, q, fromDate, toDate, type, status])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const clearFilters = () => {
    setQ('')
    const def = getDefaultPeriod()
    setFromDate(def.from_date)
    setToDate(def.to_date)
    setType('')
    setStatus('')
    setPage(1)
  }

  const schoolName = data?.school_name ?? ''
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = q.trim() || type || status || fromDate !== defaultPeriod.from_date || toDate !== defaultPeriod.to_date
  const isEmpty = !loading && !error && items.length === 0
  const isEmptyWithFilters = isEmpty && hasFilters

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Eventos</h1>
        <p style={styles.subtitle}>Agenda e atividades especiais</p>
      </header>

      <div style={styles.toolbar}>
        <div />
        {canCreateEvent && (
          <Link
            to="/school/events/new"
            style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none' }}
            className="btn-hover"
          >
            Novo evento
          </Link>
        )}
      </div>

      <div style={styles.filtersRow}>
        <input
          type="search"
          aria-label="Buscar eventos"
          placeholder="Buscar por título, local"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          style={styles.searchInput}
          disabled={loading}
        />
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
          aria-label="Tipo de evento"
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1) }}
          style={styles.select}
          disabled={loading}
        >
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          style={styles.select}
          disabled={loading}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
          ))}
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
            <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => fetchEvents()}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!error && loading && <TableSkeleton rows={8} />}

      {!error && !loading && isEmpty && !isEmptyWithFilters && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            Nenhum evento cadastrado ainda.
          </p>
          {canCreateEvent && (
            <Link
              to="/school/events/new"
              style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none', display: 'inline-block', marginTop: GRID }}
              className="btn-hover"
            >
              Novo evento
            </Link>
          )}
        </div>
      )}

      {!error && !loading && isEmptyWithFilters && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            Nenhum evento encontrado com os filtros aplicados.
          </p>
          <button type="button" style={{ ...styles.btn, ...styles.btnSecondary, marginTop: GRID }} onClick={clearFilters}>
            Limpar filtros
          </button>
        </div>
      )}

      {!error && !loading && items.length > 0 && (
        <>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Local</th>
                  <th style={styles.th}>Público</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onNavigateToDetail={(id) => navigate(`/school/events/${id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Página {data.page} de {totalPages}
              {' · '}
              {total} {total === 1 ? 'evento' : 'eventos'}
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
