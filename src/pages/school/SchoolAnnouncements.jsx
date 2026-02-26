import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolAnnouncements } from '../../api/schoolPortal'
import { useDebounce } from '../../hooks/useDebounce'

const GRID = 8
const PAGE_SIZE_OPTIONS = [10, 25, 50]

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
// MVP: exibir botão de criar; backend valida permissão (SchoolOwner, SchoolStaff).
const canCreateAnnouncement = true

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
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    cursor: 'pointer',
    textAlign: 'left',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  cardTitle: {
    margin: '0 0 ' + GRID + 'px',
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  cardPreview: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    lineHeight: 1.45,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
  },
  statusPublished: { background: '#D1FAE5', color: '#065F46' },
  statusDraft: { background: '#FEF3C7', color: '#92400E' },
  statusArchived: { background: '#E5E7EB', color: '#374151' },
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
}

function formatDate(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return value
  }
}

function CardSkeleton() {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.skeleton, width: '60%', height: 20, marginBottom: GRID }} />
      <div style={{ ...styles.skeleton, width: '100%', height: 16, marginBottom: GRID }} />
      <div style={{ ...styles.skeleton, width: '80%', height: 16, marginBottom: GRID * 2 }} />
      <div style={{ ...styles.skeleton, width: 120, height: 14 }} />
    </div>
  )
}

function AnnouncementCard({ item }) {
  const dateDisplay = item.published_at || item.created_at
  const statusStyle =
    item.status === 'published'
      ? styles.statusPublished
      : item.status === 'draft'
        ? styles.statusDraft
        : styles.statusArchived
  const statusLabel =
    item.status === 'published' ? 'Publicado' : item.status === 'draft' ? 'Rascunho' : 'Arquivado'

  return (
    <Link
      to={`/school/announcements/${item.id}`}
      style={styles.card}
      className="btn-hover"
      aria-label={`Ver comunicado: ${item.title}`}
    >
      <h3 style={styles.cardTitle}>{item.title}</h3>
      {item.content_preview && (
        <p style={styles.cardPreview}>{item.content_preview}</p>
      )}
      <div style={styles.cardMeta}>
        <span>{formatDate(dateDisplay)}</span>
        {item.author?.name && <span>{item.author.name}</span>}
        {item.audience_summary && <span>{item.audience_summary}</span>}
        <span style={{ ...styles.statusBadge, ...statusStyle }}>{statusLabel}</span>
      </div>
    </Link>
  )
}

export default function SchoolAnnouncements() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [q, setQ] = useState('')
  const debouncedQ = useDebounce(q, 350)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const hasFilters = debouncedQ || status

  const fetchAnnouncements = useCallback(() => {
    setError(null)
    setLoading(true)
    const params = {
      page,
      page_size: pageSize,
      ...(debouncedQ && { q: debouncedQ }),
      ...(status && { status }),
    }
    getSchoolAnnouncements(params)
      .then((res) => setData(res))
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setError(err?.message || 'Não foi possível carregar os comunicados. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [page, pageSize, debouncedQ, status])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, status])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

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
        <h1 style={styles.title}>Comunicados</h1>
        <p style={styles.subtitle}>Mural da escola</p>
      </header>

      <div style={styles.toolbar}>
        <div />
        {canCreateAnnouncement && (
          <Link
            to="/school/announcements/new"
            style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none' }}
            className="btn-hover"
          >
            Novo comunicado
          </Link>
        )}
      </div>

      <div style={styles.searchRow}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon} aria-hidden><IconSearch /></span>
          <input
            type="search"
            aria-label="Buscar comunicados"
            placeholder="Buscar por título ou conteúdo"
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
          <option value="published">Publicado</option>
          <option value="draft">Rascunho</option>
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
            <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={fetchAnnouncements}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!error && loading && (
        <div style={styles.cardList}>
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && !loading && isEmpty && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            {isEmptyWithFilters
              ? 'Nenhum comunicado encontrado com os filtros aplicados.'
              : 'Nenhum comunicado publicado ainda.'}
          </p>
          {isEmptyWithFilters ? (
            <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={clearFilters}>
              Limpar filtros
            </button>
          ) : canCreateAnnouncement ? (
            <Link
              to="/school/announcements/new"
              style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none', display: 'inline-block', marginTop: GRID }}
              className="btn-hover"
            >
              Novo comunicado
            </Link>
          ) : null}
        </div>
      )}

      {!error && !loading && items.length > 0 && (
        <>
          <div style={styles.cardList}>
            {items.map((item) => (
              <AnnouncementCard key={item.id} item={item} />
            ))}
          </div>

          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Página {data.page} de {totalPages}
              {' · '}
              {total} {total === 1 ? 'comunicado' : 'comunicados'}
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
