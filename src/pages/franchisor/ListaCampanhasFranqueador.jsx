import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import { getFranchisorMe, getFranchisorCampaigns } from '../../api/franchisorPortal'
import { useDebounce } from '../../hooks/useDebounce'

const GRID = 8
const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'ativa', label: 'Ativa' },
  { value: 'encerrada', label: 'Encerrada' },
]
const SEGMENT_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'ALL', label: 'Para todas as escolas' },
  { value: 'SCHOOL_LIST', label: 'Para escolas selecionadas' },
]
const PAGE_SIZES = [10, 25, 50]

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)
const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconMore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="6" r="1.5" />
    <circle cx="12" cy="18" r="1.5" />
  </svg>
)
const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
)

const styles = {
  section: { marginBottom: GRID * 4 },
  header: { marginBottom: GRID * 4 },
  searchRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 280px',
    minWidth: 200,
  },
  searchIcon: {
    position: 'absolute',
    left: GRID * 2 + 4,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--grafite-tecnico)',
    opacity: 0.5,
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px ${GRID * 1.5}px 40px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    background: 'var(--branco-luz)',
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  select: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    minWidth: 140,
  },
  inputDate: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    minWidth: 140,
  },
  btnLimpar: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  tableWrap: {
    overflowX: 'auto',
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    borderBottom: '2px solid var(--cinza-arquibancada)',
  },
  td: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderBottom: '1px solid #eee',
    color: 'var(--grafite-tecnico)',
    verticalAlign: 'middle',
  },
  rowClickable: { cursor: 'pointer' },
  linkAbrir: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  badge: {
    display: 'inline-block',
    padding: `${GRID / 2}px ${GRID * 1.5}px`,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  statusAtiva: { background: 'rgba(76, 203, 138, 0.2)', color: 'var(--verde-patrocinio)' },
  statusRascunho: { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' },
  statusEncerrada: { background: 'rgba(58, 58, 60, 0.12)', color: 'var(--grafite-tecnico)', opacity: 0.9 },
  actionsCell: { width: 56, textAlign: 'right' },
  btnActions: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    padding: 0,
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: 4,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    border: '1px solid #E5E5E7',
    minWidth: 180,
    zIndex: 50,
    padding: GRID,
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: 'none',
    borderRadius: 8,
    background: 'none',
    textAlign: 'left',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginTop: GRID * 3,
    padding: `${GRID * 2} 0`,
  },
  paginationInfo: { fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
  },
  btnPage: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 36,
    padding: `0 ${GRID}`,
    border: '1px solid #E5E5E7',
    borderRadius: 8,
    background: 'var(--branco-luz)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
  },
  btnPageDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  pageSizeSelect: { marginLeft: GRID * 2 },
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
    border: '1px solid rgba(0,0,0,0.04)',
  },
  emptyTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  emptyText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  emptyLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
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
  btnReload: {
    background: '#DC2626',
    color: '#fff',
    border: 'none',
    padding: `${GRID}px ${GRID * 2}px`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
}

const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

function formatDateBR(str) {
  if (!str) return '—'
  try {
    return new Date(str + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return str
  }
}

function formatDateTimeBR(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return str
  }
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const style =
    s === 'ativa'
      ? { ...styles.badge, ...styles.statusAtiva }
      : s === 'rascunho'
        ? { ...styles.badge, ...styles.statusRascunho }
        : { ...styles.badge, ...styles.statusEncerrada }
  return <span style={style}>{status || '—'}</span>
}

function SegmentacaoLabel({ target_type, target_schools_count }) {
  if (target_type === 'ALL' || !target_type) return 'Todas as escolas'
  if (target_type === 'SCHOOL_LIST' && target_schools_count != null) {
    return `${target_schools_count} ${target_schools_count === 1 ? 'escola' : 'escolas'}`
  }
  return 'Escolas selecionadas'
}

function SkeletonRow() {
  return (
    <tr>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: '70%' }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 60 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 100 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 80 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 90 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 40 }} /></td>
    </tr>
  )
}

function RowActions({ campaignId, searchParams }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const returnTo = `/franchisor/campaigns?${(searchParams || new URLSearchParams()).toString()}`

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
      <button
        type="button"
        style={styles.btnActions}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        aria-label="Ações"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <IconMore />
      </button>
      {open && (
        <div style={styles.dropdown} role="menu">
          <Link
            to={`/franchisor/campaigns/${campaignId}`}
            state={{ returnTo }}
            style={styles.dropdownItem}
            role="menuitem"
            onClick={(e) => e.stopPropagation()}
          >
            Ver detalhes
          </Link>
          <Link
            to={`/franchisor/campaigns/${campaignId}/edit`}
            state={{ returnTo }}
            style={styles.dropdownItem}
            role="menuitem"
            onClick={(e) => e.stopPropagation()}
          >
            Editar
          </Link>
        </div>
      )}
    </div>
  )
}

