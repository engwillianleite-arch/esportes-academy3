import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getStandardsLibrary,
  LIBRARY_TYPE_METHODOLOGY,
  LIBRARY_TYPE_PRICING,
} from '../../api/franchisorPortal'
import { useDebounce } from '../../hooks/useDebounce'

const GRID = 8
const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'METHODOLOGY', label: 'Metodologia' },
  { value: 'PRICING', label: 'Preços sugeridos' },
]
const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
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

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function typeLabel(type) {
  if (type === LIBRARY_TYPE_METHODOLOGY) return 'Metodologia'
  if (type === LIBRARY_TYPE_PRICING) return 'Preços sugeridos'
  return type || '—'
}

const styles = {
  section: { marginBottom: GRID * 4 },
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  btnSecundario: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
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
  badge: {
    display: 'inline-block',
    padding: `${GRID / 2}px ${GRID * 1.5}px`,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  typeMetodologia: { background: 'rgba(44, 110, 242, 0.12)', color: 'var(--azul-arena)' },
  typePricing: { background: 'rgba(76, 203, 138, 0.2)', color: 'var(--verde-patrocinio)' },
  statusAtivo: { background: 'rgba(76, 203, 138, 0.2)', color: 'var(--verde-patrocinio)' },
  statusInativo: { background: 'rgba(58, 58, 60, 0.12)', color: 'var(--grafite-tecnico)', opacity: 0.9 },
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
  paginationControls: { display: 'flex', alignItems: 'center', gap: GRID },
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

function TypeBadge({ type }) {
  const style =
    type === LIBRARY_TYPE_METHODOLOGY
      ? { ...styles.badge, ...styles.typeMetodologia }
      : { ...styles.badge, ...styles.typePricing }
  return <span style={style}>{typeLabel(type)}</span>
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const style = s === 'ativo' ? { ...styles.badge, ...styles.statusAtivo } : { ...styles.badge, ...styles.statusInativo }
  return <span style={style}>{status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
}

function SkeletonRow() {
  return (
    <tr>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 80 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: '60%' }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 40 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 60 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 100 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 120 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 40 }} /></td>
    </tr>
  )
}

function RowActions({ item, libraryParams }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  const editPath =
    item.type === LIBRARY_TYPE_METHODOLOGY
      ? `/franchisor/standards/methodology?returnTo=${encodeURIComponent('/franchisor/standards/library' + (libraryParams ? '?' + libraryParams : ''))}`
      : `/franchisor/standards/pricing?returnTo=${encodeURIComponent('/franchisor/standards/library' + (libraryParams ? '?' + libraryParams : ''))}`

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
      <button
        type="button"
        style={styles.btnActions}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        aria-label="Ações"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <IconMore />
      </button>
      {open && (
        <div style={styles.dropdown} role="menu">
          <button
            type="button"
            style={styles.dropdownItem}
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate(`/franchisor/standards/library/${item.item_id}${libraryParams ? '?' + libraryParams : ''}`)
            }}
          >
            Ver histórico
          </button>
          <Link to={editPath} style={styles.dropdownItem} role="menuitem" onClick={() => setOpen(false)}>
            Editar
          </Link>
        </div>
      )}
    </div>
  )
}

