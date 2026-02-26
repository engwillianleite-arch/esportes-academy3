import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolEventDetail, cancelSchoolEvent, getEventTypeLabel } from '../../api/schoolPortal'

const GRID = 8

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

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
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
  },
  badgeType: { background: '#E0E7FF', color: '#3730A3' },
  statusActive: { background: '#D1FAE5', color: '#065F46' },
  statusCanceled: { background: '#FEE2E2', color: '#991B1B' },
  statusPast: { background: '#E5E7EB', color: '#374151' },
  statusUpcoming: { background: '#DBEAFE', color: '#1E40AF' },
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
  fieldRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
    marginBottom: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  fieldLabel: { fontWeight: 600, minWidth: 100 },
  fieldValue: { opacity: 0.95 },
  descriptionText: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
  audienceList: { listStyle: 'none', margin: 0, padding: 0 },
  audienceItem: {
    padding: `${GRID}px 0`,
    borderBottom: '1px solid #eee',
    fontSize: 14,
  },
  audienceItemLast: { borderBottom: 'none' },
  audienceLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
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
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = String(t).split(':')
  return `${h || '00'}:${m || '00'}`
}

function formatDateAndTime(dateStr, startTime, endTime) {
  const d = formatDate(dateStr)
  if (!startTime && !endTime) return d
  if (startTime && endTime) return `${d} · ${formatTime(startTime)} – ${formatTime(endTime)}`
  return `${d} · ${formatTime(startTime || endTime)}`
}

function getStatusBadgeLabel(event) {
  if (event.status === 'canceled') return 'Cancelado'
  const today = new Date().toISOString().slice(0, 10)
  if (event.date >= today) return 'Próximo'
  return 'Passado'
}

function getStatusBadgeStyle(event) {
  if (event.status === 'canceled') return styles.statusCanceled
  const today = new Date().toISOString().slice(0, 10)
  if (event.date >= today) return styles.statusUpcoming
  return styles.statusPast
}

const canEditEvent = true
const canCancelEvent = true

function DetailSkeleton() {
  return (
    <>
      <div style={styles.header}>
        <div style={{ ...styles.skeleton, width: 100, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '70%', height: 32, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: 200, height: 20 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 180, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 60 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 120, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 80 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 140, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 40 }} />
      </div>
    </>
  )
}

