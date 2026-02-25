import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorCampaignById,
  updateFranchisorCampaign,
} from '../../api/franchisorPortal'

const GRID = 8
const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']
const TARGET_TYPE_ALL = 'ALL'
const TARGET_TYPE_SCHOOL_LIST = 'SCHOOL_LIST'

const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
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
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
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
  btnGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  btnPrimary: {
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
    cursor: 'pointer',
    textDecoration: 'none',
  },
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
  btnDestructive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 3}px`,
    background: 'transparent',
    color: '#DC2626',
    border: '1px solid rgba(220, 38, 38, 0.5)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 3,
  },
  cardTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  row: { marginBottom: GRID * 1.5, fontSize: 14, color: 'var(--grafite-tecnico)' },
  label: { fontWeight: 600, marginRight: GRID, opacity: 0.9 },
  contentBlock: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    lineHeight: 1.5,
    marginBottom: GRID * 2,
  },
  searchWrap: {
    position: 'relative',
    maxWidth: 320,
    marginBottom: GRID * 2,
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
  tableWrap: {
    overflowX: 'auto',
    border: '1px solid #eee',
    borderRadius: 'var(--radius)',
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
    marginRight: GRID * 2,
  },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  emptyText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  emptyLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    maxWidth: 400,
    width: '90%',
    boxShadow: 'var(--shadow-hover)',
  },
  modalTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  modalText: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  modalCheckbox: { display: 'flex', alignItems: 'center', gap: GRID, marginBottom: GRID * 3, cursor: 'pointer', fontSize: 14 },
  modalButtons: { display: 'flex', gap: GRID * 2, justifyContent: 'flex-end' },
  toast: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'rgba(76, 203, 138, 0.15)',
    color: 'var(--verde-patrocinio)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
    fontWeight: 500,
  },
  toastError: { background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545' },
}

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
  const label = s === 'ativa' ? 'Ativa' : s === 'rascunho' ? 'Rascunho' : s === 'encerrada' ? 'Encerrada' : status || '—'
  return <span style={style}>{label}</span>
}

function SchoolStatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const style =
    s === 'ativo'
      ? { ...styles.badge, ...styles.statusAtiva }
      : s === 'pendente'
        ? { ...styles.badge, ...styles.statusRascunho }
        : { ...styles.badge, ...styles.statusEncerrada }
  const label = s === 'ativo' ? 'Ativa' : s === 'pendente' ? 'Pendente' : s === 'suspenso' ? 'Suspensa' : status || '—'
  return <span style={style}>{label}</span>
}

function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.skeleton, width: '40%', marginBottom: GRID * 2, height: 18 }} />
      <div style={{ ...styles.skeleton, width: '90%', marginBottom: GRID }} />
      <div style={{ ...styles.skeleton, width: '70%', marginBottom: GRID }} />
      <div style={{ ...styles.skeleton, width: '60%' }} />
    </div>
  )
}

export default function DetalheCampanhaFranqueador() {
  const { campaign_id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = location.state?.returnTo || '/franchisor/campaigns'

  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [toast, setToast] = useState(null)
  const [toastError, setToastError] = useState(false)
  const [modalEncerrar, setModalEncerrar] = useState(false)
  const [confirmEncerrar, setConfirmEncerrar] = useState(false)
  const [ending, setEnding] = useState(false)
  const [endError, setEndError] = useState(null)
  const [schoolSearch, setSchoolSearch] = useState('')

  const breadcrumb = useMemo(
    () => [
      { label: 'Dashboard', to: '/franchisor/dashboard' },
      { label: 'Campanhas', to: '/franchisor/campaigns' },
      { label: campaign?.title || 'Detalhe da campanha' },
    ],
    [campaign?.title]
  )

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
    if (!campaign_id) {
      setLoading(false)
      setNotFound(true)
      return
    }
    let cancelled = false
    setError(null)
    setNotFound(false)
    setLoading(true)
    getFranchisorCampaignById(campaign_id)
      .then((data) => {
        if (!cancelled) {
          if (data == null) setNotFound(true)
          else setCampaign(data)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar a campanha. Tente novamente.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaign_id, permissionDenied])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=franchisor', { replace: true })
    }
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => {
        setToast(null)
        setToastError(false)
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleCopyContent = () => {
    const text = (campaign?.description ? campaign.description + '\n\n' : '') + (campaign?.content || '')
    if (!text.trim()) return
    navigator.clipboard.writeText(text).then(
      () => setToast('Conteúdo copiado!'),
      () => {
        setToast('Não foi possível copiar.')
        setToastError(true)
      }
    )
  }

  const handleEncerrarOpen = () => {
    setConfirmEncerrar(false)
    setEndError(null)
    setModalEncerrar(true)
  }

  const handleEncerrarConfirm = async () => {
    if (!confirmEncerrar || !campaign_id) return
    setEnding(true)
    setEndError(null)
    try {
      await updateFranchisorCampaign(campaign_id, { status: 'encerrada' })
      setCampaign((prev) => (prev ? { ...prev, status: 'encerrada' } : null))
      setToast('Campanha encerrada!')
      setModalEncerrar(false)
      setConfirmEncerrar(false)
    } catch (err) {
      setEndError(err?.message || 'Não foi possível encerrar. Tente novamente.')
    } finally {
      setEnding(false)
    }
  }

  const statusLower = (campaign?.status || '').toLowerCase()
  const canEncerrar = statusLower !== 'encerrada'
  const targetSchools = campaign?.target_schools || []
  const schoolSearchLower = (schoolSearch || '').toLowerCase().trim()
  const filteredSchools = useMemo(() => {
    if (!schoolSearchLower) return targetSchools
    return targetSchools.filter(
      (s) =>
        (s.school_name && s.school_name.toLowerCase().includes(schoolSearchLower)) ||
        (s.city && s.city.toLowerCase().includes(schoolSearchLower)) ||
        (s.state && s.state.toLowerCase().includes(schoolSearchLower))
    )
  }, [targetSchools, schoolSearchLower])

  if (permissionDenied) return null

  return (
    <FranchisorLayout
      pageTitle={campaign ? campaign.title : 'Detalhe da campanha'}
      breadcrumb={breadcrumb}
    >
      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, ...(toastError ? styles.toastError : {}) }} role="status">
          {toast}
        </div>
      )}

      {/* Erro ao carregar */}
      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro</div>
            <div style={styles.errorText}>{error}</div>
            <div>
              <button type="button" style={styles.btnReload} onClick={() => window.location.reload()}>
                Recarregar
              </button>
              <Link to={returnTo} style={styles.btnSecondary}>
                Voltar
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Não encontrada */}
      {!error && !loading && notFound && (
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>Campanha não encontrada.</h2>
          <p style={styles.emptyText}>
            O identificador pode estar incorreto ou você não tem permissão para acessá-la.
          </p>
          <Link to={returnTo} style={styles.emptyLink}>
            Voltar para campanhas
          </Link>
        </div>
      )}

      {/* Conteúdo principal */}
      {!error && !notFound && campaign && (
        <>
          <div style={styles.headerRow}>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>{campaign.title}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <div style={styles.btnGroup}>
              <Link
                to={`/franchisor/campaigns/${campaign_id}/edit`}
                state={{ returnTo: `/franchisor/campaigns/${campaign_id}` }}
                style={styles.btnPrimary}
                className="btn-hover"
              >
                <IconEdit />
                Editar
              </Link>
              <Link
                to={`/franchisor/campaigns/${campaign_id}/results`}
                state={{ returnTo: `/franchisor/campaigns/${campaign_id}` }}
                style={styles.btnSecondary}
                className="btn-hover"
              >
                Resultados
              </Link>
              <Link to={returnTo} style={styles.btnSecondary} className="btn-hover">
                <IconArrowLeft />
                Voltar
              </Link>
              {canEncerrar && (
                <button
                  type="button"
                  style={styles.btnDestructive}
                  onClick={handleEncerrarOpen}
                  className="btn-hover"
                >
                  Encerrar
                </button>
              )}
            </div>
          </div>

          {/* Card Resumo */}
          <section style={styles.section} aria-label="Resumo">
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Resumo</h2>
              <div style={styles.row}>
                <span style={styles.label}>Status:</span>
                <StatusBadge status={campaign.status} />
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Período:</span>
                {formatDateBR(campaign.start_date)} até {campaign.end_date ? formatDateBR(campaign.end_date) : 'Sem término'}
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Segmentação:</span>
                {campaign.target_type === TARGET_TYPE_ALL
                  ? 'Todas as escolas'
                  : `${(campaign.target_schools || []).length} escolas selecionadas`}
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Última atualização:</span>
                {formatDateTimeBR(campaign.updated_at)}
              </div>
            </div>
          </section>

          {/* Card Conteúdo */}
          <section style={styles.section} aria-label="Conteúdo">
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Conteúdo</h2>
              {campaign.description && (
                <div style={styles.contentBlock}>{campaign.description}</div>
              )}
              <div style={styles.contentBlock}>{campaign.content || '—'}</div>
              <button
                type="button"
                style={styles.btnSecondary}
                onClick={handleCopyContent}
                className="btn-hover"
              >
                <IconCopy />
                Copiar conteúdo
              </button>
            </div>
          </section>

          {/* Escolas alvo */}
          <section style={styles.section} aria-label="Escolas alvo">
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Escolas alvo</h2>
              {campaign.target_type === TARGET_TYPE_ALL ? (
                <>
                  <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                    Esta campanha se aplica a todas as suas escolas.
                  </p>
                  <Link to="/franchisor/schools" style={{ ...styles.btnSecondary, display: 'inline-flex' }} className="btn-hover">
                    Ver escolas
                  </Link>
                </>
              ) : (
                <>
                  {targetSchools.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
                      Nenhuma escola selecionada.
                    </p>
                  ) : (
                    <>
                      <div style={styles.searchWrap}>
                        <span style={styles.searchIcon} aria-hidden="true"><IconSearch /></span>
                        <input
                          type="search"
                          placeholder="Buscar escola alvo…"
                          value={schoolSearch}
                          onChange={(e) => setSchoolSearch(e.target.value)}
                          style={styles.searchInput}
                          aria-label="Buscar escola alvo"
                        />
                      </div>
                      <div style={styles.tableWrap}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Nome da escola</th>
                              <th style={styles.th}>Status</th>
                              <th style={styles.th}>Cidade/UF</th>
                              <th style={styles.th}>Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSchools.map((s) => (
                              <tr key={s.school_id}>
                                <td style={styles.td}>{s.school_name}</td>
                                <td style={styles.td}>
                                  <SchoolStatusBadge status={s.status} />
                                </td>
                                <td style={styles.td}>
                                  {[s.city, s.state].filter(Boolean).join(' / ') || '—'}
                                </td>
                                <td style={styles.td}>
                                  <Link
                                    to={`/franchisor/schools/${s.school_id}`}
                                    state={{ returnTo: `/franchisor/campaigns/${campaign_id}` }}
                                    style={styles.linkAbrir}
                                  >
                                    Abrir escola
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filteredSchools.length === 0 && schoolSearchLower && (
                          <div style={{ padding: GRID * 4, textAlign: 'center', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
                            Nenhuma escola encontrada na busca.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}

      {/* Loading skeleton */}
      {!error && !notFound && loading && !campaign && (
        <>
          <div style={styles.headerRow}>
            <div style={{ ...styles.skeleton, width: 280, height: 28 }} />
            <div style={{ ...styles.skeleton, width: 200, height: 36 }} />
          </div>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* Modal Encerrar campanha */}
      {modalEncerrar && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-encerrar-title">
          <div style={styles.modal}>
            <h2 id="modal-encerrar-title" style={styles.modalTitle}>
              Encerrar campanha?
            </h2>
            <p style={styles.modalText}>
              A campanha será marcada como encerrada e não aparecerá como ativa para as escolas.
            </p>
            <label style={styles.modalCheckbox}>
              <input
                type="checkbox"
                checked={confirmEncerrar}
                onChange={(e) => setConfirmEncerrar(e.target.checked)}
                disabled={ending}
              />
              Confirmo que desejo encerrar.
            </label>
            {endError && (
              <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#DC2626' }} role="alert">
                {endError}
              </p>
            )}
            <div style={styles.modalButtons}>
              <button
                type="button"
                style={styles.btnSecondary}
                onClick={() => !ending && setModalEncerrar(false)}
                disabled={ending}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{ ...styles.btnDestructive, borderColor: '#DC2626', background: '#DC2626', color: '#fff' }}
                className="btn-hover"
                disabled={!confirmEncerrar || ending}
                onClick={handleEncerrarConfirm}
              >
                {ending ? 'Encerrando…' : 'Encerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FranchisorLayout>
  )
}