export default function BibliotecaPadroesFranqueador() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const searchParam = searchParams.get('search') || ''
  const typeParam = searchParams.get('type') || ''
  const statusParam = searchParams.get('status') || ''
  const fromParam = searchParams.get('from') || ''
  const toParam = searchParams.get('to') || ''
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
    const next = new URLSearchParams(searchParams)
    if ((searchParams.get('search') || '') !== debouncedSearch) {
      if (debouncedSearch) next.set('search', debouncedSearch)
      else next.delete('search')
      next.set('page', '1')
      setSearchParams(next, { replace: true })
    }
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((me) => {
        if (!cancelled && !ALLOWED_ROLES.includes(me.user_role)) setPermissionDenied(true)
      })
      .catch(() => {
        if (!cancelled) setPermissionDenied(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (permissionDenied) return
    let cancelled = false
    setError(null)
    setLoading(true)
    const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
    const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get('page_size'), 10) || 10))
    getStandardsLibrary({
      search: searchParams.get('search') || '',
      type: searchParams.get('type') || '',
      status: searchParams.get('status') || '',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
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
        if (!cancelled) setError(err?.message || 'Não foi possível carregar a biblioteca. Tente novamente.')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setInitialLoad(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [permissionDenied, searchParams])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=franchisor', { replace: true })
  }, [permissionDenied, navigate])

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

  const clearFilters = () => {
    setSearchInput('')
    setSearchParams(
      new URLSearchParams({ page: '1', page_size: String(pageSizeParam) }),
      { replace: true }
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSizeParam))
  const currentPage = Math.min(pageParam, totalPages)
  const hasFilters =
    (searchParams.get('search') || '').trim() ||
    (searchParams.get('type') || '').trim() ||
    (searchParams.get('status') || '').trim() ||
    (searchParams.get('from') || '').trim() ||
    (searchParams.get('to') || '').trim()
  const libraryParams = searchParams.toString()

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Padrões' },
    { label: 'Biblioteca' },
  ]

  if (permissionDenied) return null

  return (
    <FranchisorLayout pageTitle="Biblioteca de Padrões" breadcrumb={breadcrumb}>
      <section style={styles.section} aria-label="Biblioteca de padrões">
        <div style={styles.headerRow}>
          <div style={{ ...styles.searchWrap, flex: '1 1 320px' }}>
            <span style={styles.searchIcon} aria-hidden="true">
              <IconSearch />
            </span>
            <input
              type="search"
              placeholder="Buscar por título, tipo ou versão"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={styles.searchInput}
              aria-label="Buscar por título, tipo ou versão"
            />
          </div>
        </div>

        <div style={styles.filtersRow}>
          <label htmlFor="filtro-type-lib" style={{ fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' }}>
            Tipo de padrão
          </label>
          <select
            id="filtro-type-lib"
            value={typeParam}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams)
              if (e.target.value) next.set('type', e.target.value)
              else next.delete('type')
              next.set('page', '1')
              setSearchParams(next, { replace: true })
            }}
            style={styles.select}
            aria-label="Tipo de padrão"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value || 'todos'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label htmlFor="filtro-status-lib" style={{ fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' }}>
            Status
          </label>
          <select
            id="filtro-status-lib"
            value={statusParam}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams)
              if (e.target.value) next.set('status', e.target.value)
              else next.delete('status')
              next.set('page', '1')
              setSearchParams(next, { replace: true })
            }}
            style={styles.select}
            aria-label="Status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'todos'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' }}>Alterado de</span>
          <input
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
            aria-label="Alterado de"
          />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' }}>até</span>
          <input
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
            aria-label="Alterado até"
          />
          {hasFilters && (
            <button type="button" style={styles.btnSecundario} onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
        </div>

        {error && (
          <div style={styles.errorBox} role="alert">
            <span style={styles.errorIcon}>
              <IconAlert />
            </span>
            <div style={styles.errorContent}>
              <div style={styles.errorTitle}>Erro</div>
              <div style={styles.errorText}>{error}</div>
              <button type="button" style={styles.btnReload} onClick={() => window.location.reload()}>
                Recarregar
              </button>
            </div>
          </div>
        )}

        {!error && (
          <div style={styles.tableWrap}>
            {loading ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Título / Item</th>
                    <th style={styles.th}>Versão atual</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Última alteração</th>
                    <th style={styles.th}>Alterado por</th>
                    <th style={styles.actionsCell} aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            ) : items.length === 0 ? (
              <div style={styles.emptyState}>
                <h2 style={styles.emptyTitle}>Nenhum padrão encontrado.</h2>
                <p style={styles.emptyText}>
                  {initialLoad && !hasFilters
                    ? 'Os padrões de metodologia e preços sugeridos aparecerão aqui.'
                    : 'Nenhum item corresponde aos filtros aplicados.'}
                </p>
              </div>
            ) : (
              <>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Tipo</th>
                      <th style={styles.th}>Título / Item</th>
                      <th style={styles.th}>Versão atual</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Última alteração</th>
                      <th style={styles.th}>Alterado por</th>
                      <th style={styles.actionsCell} aria-label="Ações" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.item_id}>
                        <td style={styles.td}>
                          <TypeBadge type={row.type} />
                        </td>
                        <td style={styles.td}>
                          <Link
                            to={`/franchisor/standards/library/${row.item_id}${libraryParams ? '?' + libraryParams : ''}`}
                            style={{ color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' }}
                          >
                            {row.title_or_name}
                          </Link>
                        </td>
                        <td style={styles.td}>{row.current_version || '—'}</td>
                        <td style={styles.td}>
                          <StatusBadge status={row.status} />
                        </td>
                        <td style={styles.td}>{formatDateTime(row.updated_at)}</td>
                        <td style={styles.td}>{row.updated_by_name || row.updated_by_email || '—'}</td>
                        <td style={styles.td}>
                          <RowActions item={row} libraryParams={libraryParams} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={styles.footer}>
                  <div style={styles.paginationInfo}>
                    {total} {total === 1 ? 'item' : 'itens'}
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
                    <label htmlFor="page-size-lib" style={{ marginLeft: GRID * 2, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                      Itens por página
                    </label>
                    <select
                      id="page-size-lib"
                      value={pageSizeParam}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      style={{ ...styles.select, marginLeft: GRID, minWidth: 70 }}
                      aria-label="Itens por página"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
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
