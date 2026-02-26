import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolTeamDetail, updateTeamStatus } from '../../api/schoolPortal'

const GRID = 8

const WEEKDAY_LABELS = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

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
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
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
  metadata: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    marginBottom: GRID * 2,
  },
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
  agendaList: { listStyle: 'none', margin: 0, padding: 0 },
  agendaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px 0`,
    borderBottom: '1px solid #eee',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  agendaItemLast: { borderBottom: 'none' },
  emptyAgenda: {
    textAlign: 'center',
    padding: GRID * 4,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    fontSize: 14,
  },
  searchWrap: {
    position: 'relative',
    maxWidth: 280,
    marginBottom: GRID * 2,
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
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    background: 'var(--cinza-arquibancada)',
    borderBottom: '1px solid #eee',
  },
  td: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderBottom: '1px solid #eee',
    color: 'var(--grafite-tecnico)',
  },
  trClick: { cursor: 'pointer' },
  studentStatusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
  },
  emptyStudents: {
    textAlign: 'center',
    padding: GRID * 6,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    fontSize: 14,
  },
  opsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: GRID * 2,
  },
  opsCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: GRID * 2,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    color: 'var(--grafite-tecnico)',
    fontWeight: 500,
    fontSize: 14,
    border: '1px solid transparent',
  },
  opsCardIcon: { color: 'var(--azul-arena)', opacity: 0.9 },
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

function formatTime(t) {
  if (!t) return '—'
  const [h, m] = String(t).split(':')
  return `${h || '00'}:${m || '00'}`
}

function formatWeekday(weekday) {
  if (!weekday) return '—'
  return WEEKDAY_LABELS[String(weekday).toLowerCase()] || weekday
}

const canEditTeam = true
const canToggleTeamStatus = true

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
        <div style={{ ...styles.skeleton, width: '100%', height: 120 }} />
      </div>
    </>
  )
}

export default function SchoolTeamDetail() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  const fetchTeam = useCallback(() => {
    if (!teamId) return
    setError(null)
    setNotFound(false)
    setPermissionDenied(false)
    setLoading(true)
    getSchoolTeamDetail(teamId)
      .then((data) => setTeam(data))
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setNotFound(true)
        } else {
          setError(err?.message || 'Não foi possível carregar a turma. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [teamId])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const scheduleItems = team?.schedule?.items ?? []
  const hasAgenda = scheduleItems.length > 0
  const students = team?.students ?? []
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students
    const q = studentSearch.trim().toLowerCase()
    return students.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.contact_phone && String(s.contact_phone).toLowerCase().includes(q)) ||
        (s.guardian_name && s.guardian_name.toLowerCase().includes(q))
    )
  }, [students, studentSearch])

  const handleConfirmToggle = () => {
    if (!team || !confirmModal) return
    const next = confirmModal.nextStatus
    setToggling(true)
    setConfirmModal(null)
    setError(null)
    updateTeamStatus(team.id, next)
      .then(() => {
        setTeam((prev) => (prev ? { ...prev, status: next } : null))
        setStatusMessage('Status da turma atualizado com sucesso.')
        setTimeout(() => setStatusMessage(null), 4000)
      })
      .catch(() => {
        setError('Não foi possível atualizar o status da turma.')
      })
      .finally(() => setToggling(false))
  }

  const openInactivateModal = () => {
    setConfirmModal({
      title: 'Inativar turma?',
      text: 'Tem certeza que deseja inativar esta turma?',
      nextStatus: 'inactive',
    })
  }
  const openActivateModal = () => {
    setConfirmModal({
      title: 'Ativar turma?',
      text: 'Tem certeza que deseja ativar esta turma?',
      nextStatus: 'active',
    })
  }

  if (permissionDenied) return null

  if (notFound) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.notFoundBox}>
          <p style={styles.notFoundText}>Turma não encontrada ou você não tem acesso.</p>
          <Link to="/school/teams" style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Turmas
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  if (error && !team) {
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
              onClick={() => fetchTeam()}
              className="btn-hover"
            >
              Recarregar
            </button>
          </div>
        </div>
      </SchoolLayout>
    )
  }

  const schoolName = team?.school_name ?? ''

  return (
    <SchoolLayout schoolName={schoolName}>
      {loading && !team && <DetailSkeleton />}

      {!loading && team && (
        <>
          <header style={styles.header}>
            <nav style={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to="/school/teams" style={styles.breadcrumbLink} className="btn-hover">
                ← Turmas
              </Link>
            </nav>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>{team.name}</h1>
              <span
                style={{
                  ...styles.statusBadge,
                  ...(team.status === 'active' ? styles.statusActive : styles.statusInactive),
                }}
              >
                {team.status === 'active' ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <div style={styles.metadata}>
              {team.coach?.name && <span>Treinador: {team.coach.name}</span>}
              {(team.coach?.name && (team.modality || team.sport)) && ' · '}
              {(team.modality || team.sport) && <span>Modalidade: {team.modality || team.sport}</span>}
              {!team.coach?.name && !team.modality && !team.sport && <span>—</span>}
            </div>
            <div style={styles.actionsRow}>
              {canEditTeam && (
                <Link
                  to={`/school/teams/${team.id}/edit`}
                  style={{ ...styles.btn, ...styles.btnPrimary }}
                  className="btn-hover"
                >
                  Editar
                </Link>
              )}
              <Link
                to={`/school/trainings/new?teamId=${team.id}`}
                style={{ ...styles.btn, ...styles.btnSecondary }}
                className="btn-hover"
              >
                Novo treino
              </Link>
              {canToggleTeamStatus && (
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={team.status === 'active' ? openInactivateModal : openActivateModal}
                  disabled={toggling}
                  className="btn-hover"
                >
                  {toggling ? 'Salvando...' : team.status === 'active' ? 'Inativar' : 'Ativar'}
                </button>
              )}
            </div>
          </header>

          {statusMessage && (
            <div style={styles.successBox} role="status">
              <div style={{ ...styles.errorTitle, color: '#065F46' }}>{statusMessage}</div>
            </div>
          )}

          {error && team && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}><IconAlert /></span>
              <div style={styles.errorContent}>
                <div style={styles.errorText}>{error}</div>
              </div>
            </div>
          )}

          {/* Agenda da turma */}
          <section style={styles.section} aria-label="Agenda da turma">
            <h2 style={styles.sectionTitle}>Agenda da turma</h2>
            {hasAgenda ? (
              <ul style={styles.agendaList}>
                {scheduleItems.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      ...styles.agendaItem,
                      ...(i === scheduleItems.length - 1 ? styles.agendaItemLast : {}),
                    }}
                  >
                    <IconCalendar />
                    <span>
                      {formatWeekday(item.weekday)} {formatTime(item.start_time)}–{formatTime(item.end_time)}
                      {item.location ? ` · ${item.location}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={styles.emptyAgenda}>Horário não definido para esta turma.</p>
            )}
          </section>

          {/* Alunos da turma */}
          <section style={styles.section} aria-label="Alunos da turma">
            <div style={styles.sectionTitleRow}>
              <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Alunos</h2>
              <span style={{ fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
                {students.length} {students.length === 1 ? 'aluno' : 'alunos'}
              </span>
            </div>
            {students.length > 0 && (
              <div style={styles.searchWrap}>
                <span style={styles.searchIcon} aria-hidden><IconSearch /></span>
                <input
                  type="search"
                  aria-label="Buscar aluno na turma"
                  placeholder="Buscar aluno na turma"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            )}
            {filteredStudents.length > 0 ? (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nome</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Contato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr
                        key={s.id}
                        style={styles.trClick}
                        className="btn-hover"
                        onClick={() => navigate(`/school/students/${s.id}`)}
                      >
                        <td style={styles.td}><strong>{s.name}</strong></td>
                        <td style={styles.td}>
                          {s.status != null ? (
                            <span
                              style={{
                                ...styles.studentStatusBadge,
                                ...(s.status === 'active' ? styles.statusActive : styles.statusInactive),
                              }}
                            >
                              {s.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={styles.td}>
                          {s.contact_phone || s.guardian_name || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={styles.emptyStudents}>
                {studentSearch.trim()
                  ? 'Nenhum aluno encontrado com esse filtro.'
                  : 'Nenhum aluno vinculado a esta turma.'}
              </p>
            )}
          </section>

          {/* Atalhos operacionais (MVP: treinos; presença se existir) */}
          <section style={styles.section} aria-label="Atalhos operacionais">
            <h2 style={styles.sectionTitle}>Atalhos</h2>
            <div style={styles.opsGrid}>
              <Link
                to={`/school/assessments/new?teamId=${team.id}`}
                style={styles.opsCard}
                className="btn-hover"
              >
                Aplicar avaliação
                <span style={styles.opsCardIcon}><IconArrowRight /></span>
              </Link>
              <Link
                to={`/school/trainings?teamId=${team.id}`}
                style={styles.opsCard}
                className="btn-hover"
              >
                Ver treinos
                <span style={styles.opsCardIcon}><IconArrowRight /></span>
              </Link>
              <Link
                to={`/school/attendance?teamId=${team.id}&date=${new Date().toISOString().slice(0, 10)}`}
                style={styles.opsCard}
                className="btn-hover"
              >
                Registrar presença
                <span style={styles.opsCardIcon}><IconArrowRight /></span>
              </Link>
              <Link
                to={`/school/attendance/history?teamId=${team.id}`}
                style={styles.opsCard}
                className="btn-hover"
              >
                Histórico de Presenças
                <span style={styles.opsCardIcon}><IconArrowRight /></span>
              </Link>
            </div>
          </section>
        </>
      )}

      {/* Modal confirmar ativar/inativar */}
      {confirmModal && (
        <div
          style={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-team-status-title"
          onClick={(e) => e.target === e.currentTarget && !toggling && setConfirmModal(null)}
        >
          <div style={styles.modalBox}>
            <h2 id="confirm-team-status-title" style={styles.modalTitle}>
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