export default function ListaCampanhasFranqueador() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const searchParam = searchParams.get('search') || ''
  const statusParam = searchParams.get('status') || ''
  const fromParam = searchParams.get('from') || ''
  const toParam = searchParams.get('to') || ''
  const segmentParam = searchParams.get('segment') || searchParams.get('target_type') || ''
  const pageParam = parseInt(searchParams.get('page'), 10) || 1
  const pageSizeParam = Math.min(50, Math.max(10, parseInt(searchParams.get('page_size'), 10) || 10))

  const [searchInput, setSearchInput] = useState(searchParam)
  const debouncedSearch = useDebounce(searchInput, 400)

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    if (currentSearch === debouncedSearch) return
    const next = new URLSearchParams(searchParams)
    if (debouncedSearch) next.set('search', debouncedSearch)
    else next.delete('search')
    next.set('page', '1')
    setSearchParams(next, { replace: true })
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((me) => {
        if (!cancelled && !ALLOWED_ROLES.includes(me.user_role)) setPermissionDenied(true)
      })
      .catch(() => { if (!cancelled) setPermissionDenied(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (permissionDenied) return
    let cancelled = false
    setError(null)
    setLoading(true)
    const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
    const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get('page_size'), 10) || 10))
    getFranchisorCampaigns({
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
      target_type: searchParams.get('segment') || searchParams.get('target_type') || '',
      page,
      page_size: pageSize,
    })
      .then((res) => {
        if (!cancelled) {
          setItems(res.items || [])
          setTotal(res.total ?? 0)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Não foi possível carregar as campanhas. Tente novamente.')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setInitialLoad(false)
        }
      })
    return () => { cancelled = true }
  }, [permissionDenied, searchParams])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=franchisor', { replace: true })
    }
  }, [permissionDenied, navigate])

  const handleLimparFiltros = () => {
    setSearchInput('')
    setSearchParams(
      new URLSearchParams({
        page: '1',
        page_size: String(pageSizeParam),
      }),
      { replace: true }
    )
  }

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(Math.max(1, p)))
    setSearchParams(next, { replace: true })
  }

  const setPageSize = (size) => {
    const next = new URLSearchParams(searchParams)
    next.set('page_size', String(size))
    next.set('page', '1')
    setSearchParams(next, { replace: true })
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSizeParam))
  const currentPage = Math.min(pageParam, totalPages)
  const hasFilters =
    (searchParams.get('search') || '').trim() ||
    (searchParams.get('status') || '').trim() ||
    (searchParams.get('from') || '').trim() ||
    (searchParams.get('to') || '').trim() ||
    (searchParams.get('segment') || searchParams.get('target_type') || '').trim()

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Campanhas' },
  ]

  if (permissionDenied) return null

  return (
    <FranchisorLayout pageTitle="Campanhas" breadcrumb={breadcrumb}>
      <section style={styles.section} aria-label="Lista de campanhas">
        {/* Busca + Nova campanha */}
        <div style={styles.searchRow}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon} aria-hidden="true"><IconSearch /></span>
            <input
              type="search"
              placeholder="Buscar por nome da campanha"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={styles.searchInput}
              aria-label="Buscar por nome da campanha"
            />
          </div>
          <Link
            to="/franchisor/campaigns/new"
            style={{
              ...styles.btnLimpar,
              background: 'var(--azul-arena)',
              color: '#fff',
              padding: `${GRID * 1.5}px ${GRID * 3}px`,
              textDecoration: 'none',
            }}
            className="btn-hover"
          >
            Nova campanha
          </Link>
        </div>

        {/* Filtros */}
        <div style={styles.filtersRow}>
          <label htmlFor="filtro-status" style={{ fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' }}>
            Status
          </label>
          <select
            id="filtro-status"
            value={statusParam}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams)
              if (e.target.value) next.set('status', e.target.value)
              else next.delete('status')
              next.set('page', '1')
              setSearchParams(next, { replace: true })
            }}
            style={styles.select}
            aria-label="Filtrar por status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'todos'} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <label htmlFor="filtro-from" style={{ fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)', marginLeft: GRID }}>
            Período (início)
          </label>
          <input
            id="filtro-from"
            type="date"
            value={fromParam}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams)
              if (e.target.value) next.set('from', e.target.value)
              else next.delete('from')
              next.set('page', '1')
              setSearchParams(next, { replace: true })
            }}
            style={styles.inputDate}
            aria-label="Início de"
          />
          <input
            id="filtro-to"
            type="date"
            value={toParam}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams)
              if (e.target.value) next.set('to', e.target.value)
              else next.delete('to')
              next.set('page', '1')
              setSearchParams(next, { replace: true })
            }}
            style={styles.inputDate}
            aria-label="Até"
          />

          <label htmlFor="filtro-segment" style={{ fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)', marginLeft: GRID }}>
            Segmentação
          </label>
          <select
            id="filtro-segment"
            value={segmentParam}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams)
              if (e.target.value) next.set('segment', e.target.value)
              else next.delete('segment')
              next.set('page', '1')
              setSearchParams(next, { replace: true })
            }}
            style={styles.select}
            aria-label="Filtrar por segmentação"
          >
            {SEGMENT_OPTIONS.map((opt) => (
              <option key={opt.value || 'todas'} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {hasFilters && (
            <button type="button" style={styles.btnLimpar} onClick={handleLimparFiltros} className="btn-hover">
              Limpar filtros
            </button>
          )}
        </div>

        {/* Erro */}
        {error && (
          <div style={styles.errorBox} role="alert">
            <span style={styles.errorIcon}><IconAlert /></span>
            <div style={styles.errorContent}>
              <div style={styles.errorTitle}>Erro</div>
              <div style={styles.errorText}>{error}</div>
              <button type="button" style={styles.btnReload} onClick={() => window.location.reload()}>
                Recarregar
              </button>
            </div>
          </div>
        )}

        {/* Tabela ou estados vazios */}
        {!error && (
          <div style={styles.tableWrap}>
            {loading ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome da campanha</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Período</th>
                    <th style={styles.th}>Segmentação</th>
                    <th style={styles.th}>Última atualização</th>
                    <th style={styles.actionsCell} />
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            ) : items.length === 0 ? (
              <div style={styles.emptyState}>
                <h2 style={styles.emptyTitle}>Nenhuma campanha encontrada.</h2>
                <p style={styles.emptyText}>
                  {initialLoad && !hasFilters
                    ? 'Você ainda não possui campanhas. Crie a primeira.'
                    : 'Nenhuma campanha corresponde aos filtros atuais.'}
                </p>
                <p style={{ margin: 0 }}>
                  <Link to="/franchisor/campaigns/new" style={styles.emptyLink}>
                    Nova campanha
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nome da campanha</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Período</th>
                      <th style={styles.th}>Segmentação</th>
                      <th style={styles.th}>Última atualização</th>
                      <th style={styles.actionsCell} aria-label="Ações" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((c) => (
                      <tr
                        key={c.id}
                        style={styles.rowClickable}
                        onClick={() =>
                          navigate(`/franchisor/campaigns/${c.id}`, {
                            state: { returnTo: `/franchisor/campaigns?${searchParams.toString()}` },
                          })
                        }
                      >
                        <td style={styles.td}>{c.title}</td>
                        <td style={styles.td}>
                          <StatusBadge status={c.status} />
                        </td>
                        <td style={styles.td}>
                          {c.start_date
                            ? (c.end_date
                              ? `${formatDateBR(c.start_date)} → ${formatDateBR(c.end_date)}`
                              : formatDateBR(c.start_date))
                            : '—'}
                        </td>
                        <td style={styles.td}>
                          <SegmentacaoLabel target_type={c.target_type} target_schools_count={c.target_schools_count} />
                        </td>
                        <td style={styles.td}>{formatDateTimeBR(c.updated_at)}</td>
                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                          <RowActions campaignId={c.id} searchParams={searchParams} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Rodapé: paginação */}
                <div style={styles.footer}>
                  <div style={styles.paginationInfo}>
                    {total} {total === 1 ? 'campanha' : 'campanhas'}
                    {totalPages > 1 && ` · Página ${currentPage} de ${totalPages}`}
                  </div>
                  <div style={styles.paginationControls}>
                    <button
                      type="button"
                      style={{ ...styles.btnPage, ...(currentPage <= 1 ? styles.btnPageDisabled : {}) }}
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      aria-label="Página anterior"
                    >
                      <IconChevronLeft />
                    </button>
                    <span style={{ padding: `0 ${GRID}`, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      style={{ ...styles.btnPage, ...(currentPage >= totalPages ? styles.btnPageDisabled : {}) }}
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      aria-label="Próxima página"
                    >
                      <IconChevronRight />
                    </button>
                    <label htmlFor="page-size" style={{ marginLeft: GRID * 2, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                      Itens por página
                    </label>
                    <select
                      id="page-size"
                      value={pageSizeParam}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      style={{ ...styles.select, ...styles.pageSizeSelect, minWidth: 70 }}
                      aria-label="Itens por página"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </FranchisorLayout>
  )
}
