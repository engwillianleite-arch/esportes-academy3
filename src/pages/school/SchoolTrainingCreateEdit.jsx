import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolTeams,
  getSchoolTrainingDetail,
  getSchoolDashboardSummary,
  createSchoolTraining,
  updateSchoolTraining,
} from '../../api/schoolPortal'

const GRID = 8

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planejado' },
  { value: 'completed', label: 'Realizado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconRemove = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
  breadcrumb: { marginBottom: GRID * 2, fontSize: 14 },
  breadcrumbLink: {
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: GRID * 2,
  },
  field: { marginBottom: GRID * 2 },
  fieldFull: { gridColumn: '1 / -1' },
  label: {
    display: 'block',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  labelRequiredAfter: { marginLeft: 2, color: '#dc2626' },
  input: {
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputError: { borderColor: 'rgba(220, 53, 69, 0.7)' },
  select: {
    width: '100%',
    maxWidth: 320,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    minHeight: 120,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  objectivesList: { marginTop: GRID * 2 },
  objectiveRow: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    marginBottom: GRID,
  },
  objectiveInput: {
    flex: 1,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btnRemove: {
    padding: GRID,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 4,
    color: 'var(--grafite-tecnico)',
    opacity: 0.7,
  },
  btnAdd: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    border: '1px dashed #ccc',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
    marginTop: GRID,
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
  successBox: {
    padding: GRID * 3,
    background: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    color: '#065F46',
    fontWeight: 500,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorText: { margin: 0, fontSize: 14, color: '#991B1B', opacity: 0.9 },
  fieldError: { marginTop: 4, fontSize: 13, color: '#dc2626' },
  footerSticky: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'var(--branco-luz)',
    borderTop: '1px solid #eee',
    padding: GRID * 3,
    margin: `${GRID * 4}px -${GRID * 4}px -${GRID * 4}px`,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  btn: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
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
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
}

function FormSkeleton() {
  return (
    <>
      <div style={styles.header}>
        <div style={{ ...styles.skeleton, width: 100, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '50%', height: 32 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 140, marginBottom: GRID * 2 }} />
        <div style={styles.fieldGrid}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={styles.field}>
              <div style={{ ...styles.skeleton, width: '60%', marginBottom: 4 }} />
              <div style={{ ...styles.skeleton, width: '100%', height: 40 }} />
            </div>
          ))}
        </div>
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 80, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 120 }} />
      </div>
    </>
  )
}

function validateForm({ team_id, date, start_time, end_time }) {
  const errors = {}
  if (!(team_id || '').trim()) {
    errors.team_id = 'Selecione uma turma.'
  }
  if (!(date || '').trim()) {
    errors.date = 'Informe a data.'
  }
  const start = (start_time || '').trim()
  const end = (end_time || '').trim()
  if (start && end) {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const startMin = (sh || 0) * 60 + (sm || 0)
    const endMin = (eh || 0) * 60 + (em || 0)
    if (endMin <= startMin) {
      errors.end_time = 'Hora fim deve ser maior que hora início.'
    }
  }
  return errors
}

