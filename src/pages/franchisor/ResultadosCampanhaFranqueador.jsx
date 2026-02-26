import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useLocation, useSearchParams } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorCampaignById,
  getFranchisorCampaignResultsSummary,
  getFranchisorCampaignResultsBySchool,
} from '../../api/franchisorPortal'

const GRID = 8
const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']
const PAGE_SIZES = [10, 25, 50]

const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
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
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  titleRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: GRID * 2 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
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
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 3}px`,
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  btnExport: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 3}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cardLabel: { fontSize: 12, fontWeight: 600, color: 'var(--grafite-tecnico)', opacity: 0.8, marginBottom: GRID },
  cardValue: { fontSize: 22, fontWeight: 700, color: 'var(--grafite-tecnico)' },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 260px',
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
  select: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    minWidth: 160,
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
  linkAbrir: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  badgeSchool: {
    display: 'inline-block',
    padding: `${GRID / 2}px ${GRID * 1.5}px`,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 4,
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
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  emptyLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  pagination: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginTop: GRID * 2,
    padding: GRID * 2,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  paginationButtons: { display: 'flex', alignItems: 'center', gap: GRID },
  paginationBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 36,
    padding: 0,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
    fontSize: 14,
  },
  paginationBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
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
  const label = s === 'ativa' ? 'Ativa' : s === 'rascunho' ? 'Rascunho' : s === 'encerrada' ? 'Encerrada' : status || '—'
  return <span style={style}>{label}</span>
}

function SchoolStatusBadge({ status }) {
  const label = status === 'Ativa' ? 'Ativa' : status === 'Suspensa' ? 'Suspensa' : status === 'Pendente' ? 'Pendente' : status || '—'
  const style =
    status === 'Ativa'
      ? { ...styles.badgeSchool, background: 'rgba(76, 203, 138, 0.2)', color: 'var(--verde-patrocinio)' }
      : status === 'Pendente'
        ? { ...styles.badgeSchool, background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' }
        : { ...styles.badgeSchool, background: 'rgba(58, 58, 60, 0.12)', color: 'var(--grafite-tecnico)', opacity: 0.9 }
  return <span style={style}>{label}</span>
}

function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.skeleton, width: '60%', marginBottom: GRID, height: 12 }} />
      <div style={{ ...styles.skeleton, width: '80%', height: 24 }} />
    </div>
  )
}

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nome (A-Z)' },
  { value: 'name_desc', label: 'Nome (Z-A)' },
  { value: 'worst_first', label: 'Pior desempenho primeiro' },
  { value: 'best_first', label: 'Melhor desempenho primeiro' },
]
const EXECUTION_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'NOT_STARTED', label: 'Não iniciado' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'DONE', label: 'Concluído' },
]
const CONFIRMATION_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'CONFIRMED', label: 'Confirmou' },
  { value: 'NOT_CONFIRMED', label: 'Não confirmou' },
]

export default function ResultadosCampanhaFranqueador() {
  const { campaign_id } = useParams()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const returnTo = location.state?.returnTo || `/franchisor/campaigns/${campaign_id}`

  const [campaign, setCampaign] = useState(null)
  const [summary, setSummary] = useState(null)
  const [bySchool, setBySchool] = useState({ items: [], total: 0 })
  const [loadingCampaign, setLoadingCampaign] = useState(true)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingTable, setLoadingTable] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const search = searchParams.get('search') || ''
  const executionStatus = searchParams.get('execution_status') || ''
  const confirmationStatus = searchParams.get('confirmation_status') || ''
  const sort = searchParams.get('sort') || 'name_asc'
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
  const pageSize = Math.max(10, Math.min(50, parseInt(searchParams.get('page_size'), 10) || 10))

  const breadcrumb = useMemo(
    () => [
      { label: 'Campanhas', to: '/franchisor/campaigns' },
      { label: campaign?.title || 'Campanha', to: campaign_id ? `/franchisor/campaigns/${campaign_id}` : undefined },
      { label: 'Resultados' },
    ],
    [campaign?.title, campaign_id]
  )

  const hasConfirmation = summary != null && typeof summary.confirmed_schools_count === 'number'
  const hasAdoptionRate = summary != null && typeof summary.adoption_rate === 'number'

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
    if (!campaign_id) return
    let cancelled = false
    setLoadingCampaign(true)
    setError(null)
    setNotFound(false)
    getFranchisorCampaignById(campaign_id)
      .then((data) => {
        if (cancelled) return
        if (data == null) setNotFound(true)
        else setCampaign(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err?.status === 403) setPermissionDenied(true)
        else if (err?.status === 404) setNotFound(true)
        else setError(err?.message || 'Não foi possível carregar a campanha.')
      })
      .finally(() => { if (!cancelled) setLoadingCampaign(false) })
    return () => { cancelled = true }
  }, [campaign_id])

  useEffect(() => {
    if (!campaign_id) return
    let cancelled = false
    setLoadingSummary(true)
    getFranchisorCampaignResultsSummary(campaign_id)
      .then((data) => {
        if (!cancelled) setSummary(data || null)
      })
      .catch(() => { if (!cancelled) setSummary(null) })
      .finally(() => { if (!cancelled) setLoadingSummary(false) })
    return () => { cancelled = true }
  }, [campaign_id])

  useEffect(() => {
    if (!campaign_id) return
    let cancelled = false
    setLoadingTable(true)
    getFranchisorCampaignResultsBySchool(campaign_id, {
      search,
      execution_status: executionStatus,
      confirmation_status: confirmationStatus,
      sort,
      page,
      page_size: pageSize,
    })
      .then((res) => {
        if (!cancelled) setBySchool({ items: res.items || [], total: res.total ?? 0 })
      })
      .catch(() => { if (!cancelled) setBySchool({ items: [], total: 0 }) })
      .finally(() => { if (!cancelled) setLoadingTable(false) })
    return () => { cancelled = true }
  }, [campaign_id, search, executionStatus, confirmationStatus, sort, page, pageSize])

  const handleSearchChange = (e) => {
    const next = new URLSearchParams(searchParams)
    const v = e.target.value
    if (v) next.set('search', v)
    else next.delete('search')
    next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const handleExecutionChange = (e) => {
    const next = new URLSearchParams(searchParams)
    const v = e.target.value
    if (v) next.set('execution_status', v)
    else next.delete('execution_status')
    next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const handleConfirmationChange = (e) => {
    const next = new URLSearchParams(searchParams)
    const v = e.target.value
    if (v) next.set('confirmation_status', v)
    else next.delete('confirmation_status')
    next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const handleSortChange = (e) => {
    const next = new URLSearchParams(searchParams)
    const v = e.target.value
    next.set('sort', v || 'name_asc')
    next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const handleClearFilters = () => {
    setSearchParams({}, { replace: true })
  }

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(Math.max(1, p)))
    setSearchParams(next, { replace: true })
  }

  const totalPages = Math.ceil((bySchool.total || 0) / pageSize)
  const hasFilters = search || executionStatus || confirmationStatus

  if (permissionDenied) {
    return (
      <FranchisorLayout pageTitle="Resultados da campanha" breadcrumb={breadcrumb}>
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>Acesso Negado.</h2>
        </div>
      </FranchisorLayout>
    )
  }

  if (!campaign_id) {
    return (
      <FranchisorLayout pageTitle="Resultados da campanha" breadcrumb={breadcrumb}>
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>Campanha não encontrada.</h2>
          <Link to="/franchisor/campaigns" style={styles.emptyLink}>Voltar para campanhas</Link>
        </div>
      </FranchisorLayout>
    )
  }

  if (notFound && !loadingCampaign) {
    return (
      <FranchisorLayout pageTitle="Resultados da campanha" breadcrumb={breadcrumb}>
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>Campanha não encontrada.</h2>
          <Link to="/franchisor/campaigns" style={styles.emptyLink}>Voltar para campanhas</Link>
        </div>
      </FranchisorLayout>
    )
  }

  if (error && !campaign) {
    return (
      <FranchisorLayout pageTitle="Resultados da campanha" breadcrumb={breadcrumb}>
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <h2 style={styles.errorTitle}>Não foi possível carregar os resultados.</h2>
            <p style={styles.errorText}>{error}</p>
            <button type="button" style={styles.btnReload} onClick={() => window.location.reload()}>
              Recarregar
            </button>
          </div>
        </div>
      </FranchisorLayout>
    )
  }

  return (
    <FranchisorLayout pageTitle="Resultados da campanha" breadcrumb={breadcrumb}>
      {loadingCampaign && !campaign ? (
        <div style={styles.section}>
          <div style={{ ...styles.skeleton, width: '50%', height: 28, marginBottom: GRID }} />
          <div style={{ ...styles.skeleton, width: '30%', height: 20 }} />
        </div>
      ) : campaign && (
        <>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.title}>Resultados da campanha</h1>
              <p style={styles.subtitle}>{campaign.title}</p>
              <div style={{ marginTop: GRID }}>
                <StatusBadge status={campaign.status} />
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: GRID * 2 }}>
              <Link
                to={returnTo}
                state={{ returnTo: location.state?.returnTo }}
                style={styles.btnSecondary}
                className="btn-hover"
              >
                <IconArrowLeft />
                Voltar para a campanha
              </Link>
              <Link
                to={`/franchisor/exports/new?type=CAMPAIGN_RESULTS&campaign_id=${campaign_id}`}
                style={styles.btnExport}
                className="btn-hover"
              >
                Exportar
              </Link>
            </div>
          </div>

          {/* Resumo (cards) */}
          <section style={styles.section} aria-label="Resumo">
            <div style={styles.cardsRow}>
              {loadingSummary ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  {hasConfirmation && <SkeletonCard />}
                  {hasAdoptionRate && <SkeletonCard />}
                  <SkeletonCard />
                </>
              ) : summary ? (
                <>
                  <div style={styles.card}>
                    <div style={styles.cardLabel}>Escolas alvo</div>
                    <div style={styles.cardValue}>{summary.target_schools_count ?? '—'}</div>
                  </div>
                  {typeof summary.confirmed_schools_count === 'number' && (
                    <div style={styles.card}>
                      <div style={styles.cardLabel}>Escolas com confirmação</div>
                      <div style={styles.cardValue}>{summary.confirmed_schools_count}</div>
                    </div>
                  )}
                  {typeof summary.adoption_rate === 'number' && (
                    <div style={styles.card}>
                      <div style={styles.cardLabel}>Taxa de adesão</div>
                      <div style={styles.cardValue}>{summary.adoption_rate}%</div>
                    </div>
                  )}
                  <div style={styles.card}>
                    <div style={styles.cardLabel}>Última atualização</div>
                    <div style={styles.cardValue}>{formatDateTimeBR(summary.updated_at)}</div>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          {/* Filtros e ordenação */}
          <section style={styles.section} aria-label="Filtros">
            <div style={styles.filtersRow}>
              <div style={styles.searchWrap}>
                <span style={styles.searchIcon}><IconSearch /></span>
                <input
                  type="search"
                  placeholder="Buscar escola…"
                  value={search}
                  onChange={handleSearchChange}
                  style={styles.searchInput}
                  aria-label="Buscar escola"
                />
              </div>
              <select
                value={executionStatus}
                onChange={handleExecutionChange}
                style={styles.select}
                aria-label="Status de execução"
              >
                {EXECUTION_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={confirmationStatus}
                onChange={handleConfirmationChange}
                style={styles.select}
                aria-label="Confirmação"
              >
                {CONFIRMATION_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={sort}
                onChange={handleSortChange}
                style={styles.select}
                aria-label="Ordenar por"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {hasFilters && (
                <button type="button" style={styles.btnLimpar} onClick={handleClearFilters}>
                  Limpar filtros
                </button>
              )}
            </div>
          </section>

          {/* Tabela por escola */}
          <section style={styles.section} aria-label="Por escola">
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Escola</th>
                    <th style={styles.th}>Status da escola</th>
                    <th style={styles.th}>Alvo da campanha</th>
                    <th style={styles.th}>Confirmação / Visualização</th>
                    <th style={styles.th}>Status de execução</th>
                    <th style={styles.th}>Última atualização</th>
                    <th style={{ ...styles.th, width: 120, textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTable ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td style={styles.td}><div style={{ ...styles.skeleton, width: '80%' }} /></td>
                        <td style={styles.td}><div style={{ ...styles.skeleton, width: 60 }} /></td>
                        <td style={styles.td}><div style={{ ...styles.skeleton, width: 40 }} /></td>
                        <td style={styles.td}><div style={{ ...styles.skeleton, width: 70 }} /></td>
                        <td style={styles.td}><div style={{ ...styles.skeleton, width: 90 }} /></td>
                        <td style={styles.td}><div style={{ ...styles.skeleton, width: 100 }} /></td>
                        <td style={styles.td}><div style={{ ...styles.skeleton, width: 80 }} /></td>
                      </tr>
                    ))
                  ) : bySchool.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: GRID * 4 }}>
                        Nenhuma escola encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    bySchool.items.map((row) => (
                      <tr key={row.school_id}>
                        <td style={styles.td}>{row.school_name || '—'}</td>
                        <td style={styles.td}>
                          <SchoolStatusBadge status={row.school_status} />
                        </td>
                        <td style={styles.td}>Sim</td>
                        <td style={styles.td}>
                          {row.confirmation_status === 'CONFIRMED'
                            ? 'Confirmou'
                            : row.confirmation_status === 'NOT_CONFIRMED'
                              ? 'Não confirmou'
                              : '—'}
                        </td>
                        <td style={styles.td}>
                          {row.execution_status === 'NOT_STARTED'
                            ? 'Não iniciado'
                            : row.execution_status === 'IN_PROGRESS'
                              ? 'Em andamento'
                              : row.execution_status === 'DONE'
                                ? 'Concluído'
                                : '—'}
                        </td>
                        <td style={styles.td}>{formatDateTimeBR(row.updated_at)}</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <Link
                            to={`/franchisor/schools/${row.school_id}`}
                            style={styles.linkAbrir}
                            state={{ returnTo: `/franchisor/campaigns/${campaign_id}/results?${searchParams.toString()}` }}
                          >
                            Abrir escola
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loadingTable && bySchool.total > 0 && (
              <div style={styles.pagination}>
                <span>
                  {bySchool.total} {bySchool.total === 1 ? 'escola' : 'escolas'}
                  {pageSize < bySchool.total && ` · Página ${page} de ${totalPages}`}
                </span>
                <div style={styles.paginationButtons}>
                  <button
                    type="button"
                    style={{ ...styles.paginationBtn, ...(page <= 1 ? styles.paginationBtnDisabled : {}) }}
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    aria-label="Página anterior"
                  >
                    <IconChevronLeft />
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.paginationBtn, ...(page >= totalPages ? styles.paginationBtnDisabled : {}) }}
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    aria-label="Próxima página"
                  >
                    <IconChevronRight />
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </FranchisorLayout>
  )
}
