import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearchParams, useBlocker } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getAttendanceByTraining,
  getAttendanceByTeamAndDate,
  getSchoolTeamsList,
  saveAttendance,
} from '../../api/schoolPortal'

const GRID = 8

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

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
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
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  section: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
  },
  sectionTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  sectionTitleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  contextLocked: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
    marginBottom: GRID * 2,
  },
  selectRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  field: { display: 'flex', flexDirection: 'column', gap: GRID / 2, minWidth: 160 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  input: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
  },
  select: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    minWidth: 220,
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
  searchWrap: { position: 'relative', maxWidth: 280, marginBottom: GRID * 2 },
  searchIcon: { position: 'absolute', left: GRID * 1.5, top: '50%', transform: 'translateY(-50%)', color: 'var(--grafite-tecnico)', opacity: 0.5, pointerEvents: 'none' },
  searchInput: {
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px ${GRID * 1.5}px ${GRID * 5}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
  },
  quickActions: { display: 'flex', flexWrap: 'wrap', gap: GRID * 2, marginBottom: GRID * 2 },
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
  td: { padding: `${GRID * 2}px ${GRID * 3}px`, borderBottom: '1px solid #eee', color: 'var(--grafite-tecnico)' },
  toggle: {
    appearance: 'none',
    width: 44,
    height: 24,
    borderRadius: 12,
    background: 'var(--cinza-arquibancada)',
    border: '1px solid #ddd',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
  },
  toggleChecked: { background: 'var(--azul-arena)', borderColor: 'var(--azul-arena)' },
  footer: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'var(--branco-luz)',
    borderTop: '1px solid #eee',
    padding: GRID * 3,
    margin: `0 -${GRID * 4}px -${GRID * 4}px`,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
  },
  footerActions: { display: 'flex', flexWrap: 'wrap', gap: GRID * 2, alignItems: 'center' },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    fontSize: 14,
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
  successBox: {
    padding: GRID * 3,
    background: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
  },
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
  linkStudent: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
}

function ListSkeleton() {
  return (
    <div style={styles.section}>
      <div style={{ ...styles.skeleton, width: 120, marginBottom: GRID * 2 }} />
      <div style={{ ...styles.skeleton, width: '100%', height: 48, marginBottom: GRID * 2 }} />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={{ ...styles.skeleton, width: '100%', height: 52, marginBottom: GRID }} />
      ))}
    </div>
  )
}

