import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolTrainingDetail, updateTrainingStatus } from '../../api/schoolPortal'

const GRID = 8
const PRESENCA_MVP = true // exibir seção presença e botão "Registrar presença"
const CANCEL_TREINO_MVP = true // botão "Cancelar treino" (opcional MVP)

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconMapPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

const STATUS_LABELS = {
  planned: 'Planejado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
}
const ATTENDANCE_STATUS_LABELS = {
  not_started: 'Não registrada',
  partial: 'Parcial',
  complete: 'Concluída',
}

const styles = {
  header: { marginBottom: GRID * 4 },
  breadcrumb: { marginBottom: GRID * 2, fontSize: 14 },
  breadcrumbLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
  },
  statusPlanned: { background: '#DBEAFE', color: '#1E40AF' },
  statusCompleted: { background: '#D1FAE5', color: '#065F46' },
  statusCancelled: { background: '#FEE2E2', color: '#991B1B' },
  actionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 4,
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
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  summaryGrid: {
    display: 'grid',
    gap: GRID * 2,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    flexWrap: 'wrap',
  },
  summaryLabel: { opacity: 0.85, minWidth: 120 },
  summaryValue: { fontWeight: 500 },
  linkTeam: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  planContent: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  objectivesList: { margin: `${GRID}px 0 0`, paddingLeft: GRID * 3 },
  attendanceRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
  },
  attendanceInfo: { fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
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
    marginBottom: GRID * 3,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 15, fontWeight: 600, color: '#991B1B' },
  errorText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#991B1B', opacity: 0.9 },
  notFoundBox: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  notFoundText: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 16, color: 'var(--grafite-tecnico)', opacity: 0.9 },
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
  successBox: {
    padding: GRID * 3,
    background: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
  },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(t) {
  if (!t) return '—'
  const [h, m] = String(t).split(':')
  return `${h || '00'}:${m || '00'}`
}

function DetailSkeleton() {
  return (
    <>
      <div style={styles.header}>
        <div style={{ ...styles.skeleton, width: 100, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '70%', height: 32, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: 120, height: 24, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: 200, height: 36 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 180, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 80 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 160, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 60 }} />
      </div>
      {PRESENCA_MVP && (
        <div style={styles.section}>
          <div style={{ ...styles.skeleton, width: 140, marginBottom: GRID * 2 }} />
          <div style={{ ...styles.skeleton, width: '100%', height: 40 }} />
        </div>
      )}
    </>
  )
}

const canEditTraining = true

