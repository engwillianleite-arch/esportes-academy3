import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolStudent, updateStudentStatus } from '../../api/schoolPortal'

const GRID = 8

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconAttendance = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
  </svg>
)
const IconFinance = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
  breadcrumb: {
    marginBottom: GRID * 2,
    fontSize: 14,
  },
  breadcrumbLink: {
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
  },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 2,
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
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: GRID * 2,
  },
  field: { marginBottom: GRID * 2 },
  fieldLabel: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.7, marginBottom: 2 },
  fieldValue: { fontSize: 14, color: 'var(--grafite-tecnico)', fontWeight: 500 },
  teamList: { listStyle: 'none', margin: 0, padding: 0 },
  teamItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${GRID * 1.5}px 0`,
    borderBottom: '1px solid #eee',
    gap: GRID * 2,
  },
  teamItemLast: { borderBottom: 'none' },
  teamName: { fontWeight: 500, color: 'var(--grafite-tecnico)' },
  teamMeta: { fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.8 },
  teamBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 500,
  },
  emptyVinc: {
    textAlign: 'center',
    padding: GRID * 4,
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
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: GRID * 4,
  },
  modal: {
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

function formatDate(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return value
  }
}

const canEditStudent = true
const canToggleStatus = true

function DetailSkeleton() {
  return (
    <>
      <div style={styles.header}>
        <div style={{ ...styles.skeleton, width: 120, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '60%', height: 32, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: 80, height: 28 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 160, marginBottom: GRID * 2 }} />
        <div style={styles.fieldGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={styles.field}>
              <div style={{ ...styles.skeleton, width: '70%', marginBottom: 4 }} />
              <div style={{ ...styles.skeleton, width: '100%' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 140, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 80 }} />
      </div>
    </>
  )
}

export default function SchoolStudentDetail() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [statusToggling, setStatusToggling] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const fetchStudent = useCallback(() => {
    if (!studentId) return
    setError(null)
    setNotFound(false)
    setPermissionDenied(false)
    setLoading(true)
    getSchoolStudent(studentId)
      .then((data) => {
        setStudent(data)
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setNotFound(true)
        } else {
          setError(err?.message || 'Não foi possível carregar os dados do aluno. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [studentId])

  useEffect(() => {
    fetchStudent()
  }, [fetchStudent])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const handleToggleStatus = () => {
    if (!student || !canToggleStatus) return
    const next = student.status === 'active' ? 'inactive' : 'active'
    setConfirmModal({
      action: next,
      message: next === 'inactive'
        ? 'Tem certeza que deseja inativar este aluno?'
        : 'Ativar aluno?',
    })
  }

  const confirmStatusChange = () => {
    if (!student || !confirmModal) return
    const next = confirmModal.action
    setStatusToggling(true)
    setConfirmModal(null)
    setError(null)
    updateStudentStatus(student.id, next)
      .then(() => {
        setStudent((prev) => (prev ? { ...prev, status: next } : null))
        setSuccessMessage('Status do aluno atualizado com sucesso.')
        setTimeout(() => setSuccessMessage(null), 4000)
      })
      .catch(() => {
        setError('Não foi possível atualizar o status do aluno.')
      })
      .finally(() => setStatusToggling(false))
  }

  if (permissionDenied) return null

  if (notFound) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.notFoundBox}>
          <p style={styles.notFoundText}>Aluno não encontrado ou você não tem acesso.</p>
          <Link to="/school/students" style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Alunos
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  if (error && !student) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => fetchStudent()} className="btn-hover">
              Recarregar
            </button>
          </div>
        </div>
      </SchoolLayout>
    )
  }

  const schoolName = student?.school_name ?? ''

  return (
    <SchoolLayout schoolName={schoolName}>
      {loading && !student && <DetailSkeleton />}

      {!loading && student && (
        <>
          <header style={styles.header}>
            <nav style={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to="/school/students" style={styles.breadcrumbLink} className="btn-hover">
                ← Alunos
              </Link>
            </nav>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>{student.name}</h1>
              <span
                style={{
                  ...styles.statusBadge,
                  ...(student.status === 'active' ? styles.statusActive : styles.statusInactive),
                }}
              >
                {student.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div style={styles.actionsRow}>
              {canEditStudent && (
                <Link
                  to={`/school/students/${student.id}/edit`}
                  style={{ ...styles.btn, ...styles.btnPrimary }}
                  className="btn-hover"
                >
                  Editar
                </Link>
              )}
              {canToggleStatus && (
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={handleToggleStatus}
                  disabled={statusToggling}
                  className="btn-hover"
                >
                  {statusToggling ? '...' : student.status === 'active' ? 'Inativar' : 'Ativar'}
                </button>
              )}
            </div>
          </header>

          {successMessage && (
            <div
              style={{
                ...styles.errorBox,
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                marginBottom: GRID * 3,
              }}
              role="status"
            >
              <div style={styles.errorContent}>
                <div style={{ ...styles.errorTitle, color: '#065F46' }}>{successMessage}</div>
              </div>
            </div>
          )}

          {error && student && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}><IconAlert /></span>
              <div style={styles.errorContent}>
                <div style={styles.errorText}>{error}</div>
              </div>
            </div>
          )}

          <section style={styles.section} aria-labelledby="dados-aluno-title">
            <h2 id="dados-aluno-title" style={styles.sectionTitle}>Dados do aluno</h2>
            <div style={styles.fieldGrid}>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Nome completo</div>
                <div style={styles.fieldValue}>{student.name || '—'}</div>
              </div>
              {student.birth_date != null && (
                <div style={styles.field}>
                  <div style={styles.fieldLabel}>Data de nascimento</div>
                  <div style={styles.fieldValue}>{formatDate(student.birth_date)}</div>
                </div>
              )}
              {student.document != null && (
                <div style={styles.field}>
                  <div style={styles.fieldLabel}>Documento (CPF/ID)</div>
                  <div style={styles.fieldValue}>{student.document}</div>
                </div>
              )}
              <div style={styles.field}>
                <div style={styles.fieldLabel}>E-mail</div>
                <div style={styles.fieldValue}>{student.email || '—'}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Telefone</div>
                <div style={styles.fieldValue}>{student.phone || '—'}</div>
              </div>
              {student.address != null && student.address !== '' && (
                <div style={styles.field}>
                  <div style={styles.fieldLabel}>Endereço</div>
                  <div style={styles.fieldValue}>{student.address}</div>
                </div>
              )}
            </div>
          </section>

          {student.guardian && (student.guardian.name || student.guardian.phone || student.guardian.email) && (
            <section style={styles.section} aria-labelledby="responsavel-title">
              <h2 id="responsavel-title" style={styles.sectionTitle}>Responsável</h2>
              <div style={styles.fieldGrid}>
                {student.guardian.name != null && (
                  <div style={styles.field}>
                    <div style={styles.fieldLabel}>Nome do responsável</div>
                    <div style={styles.fieldValue}>{student.guardian.name}</div>
                  </div>
                )}
                {student.guardian.phone != null && (
                  <div style={styles.field}>
                    <div style={styles.fieldLabel}>Telefone do responsável</div>
                    <div style={styles.fieldValue}>{student.guardian.phone}</div>
                  </div>
                )}
                {student.guardian.email != null && (
                  <div style={styles.field}>
                    <div style={styles.fieldLabel}>E-mail do responsável</div>
                    <div style={styles.fieldValue}>{student.guardian.email}</div>
                  </div>
                )}
                {student.guardian.relation != null && (
                  <div style={styles.field}>
                    <div style={styles.fieldLabel}>Relação</div>
                    <div style={styles.fieldValue}>{student.guardian.relation}</div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section style={styles.section} aria-labelledby="vinculos-title">
            <h2 id="vinculos-title" style={styles.sectionTitle}>Vínculos</h2>
            <h3 style={{ margin: `0 0 ${GRID}px`, fontSize: 14, fontWeight: 600, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>Turmas vinculadas</h3>
            {student.teams && student.teams.length > 0 ? (
              <ul style={styles.teamList}>
                {student.teams.map((t, i) => (
                  <li
                    key={t.team_id}
                    style={{
                      ...styles.teamItem,
                      ...(i === student.teams.length - 1 ? styles.teamItemLast : {}),
                    }}
                  >
                    <div>
                      <div style={styles.teamName}>{t.team_name}</div>
                      <div style={styles.teamMeta}>
                        {t.schedule || ''}
                        {t.schedule && ' · '}
                        <span
                          style={{
                            ...styles.teamBadge,
                            ...(t.active ? styles.statusActive : styles.statusInactive),
                          }}
                        >
                          {t.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={styles.emptyVinc}>Este aluno ainda não está vinculado a nenhuma turma.</p>
            )}
            {student.operational_summary && (student.operational_summary.last_attendance_date || student.operational_summary.financial_status != null) && (
              <>
                <h3 style={{ margin: `${GRID * 3}px 0 ${GRID}px`, fontSize: 14, fontWeight: 600, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>Resumo operacional</h3>
                <div style={styles.fieldGrid}>
                  {student.operational_summary.last_attendance_date && (
                    <div style={styles.field}>
                      <div style={styles.fieldLabel}>Última presença</div>
                      <div style={styles.fieldValue}>{formatDate(student.operational_summary.last_attendance_date)}</div>
                    </div>
                  )}
                  {student.operational_summary.financial_status != null && (
                    <div style={styles.field}>
                      <div style={styles.fieldLabel}>Situação financeira</div>
                      <div style={styles.fieldValue}>
                        {student.operational_summary.financial_status === 'up_to_date' ? 'Em dia' : 'Inadimplente'}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <section style={styles.section} aria-labelledby="operacao-title">
            <h2 id="operacao-title" style={styles.sectionTitle}>Operação</h2>
            <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
              Acesso rápido aos módulos do aluno.
            </p>
            <div style={styles.opsGrid}>
              <Link
                to={`/school/attendance?studentId=${student.id}`}
                style={styles.opsCard}
                className="btn-hover"
              >
                <span style={styles.opsCardIcon}><IconAttendance /></span>
                Presença
                <IconArrowRight />
              </Link>
              <Link
                to={`/school/finance?studentId=${student.id}`}
                style={styles.opsCard}
                className="btn-hover"
              >
                <span style={styles.opsCardIcon}><IconFinance /></span>
                Financeiro
                <IconArrowRight />
              </Link>
            </div>
          </section>
        </>
      )}

      {confirmModal && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div style={styles.modal}>
            <h3 id="confirm-title" style={styles.modalTitle}>Confirmar</h3>
            <p style={styles.modalText}>{confirmModal.message}</p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setConfirmModal(null)}
                className="btn-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={confirmStatusChange}
                className="btn-hover"
              >
                {confirmModal.action === 'inactive' ? 'Inativar' : 'Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