export default function SchoolAttendance() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const trainingId = searchParams.get('trainingId')
  const teamIdParam = searchParams.get('teamId')
  const dateParam = searchParams.get('date')

  const [teams, setTeams] = useState([])
  const [schoolNameFromApi, setSchoolNameFromApi] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState(teamIdParam || '')
  const [selectedDate, setSelectedDate] = useState(dateParam || todayISO())
  const [context, setContext] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [loadTrigger, setLoadTrigger] = useState(0)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [unsavedModal, setUnsavedModal] = useState(false)
  const [pendingNavigate, setPendingNavigate] = useState(null)

  const isByTraining = Boolean(trainingId)
  const hasContext = context != null
  const students = context?.students ?? []
  const initialItems = useMemo(() => {
    return students.map((s) => ({
      student_id: s.student_id,
      present: s.current_attendance_status === true,
    }))
  }, [students])

  const isDirty = useMemo(() => {
    if (items.length === 0 && initialItems.length === 0) return false
    if (items.length !== initialItems.length) return true
    return items.some((it, i) => {
      const init = initialItems.find((x) => x.student_id === it.student_id)
      return init ? init.present !== it.present : true
    })
  }, [items, initialItems])

  const backUrl = useMemo(() => {
    if (trainingId) return `/school/trainings/${trainingId}`
    if (teamIdParam) return `/school/teams/${teamIdParam}`
    return '/school/dashboard'
  }, [trainingId, teamIdParam])

  const backLabel = useMemo(() => {
    if (trainingId) return 'Voltar ao treino'
    if (teamIdParam) return 'Voltar à turma'
    return 'Voltar ao dashboard'
  }, [trainingId, teamIdParam])

  const loadByTraining = useCallback(() => {
    if (!trainingId) return
    setError(null)
    setPermissionDenied(false)
    setNotFound(false)
    setLoading(true)
    getAttendanceByTraining(trainingId)
      .then((data) => {
        setContext(data)
        setItems(
          (data.students || []).map((s) => ({
            student_id: s.student_id,
            present: s.current_attendance_status === true,
          }))
        )
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else if (err.status === 404 || err.code === 'NOT_FOUND') setNotFound(true)
        else setError(err?.message || 'Não foi possível carregar a chamada. Tente novamente.')
      })
      .finally(() => setLoading(false))
  }, [trainingId])

  const loadByTeamAndDate = useCallback(() => {
    if (!selectedTeamId || !selectedDate) return
    setError(null)
    setPermissionDenied(false)
    setNotFound(false)
    setLoading(true)
    getAttendanceByTeamAndDate(selectedTeamId, selectedDate)
      .then((data) => {
        setContext(data)
        setItems(
          (data.students || []).map((s) => ({
            student_id: s.student_id,
            present: s.current_attendance_status === true,
          }))
        )
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else if (err.status === 404 || err.code === 'NOT_FOUND') setNotFound(true)
        else setError(err?.message || 'Não foi possível carregar a chamada. Tente novamente.')
      })
      .finally(() => setLoading(false))
  }, [selectedTeamId, selectedDate])

  useEffect(() => {
    if (isByTraining) {
      loadByTraining()
    } else {
      setContext(null)
      setItems([])
    }
  }, [isByTraining, trainingId, loadByTraining])

  useEffect(() => {
    if (!isByTraining && loadTrigger > 0 && selectedTeamId && selectedDate) {
      loadByTeamAndDate()
    }
  }, [loadTrigger, isByTraining, selectedTeamId, selectedDate, loadByTeamAndDate])

  useEffect(() => {
    if (!isByTraining) {
      setLoadingTeams(true)
      getSchoolTeamsList({ page: 1, page_size: 100, status: 'active' })
        .then((res) => {
          setTeams(res.items || [])
          if (res.school_name) setSchoolNameFromApi(res.school_name)
        })
        .catch(() => setTeams([]))
        .finally(() => setLoadingTeams(false))
    }
  }, [isByTraining])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setUnsavedModal(true)
      setPendingNavigate(() => () => {
        if (blocker.proceed) blocker.proceed()
        setPendingNavigate(null)
        setUnsavedModal(false)
      })
    }
  }, [blocker.state])

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const setPresent = (studentId, present) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.student_id === studentId ? { ...it, present } : it))
      const has = next.some((it) => it.student_id === studentId)
      if (!has) next.push({ student_id: studentId, present })
      return next
    })
  }

  const markAllPresent = () => {
    setItems(students.map((s) => ({ student_id: s.student_id, present: true })))
  }

  const clearMarks = () => {
    setItems(
      students.map((s) => ({
        student_id: s.student_id,
        present: s.current_attendance_status === true,
      }))
    )
  }

  const handleSave = () => {
    setSaveError(null)
    if (!context) return
    const payload = {
      team_id: context.team_id,
      date: context.date,
      items: items.map((it) => ({ student_id: it.student_id, present: it.present })),
    }
    if (context.training_id) payload.training_id = context.training_id
    setSaving(true)
    saveAttendance(payload)
      .then(() => {
        setSuccessMessage('Presença salva com sucesso.')
        setTimeout(() => setSuccessMessage(null), 4000)
        setContext((c) => (c ? { ...c, attendance_id: payload.training_id ? `att-${payload.training_id}` : `att-${payload.team_id}-${payload.date}` } : null))
        setItems((prev) => prev.map((it) => ({ ...it })))
      })
      .catch((err) => {
        setSaveError(err?.message || 'Não foi possível salvar a presença. Tente novamente.')
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    if (isDirty) {
      setUnsavedModal(true)
      setPendingNavigate(() => () => {
        setUnsavedModal(false)
        setPendingNavigate(null)
        navigate(backUrl)
      })
    } else {
      navigate(backUrl)
    }
  }

  const confirmLeave = () => {
    const fn = pendingNavigate
    setPendingNavigate(null)
    setUnsavedModal(false)
    if (blocker.state === 'blocked' && blocker.reset) blocker.reset()
    if (typeof fn === 'function') {
      const action = fn()
      if (typeof action === 'function') action()
    }
  }

  const stay = () => {
    setPendingNavigate(null)
    setUnsavedModal(false)
    if (blocker.state === 'blocked' && blocker.reset) blocker.reset()
  }

  const [searchQuery, setSearchQuery] = useState('')
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.trim().toLowerCase()
    return students.filter((s) => (s.name && s.name.toLowerCase().includes(q)))
  }, [students, searchQuery])

  const schoolName = context?.school_name || schoolNameFromApi || ''
  const subtitle = useMemo(() => {
    if (!context) return null
    if (context.training_id) {
      return `Treino — ${formatDate(context.date)} • ${context.team_name}`
    }
    return `${context.team_name} • ${formatDate(context.date)}`
  }, [context])

  if (permissionDenied) return null

  if (notFound && isByTraining) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.section}>
          <p style={styles.emptyState}>Treino não encontrado ou você não tem acesso.</p>
          <Link to="/school/trainings" style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Treinos
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  if (notFound && !isByTraining) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.section}>
          <p style={styles.emptyState}>Turma não encontrada ou você não tem acesso.</p>
          <Link to="/school/teams" style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Turmas
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <nav style={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to={backUrl} style={styles.breadcrumbLink} className="btn-hover">
            ← {backLabel}
          </Link>
        </nav>
        <h1 style={styles.title}>Presença</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </header>

      {successMessage && (
        <div style={styles.successBox} role="status">
          <div style={{ ...styles.errorTitle, color: '#065F46' }}>{successMessage}</div>
        </div>
      )}

      {saveError && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorText}>{saveError}</div>
          </div>
        </div>
      )}

      {/* Seleção do contexto */}
      <section style={styles.section} aria-label="Contexto da chamada">
        <h2 style={styles.sectionTitle}>Contexto</h2>
        {isByTraining ? (
          hasContext && (
            <div style={styles.contextLocked}>
              Turma: <strong>{context.team_name}</strong> · Data: {formatDate(context.date)}
              {(context.start_time || context.end_time) && (
                <> · Horário: {formatTime(context.start_time)} – {formatTime(context.end_time)}</>
              )}
            </div>
          )
        ) : (
          <>
            <div style={styles.selectRow}>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="att-team">Turma</label>
                <select
                  id="att-team"
                  style={styles.select}
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  disabled={loadingTeams}
                  aria-label="Selecionar turma"
                >
                  <option value="">Selecione a turma</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="att-date">Data</label>
                <input
                  id="att-date"
                  type="date"
                  style={styles.input}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  aria-label="Data da chamada"
                />
              </div>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                className="btn-hover"
                onClick={() => setLoadTrigger((t) => t + 1)}
                disabled={!selectedTeamId || !selectedDate || loading}
              >
                Carregar lista
              </button>
            </div>
            {!hasContext && !loading && (
              <p style={styles.emptyState}>Selecione uma turma e uma data para carregar a chamada.</p>
            )}
          </>
        )}
      </section>

      {error && !hasContext && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={isByTraining ? loadByTraining : loadByTeamAndDate}
              className="btn-hover"
            >
              Recarregar
            </button>
          </div>
        </div>
      )}

      {loading && <ListSkeleton />}

      {!loading && hasContext && (
        <section style={styles.section} aria-label="Lista de alunos">
          <div style={styles.sectionTitleRow}>
            <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Alunos</h2>
            <span style={{ fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
              {students.length} {students.length === 1 ? 'aluno' : 'alunos'}
            </span>
          </div>

          {students.length === 0 ? (
            <p style={styles.emptyState}>Esta turma não possui alunos vinculados.</p>
          ) : (
            <>
              <div style={styles.searchWrap}>
                <span style={styles.searchIcon} aria-hidden><IconSearch /></span>
                <input
                  type="search"
                  aria-label="Buscar aluno"
                  placeholder="Buscar aluno"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
              <div style={styles.quickActions}>
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  className="btn-hover"
                  onClick={markAllPresent}
                >
                  Marcar todos como presentes
                </button>
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  className="btn-hover"
                  onClick={clearMarks}
                >
                  Limpar marcações
                </button>
              </div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nome</th>
                      <th style={styles.th}>Presente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => {
                      const it = items.find((i) => i.student_id === s.student_id)
                      const present = it ? it.present : false
                      return (
                        <tr key={s.student_id}>
                          <td style={styles.td}>
                            <Link
                              to={`/school/students/${s.student_id}`}
                              style={styles.linkStudent}
                              className="btn-hover"
                            >
                              {s.name || '—'}
                            </Link>
                          </td>
                          <td style={styles.td}>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={present}
                              aria-label={`${s.name} ${present ? 'presente' : 'ausente'}`}
                              style={{
                                ...styles.toggle,
                                ...(present ? styles.toggleChecked : {}),
                              }}
                              onClick={() => setPresent(s.student_id, !present)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {hasContext && students.length > 0 && (
        <footer style={styles.footer}>
          <div style={styles.footerActions}>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              className="btn-hover"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar presença'}
            </button>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnSecondary }}
              className="btn-hover"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </footer>
      )}

      {unsavedModal && (
        <div
          style={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-attendance-title"
          onClick={(e) => e.target === e.currentTarget && stay()}
        >
          <div style={styles.modalBox}>
            <h2 id="unsaved-attendance-title" style={styles.modalTitle}>
              Alterações não salvas
            </h2>
            <p style={styles.modalText}>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={stay}
                className="btn-hover"
              >
                Continuar
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={confirmLeave}
                className="btn-hover"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
