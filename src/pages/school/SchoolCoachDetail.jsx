import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolCoachDetail, updateCoachStatus } from '../../api/schoolPortal'

const GRID = 8

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
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
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
  },
  statusActive: { background: '#D1FAE5', color: '#065F46' },
  statusInactive: { background: '#FEE2E2', color: '#991B1B' },
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
  sectionTitleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  dataGrid: {
    display: 'grid',
    gap: GRID * 2,
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  },
  dataItem: { fontSize: 14, color: 'var(--grafite-tecnico)' },
  dataLabel: { opacity: 0.75, marginBottom: 2 },
  dataValue: { fontWeight: 500 },
  teamList: { listStyle: 'none', margin: 0, padding: 0 },
  teamItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: GRID,
    padding: `${GRID * 2}px 0`,
    borderBottom: '1px solid #eee',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  teamItemLast: { borderBottom: 'none' },
  teamLink: {
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
  },
  teamMeta: { fontSize: 13, opacity: 0.85 },
  emptyTeams: {
    textAlign: 'center',
    padding: GRID * 4,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    fontSize: 14,
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
  successBox: {
    padding: GRID * 3,
    background: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
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
}

const canEditCoach = true
const canToggleCoachStatus = true

function DetailSkeleton() {
  return (
    <>
      <div style={styles.header}>
        <div style={{ ...styles.skeleton, width: 180, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '60%', height: 32, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: 80, height: 24 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 160, marginBottom: GRID * 2 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: GRID * 2 }}>
          <div style={{ ...styles.skeleton, height: 40 }} />
          <div style={{ ...styles.skeleton, height: 40 }} />
          <div style={{ ...styles.skeleton, height: 40 }} />
          <div style={{ ...styles.skeleton, height: 40 }} />
        </div>
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 120, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 120 }} />
      </div>
    </>
  )
}