export default function SchoolEventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const fetchEvent = useCallback(() => {
    if (!eventId) return
    setError(null)
    setNotFound(false)
    setPermissionDenied(false)
    setLoading(true)
    getSchoolEventDetail(eventId)
      .then((data) => setEvent(data))
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setNotFound(true)
        } else {
          setError(err?.message || 'Não foi possível carregar o evento. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const handleConfirmCancel = () => {
    if (!eventId) return
    setCanceling(true)
    setCancelError(null)
    setConfirmCancel(false)
    cancelSchoolEvent(eventId, {})
      .then(() => {
        setEvent((prev) => (prev ? { ...prev, status: 'canceled' } : null))
        setSuccessMessage('Evento cancelado com sucesso.')
        setTimeout(() => setSuccessMessage(null), 4000)
        fetchEvent()
      })
      .catch((err) => {
        setCancelError(err?.message || 'Não foi possível cancelar o evento. Tente novamente.')
      })
      .finally(() => setCanceling(false))
  }

  if (permissionDenied) return null

  if (notFound) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.notFoundBox}>
          <p style={styles.notFoundText}>Evento não encontrado ou você não tem acesso.</p>
          <Link to="/school/events" style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Eventos
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  if (error && !event) {
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
              onClick={() => fetchEvent()}
              className="btn-hover"
            >
              Recarregar
            </button>
          </div>
        </div>
      </SchoolLayout>
    )
  }

  const schoolName = event?.school_name ?? ''

  return (
    <SchoolLayout schoolName={schoolName}>
      {loading && !event && <DetailSkeleton />}

      {!loading && event && (
        <>
          <header style={styles.header}>
            <nav style={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to="/school/events" style={styles.breadcrumbLink} className="btn-hover">
                ← Eventos
              </Link>
            </nav>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>{event.title || 'Evento'}</h1>
              {event.type && (
                <span style={{ ...styles.badge, ...styles.badgeType }}>
                  {getEventTypeLabel(event.type)}
                </span>
              )}
              <span style={{ ...styles.badge, ...getStatusBadgeStyle(event) }}>
                {getStatusBadgeLabel(event)}
              </span>
            </div>
            <div style={styles.actionsRow}>
              {canEditEvent && event.status !== 'canceled' && (
                <Link
                  to={`/school/events/${event.id}/edit`}
                  style={{ ...styles.btn, ...styles.btnPrimary }}
                  className="btn-hover"
                >
                  Editar
                </Link>
              )}
              {canCancelEvent && event.status !== 'canceled' && (
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={() => setConfirmCancel(true)}
                  disabled={canceling}
                  className="btn-hover"
                >
                  {canceling ? 'Cancelando...' : 'Cancelar evento'}
                </button>
              )}
            </div>
          </header>

          {successMessage && (
            <div style={styles.successBox} role="status">
              <div style={{ ...styles.errorTitle, color: '#065F46' }}>{successMessage}</div>
            </div>
          )}

          {cancelError && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}><IconAlert /></span>
              <div style={styles.errorContent}>
                <div style={styles.errorText}>{cancelError}</div>
              </div>
            </div>
          )}

          {/* Resumo */}
          <section style={styles.section} aria-label="Resumo do evento">
            <h2 style={styles.sectionTitle}>Resumo</h2>
            <div style={styles.fieldRow}>
              <span style={styles.fieldLabel}>Data</span>
              <span style={styles.fieldValue}>
                {formatDateAndTime(event.date, event.start_time, event.end_time)}
              </span>
            </div>
            {event.location && (
              <div style={styles.fieldRow}>
                <span style={styles.fieldLabel}>Local</span>
                <span style={styles.fieldValue}>{event.location}</span>
              </div>
            )}
            {event.type && (
              <div style={styles.fieldRow}>
                <span style={styles.fieldLabel}>Tipo</span>
                <span style={styles.fieldValue}>{getEventTypeLabel(event.type)}</span>
              </div>
            )}
            {event.organizer?.name && (
              <div style={styles.fieldRow}>
                <span style={styles.fieldLabel}>Responsável</span>
                <span style={styles.fieldValue}>{event.organizer.name}</span>
              </div>
            )}
          </section>

          {/* Descrição */}
          <section style={styles.section} aria-label="Descrição">
            <h2 style={styles.sectionTitle}>Descrição</h2>
            <p style={styles.descriptionText}>
              {event.description?.trim() ? event.description : 'Sem descrição.'}
            </p>
          </section>

          {/* Público-alvo (somente se existir no modelo) */}
          {event.audience && (
            <section style={styles.section} aria-label="Público-alvo">
              <h2 style={styles.sectionTitle}>Público-alvo</h2>
              {event.audience.mode === 'all' && (
                <p style={styles.descriptionText}>Público: Todos os alunos</p>
              )}
              {event.audience.mode === 'teams' && event.audience_resolved?.teams?.length > 0 && (
                <ul style={styles.audienceList}>
                  {event.audience_resolved.teams.map((team, i) => (
                    <li
                      key={team.id}
                      style={{
                        ...styles.audienceItem,
                        ...(i === event.audience_resolved.teams.length - 1 ? styles.audienceItemLast : {}),
                      }}
                    >
                      <Link to={`/school/teams/${team.id}`} style={styles.audienceLink} className="btn-hover">
                        {team.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {event.audience.mode === 'teams' && (!event.audience_resolved?.teams?.length) && (
                <p style={styles.descriptionText}>Turmas específicas (dados não disponíveis)</p>
              )}
              {event.audience.mode === 'students' && event.audience_resolved?.students?.length > 0 && (
                <ul style={styles.audienceList}>
                  {event.audience_resolved.students.map((student, i) => (
                    <li
                      key={student.id}
                      style={{
                        ...styles.audienceItem,
                        ...(i === event.audience_resolved.students.length - 1 ? styles.audienceItemLast : {}),
                      }}
                    >
                      <Link to={`/school/students/${student.id}`} style={styles.audienceLink} className="btn-hover">
                        {student.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {event.audience.mode === 'students' && (!event.audience_resolved?.students?.length) && (
                <p style={styles.descriptionText}>Alunos específicos (dados não disponíveis)</p>
              )}
            </section>
          )}
        </>
      )}

      {/* Modal confirmar cancelamento */}
      {confirmCancel && (
        <div
          style={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-cancel-event-title"
          onClick={(e) => e.target === e.currentTarget && !canceling && setConfirmCancel(false)}
        >
          <div style={styles.modalBox}>
            <h2 id="confirm-cancel-event-title" style={styles.modalTitle}>
              Cancelar evento
            </h2>
            <p style={styles.modalText}>
              Tem certeza que deseja cancelar este evento?
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => !canceling && setConfirmCancel(false)}
                disabled={canceling}
                className="btn-hover"
              >
                Não
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={handleConfirmCancel}
                disabled={canceling}
                className="btn-hover"
              >
                {canceling ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
