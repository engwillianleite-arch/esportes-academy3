import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getStandardsLibraryItem,
  getStandardsLibraryVersions,
  getStandardsLibraryVersionContent,
  LIBRARY_TYPE_METHODOLOGY,
  LIBRARY_TYPE_PRICING,
} from '../../api/franchisorPortal'

const GRID = 8
const MAX_PREVIEW = 600

const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)
const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
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

function formatAmount(amount, currency = 'BRL') {
  if (amount == null || amount === '') return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
    minimumFractionDigits: 2,
  }).format(amount)
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
    textDecoration: 'none',
  },
  btnPrimario: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 3}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 4,
  },
  cardTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: GRID * 2,
  },
  cardMeta: { fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  cardMetaLabel: { fontWeight: 500, marginRight: GRID },
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
  linkButton: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--azul-arena)',
    cursor: 'pointer',
    textDecoration: 'none',
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
  emptyTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
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
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: GRID * 4,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    maxWidth: 640,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    padding: GRID * 3,
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  modalClose: {
    padding: GRID,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: 'var(--grafite-tecnico)',
    borderRadius: 8,
  },
  modalBody: {
    padding: GRID * 3,
    overflowY: 'auto',
    flex: 1,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  modalFooter: {
    padding: GRID * 3,
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: GRID * 2,
    justifyContent: 'flex-end',
  },
  diffWrap: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: GRID * 3,
    marginTop: GRID * 2,
  },
  diffBlock: {
    padding: GRID * 2,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    maxHeight: 320,
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  diffLabel: { fontSize: 12, fontWeight: 600, color: 'var(--grafite-tecnico)', marginBottom: GRID },
  expandBtn: {
    marginTop: GRID,
    background: 'none',
    border: 'none',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--azul-arena)',
    cursor: 'pointer',
  },
}

const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

function ContentPreview({ content, maxLen = MAX_PREVIEW }) {
  const [expanded, setExpanded] = useState(false)
  const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  const truncated = text.length > maxLen && !expanded
  const display = truncated ? text.slice(0, maxLen) + '...' : text
  return (
    <div>
      <div style={styles.modalBody}>{display}</div>
      {text.length > maxLen && (
        <button type="button" style={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Recolher' : 'Expandir'}
        </button>
      )}
    </div>
  )
}

function RenderSnapshot({ content_snapshot, type }) {
  if (!content_snapshot) return <p style={{ margin: 0 }}>—</p>
  if (type === LIBRARY_TYPE_METHODOLOGY) {
    return (
      <div>
        {content_snapshot.title && (
          <p style={{ margin: '0 0 ' + GRID + 'px', fontWeight: 600 }}>{content_snapshot.title}</p>
        )}
        <ContentPreview content={content_snapshot.content || ''} />
      </div>
    )
  }
  if (type === LIBRARY_TYPE_PRICING) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: GRID }}>
        {content_snapshot.name != null && <span><strong>Nome:</strong> {content_snapshot.name}</span>}
        {content_snapshot.category != null && <span><strong>Categoria:</strong> {content_snapshot.category}</span>}
        {content_snapshot.amount != null && (
          <span><strong>Valor:</strong> {formatAmount(content_snapshot.amount, content_snapshot.currency)}</span>
        )}
        {content_snapshot.periodicity != null && <span><strong>Periodicidade:</strong> {content_snapshot.periodicity}</span>}
        {content_snapshot.notes != null && content_snapshot.notes && (
          <span><strong>Observações:</strong> {content_snapshot.notes}</span>
        )}
      </div>
    )
  }
  return <ContentPreview content={content_snapshot} /> 
}

