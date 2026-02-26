import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate, useBlocker } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolEventDetail,
  createSchoolEvent,
  updateSchoolEvent,
  getSchoolTeams,
  getSchoolStudents,
  getSchoolDashboardSummary,
} from '../../api/schoolPortal'

const GRID = 8

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Selecione o tipo (opcional)' },
  { value: 'campeonato', label: 'Campeonato' },
  { value: 'festival', label: 'Festival' },
  { value: 'treino_especial', label: 'Treino especial' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'confraternizacao', label: 'Confraternização' },
  { value: 'outro', label: 'Outro' },
]

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'teams', label: 'Turmas específicas' },
  { value: 'students', label: 'Alunos específicos' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'canceled', label: 'Cancelado' },
]

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
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: GRID * 2,
  },
  field: { marginBottom: GRID * 2 },
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
    maxWidth: 400,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputFull: { maxWidth: 'none' },
  inputError: { borderColor: 'rgba(220, 53, 69, 0.7)' },
  select: {
    width: '100%',
    maxWidth: 280,
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
    minHeight: 100,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
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
  multiSelectWrap: { maxWidth: 400 },
  multiSelectBox: {
    maxHeight: 200,
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    padding: GRID,
  },
  multiSelectItem: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    cursor: 'pointer',
    borderRadius: 4,
  },
  multiSelectSearch: {
    width: '100%',
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    marginBottom: GRID,
    boxSizing: 'border-box',
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
  notFoundBox: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  notFoundText: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 16, color: 'var(--grafite-tecnico)', opacity: 0.9 },
}

function getInitialForm() {
  return {
    title: '',
    type: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    audience_mode: 'all',
    team_ids: [],
    student_ids: [],
    status: 'active',
  }
}

function eventToForm(event) {
  const audience = event.audience || { mode: 'all' }
  return {
    title: event.title ?? '',
    type: event.type ?? '',
    date: event.date ?? '',
    start_time: event.start_time ?? '',
    end_time: event.end_time ?? '',
    location: event.location ?? '',
    description: event.description ?? '',
    audience_mode: audience.mode || 'all',
    team_ids: audience.team_ids ? [...audience.team_ids] : [],
    student_ids: audience.student_ids ? [...audience.student_ids] : [],
    status: event.status ?? 'active',
  }
}

function formToPayload(form) {
  const payload = {
    title: form.title.trim(),
    type: form.type || undefined,
    date: form.date,
    start_time: form.start_time?.trim() || undefined,
    end_time: form.end_time?.trim() || undefined,
    location: form.location?.trim() || undefined,
    description: form.description?.trim() || undefined,
  }
  if (form.audience_mode === 'teams' && form.team_ids?.length) {
    payload.audience = { mode: 'teams', team_ids: form.team_ids }
  } else if (form.audience_mode === 'students' && form.student_ids?.length) {
    payload.audience = { mode: 'students', student_ids: form.student_ids }
  } else {
    payload.audience = { mode: 'all' }
  }
  if (form.status) payload.status = form.status
  return payload
}

function validateForm(form) {
  const errors = {}
  if (!form.title?.trim()) errors.title = 'Título é obrigatório.'
  if (!form.date?.trim()) errors.date = 'Informe a data.'
  if (form.start_time?.trim() && form.end_time?.trim()) {
    if (form.start_time >= form.end_time) {
      errors.end_time = 'A hora de término deve ser posterior à hora de início.'
    }
  }
  return errors
}

function FormSkeleton() {
  return (
    <div style={styles.section}>
      <div style={{ ...styles.skeleton, width: 180, height: 22, marginBottom: GRID * 2 }} />
      <div style={{ display: 'grid', gap: GRID * 2 }}>
        <div style={{ ...styles.skeleton, width: '100%', height: 40 }} />
        <div style={{ ...styles.skeleton, width: '60%', height: 40 }} />
        <div style={{ ...styles.skeleton, width: '40%', height: 40 }} />
      </div>
    </div>
  )
}