export default function SchoolTrainingCreateEdit() {
  const { trainingId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(trainingId)
  const teamIdFromQuery = searchParams.get('teamId') || ''

  const [teams, setTeams] = useState([])
  const [schoolName, setSchoolName] = useState('')
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState(null)

  const [team_id, setTeamId] = useState(teamIdFromQuery || '')
  const [date, setDate] = useState('')
  const [start_time, setStartTime] = useState('')
  const [end_time, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState([])
  const [status, setStatus] = useState('planned')

  useEffect(() => {
    if (teamIdFromQuery && !team_id) setTeamId(teamIdFromQuery)
  }, [teamIdFromQuery, team_id])

  const loadTeams = useCallback(() => {
    getSchoolTeams()
      .then((list) => setTeams(Array.isArray(list) ? list : []))
      .catch(() => setTeams([]))
  }, [])

  const loadInitial = useCallback(() => {
    setLoading(true)
    setPermissionDenied(false)
    setNotFound(false)
    setSaveError(null)
    setGeneralError(null)

    const load = async () => {
      try {
        if (isEdit) {
          const [training, teamsList] = await Promise.all([
            getSchoolTrainingDetail(trainingId),
            getSchoolTeams(),
          ])
          setSchoolName(training.school_name ?? '')
          setTeams(Array.isArray(teamsList) ? teamsList : [])
          setTeamId(training.team_id ?? '')
          setDate(training.date ?? '')
          setStartTime(training.start_time ?? '')
          setEndTime(training.end_time ?? '')
          setLocation(training.location ?? '')
          setTitle(training.title ?? '')
          setDescription(training.description ?? '')
          setObjectives(Array.isArray(training.objectives) ? [...training.objectives] : [])
          setStatus(training.status ?? 'planned')
        } else {
          const [summary, teamsList] = await Promise.all([
            getSchoolDashboardSummary(),
            getSchoolTeams(),
          ])
          setSchoolName(summary.school_name ?? '')
          setTeams(Array.isArray(teamsList) ? teamsList : [])
          if (teamIdFromQuery && teamsList.some((t) => t.id === teamIdFromQuery)) {
            setTeamId(teamIdFromQuery)
          }
        }
      } catch (err) {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setNotFound(true)
        } else {
          setGeneralError(err?.message || 'Não foi possível carregar os dados.')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isEdit, trainingId, teamIdFromQuery])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const addObjective = () => {
    setObjectives((prev) => [...prev, ''])
  }
  const setObjectiveAt = (index, value) => {
    setObjectives((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }
  const removeObjective = (index) => {
    setObjectives((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaveError(null)
    setFieldErrors({})
    const payload = {
      team_id: team_id.trim() || undefined,
      date: date.trim() || undefined,
      start_time: start_time.trim() || undefined,
      end_time: end_time.trim() || undefined,
      location: location.trim() || undefined,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      objectives: objectives.filter((o) => (o || '').trim()).length ? objectives.map((o) => (o || '').trim()).filter(Boolean) : undefined,
      status: status || undefined,
    }
    const errors = validateForm(payload)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSaveError('Preencha os campos obrigatórios.')
      return
    }
    setSaving(true)
    const body = {
      team_id: payload.team_id,
      date: payload.date,
      start_time: payload.start_time || null,
      end_time: payload.end_time || null,
      location: payload.location || null,
      title: payload.title || null,
      description: payload.description || null,
      objectives: payload.objectives ?? null,
      status: payload.status || 'planned',
    }
    const promise = isEdit
      ? updateSchoolTraining(trainingId, body)
      : createSchoolTraining(body)
    promise
      .then((res) => {
        setSuccessMessage('Treino salvo com sucesso.')
        const id = res.id
        setTimeout(() => {
          navigate(`/school/trainings/${id}`, { replace: true })
        }, 800)
      })
      .catch((err) => {
        setSaveError(err?.message || 'Não foi possível salvar o treino. Tente novamente.')
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    if (isEdit) {
      navigate(`/school/trainings/${trainingId}`)
    } else {
      navigate('/school/trainings')
    }
  }

  if (permissionDenied) return null

  if (notFound && isEdit) {
    return (
      <SchoolLayout schoolName={schoolName || ''}>
        <div style={{ padding: GRID * 4, textAlign: 'center' }}>
          <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 16, color: 'var(--grafite-tecnico)' }}>
            Treino não encontrado ou você não tem acesso.
          </p>
          <Link to="/school/trainings" style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Treinos
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  if (generalError && !loading) {
    return (
      <SchoolLayout schoolName={schoolName || ''}>
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorText}>{generalError}</div>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={() => loadInitial()}
              className="btn-hover"
            >
              Recarregar
            </button>
          </div>
        </div>
      </SchoolLayout>
    )
  }

  return (
    <SchoolLayout schoolName={schoolName || ''}>
      {loading && <FormSkeleton />}

      {!loading && (
        <>
          <header style={styles.header}>
            <nav style={styles.breadcrumb} aria-label="Breadcrumb">
              {isEdit ? (
                <Link to={`/school/trainings/${trainingId}`} style={styles.breadcrumbLink} className="btn-hover">
                  ← Detalhe do treino
                </Link>
              ) : (
                <Link to="/school/trainings" style={styles.breadcrumbLink} className="btn-hover">
                  ← Treinos
                </Link>
              )}
            </nav>
            <h1 style={styles.title}>{isEdit ? 'Editar treino' : 'Novo treino'}</h1>
          </header>

          {successMessage && (
            <div style={styles.successBox} role="status">
              {successMessage}
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

          <form onSubmit={handleSubmit} noValidate>
            <section style={styles.section} aria-label="Dados do treino">
              <h2 style={styles.sectionTitle}>Dados do treino</h2>
              <div style={styles.fieldGrid}>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="training-team">
                    Turma<span style={styles.labelRequiredAfter}>*</span>
                  </label>
                  <select
                    id="training-team"
                    value={team_id}
                    onChange={(e) => setTeamId(e.target.value)}
                    style={{
                      ...styles.select,
                      ...(fieldErrors.team_id ? styles.inputError : {}),
                    }}
                    disabled={loading}
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.team_id)}
                  >
                    <option value="">Selecione uma turma</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {fieldErrors.team_id && (
                    <div style={styles.fieldError} role="alert">{fieldErrors.team_id}</div>
                  )}
                </div>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="training-date">
                    Data do treino<span style={styles.labelRequiredAfter}>*</span>
                  </label>
                  <input
                    id="training-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      ...styles.input,
                      maxWidth: 200,
                      ...(fieldErrors.date ? styles.inputError : {}),
                    }}
                    disabled={loading}
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.date)}
                  />
                  {fieldErrors.date && (
                    <div style={styles.fieldError} role="alert">{fieldErrors.date}</div>
                  )}
                </div>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="training-start">Hora início</label>
                  <input
                    id="training-start"
                    type="time"
                    value={start_time}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ ...styles.input, maxWidth: 140 }}
                    disabled={loading}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="training-end">Hora fim</label>
                  <input
                    id="training-end"
                    type="time"
                    value={end_time}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      ...styles.input,
                      maxWidth: 140,
                      ...(fieldErrors.end_time ? styles.inputError : {}),
                    }}
                    disabled={loading}
                    aria-invalid={Boolean(fieldErrors.end_time)}
                  />
                  {fieldErrors.end_time && (
                    <div style={styles.fieldError} role="alert">{fieldErrors.end_time}</div>
                  )}
                </div>
                <div style={{ ...styles.field, ...styles.fieldFull }}>
                  <label style={styles.label} htmlFor="training-location">Local</label>
                  <input
                    id="training-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={styles.input}
                    placeholder="Ex.: Quadra 1"
                    disabled={loading}
                  />
                </div>
                <div style={{ ...styles.field, ...styles.fieldFull }}>
                  <label style={styles.label} htmlFor="training-title">Título / tema do treino</label>
                  <input
                    id="training-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={styles.input}
                    placeholder="Ex.: Fundamentos e passes"
                    disabled={loading}
                  />
                </div>
                {STATUS_OPTIONS.length > 0 && (
                  <div style={styles.field}>
                    <label style={styles.label} htmlFor="training-status">Status</label>
                    <select
                      id="training-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={styles.select}
                      disabled={loading}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </section>

            <section style={styles.section} aria-label="Conteúdo do treino">
              <h2 style={styles.sectionTitle}>Conteúdo do treino</h2>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="training-description">Descrição do treino</label>
                <textarea
                  id="training-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={styles.textarea}
                  placeholder="Descreva o plano ou conteúdo do treino..."
                  disabled={loading}
                  rows={4}
                />
              </div>
              <div>
                <span style={styles.label}>Objetivos</span>
                <div style={styles.objectivesList}>
                  {objectives.map((obj, i) => (
                    <div key={i} style={styles.objectiveRow}>
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => setObjectiveAt(i, e.target.value)}
                        style={styles.objectiveInput}
                        placeholder="Objetivo"
                        disabled={loading}
                        aria-label={`Objetivo ${i + 1}`}
                      />
                      <button
                        type="button"
                        style={styles.btnRemove}
                        onClick={() => removeObjective(i)}
                        disabled={loading}
                        aria-label="Remover objetivo"
                      >
                        <IconRemove />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={styles.btnAdd}
                    onClick={addObjective}
                    disabled={loading}
                    className="btn-hover"
                  >
                    Adicionar objetivo
                  </button>
                </div>
              </div>
            </section>

            <footer style={styles.footerSticky}>
              <button
                type="submit"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                disabled={saving || loading}
                className="btn-hover"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={handleCancel}
                disabled={saving}
                className="btn-hover"
              >
                Cancelar
              </button>
            </footer>
          </form>
        </>
      )}
    </SchoolLayout>
  )
}