export default function DetalheBibliotecaPadraoFranqueador() {
  const { item_id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const libraryQuery = searchParams.toString()
  const libraryPath = '/franchisor/standards/library' + (libraryQuery ? '?' + libraryQuery : '')

  const [item, setItem] = useState(null)
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [viewVersionId, setViewVersionId] = useState(null)
  const [viewContent, setViewContent] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  const [compareLeft, setCompareLeft] = useState(null)
  const [compareRight, setCompareRight] = useState(null)
  const [compareContentLeft, setCompareContentLeft] = useState(null)
  const [compareContentRight, setCompareContentRight] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

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
    if (permissionDenied || !item_id) return
    let cancelled = false
    setError(null)
    setLoading(true)
    Promise.all([
      getStandardsLibraryItem(item_id),
      getStandardsLibraryVersions(item_id, {}),
    ])
      .then(([itemRes, versionsRes]) => {
        if (!cancelled) {
          setItem(itemRes || null)
          setVersions(versionsRes.items || [])
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Não foi possível carregar o item.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [permissionDenied, item_id])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=franchisor', { replace: true })
  }, [permissionDenied, navigate])

  const openViewContent = async (versionId) => {
    setViewVersionId(versionId)
    setViewContent(null)
    setViewLoading(true)
    try {
      const res = await getStandardsLibraryVersionContent(item_id, versionId)
      setViewContent(res?.content_snapshot || null)
    } catch {
      setViewContent(null)
    } finally {
      setViewLoading(false)
    }
  }

  const openCompareWithCurrent = async (versionId) => {
    const currentVersion = versions.find((v) => v.version_id && v.version_id.endsWith('_current'))
    if (!currentVersion || !item) return
    setCompareLeft(versionId)
    setCompareRight(currentVersion.version_id)
    setCompareContentLeft(null)
    setCompareContentRight(null)
    setCompareLoading(true)
    setCompareOpen(true)
    try {
      const [left, right] = await Promise.all([
        getStandardsLibraryVersionContent(item_id, versionId),
        getStandardsLibraryVersionContent(item_id, currentVersion.version_id),
      ])
      setCompareContentLeft(left?.content_snapshot || null)
      setCompareContentRight(right?.content_snapshot || null)
    } catch {
      setCompareContentLeft(null)
      setCompareContentRight(null)
    } finally {
      setCompareLoading(false)
    }
  }

  const editPath =
    item?.type === LIBRARY_TYPE_METHODOLOGY
      ? `/franchisor/standards/methodology?returnTo=${encodeURIComponent(libraryPath)}`
      : `/franchisor/standards/pricing?returnTo=${encodeURIComponent(libraryPath)}`

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Padrões' },
    { label: 'Biblioteca', to: libraryPath },
    { label: item?.title_or_name || item_id || 'Item' },
  ]

  if (permissionDenied) return null

  return (
    <FranchisorLayout
      pageTitle="Histórico de versões"
      breadcrumb={breadcrumb}
    >
      <section style={styles.section} aria-label="Histórico de versões">
        <div style={styles.headerRow}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: GRID * 2 }}>
            <Link to={libraryPath} style={styles.btnSecundario}>
              <IconChevronLeft />
              Voltar
            </Link>
            <a href={editPath} style={styles.btnPrimario} className="btn-hover">
              Editar
            </a>
          </div>
        </div>

        {item && (
          <p style={{ margin: `0 0 ${GRID * 3}px`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
            Tipo: {typeLabel(item.type)} · Status atual: {item.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </p>
        )}

        {error && (
          <div style={styles.errorBox} role="alert">
            <span style={{ color: '#DC2626' }}><IconAlert /></span>
            <div>
              <div style={{ fontWeight: 600, color: '#991B1B' }}>Erro</div>
              <div style={{ fontSize: 14, color: '#991B1B' }}>{error}</div>
            </div>
          </div>
        )}

        {!error && item && (
          <>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Resumo do item</h2>
              <div style={styles.cardGrid}>
                <div style={styles.cardMeta}>
                  <span style={styles.cardMetaLabel}>Título / Item:</span>
                  {item.title_or_name}
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.cardMetaLabel}>Tipo:</span>
                  {typeLabel(item.type)}
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.cardMetaLabel}>Versão atual:</span>
                  {item.current_version || '—'}
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.cardMetaLabel}>Status:</span>
                  {item.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.cardMetaLabel}>Última alteração:</span>
                  {formatDateTime(item.updated_at)}
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.cardMetaLabel}>Alterado por:</span>
                  {item.updated_by_name || '—'}
                </div>
              </div>
            </div>

            <h2 style={{ margin: `0 0 ${GRID * 2}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' }}>
              Lista de versões
            </h2>
            <div style={styles.tableWrap}>
              {loading ? (
                <div style={{ padding: GRID * 4 }}>
                  <div style={{ ...styles.skeleton, width: '80%', marginBottom: GRID * 2 }} />
                  <div style={{ ...styles.skeleton, width: '60%' }} />
                </div>
              ) : versions.length === 0 ? (
                <div style={styles.emptyState}>
                  <h3 style={styles.emptyTitle}>Nenhuma versão registrada.</h3>
                </div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Versão</th>
                      <th style={styles.th}>Data/hora</th>
                      <th style={styles.th}>Autor</th>
                      <th style={styles.th}>Resumo</th>
                      <th style={styles.th}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((v) => (
                      <tr key={v.version_id}>
                        <td style={styles.td}>{v.version_label || v.version_id}</td>
                        <td style={styles.td}>{formatDateTime(v.created_at)}</td>
                        <td style={styles.td}>{v.created_by || '—'}</td>
                        <td style={styles.td}>{v.summary || '—'}</td>
                        <td style={styles.td}>
                          <button
                            type="button"
                            style={styles.linkButton}
                            onClick={() => openViewContent(v.version_id)}
                          >
                            Ver conteúdo
                          </button>
                          {' · '}
                          <button
                            type="button"
                            style={styles.linkButton}
                            onClick={() => openCompareWithCurrent(v.version_id)}
                          >
                            Comparar com atual
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {!error && !item && !loading && (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>Item não encontrado.</h3>
            <Link to={libraryPath} style={styles.btnSecundario}>
              Voltar à Biblioteca
            </Link>
          </div>
        )}

        {/* Modal Ver conteúdo */}
        {viewVersionId != null && (
          <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-view-title">
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 id="modal-view-title" style={styles.modalTitle}>Conteúdo da versão</h2>
                <button
                  type="button"
                  style={styles.modalClose}
                  onClick={() => { setViewVersionId(null); setViewContent(null); }}
                  aria-label="Fechar"
                >
                  <IconClose />
                </button>
              </div>
              <div style={styles.modalBody}>
                {viewLoading ? (
                  <div style={styles.skeleton} />
                ) : (
                  <RenderSnapshot content_snapshot={viewContent} type={item?.type} />
                )}
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.btnSecundario}
                  onClick={() => { setViewVersionId(null); setViewContent(null); }}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  style={styles.btnPrimario}
                  className="btn-hover"
                  onClick={() => {
                    setViewVersionId(null)
                    setViewContent(null)
                    openCompareWithCurrent(viewVersionId)
                  }}
                >
                  Comparar com atual
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Comparação */}
        {compareOpen && (
          <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-compare-title">
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 id="modal-compare-title" style={styles.modalTitle}>Comparação (Antes / Depois)</h2>
                <button
                  type="button"
                  style={styles.modalClose}
                  onClick={() => {
                    setCompareOpen(false)
                    setCompareLeft(null)
                    setCompareRight(null)
                    setCompareContentLeft(null)
                    setCompareContentRight(null)
                  }}
                  aria-label="Fechar"
                >
                  <IconClose />
                </button>
              </div>
              <div style={{ ...styles.modalBody, padding: GRID * 3 }}>
                {compareLoading ? (
                  <div style={styles.skeleton} />
                ) : (
                  <div style={styles.diffWrap}>
                    <div>
                      <div style={styles.diffLabel}>Antes (versão selecionada)</div>
                      <div style={styles.diffBlock}>
                        <RenderSnapshot content_snapshot={compareContentLeft} type={item?.type} />
                      </div>
                    </div>
                    <div>
                      <div style={styles.diffLabel}>Depois (atual)</div>
                      <div style={styles.diffBlock}>
                        <RenderSnapshot content_snapshot={compareContentRight} type={item?.type} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.btnPrimario}
                  onClick={() => {
                    setCompareOpen(false)
                    setCompareLeft(null)
                    setCompareRight(null)
                    setCompareContentLeft(null)
                    setCompareContentRight(null)
                  }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </FranchisorLayout>
  )
}
