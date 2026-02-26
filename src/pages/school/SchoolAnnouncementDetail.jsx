import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolAnnouncement,
  archiveSchoolAnnouncement,
  deleteSchoolAnnouncement,
} from '../../api/schoolPortal'

const GRID = 8

/** Exibir ações Editar/Arquivar/Excluir somente se existirem no MVP. */
const SUPPORT_EDIT = true
const SUPPORT_ARCHIVE = true
const SUPPORT_DELETE = true

/** RBAC: quem pode editar/arquivar/excluir (SchoolOwner, SchoolStaff). Front apenas esconde botões; backend valida. */
const canManageAnnouncements = true

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const styles = {
  breadcrumb: {
    marginBottom: GRID * 2,
    fontSize: 14,
  },
  breadcrumbLink: {
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
  },
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
    flex: '1 1 300px',
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID,
    marginBottom: GRID * 2,
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
  },
  statusPublished: { background: '#D1FAE5', color: '#065F46' },
  statusDraft: { background: '#FEF3C7', color: '#92400E' },
  statusArchived: { background: '#E5E7EB', color: '#374151' },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  btn: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
  },
  btnPrimary: { background: 'var(--azul-arena)', color: '#fff' },
  btnSecondary: { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' },
  btnDanger: { background: '#FEE2E2', color: '#991B1B' },
  section: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
  },
  sectionTitle: {
    margin: `0 0 ${GRID * 2}px`,
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  metaGrid: {
    display: 'grid',
    gap: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  metaLabel: { fontWeight: 500, opacity: 0.85 },
  metaValue: { opacity: 0.95 },
  contentBody: {
    fontSize: 15,
    lineHeight: 1.6,
    color: 'var(--grafite-tecnico)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  successBanner: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: 'var(--radius)',
    color: '#065F46',
    fontWeight: 500,
    fontSize: 14,
  },
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
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
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
  linkList: { display: 'flex', flexWrap: 'wrap', gap: GRID, marginTop: 4 },
  linkItem: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
}

function formatDateTime(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function getStatusBadge(status) {
  const s = (status || 'published').toLowerCase()
  if (s === 'published') return { label: 'Publicado', style: styles.statusPublished }
  if (s === 'draft') return { label: 'Rascunho', style: styles.statusDraft }
  return { label: 'Arquivado', style: styles.statusArchived }
}

function getAudienceSummary(announcement) {
  const aud = announcement?.audience
  const resolved = announcement?.audience_resolved
  if (!aud || aud.mode === 'all') return 'Todos'
  if (aud.mode === 'teams' && resolved?.teams?.length) {
    return `Turmas: ${resolved.teams.length} selecionada(s)`
  }
  if (aud.mode === 'teams' && aud.team_ids?.length) return `Turmas: ${aud.team_ids.length} selecionada(s)`
  if (aud.mode === 'students' && resolved?.students?.length) {
    return `Alunos: ${resolved.students.length} selecionado(s)`
  }
  if (aud.mode === 'students' && aud.student_ids?.length) return `Alunos: ${aud.student_ids.length} selecionado(s)`
  return 'Todos'
}

function DetailSkeleton() {
  return (
    <>
      <div style={styles.breadcrumb}>
        <div style={{ ...styles.skeleton, width: 140, height: 16 }} />
      </div>
      <div style={{ ...styles.skeleton, width: '70%', height: 32, marginBottom: GRID * 2 }} />
      <div style={{ display: 'flex', gap: GRID, marginBottom: GRID * 3 }}>
        <div style={{ ...styles.skeleton, width: 80, height: 24 }} />
        <div style={{ ...styles.skeleton, width: 60, height: 24 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 120, height: 16, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 16, marginBottom: GRID }} />
        <div style={{ ...styles.skeleton, width: '80%', height: 16, marginBottom: GRID }} />
        <div style={{ ...styles.skeleton, width: '60%', height: 16 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 100, height: 16, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 60 }} />
      </div>
    </>
  )
}

export default function SchoolAnnouncementDetail() {
  const { announcementId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const successMessage = location.state?.message

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [actionLoading, setActionLoading] = useState(null) // 'archive' | 'delete'
  const [confirmModal, setConfirmModal] = useState(null)   // { type: 'archive' | 'delete' }
  const [actionError, setActionError] = useState(null)

  const fetchDetail = useCallback(() => {
    if (!announcementId) return
    setError(null)
    setNotFound(false)
    setPermissionDenied(false)
    setLoading(true)
    getSchoolAnnouncement(announcementId)
      .then((res) => {
        setData(res)
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setNotFound(true)
        } else {
          setError(err?.message || 'Não foi possível carregar o comunicado. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [announcementId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const handleArchive = () => {
    setActionError(null)
    setActionLoading('archive')
    archiveSchoolAnnouncement(announcementId)
      .then(() => {
        setConfirmModal(null)
        setData((prev) => (prev ? { ...prev, status: 'archived' } : null))
      })
      .catch((err) => {
        setActionError(err?.message || 'Não foi possível arquivar. Tente novamente.')
      })
      .finally(() => setActionLoading(null))
  }

  const handleDelete = () => {
    setActionError(null)
    setActionLoading('delete')
    deleteSchoolAnnouncement(announcementId)
      .then(() => {
        setConfirmModal(null)
        navigate('/school/announcements', { replace: true, state: { message: 'Comunicado excluído.' } })
      })
      .catch((err) => {
        setActionError(err?.message || 'Não foi possível excluir. Tente novamente.')
      })
      .finally(() => setActionLoading(null))
  }

  const schoolName = data?.school_name ?? ''
  const showActions = canManageAnnouncements && (SUPPORT_EDIT || SUPPORT_ARCHIVE || SUPPORT_DELETE)
  const statusBadge = data ? getStatusBadge(data.status) : null
  const audienceSummary = data ? getAudienceSummary(data) : ''

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      {successMessage && (
        <div style={styles.successBanner} role="status">
          {successMessage}
        </div>
      )}

      {loading && <DetailSkeleton />}

      {!loading && error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={fetchDetail}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!loading && notFound && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Comunicado não encontrado ou você não tem acesso.</p>
          <Link to="/school/announcements" style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none' }} className="btn-hover">
            Voltar para Comunicados
          </Link>
        </div>
      )}

      {!loading && data && !notFound && (
        <>
          <nav style={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/school/announcements" style={styles.breadcrumbLink} className="btn-hover">
              ← Comunicados
            </Link>
          </nav>

          <div style={styles.headerRow}>
            <h1 style={styles.title}>{data.title}</h1>
            {showActions && (
              <div style={styles.actions}>
                <Link
                  to={`/school/announcements/${announcementId}/history`}
                  style={{ ...styles.btn, ...styles.btnSecondary, textDecoration: 'none' }}
                  className="btn-hover"
                >
                  Histórico
                </Link>
                {SUPPORT_EDIT && (
                  <Link
                    to={`/school/announcements/${announcementId}/edit`}
                    style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none' }}
                    className="btn-hover"
                  >
                    Editar
                  </Link>
                )}
                {SUPPORT_ARCHIVE && data.status !== 'archived' && (
                  <button
                    type="button"
                    style={{ ...styles.btn, ...styles.btnSecondary }}
                    onClick={() => setConfirmModal({ type: 'archive' })}
                    className="btn-hover"
                  >
                    Arquivar
                  </button>
                )}
                {SUPPORT_DELETE && (
                  <button
                    type="button"
                    style={{ ...styles.btn, ...styles.btnDanger }}
                    onClick={() => setConfirmModal({ type: 'delete' })}
                    className="btn-hover"
                  >
                    Excluir
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={styles.badges}>
            {statusBadge && (
              <span style={{ ...styles.badge, ...statusBadge.style }}>{statusBadge.label}</span>
            )}
            {audienceSummary && (
              <span style={{ ...styles.badge, ...styles.statusPublished }}>{audienceSummary}</span>
            )}
          </div>

          {actionError && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}><IconAlert /></span>
              <div style={styles.errorContent}>
                <div style={styles.errorText}>{actionError}</div>
                <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setActionError(null)}>
                  Fechar
                </button>
              </div>
            </div>
          )}

          <section style={styles.section} aria-labelledby="meta-title">
            <h2 id="meta-title" style={styles.sectionTitle}>Metadados</h2>
            <div style={styles.metaGrid}>
              <div>
                <span style={styles.metaLabel}>
                  {data.status === 'draft' || !data.published_at ? 'Criado em: ' : 'Publicado em: '}
                </span>
                <span style={styles.metaValue}>
                  {formatDateTime(data.status === 'draft' || !data.published_at ? data.created_at : data.published_at)}
                </span>
              </div>
              <div>
                <span style={styles.metaLabel}>Autor: </span>
                <span style={styles.metaValue}>{data.author?.name || '—'}</span>
              </div>
              <div>
                <span style={styles.metaLabel}>Público-alvo: </span>
                <span style={styles.metaValue}>{audienceSummary}</span>
                {data.audience_resolved?.teams?.length > 0 && (
                  <div style={styles.linkList}>
                    {data.audience_resolved.teams.map((t) => (
                      <Link key={t.id} to={`/school/teams/${t.id}`} style={styles.linkItem}>
                        {t.name}
                      </Link>
                    ))}
                  </div>
                )}
                {data.audience_resolved?.students?.length > 0 && (
                  <div style={styles.linkList}>
                    {data.audience_resolved.students.map((s) => (
                      <Link key={s.id} to={`/school/students/${s.id}`} style={styles.linkItem}>
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section style={styles.section} aria-labelledby="content-title">
            <h2 id="content-title" style={styles.sectionTitle}>Conteúdo</h2>
            <div style={styles.contentBody}>{data.content || '—'}</div>
          </section>
        </>
      )}

      {confirmModal && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div style={styles.modalBox}>
            <h2 id="confirm-title" style={styles.modalTitle}>
              {confirmModal.type === 'archive' ? 'Arquivar este comunicado?' : 'Excluir este comunicado?'}
            </h2>
            <p style={styles.modalText}>
              {confirmModal.type === 'archive'
                ? 'O comunicado ficará arquivado e poderá ser filtrado na lista.'
                : 'Esta ação não pode ser desfeita.'}
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setConfirmModal(null)}
                disabled={actionLoading !== null}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...(confirmModal.type === 'delete' ? styles.btnDanger : styles.btnPrimary) }}
                onClick={confirmModal.type === 'archive' ? handleArchive : handleDelete}
                disabled={actionLoading !== null}
              >
                {actionLoading ? 'Aguarde...' : confirmModal.type === 'archive' ? 'Arquivar' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
