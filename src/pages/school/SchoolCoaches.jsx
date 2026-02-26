import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolCoachesList, updateCoachStatus } from '../../api/schoolPortal'

const GRID = 8

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
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

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const SORT_DEFAULT = 'name_asc'

const styles = {
  header: {
    marginBottom: GRID * 4,
  },
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
  searchRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  searchWrap: {
    flex: '1 1 280px',
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px ${GRID * 1.5}px ${GRID * 5}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
  },
  searchIcon: {
    position: 'absolute',
    left: GRID * 1.5,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--grafite-tecnico)',
    opacity: 0.5,
    pointerEvents: 'none',
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
  btn: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  btnPrimary: {
    background: 'var(--azul-arena)',
    color: '#fff',
  },
  btnSecondary: {
    background: 'var(--cinza-arquibancada)',
    color: 'var(--grafite-tecnico)',
  },
  tableWrap: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
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
  trClick: {
    cursor: 'pointer',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
  },
  statusActive: { background: '#D1FAE5', color: '#065F46' },
  statusInactive: { background: '#FEE2E2', color: '#991B1B' },
  menuWrap: {
    position: 'relative',
    display: 'inline-block',
  },
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
    minWidth: 140,
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
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
  },
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
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: GRID * 4,
  },
  modalBox: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    padding: GRID * 4,
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  modalText: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  modalActions: { display: 'flex', gap: GRID * 2, justifyContent: 'flex-end' },
  teamsPreview: { fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.85 },
}

const canCreateCoach = true