function MultiSelectTeams({ selectedIds, onChange, teams, loading, search, onSearch }) {
  const filtered = teams.filter((t) =>
    !search.trim() || t.name.toLowerCase().includes(search.toLowerCase())
  )
  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }
  return (
    <div style={styles.multiSelectWrap}>
      <input
        type="search"
        placeholder="Buscar turmas..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        style={styles.multiSelectSearch}
        aria-label="Buscar turmas"
      />
      <div style={styles.multiSelectBox}>
        {loading && <div style={styles.skeleton}>Carregando...</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: GRID * 2, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
            Nenhuma turma encontrada.
          </div>
        )}
        {!loading && filtered.map((t) => (
          <label
            key={t.id}
            style={{ ...styles.multiSelectItem, background: selectedIds.includes(t.id) ? '#E0E7FF' : 'transparent' }}
            className="btn-hover"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(t.id)}
              onChange={() => toggle(t.id)}
              style={{ margin: 0 }}
            />
            <span>{t.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function MultiSelectStudents({ selectedIds, onChange, students, loading, search, onSearch }) {
  const filtered = students.filter((s) =>
    !search.trim() || (s.name || '').toLowerCase().includes(search.toLowerCase())
  )
  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }
  return (
    <div style={styles.multiSelectWrap}>
      <input
        type="search"
        placeholder="Buscar alunos..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        style={styles.multiSelectSearch}
        aria-label="Buscar alunos"
      />
      <div style={styles.multiSelectBox}>
        {loading && <div style={styles.skeleton}>Carregando...</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: GRID * 2, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
            Nenhum aluno encontrado.
          </div>
        )}
        {!loading && filtered.map((s) => (
          <label
            key={s.id}
            style={{ ...styles.multiSelectItem, background: selectedIds.includes(s.id) ? '#E0E7FF' : 'transparent' }}
            className="btn-hover"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(s.id)}
              onChange={() => toggle(s.id)}
              style={{ margin: 0 }}
            />
            <span>{s.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function SchoolEventCreateEdit() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(eventId)

  const [form, setForm] = useState(getInitialForm)
  const [initialForm, setInitialForm] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [errors, setErrors] = useState({})
  const [teams, setTeams] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [unsavedModal, setUnsavedModal] = useState(false)
  const [pendingNavigate, setPendingNavigate] = useState(null)
  const [schoolNameFallback, setSchoolNameFallback] = useState('')
  const successRedirectRef = useRef(null)

  const isDirty = initialForm != null && JSON.stringify(form) !== JSON.stringify(initialForm)

  useEffect(() => {
    if (!isEdit) {
      getSchoolDashboardSummary()
        .then((s) => setSchoolNameFallback(s?.school_name ?? ''))
        .catch(() => setSchoolNameFallback(''))
    }
  }, [isEdit])

  const fetchEvent = useCallback(() => {
    if (!eventId) return
    setLoading(true)
    setNotFound(false)
    setPermissionDenied(false)
    getSchoolEventDetail(eventId)
      .then((data) => {
        setEvent(data)
        const f = eventToForm(data)
        setForm(f)
        setInitialForm(f)
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else if (err.status === 404 || err.code === 'NOT_FOUND') setNotFound(true)
        else setSaveError(err?.message || 'Não foi possível carregar o evento.')
      })
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => {
    if (isEdit) fetchEvent()
    else setInitialForm(getInitialForm())
  }, [isEdit, fetchEvent])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (form.audience_mode === 'teams' && teams.length === 0 && !teamsLoading) {
      setTeamsLoading(true)
      getSchoolTeams()
        .then((list) => setTeams(Array.isArray(list) ? list : list?.items || []))
        .catch(() => setTeams([]))
        .finally(() => setTeamsLoading(false))
    }
  }, [form.audience_mode, teams.length, teamsLoading])

  useEffect(() => {
    if (form.audience_mode === 'students' && students.length === 0 && !studentsLoading) {
      setStudentsLoading(true)
      getSchoolStudents({ page: 1, page_size: 200 })
        .then((res) => setStudents(res?.items || []))
        .catch(() => setStudents([]))
        .finally(() => setStudentsLoading(false))
    }
  }, [form.audience_mode, students.length, studentsLoading])

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
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (successRedirectRef.current) {
      navigate(successRedirectRef.current, { replace: true })
      successRedirectRef.current = null
    }
  }, [successMessage, navigate])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSaveError(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSaveError('Preencha os campos obrigatórios.')
      return
    }
    setSaving(true)
    setSaveError(null)
    const payload = formToPayload(form)
    const promise = isEdit ? updateSchoolEvent(eventId, payload) : createSchoolEvent(payload)
    promise
      .then((res) => {
        setSuccessMessage('Evento salvo com sucesso.')
        setInitialForm(form)
        successRedirectRef.current = `/school/events/${res.id}`
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setSaveError(err?.message || 'Não foi possível salvar o evento. Tente novamente.')
        }
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    if (isDirty) {
      setUnsavedModal(true)
      setPendingNavigate(() => () => {
        navigate(isEdit ? `/school/events/${eventId}` : '/school/events')
        setPendingNavigate(null)
        setUnsavedModal(false)
      })
    } else {
      navigate(isEdit ? `/school/events/${eventId}` : '/school/events')
    }
  }

  const schoolName = event?.school_name ?? schoolNameFallback
  const generalError = saveError && !errors.title && !errors.date && !errors.end_time

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

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <nav style={styles.breadcrumb} aria-label="Breadcrumb">
          {isEdit ? (
            <Link to={`/school/events/${eventId}`} style={styles.breadcrumbLink} className="btn-hover">
              ← Detalhe do evento
            </Link>
          ) : (
            <Link to="/school/events" style={styles.breadcrumbLink} className="btn-hover">
              ← Eventos
            </Link>
          )}
        </nav>
        <h1 style={styles.title}>{isEdit ? 'Editar evento' : 'Novo evento'}</h1>
      </header>

      {successMessage && (
        <div style={styles.successBox} role="status">
          {successMessage}
        </div>
      )}

      {(generalError || (errors.title || errors.date || errors.end_time)) && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorText}>
              {generalError || 'Preencha os campos obrigatórios.'}
            </div>
          </div>
        </div>
      )}

      {loading && isEdit && <FormSkeleton />}

      {(!loading || !isEdit) && (
        <form onSubmit={handleSubmit} noValidate>
          <section style={styles.section} aria-label="Dados do evento">
            <h2 style={styles.sectionTitle}>Dados do evento</h2>
            <div style={styles.fieldGrid}>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label} htmlFor="event-title">
                  Título do evento<span style={styles.labelRequiredAfter}>*</span>
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  style={{ ...styles.input, ...styles.inputFull, ...(errors.title ? styles.inputError : {}) }}
                  placeholder="Ex.: Reunião de pais"
                  disabled={loading}
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'event-title-error' : undefined}
                />
                {errors.title && (
                  <p id="event-title-error" style={styles.fieldError} role="alert">{errors.title}</p>
                )}
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="event-type">Tipo</label>
                <select
                  id="event-type"
                  value={form.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  style={styles.select}
                  disabled={loading}
                >
                  {EVENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="event-date">
                  Data<span style={styles.labelRequiredAfter}>*</span>
                </label>
                <input
                  id="event-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  style={{ ...styles.input, ...(errors.date ? styles.inputError : {}) }}
                  disabled={loading}
                  aria-invalid={!!errors.date}
                />
                {errors.date && (
                  <p style={styles.fieldError} role="alert">{errors.date}</p>
                )}
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="event-start">Hora início</label>
                <input
                  id="event-start"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => updateField('start_time', e.target.value)}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="event-end">Hora fim</label>
                <input
                  id="event-end"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => updateField('end_time', e.target.value)}
                  style={{ ...styles.input, ...(errors.end_time ? styles.inputError : {}) }}
                  disabled={loading}
                  aria-invalid={!!errors.end_time}
                />
                {errors.end_time && (
                  <p style={styles.fieldError} role="alert">{errors.end_time}</p>
                )}
              </div>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label} htmlFor="event-location">Local</label>
                <input
                  id="event-location"
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  style={{ ...styles.input, ...styles.inputFull }}
                  placeholder="Ex.: Quadra 1"
                  disabled={loading}
                />
              </div>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label} htmlFor="event-description">Descrição</label>
                <textarea
                  id="event-description"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  style={{ ...styles.textarea, ...styles.inputFull }}
                  placeholder="Descrição opcional do evento"
                  disabled={loading}
                  rows={4}
                />
              </div>
            </div>
          </section>

          {/* Público-alvo (opcional MVP — backend suporta audience) */}
          <section style={styles.section} aria-label="Público-alvo">
            <h2 style={styles.sectionTitle}>Público</h2>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="event-audience">Público-alvo</label>
              <select
                id="event-audience"
                value={form.audience_mode}
                onChange={(e) => updateField('audience_mode', e.target.value)}
                style={styles.select}
                disabled={loading}
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {form.audience_mode === 'teams' && (
              <div style={{ marginTop: GRID * 2 }}>
                <MultiSelectTeams
                  selectedIds={form.team_ids}
                  onChange={(ids) => updateField('team_ids', ids)}
                  teams={teams}
                  loading={teamsLoading}
                  search={teamSearch}
                  onSearch={setTeamSearch}
                />
              </div>
            )}
            {form.audience_mode === 'students' && (
              <div style={{ marginTop: GRID * 2 }}>
                <MultiSelectStudents
                  selectedIds={form.student_ids}
                  onChange={(ids) => updateField('student_ids', ids)}
                  students={students}
                  loading={studentsLoading}
                  search={studentSearch}
                  onSearch={setStudentSearch}
                />
              </div>
            )}
          </section>

          {/* Status (somente ao editar) */}
          {isEdit && (
            <section style={styles.section} aria-label="Status">
              <h2 style={styles.sectionTitle}>Status</h2>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="event-status">Status</label>
                <select
                  id="event-status"
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  style={styles.select}
                  disabled={loading}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </section>
          )}

          <footer style={styles.footerSticky}>
            <button
              type="submit"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              className="btn-hover"
              disabled={saving || loading}
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
      )}

      {/* Modal confirmação de saída */}
      {unsavedModal && (
        <div
          style={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-event-title"
          onClick={(e) => e.target === e.currentTarget && setUnsavedModal(false)}
        >
          <div style={styles.modalBox}>
            <h2 id="unsaved-event-title" style={styles.modalTitle}>
              Alterações não salvas
            </h2>
            <p style={styles.modalText}>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => {
                  if (pendingNavigate) pendingNavigate()
                  setUnsavedModal(false)
                  setPendingNavigate(null)
                }}
                className="btn-hover"
              >
                Sair
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={() => {
                  setUnsavedModal(false)
                  setPendingNavigate(null)
                  if (blocker.reset) blocker.reset()
                }}
                className="btn-hover"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
