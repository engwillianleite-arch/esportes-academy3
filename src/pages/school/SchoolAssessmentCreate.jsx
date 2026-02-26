import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolStudents,
  getSchoolTeamsList,
  getSchoolDashboardSummary,
  createSchoolAssessment,
} from '../../api/schoolPortal'

const GRID = 8

const ASSESSMENT_TYPES = [
  { value: '', label: '—' },
  { value: 'tecnica', label: 'Técnica' },
  { value: 'fisica', label: 'Física' },
  { value: 'faixa', label: 'Faixa/Graduação' },
  { value: 'outro', label: 'Outro' },
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
  subtitle: {
    margin: `${GRID}px 0 0`,
    fontSize: 15,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
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
    maxWidth: 360,
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
    maxWidth: 360,
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
  criteriaList: { marginTop: GRID * 2 },
  criterionRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 100px 1fr auto',
    gap: GRID * 2,
    alignItems: 'start',
    marginBottom: GRID * 2,
  },
  criterionInput: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  addCriterionBtn: {
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
  removeBtn: {
    padding: GRID,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#6b7280',
  },
  footer: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    padding: `${GRID * 3}px 0`,
    background: 'var(--branco-luz)',
    borderTop: '1px solid #eee',
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
  },
  btnPrimary: { background: 'var(--azul-arena)', color: '#fff' },
  btnSecondary: { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' },
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
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
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

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function SchoolAssessmentCreate() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryStudentId = searchParams.get('studentId') || ''
  const queryTeamId = searchParams.get('teamId') || ''

  const [schoolName, setSchoolName] = useState('')
  const [students, setStudents] = useState([])
  const [teams, setTeams] = useState([])
  const [loadingSelects, setLoadingSelects] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [studentId, setStudentId] = useState(queryStudentId)
  const [teamId, setTeamId] = useState(queryTeamId)
  const [date, setDate] = useState(todayISO())
  const [type, setType] = useState('')
  const [title, setTitle] = useState('')
  const [criteria, setCriteria] = useState([{ criterion_name: '', value: '', note: '' }])
  const [summary, setSummary] = useState('')
  const [notes, setNotes] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [exitConfirm, setExitConfirm] = useState(null)

  const studentLocked = !!queryStudentId
  const teamLocked = !!queryTeamId

  const initialDirtyRef = useMemo(() => ({
    studentId: queryStudentId,
    teamId: queryTeamId,
    date: todayISO(),
    type: '',
    title: '',
    criteria: [{ criterion_name: '', value: '', note: '' }],
    summary: '',
    notes: '',
  }), [queryStudentId, queryTeamId])

  const isDirty = useMemo(() => {
    const sameCriteria =
      criteria.length === initialDirtyRef.criteria.length &&
      criteria.every((c, i) => {
        const o = initialDirtyRef.criteria[i]
        return o && c.criterion_name === o.criterion_name && String(c.value) === String(o.value) && c.note === o.note
      })
    return (
      studentId !== initialDirtyRef.studentId ||
      teamId !== initialDirtyRef.teamId ||
      date !== initialDirtyRef.date ||
      type !== initialDirtyRef.type ||
      title !== initialDirtyRef.title ||
      !sameCriteria ||
      summary !== initialDirtyRef.summary ||
      notes !== initialDirtyRef.notes
    )
  }, [studentId, teamId, date, type, title, criteria, summary, notes, initialDirtyRef])

  const loadSummary = useCallback(() => {
    getSchoolDashboardSummary()
      .then((d) => setSchoolName(d.school_name || ''))
      .catch(() => {})
  }, [])

  const loadSelects = useCallback(() => {
    setLoadingSelects(true)
    setError(null)
    const teamIdParam = queryTeamId || undefined
    Promise.all([
      getSchoolStudents({ page: 1, page_size: 500, ...(teamIdParam && { team_id: teamIdParam }) }),
      getSchoolTeamsList({ page: 1, page_size: 200 }),
    ])
      .then(([studentsRes, teamsRes]) => {
        setStudents(studentsRes.items || [])
        setTeams(teamsRes.items || [])
        if (studentsRes.school_name) setSchoolName(studentsRes.school_name)
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setError(err?.message || 'Não foi possível carregar alunos e turmas.')
        }
      })
      .finally(() => setLoadingSelects(false))
  }, [queryTeamId])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadSelects()
  }, [loadSelects])

  useEffect(() => {
    if (queryStudentId) setStudentId(queryStudentId)
    if (queryTeamId) setTeamId(queryTeamId)
  }, [queryStudentId, queryTeamId])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const studentsFiltered = useMemo(() => {
    if (!studentSearch.trim()) return students
    const q = studentSearch.trim().toLowerCase()
    return students.filter((s) => (s.name || '').toLowerCase().includes(q))
  }, [students, studentSearch])

  const breadcrumbParts = useMemo(() => {
    if (queryStudentId) {
      const student = students.find((s) => s.id === queryStudentId)
      return [
        { to: '/school/students', label: 'Alunos' },
        ...(student ? [{ to: `/school/students/${queryStudentId}`, label: student.name }] : []),
        { label: 'Aplicar avaliação' },
      ]
    }
    if (queryTeamId) {
      const team = teams.find((t) => t.id === queryTeamId)
      return [
        { to: '/school/teams', label: 'Turmas' },
        ...(team ? [{ to: `/school/teams/${queryTeamId}`, label: team.name }] : []),
        { label: 'Aplicar avaliação' },
      ]
    }
    return [
      { to: '/school/assessments', label: 'Avaliações' },
      { label: 'Aplicar avaliação' },
    ]
  }, [queryStudentId, queryTeamId, students, teams])

  const getCancelTo = () => {
    if (queryStudentId) return `/school/students/${queryStudentId}`
    if (queryTeamId) return `/school/teams/${queryTeamId}`
    return '/school/assessments'
  }

  const validate = () => {
    const err = {}
    if (!studentId || !studentId.trim()) err.studentId = 'Selecione um aluno.'
    if (!date || !date.trim()) err.date = 'Informe a data.'
    const validCriteria = criteria.filter((c) => (c.criterion_name || '').trim() !== '' && (c.value !== '' && c.value != null))
    if (validCriteria.length === 0) err.criteria = 'Adicione ao menos 1 critério.'
    setValidationErrors(err)
    return Object.keys(err).length === 0
  }

  const handleAddCriterion = () => {
    setCriteria((prev) => [...prev, { criterion_name: '', value: '', note: '' }])
  }

  const handleRemoveCriterion = (index) => {
    setCriteria((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const handleCriterionChange = (index, field, value) => {
    setCriteria((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setSaving(true)
    const validCriteria = criteria.filter((c) => (c.criterion_name || '').trim() !== '' && (c.value !== '' && c.value != null))
    const body = {
      student_id: studentId.trim(),
      date: date.trim(),
      ...(teamId && teamId.trim() && { team_id: teamId.trim() }),
      ...(type && type.trim() && { type: type.trim() }),
      ...(title && title.trim() && { title: title.trim() }),
      criteria_results: validCriteria.map((c) => ({
        criterion_name: (c.criterion_name || '').trim(),
        scale_type: 'score',
        value: Number(c.value),
        ...(c.note && c.note.trim() && { note: c.note.trim() }),
      })),
      final_result: {
        ...(summary && summary.trim() && { summary: summary.trim() }),
        ...(notes && notes.trim() && { notes: notes.trim() }),
      },
    }
    createSchoolAssessment(body)
      .then((res) => {
        navigate(`/school/assessments/${res.id}`, { replace: true })
      })
      .catch((err) => {
        setError(err?.message || 'Não foi possível salvar a avaliação. Tente novamente.')
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    if (isDirty) {
      setExitConfirm(true)
    } else {
      navigate(getCancelTo())
    }
  }

  const handleConfirmExit = () => {
    setExitConfirm(null)
    navigate(getCancelTo())
  }

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <nav style={styles.breadcrumb} aria-label="Breadcrumb">
          {breadcrumbParts.map((part, i) => (
            <span key={i}>
              {i > 0 && ' / '}
              {part.to ? (
                <Link to={part.to} style={styles.breadcrumbLink} className="btn-hover">
                  {part.label}
                </Link>
              ) : (
                part.label
              )}
            </span>
          ))}
        </nav>
        <h1 style={styles.title}>Aplicar avaliação</h1>
        <p style={styles.subtitle}>Registre critérios e resultados do aluno</p>
      </header>

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <p style={styles.errorText}>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <section style={styles.section} aria-labelledby="contexto-avaliacao">
          <h2 id="contexto-avaliacao" style={styles.sectionTitle}>Contexto da avaliação</h2>
          <div style={styles.fieldGrid}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="student">
                Aluno <span style={styles.labelRequiredAfter}>*</span>
              </label>
              {loadingSelects ? (
                <div id="student" style={{ ...styles.skeleton, width: '100%', maxWidth: 360, height: 40 }} />
              ) : studentLocked ? (
                <input
                  id="student"
                  type="text"
                  readOnly
                  value={students.find((s) => s.id === studentId)?.name || studentId}
                  style={{ ...styles.input, background: '#f5f5f5', cursor: 'not-allowed' }}
                  aria-readonly="true"
                />
              ) : (
                <>
                  <input
                    type="search"
                    aria-label="Buscar aluno"
                    placeholder="Buscar aluno..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{ ...styles.input, marginBottom: GRID }}
                  />
                  <select
                    id="student"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    style={{ ...styles.select, ...(validationErrors.studentId ? styles.inputError : {}) }}
                    aria-required="true"
                    aria-invalid={!!validationErrors.studentId}
                  >
                    <option value="">Selecione um aluno</option>
                    {studentsFiltered.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </>
              )}
              {validationErrors.studentId && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }} role="alert">{validationErrors.studentId}</p>
              )}
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="team">Turma</label>
              {loadingSelects ? (
                <div id="team" style={{ ...styles.skeleton, width: '100%', maxWidth: 360, height: 40 }} />
              ) : teamLocked ? (
                <input
                  id="team"
                  type="text"
                  readOnly
                  value={teams.find((t) => t.id === teamId)?.name || teamId}
                  style={{ ...styles.input, background: '#f5f5f5', cursor: 'not-allowed' }}
                />
              ) : (
                <select
                  id="team"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Nenhuma</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="date">
                Data da avaliação <span style={styles.labelRequiredAfter}>*</span>
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ ...styles.input, ...(validationErrors.date ? styles.inputError : {}) }}
                aria-required="true"
                aria-invalid={!!validationErrors.date}
              />
              {validationErrors.date && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }} role="alert">{validationErrors.date}</p>
              )}
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="type">Tipo</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)} style={styles.select}>
                {ASSESSMENT_TYPES.map((opt) => (
                  <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
              <label style={styles.label} htmlFor="title">Título (opcional)</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Avaliação técnica - passes"
                style={styles.input}
              />
            </div>
          </div>
        </section>

        <section style={styles.section} aria-labelledby="criterios-title">
          <h2 id="criterios-title" style={styles.sectionTitle}>Critérios e resultados (MVP: nota 0–10)</h2>
          {validationErrors.criteria && (
            <p style={{ margin: '0 0 ' + GRID + 'px', fontSize: 14, color: '#dc2626' }} role="alert">{validationErrors.criteria}</p>
          )}
          <div style={styles.criteriaList}>
            {criteria.map((c, index) => (
              <div key={index} style={styles.criterionRow}>
                <div>
                  <label style={{ ...styles.label, marginBottom: 4 }}>Critério</label>
                  <input
                    type="text"
                    value={c.criterion_name}
                    onChange={(e) => handleCriterionChange(index, 'criterion_name', e.target.value)}
                    placeholder="Ex.: Precisão de passes"
                    style={{ ...styles.criterionInput, width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ ...styles.label, marginBottom: 4 }}>Nota (0–10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={c.value}
                    onChange={(e) => handleCriterionChange(index, 'value', e.target.value === '' ? '' : e.target.value)}
                    placeholder="—"
                    style={styles.criterionInput}
                  />
                </div>
                <div>
                  <label style={{ ...styles.label, marginBottom: 4 }}>Observação</label>
                  <input
                    type="text"
                    value={c.note}
                    onChange={(e) => handleCriterionChange(index, 'note', e.target.value)}
                    placeholder="Opcional"
                    style={{ ...styles.criterionInput, width: '100%' }}
                  />
                </div>
                <div style={{ paddingTop: 28 }}>
                  <button
                    type="button"
                    style={styles.removeBtn}
                    onClick={() => handleRemoveCriterion(index)}
                    disabled={criteria.length <= 1}
                    aria-label="Remover critério"
                  >
                    <IconRemove />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" style={styles.addCriterionBtn} onClick={handleAddCriterion} className="btn-hover">
            + Adicionar critério
          </button>
        </section>

        <section style={styles.section} aria-labelledby="resultado-final">
          <h2 id="resultado-final" style={styles.sectionTitle}>Resultado final e observações</h2>
          <div style={styles.fieldGrid}>
            <div style={styles.fieldFull}>
              <label style={styles.label} htmlFor="summary">Resumo do resultado (opcional)</label>
              <input
                id="summary"
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Ex.: Aprovado / 8,5"
                style={styles.input}
              />
            </div>
            <div style={styles.fieldFull}>
              <label style={styles.label} htmlFor="notes">Observações gerais (opcional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações gerais da avaliação"
                style={styles.textarea}
              />
            </div>
          </div>
        </section>

        <footer style={styles.footer}>
          <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }} disabled={saving} className="btn-hover">
            {saving ? 'Salvando...' : 'Salvar avaliação'}
          </button>
          <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handleCancel} disabled={saving} className="btn-hover">
            Cancelar
          </button>
        </footer>
      </form>

      {exitConfirm && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="exit-confirm-title">
          <div style={styles.modal}>
            <h2 id="exit-confirm-title" style={styles.modalTitle}>Sair sem salvar?</h2>
            <p style={styles.modalText}>Você tem alterações não salvas. Deseja sair sem salvar?</p>
            <div style={styles.modalActions}>
              <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setExitConfirm(null)} className="btn-hover">
                Continuar
              </button>
              <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleConfirmExit} className="btn-hover">
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