function formatContact(coach) {
  const parts = [coach.phone, coach.email].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

function formatTeams(coach) {
  if (coach.teams_count != null && coach.teams_count === 0) return 'Nenhuma'
  if (coach.teams_preview?.length) {
    return coach.teams_preview.length > 2
      ? `${coach.teams_preview.slice(0, 2).join(', ')} +${coach.teams_preview.length - 2}`
      : coach.teams_preview.join(', ')
  }
  if (coach.teams_count != null) return `${coach.teams_count} turma(s)`
  return '—'
}

function CoachRow({ coach, onCloseMenu, onNavigateToDetail, onConfirmStatus }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleToggleStatus = () => {
    setMenuOpen(false)
    onCloseMenu?.()
    const next = coach.status === 'active' ? 'inactive' : 'active'
    onConfirmStatus(coach, next)
  }

  return (
    <tr
      style={styles.trClick}
      className="btn-hover"
      onClick={(e) => {
        if (e.target.closest('[data-action-menu]')) return
        onNavigateToDetail?.(coach.id)
      }}
    >
      <td style={styles.td}>
        <strong>{coach.name}</strong>
      </td>
      <td style={styles.td}>
        <span
          style={{
            ...styles.statusBadge,
            ...(coach.status === 'active' ? styles.statusActive : styles.statusInactive),
          }}
        >
          {coach.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td style={styles.td}>{formatContact(coach)}</td>
      <td style={styles.td}>
        <span style={styles.teamsPreview}>{formatTeams(coach)}</span>
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
                  to={`/school/coaches/${coach.id}/edit`}
                  style={styles.menuItem}
                  onClick={() => { setMenuOpen(false); onCloseMenu?.() }}
                >
                  Editar
                </Link>
                <button type="button" style={styles.menuItem} onClick={handleToggleStatus}>
                  {coach.status === 'active' ? 'Inativar' : 'Ativar'}
                </button>
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
            <th style={styles.th}>Nome</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Contato</th>
            <th style={styles.th}>Turmas atribuídas</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '70%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 60 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '50%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '40%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 24 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SchoolCoaches() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sort] = useState(SORT_DEFAULT)

  const [confirmCoach, setConfirmCoach] = useState(null)
  const [confirmNextStatus, setConfirmNextStatus] = useState(null)
  const [toggling, setToggling] = useState(false)

  const hasFilters = q || status

  const fetchCoaches = useCallback(() => {
    setError(null)
    setLoading(true)
    const params = {
      page,
      page_size: pageSize,
      sort,
      ...(q && { q }),
      ...(status && { status }),
    }
    getSchoolCoachesList(params)
      .then((res) => setData(res))
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setError(err?.message || 'Não foi possível carregar os treinadores. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [page, pageSize, sort, q, status])

  useEffect(() => {
    fetchCoaches()
  }, [fetchCoaches])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const handleConfirmStatus = (coach, nextStatus) => {
    setConfirmCoach(coach)
    setConfirmNextStatus(nextStatus)
  }

  const handleConfirmClose = () => {
    if (!toggling) {
      setConfirmCoach(null)
      setConfirmNextStatus(null)
    }
  }

  const handleConfirmConfirm = () => {
    if (!confirmCoach || !confirmNextStatus) return
    setToggling(true)
    updateCoachStatus(confirmCoach.id, confirmNextStatus)
      .then(() => {
        setData((prev) => {
          if (!prev?.items) return prev
          return {
            ...prev,
            items: prev.items.map((c) =>
              c.id === confirmCoach.id ? { ...c, status: confirmNextStatus } : c
            ),
          }
        })
        setConfirmCoach(null)
        setConfirmNextStatus(null)
      })
      .catch(() => {})
      .finally(() => setToggling(false))
  }

  const clearFilters = () => {
    setQ('')
    setStatus('')
    setPage(1)
  }

  const schoolName = data?.school_name ?? ''
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isEmpty = !loading && !error && items.length === 0
  const isEmptyWithFilters = isEmpty && hasFilters

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Professores/Treinadores</h1>
        <p style={styles.subtitle}>Gestão da equipe técnica</p>
      </header>

      <div style={styles.toolbar}>
        <div />
        {canCreateCoach && (
          <Link to="/school/coaches/new" style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none' }} className="btn-hover">
            Novo treinador
          </Link>
        )}
      </div>

      <div style={styles.searchRow}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon} aria-hidden><IconSearch /></span>
          <input
            type="search"
            aria-label="Buscar"
            placeholder="Buscar por nome, telefone, e-mail"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
            style={styles.searchInput}
            disabled={loading}
          />
        </div>
      </div>

      <div style={styles.filtersRow}>
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          style={styles.select}
          disabled={loading}
        >
          <option value="">Status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
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
            <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => fetchCoaches()}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!error && loading && <TableSkeleton rows={8} />}

      {!error && !loading && isEmpty && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            {isEmptyWithFilters
              ? 'Nenhum treinador encontrado com os filtros aplicados.'
              : 'Nenhum treinador cadastrado ainda.'}
          </p>
          {isEmptyWithFilters ? (
            <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={clearFilters}>
              Limpar filtros
            </button>
          ) : canCreateCoach ? (
            <Link to="/school/coaches/new" style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none', display: 'inline-block', marginTop: GRID }} className="btn-hover">
              Novo treinador
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
                  <th style={styles.th}>Nome</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Contato</th>
                  <th style={styles.th}>Turmas atribuídas</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((coach) => (
                  <CoachRow
                    key={coach.id}
                    coach={coach}
                    onNavigateToDetail={(id) => navigate(`/school/coaches/${id}`)}
                    onConfirmStatus={handleConfirmStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Página {data.page} de {totalPages}
              {' · '}
              {total} {total === 1 ? 'treinador' : 'treinadores'}
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

      {confirmCoach && confirmNextStatus && (
        <div
          style={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-coach-title"
          onClick={(e) => e.target === e.currentTarget && handleConfirmClose()}
        >
          <div style={styles.modalBox}>
            <h2 id="confirm-coach-title" style={styles.modalTitle}>
              {confirmNextStatus === 'inactive' ? 'Inativar treinador?' : 'Ativar treinador?'}
            </h2>
            <p style={styles.modalText}>
              {confirmNextStatus === 'inactive'
                ? 'Tem certeza que deseja inativar este treinador?'
                : 'Tem certeza que deseja ativar este treinador?'}
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={handleConfirmClose}
                disabled={toggling}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={handleConfirmConfirm}
                disabled={toggling}
              >
                {toggling ? 'Salvando...' : confirmNextStatus === 'inactive' ? 'Inativar' : 'Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