export default function SchoolTrainingDetail() {
  const { trainingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [training, setTraining] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  const fromListQuery = location.state?.fromListQuery ?? ''

  const fetchTraining = useCallback(() => {
    if (!trainingId) return
    setError(null)
    setNotFound(false)
    setPermissionDenied(false)
    setLoading(true)
    getSchoolTrainingDetail(trainingId)
      .then((data) => setTraining(data))
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setNotFound(true)
        } else {
          setError(err?.message || 'Não foi possível carregar o treino. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [trainingId])

  useEffect(() => {
    fetchTraining()
  }, [fetchTraining])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const handleCancelConfirm = () => {
    if (!training || !trainingId) return
    setCancelling(true)
    setCancelModal(false)
    setError(null)
    updateTrainingStatus(trainingId, 'cancelled')
      .then(() => {
        setTraining((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
        setStatusMessage('Treino cancelado com sucesso.')
        setTimeout(() => setStatusMessage(null), 4000)
      })
      .catch(() => {
        setError('Não foi possível cancelar o treino.')
      })
      .finally(() => setCancelling(false))
  }

  if (permissionDenied) return null

  if (notFound) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.notFoundBox}>
          <p style={styles.notFoundText}>Treino não encontrado ou você não tem acesso.</p>
          <Link to={`/school/trainings${fromListQuery}`} style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Treinos
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  if (error && !training) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={() => fetchTraining()}
              className="btn-hover"
            >
              Recarregar
            </button>
          </div>
        </div>
      </SchoolLayout>
    )
  }

  const schoolName = training?.school_name ?? ''

  const pageTitle = training
    ? (training.title ? `${training.title} — ${formatDate(training.date)}` : `Treino — ${formatDate(training.date)}`)
    : ''

  return (
    <SchoolLayout schoolName={schoolName}>
      {loading && !training && <DetailSkeleton />}

      {!loading && training && (
        <>
          <header style={styles.header}>
            <nav style={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to={`/school/trainings${fromListQuery}`} style={styles.breadcrumbLink} className="btn-hover">
                ← Treinos
              </Link>
            </nav>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>{pageTitle}</h1>
              {training.status && (
                <span
                  style={{
                    ...styles.statusBadge,
                    ...(training.status === 'planned' ? styles.statusPlanned : training.status === 'completed' ? styles.statusCompleted : styles.statusCancelled),
                  }}
                >
                  {STATUS_LABELS[training.status] ?? training.status}
                </span>
              )}
            </div>
            <div style={styles.actionsRow}>
              {canEditTraining && (
                <Link
                  to={`/school/trainings/${training.id}/edit`}
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  className="btn-hover"
                >
                  Editar
                </Link>
              )}
              {PRESENCA_MVP && (
                <Link
                  to={`/school/attendance?trainingId=${training.id}`}
                  style={{ ...styles.btn, ...styles.btnPrimary }}
                  className="btn-hover"
                >
                  Registrar presença
                </Link>
              )}
              {CANCEL_TREINO_MVP && training.status === 'planned' && (
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={() => setCancelModal(true)}
                  disabled={cancelling}
                  className="btn-hover"
                >
                  {cancelling ? 'Cancelando...' : 'Cancelar treino'}
                </button>
              )}
            </div>
          </header>

          {statusMessage && (
            <div style={styles.successBox} role="status">
              <div style={{ ...styles.errorTitle, color: '#065F46' }}>{statusMessage}</div>
            </div>
          )}

          {error && training && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}><IconAlert /></span>
              <div style={styles.errorContent}>
                <div style={styles.errorText}>{error}</div>
              </div>
            </div>
          )}

          {/* Resumo */}
          <section style={styles.section} aria-label="Resumo do treino">
            <h2 style={styles.sectionTitle}>Resumo</h2>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Turma:</span>
                <span style={styles.summaryValue}>
                  <Link to={`/school/teams/${training.team_id}`} style={styles.linkTeam} className="btn-hover">
                    {training.team_name}
                  </Link>
                </span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Data do treino:</span>
                <span style={styles.summaryValue}>{formatDate(training.date)}</span>
              </div>
              {(training.start_time || training.end_time) && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Horário:</span>
                  <span style={styles.summaryValue}>
                    {formatTime(training.start_time)} – {formatTime(training.end_time)}
                  </span>
                </div>
              )}
              {training.location && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Local:</span>
                  <span style={styles.summaryValue}>{training.location}</span>
                </div>
              )}
              {training.coach?.name && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Treinador responsável:</span>
                  <span style={styles.summaryValue}>{training.coach.name}</span>
                </div>
              )}
            </div>
          </section>

          {/* Plano do treino */}
          <section style={styles.section} aria-label="Plano do treino">
            <h2 style={styles.sectionTitle}>Plano do treino</h2>
            {training.title && !training.description && !training.objectives?.length ? (
              <p style={styles.planContent}>{training.title}</p>
            ) : training.description || (training.objectives && training.objectives.length > 0) ? (
              <>
                {training.description && (
                  <p style={{ ...styles.planContent, marginBottom: training.objectives?.length ? GRID * 2 : 0 }}>
                    {training.description}
                  </p>
                )}
                {training.objectives && training.objectives.length > 0 && (
                  <div>
                    <strong style={{ fontSize: 14 }}>Objetivos:</strong>
                    <ul style={styles.objectivesList}>
                      {training.objectives.map((obj, i) => (
                        <li key={i} style={{ marginBottom: GRID / 2 }}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p style={{ ...styles.planContent, opacity: 0.85 }}>Sem detalhes adicionais do treino.</p>
            )}
          </section>

          {/* Presença (somente se PRESENCA_MVP e integração por treino) */}
          {PRESENCA_MVP && (
            <section style={styles.section} aria-label="Presença">
              <h2 style={styles.sectionTitle}>Presença</h2>
              <div style={styles.attendanceRow}>
                <div style={styles.attendanceInfo}>
                  {training.attendance_summary != null ? (
                    <>
                      <span>Presenças registradas: {training.attendance_summary.present_count ?? 0} / {training.attendance_summary.total_students ?? 0}</span>
                      {training.attendance_summary.attendance_status && (
                        <span style={{ marginLeft: GRID * 2 }}>
                          · {ATTENDANCE_STATUS_LABELS[training.attendance_summary.attendance_status] ?? training.attendance_summary.attendance_status}
                        </span>
                      )}
                    </>
                  ) : (
                    <span>Presença não registrada para este treino.</span>
                  )}
                </div>
                <Link
                  to={`/school/attendance?trainingId=${training.id}`}
                  style={{ ...styles.btn, ...styles.btnSecondary, textDecoration: 'none' }}
                  className="btn-hover"
                >
                  Abrir presença
                  <IconArrowRight />
                </Link>
              </div>
            </section>
          )}
        </>
      )}

      {/* Modal confirmar cancelar treino */}
      {cancelModal && (
        <div
          style={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-cancel-training-title"
          onClick={(e) => e.target === e.currentTarget && !cancelling && setCancelModal(false)}
        >
          <div style={styles.modalBox}>
            <h2 id="confirm-cancel-training-title" style={styles.modalTitle}>
              Cancelar treino?
            </h2>
            <p style={styles.modalText}>Tem certeza que deseja cancelar este treino?</p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => !cancelling && setCancelModal(false)}
                disabled={cancelling}
                className="btn-hover"
              >
                Não
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="btn-hover"
              >
                {cancelling ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
