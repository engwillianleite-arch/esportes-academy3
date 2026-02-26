import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useBlocker } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolDashboardSummary,
  createSchoolAnnouncement,
  getSchoolTeams,
  getSchoolStudents,
} from '../../api/schoolPortal'

const GRID = 8

/** Exibir seção de público-alvo (turmas/alunos). Desligar se o backend não suportar segmentação. */
const SUPPORT_AUDIENCE_SEGMENTATION = true
/** Exibir botão "Salvar rascunho". Desligar se o backend não suportar status draft. */
const SUPPORT_DRAFT = true

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'teams', label: 'Turmas específicas' },
  { value: 'students', label: 'Alunos específicos' },
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
  field: { marginBottom: GRID * 2 },
  label: {
    display: 'block',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  labelRequired: { marginLeft: 2, color: '#dc2626' },
  input: {
    width: '100%',
    maxWidth: 560,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputError: { borderColor: 'rgba(220, 53, 69, 0.7)' },
  textarea: {
    width: '100%',
    minHeight: 160,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
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
}

function getInitialForm() {
  return {
    title: '',
    content: '',
    audience_mode: 'all',
    team_ids: [],
    student_ids: [],
  }
}

function buildPayload(form, status = 'published') {
  const payload = {
    title: form.title.trim(),
    content: form.content.trim(),
    status,
  }
  if (SUPPORT_AUDIENCE_SEGMENTATION) {
    if (form.audience_mode === 'teams' && form.team_ids?.length) {
      payload.audience = { mode: 'teams', team_ids: form.team_ids }
    } else if (form.audience_mode === 'students' && form.student_ids?.length) {
      payload.audience = { mode: 'students', student_ids: form.student_ids }
    } else {
      payload.audience = { mode: 'all' }
    }
  }
  return payload
}

function validateForm(form) {
  const errors = {}
  if (!form.title?.trim()) errors.title = 'Informe o título.'
  if (!form.content?.trim()) errors.content = 'Informe a mensagem.'
  if (SUPPORT_AUDIENCE_SEGMENTATION) {
    if (form.audience_mode === 'teams' && (!form.team_ids?.length)) {
      errors.audience = 'Selecione ao menos uma turma.'
    } else if (form.audience_mode === 'students' && (!form.student_ids?.length)) {
      errors.audience = 'Selecione ao menos um aluno.'
    }
  }
  return errors
}

function MultiSelectTeams({ selectedIds, onChange, teams, loading, search, onSearch }) {
  const filtered = teams.filter((t) =>
    !search.trim() || (t.name || '').toLowerCase().includes(search.toLowerCase())
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
        {loading && <div style={styles.skeleton}>Carregando turmas...</div>}
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
        {loading && <div style={styles.skeleton}>Carregando alunos...</div>}
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

export default function SchoolAnnouncementCreate() {
  const navigate = useNavigate()
  const [schoolName, setSchoolName] = useState('')
  const [form, setForm] = useState(getInitialForm)
  const [initialForm] = useState(getInitialForm)
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [unsavedModal, setUnsavedModal] = useState(false)
  const [pendingNavigate, setPendingNavigate] = useState(null)

  const [teams, setTeams] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  const isDirty =
    form.title !== initialForm.title ||
    form.content !== initialForm.content ||
    form.audience_mode !== initialForm.audience_mode ||
    JSON.stringify(form.team_ids) !== JSON.stringify(initialForm.team_ids) ||
    JSON.stringify(form.student_ids) !== JSON.stringify(initialForm.student_ids)

  useEffect(() => {
    getSchoolDashboardSummary()
      .then((s) => setSchoolName(s?.school_name ?? ''))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (SUPPORT_AUDIENCE_SEGMENTATION && form.audience_mode === 'teams' && teams.length === 0 && !teamsLoading) {
      setTeamsLoading(true)
      getSchoolTeams()
        .then((list) => setTeams(Array.isArray(list) ? list : list?.items || []))
        .catch(() => setTeams([]))
        .finally(() => setTeamsLoading(false))
    }
  }, [form.audience_mode, teams.length, teamsLoading])

  useEffect(() => {
    if (SUPPORT_AUDIENCE_SEGMENTATION && form.audience_mode === 'students' && students.length === 0 && !studentsLoading) {
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
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSaveError(null)
  }, [])

  const handlePublish = (e) => {
    e.preventDefault()
    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSaveError('Preencha os campos obrigatórios.')
      return
    }
    setSaving(true)
    setSaveError(null)
    createSchoolAnnouncement(buildPayload(form, 'published'))
      .then((res) => {
        navigate(`/school/announcements/${res.id}`, {
          replace: true,
          state: { message: 'Comunicado publicado com sucesso.' },
        })
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setSaveError(err?.message || 'Não foi possível publicar o comunicado. Tente novamente.')
        }
      })
      .finally(() => setSaving(false))
  }

  const handleSaveDraft = (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!form.title?.trim()) nextErrors.title = 'Informe o título.'
    if (!form.content?.trim()) nextErrors.content = 'Informe a mensagem.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSaveError('Preencha título e mensagem para salvar o rascunho.')
      return
    }
    setSaving(true)
    setSaveError(null)
    createSchoolAnnouncement(buildPayload(form, 'draft'))
      .then((res) => {
        navigate(`/school/announcements/${res.id}`, {
          replace: true,
          state: { message: 'Rascunho salvo com sucesso.' },
        })
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setSaveError(err?.message || 'Não foi possível salvar o rascunho. Tente novamente.')
        }
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    if (isDirty) {
      setUnsavedModal(true)
      setPendingNavigate(() => () => {
        navigate('/school/announcements')
        setPendingNavigate(null)
        setUnsavedModal(false)
      })
    } else {
      navigate('/school/announcements')
    }
  }

  const confirmLeave = () => {
    if (pendingNavigate) {
      pendingNavigate()
    }
  }

  const stayOnPage = () => {
    if (blocker.reset) blocker.reset()
    setPendingNavigate(null)
    setUnsavedModal(false)
  }

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <nav style={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/school/announcements" style={styles.breadcrumbLink} className="btn-hover">
            ← Comunicados
          </Link>
        </nav>
        <h1 style={styles.title}>Novo comunicado</h1>
      </header>

      <form onSubmit={handlePublish} noValidate>
        {saveError && (
          <div style={styles.errorBox} role="alert">
            <span style={styles.errorIcon}><IconAlert /></span>
            <div style={styles.errorContent}>
              <p style={styles.errorText}>{saveError}</p>
            </div>
          </div>
        )}

        <section style={styles.section} aria-labelledby="section-content">
          <h2 id="section-content" style={styles.sectionTitle}>Conteúdo do comunicado</h2>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="ann-title">
              Título<span style={styles.labelRequired}>*</span>
            </label>
            <input
              id="ann-title"
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Ex.: Recesso de fim de ano"
              style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'err-title' : undefined}
              disabled={saving}
            />
            {errors.title && <p id="err-title" style={styles.fieldError}>{errors.title}</p>}
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="ann-content">
              Mensagem<span style={styles.labelRequired}>*</span>
            </label>
            <textarea
              id="ann-content"
              value={form.content}
              onChange={(e) => updateField('content', e.target.value)}
              placeholder="Escreva o texto do comunicado..."
              style={{ ...styles.textarea, ...(errors.content ? styles.inputError : {}) }}
              aria-invalid={!!errors.content}
              aria-describedby={errors.content ? 'err-content' : undefined}
              disabled={saving}
              rows={6}
            />
            {errors.content && <p id="err-content" style={styles.fieldError}>{errors.content}</p>}
          </div>
        </section>

        {SUPPORT_AUDIENCE_SEGMENTATION && (
          <section style={styles.section} aria-labelledby="section-audience">
            <h2 id="section-audience" style={styles.sectionTitle}>Público-alvo</h2>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="audience-mode">Enviar para</label>
              <select
                id="audience-mode"
                value={form.audience_mode}
                onChange={(e) => updateField('audience_mode', e.target.value)}
                style={styles.select}
                disabled={saving}
              >
                {AUDIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {form.audience_mode === 'teams' && (
              <div style={styles.field}>
                <MultiSelectTeams
                  selectedIds={form.team_ids}
                  onChange={(ids) => updateField('team_ids', ids)}
                  teams={teams}
                  loading={teamsLoading}
                  search={teamSearch}
                  onSearch={setTeamSearch}
                />
                {errors.audience && <p style={styles.fieldError}>{errors.audience}</p>}
              </div>
            )}
            {form.audience_mode === 'students' && (
              <div style={styles.field}>
                <MultiSelectStudents
                  selectedIds={form.student_ids}
                  onChange={(ids) => updateField('student_ids', ids)}
                  students={students}
                  loading={studentsLoading}
                  search={studentSearch}
                  onSearch={setStudentSearch}
                />
                {errors.audience && <p style={styles.fieldError}>{errors.audience}</p>}
              </div>
            )}
          </section>
        )}

        <footer style={styles.footerSticky}>
          <button
            type="submit"
            style={{ ...styles.btn, ...styles.btnPrimary }}
            className="btn-hover"
            disabled={saving}
          >
            {saving ? 'Publicando...' : 'Publicar'}
          </button>
          {SUPPORT_DRAFT && (
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnSecondary }}
              className="btn-hover"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              Salvar rascunho
            </button>
          )}
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnSecondary }}
            className="btn-hover"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancelar
          </button>
        </footer>
      </form>

      {unsavedModal && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
          <div style={styles.modalBox}>
            <h2 id="unsaved-title" style={styles.modalTitle}>Sair sem salvar?</h2>
            <p style={styles.modalText}>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                className="btn-hover"
                onClick={stayOnPage}
              >
                Continuar
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                className="btn-hover"
                onClick={confirmLeave}
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