export default function SchoolCoachDetail() {
  const { coachId } = useParams()
  const navigate = useNavigate()
  const [coach, setCoach] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  const fetchCoach = useCallback(() => {
    if (!coachId) return
    setError(null)
    setNotFound(false)
    setPermissionDenied(false)
    setLoading(true)
    getSchoolCoachDetail(coachId)
      .then((data) => setCoach(data))
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setNotFound(true)
        } else {
          setError(err?.message || 'Não foi possível carregar o treinador. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [coachId])

  useEffect(() => {
    fetchCoach()
  }, [fetchCoach])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const handleConfirmToggle = () => {
    if (!coach || !confirmModal) return
    const next = confirmModal.nextStatus
    setToggling(true)
    setConfirmModal(null)
    setError(null)
    updateCoachStatus(coach.id, next)
      .then(() => {
        setCoach((prev) => (prev ? { ...prev, status: next } : null))
        setStatusMessage('Status do treinador atualizado com sucesso.')
        setTimeout(() => setStatusMessage(null), 4000)
      })
      .catch(() => {
        setError('Não foi possível atualizar o status do treinador.')
      })
      .finally(() => setToggling(false))
  }

  const openInactivateModal = () => {
    setConfirmModal({
      title: 'Inativar treinador?',
      text: 'Tem certeza que deseja inativar este treinador?',
      nextStatus: 'inactive',
    })
  }
  const openActivateModal = () => {
    setConfirmModal({
      title: 'Ativar treinador?',
      text: 'Tem certeza que deseja ativar este treinador?',
      nextStatus: 'active',
    })
  }

  if (permissionDenied) return null

  if (notFound) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.notFoundBox}>
          <p style={styles.notFoundText}>Treinador não encontrado ou você não tem acesso.</p>
          <Link to="/school/coaches" style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Professores/Treinadores
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  if (error && !coach) {
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
              onClick={() => fetchCoach()}
              className="btn-hover"
            >
              Recarregar
            </button>
          </div>
        </div>
      </SchoolLayout>
    )
  }

  const schoolName = coach?.school_name ?? ''
  const teams = coach?.teams ?? []

  return (
    <SchoolLayout schoolName={schoolName}>
      {loading && !coach && <DetailSkeleton />}

      {!loading && coach && (
        <>
          <header style={styles.header}>
            <nav style={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to="/school/coaches" style={styles.breadcrumbLink} className="btn-hover">
                ← Professores/Treinadores
              </Link>
            </nav>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>{coach.name}</h1>
              <span
                style={{
                  ...styles.statusBadge,
                  ...(coach.status === 'active' ? styles.statusActive : styles.statusInactive),
                }}
              >
                {coach.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div style={styles.actionsRow}>
              {canEditCoach && (
                <Link
                  to={`/school/coaches/${coach.id}/edit`}
                  style={{ ...styles.btn, ...styles.btnPrimary }}
                  className="btn-hover"
                >
                  Editar
                </Link>
              )}
              {canToggleCoachStatus && (
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={coach.status === 'active' ? openInactivateModal : openActivateModal}
                  disabled={toggling}
                  className="btn-hover"
                >
                  {toggling ? 'Salvando...' : coach.status === 'active' ? 'Inativar' : 'Ativar'}
                </button>
              )}
            </div>
          </header>

          {statusMessage && (
            <div style={styles.successBox} role="status">
              <div style={{ ...styles.errorTitle, color: '#065F46' }}>{statusMessage}</div>
            </div>
          )}

          {error && coach && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}><IconAlert /></span>
              <div style={styles.errorContent}>
                <div style={styles.errorText}>{error}</div>
              </div>
            </div>
          )}

          {/* Dados do treinador */}
          <section style={styles.section} aria-label="Dados do treinador">
            <h2 style={styles.sectionTitle}>Dados do treinador</h2>
            <div style={styles.dataGrid}>
              <div style={styles.dataItem}>
                <div style={styles.dataLabel}>Nome completo</div>
                <div style={styles.dataValue}>{coach.name || '—'}</div>
              </div>
              <div style={styles.dataItem}>
                <div style={styles.dataLabel}>E-mail</div>
                <div style={styles.dataValue}>{coach.email || '—'}</div>
              </div>
              <div style={styles.dataItem}>
                <div style={styles.dataLabel}>Telefone</div>
                <div style={styles.dataValue}>{coach.phone || '—'}</div>
              </div>
              {(coach.specialty != null && coach.specialty !== '') && (
                <div style={styles.dataItem}>
                  <div style={styles.dataLabel}>Especialidade/Modalidade</div>
                  <div style={styles.dataValue}>{coach.specialty}</div>
                </div>
              )}
              {(coach.notes != null && coach.notes !== '') && (
                <div style={styles.dataItem}>
                  <div style={styles.dataLabel}>Observações</div>
                  <div style={styles.dataValue}>{coach.notes}</div>
                </div>
              )}
            </div>
          </section>

          {/* Turmas atribuídas */}
          <section style={styles.section} aria-label="Turmas atribuídas">
            <div style={styles.sectionTitleRow}>
              <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Turmas</h2>
              <span style={{ fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
                {teams.length} {teams.length === 1 ? 'turma' : 'turmas'}
              </span>
            </div>
            {teams.length > 0 ? (
              <ul style={styles.teamList}>
                {teams.map((t, i) => (
                  <li
                    key={t.team_id}
                    style={{
                      ...styles.teamItem,
                      ...(i === teams.length - 1 ? styles.teamItemLast : {}),
                    }}
                  >
                    <Link
                      to={`/school/teams/${t.team_id}`}
                      style={styles.teamLink}
                      className="btn-hover"
                    >
                      {t.team_name}
                      <IconArrowRight />
                    </Link>
                    <div style={styles.teamMeta}>
                      {t.schedule_summary && <span>{t.schedule_summary}</span>}
                      {t.schedule_summary && ' · '}
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(t.team_status === 'active' ? styles.statusActive : styles.statusInactive),
                        }}
                      >
                        {t.team_status === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={styles.emptyTeams}>Nenhuma turma atribuída a este treinador.</p>
            )}
          </section>
        </>
      )}

      {/* Modal confirmar ativar/inativar */}
      {confirmModal && (
        <div
          style={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-coach-status-title"
          onClick={(e) => e.target === e.currentTarget && !toggling && setConfirmModal(null)}
        >
          <div style={styles.modalBox}>
            <h2 id="confirm-coach-status-title" style={styles.modalTitle}>
              {confirmModal.title}
            </h2>
            <p style={styles.modalText}>{confirmModal.text}</p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => !toggling && setConfirmModal(null)}
                disabled={toggling}
                className="btn-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={handleConfirmToggle}
                disabled={toggling}
                className="btn-hover"
              >
                {toggling ? 'Salvando...' : confirmModal.nextStatus === 'inactive' ? 'Inativar' : 'Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
