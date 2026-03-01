import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolTeamDetail,
  getSchoolCoaches,
  getSchoolStudents,
  getSchoolDashboardSummary,
  createSchoolTeam,
  updateSchoolTeam,
} from '../../api/schoolPortal'
import { getMockCounts, updateMockCounts } from '../../data/mockSchoolSession'

const GRID = 8

const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Seg' },
  { value: 'tuesday', label: 'Ter' },
  { value: 'wednesday', label: 'Qua' },
  { value: 'thursday', label: 'Qui' },
  { value: 'friday', label: 'Sex' },
  { value: 'saturday', label: 'Sáb' },
  { value: 'sunday', label: 'Dom' },
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
    maxWidth: 280,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    cursor: 'pointer',
  },
  agendaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: GRID * 2,
    marginBottom: GRID * 2,
    paddingBottom: GRID * 2,
    borderBottom: '1px solid #eee',
  },
  agendaRowLast: { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 },
  agendaField: { minWidth: 0 },
  agendaFieldWide: { flex: '1 1 200px' },
  agendaFieldTime: { width: 100, maxWidth: 120 },
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
  studentsMultiWrap: { maxWidth: 400 },
  studentsMultiButton: {
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    background: 'var(--branco-luz)',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'var(--grafite-tecnico)',
  },
  studentsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    minWidth: 320,
    maxHeight: 280,
    background: 'var(--branco-luz)',
    border: '1px solid #eee',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    zIndex: 50,
    overflow: 'hidden',
  },
  studentsSearch: {
    width: '100%',
    padding: `${GRID}px ${GRID * 2}px`,
    border: 'none',
    borderBottom: '1px solid #eee',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  studentsList: {
    maxHeight: 220,
    overflowY: 'auto',
    padding: GRID,
  },
  studentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    cursor: 'pointer',
    borderRadius: 4,
  },
  emptyStudents: {
    padding: GRID * 3,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  selectedChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID,
    marginTop: GRID * 2,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID / 2}px ${GRID}px`,
    fontSize: 13,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 999,
    color: 'var(--grafite-tecnico)',
  },
  chipRemove: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: 'inherit',
    opacity: 0.8,
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
          {[1, 2, 3, 4].map((i) => (
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

function StudentsMultiSelect({ students, selectedIds, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  const searchLower = (search || '').toLowerCase().trim()
  const filtered = searchLower
    ? students.filter((s) => (s.name || '').toLowerCase().includes(searchLower))
    : students

  const toggle = (id) => {
    const set = new Set(selectedIds || [])
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange(Array.from(set))
  }

  const remove = (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    onChange((selectedIds || []).filter((x) => x !== id))
  }

  const count = (selectedIds || []).length
  const label = count === 0 ? 'Nenhum aluno selecionado' : `${count} aluno(s) selecionado(s)`
  const selectedStudents = (students || []).filter((s) => (selectedIds || []).includes(s.id))

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={styles.studentsMultiButton}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div style={styles.studentsDropdown} role="listbox">
          <input
            type="search"
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.studentsSearch}
            aria-label="Buscar aluno"
          />
          <div style={styles.studentsList}>
            {filtered.length === 0 ? (
              <div style={styles.emptyStudents}>Nenhum aluno encontrado.</div>
            ) : (
              filtered.map((s) => {
                const checked = (selectedIds || []).includes(s.id)
                return (
                  <label
                    key={s.id}
                    style={{ ...styles.studentOption, margin: 0 }}
                    className="btn-hover"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14 }}>{s.name}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
      {selectedStudents.length > 0 && (
        <div style={styles.selectedChips}>
          {selectedStudents.map((s) => (
            <span key={s.id} style={styles.chip}>
              {s.name}
              <button
                type="button"
                style={styles.chipRemove}
                aria-label={`Remover ${s.name}`}
                onClick={(e) => remove(s.id, e)}
              >
                <IconRemove />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function validateForm({ name, scheduleItems }) {
  const errors = {}
  if (!(name || '').trim()) {
    errors.name = 'Nome da turma é obrigatório.'
  }
  // Valida por índice do formulário: hora fim > hora início em cada linha preenchida
  if (scheduleItems && scheduleItems.length > 0) {
    scheduleItems.forEach((item, i) => {
      const start = (item.start_time || '').trim()
      const end = (item.end_time || '').trim()
      if (start && end) {
        const [sh, sm] = start.split(':').map(Number)
        const [eh, em] = end.split(':').map(Number)
        const startMin = (sh || 0) * 60 + (sm || 0)
        const endMin = (eh || 0) * 60 + (em || 0)
        if (endMin <= startMin) {
          errors[`schedule_${i}`] = 'Hora fim deve ser maior que hora início.'
        }
      }
    })
  }
  return errors
}

export default function SchoolTeamCreateEdit() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(teamId)

  const [team, setTeam] = useState(null)
  const [coaches, setCoaches] = useState([])
  const [students, setStudents] = useState([])
  const [schoolName, setSchoolName] = useState('')
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState(null)

  const [name, setName] = useState('')
  const [coachId, setCoachId] = useState('')
  const [modality, setModality] = useState('')
  const [status, setStatus] = useState('active')
  const [scheduleItems, setScheduleItems] = useState([{ weekday: '', start_time: '', end_time: '', location: '' }])
  const [studentIds, setStudentIds] = useState([])

  const loadInitial = useCallback(() => {
    setLoading(true)
    setPermissionDenied(false)
    setNotFound(false)
    setSaveError(null)
    setFieldErrors({})
    setGeneralError(null)

    const promises = [
      getSchoolCoaches().then(setCoaches).catch(() => setCoaches([])),
      getSchoolStudents({ page: 1, page_size: 200 }).then((r) => setStudents(r.items || [])).catch(() => setStudents([])),
    ]

    if (isEdit) {
      promises.push(
        getSchoolTeamDetail(teamId)
          .then((data) => {
            setTeam(data)
            setSchoolName(data.school_name || '')
            setName(data.name || '')
            setCoachId(data.coach?.id || '')
            setModality(data.modality || data.sport || '')
            setStatus(data.status || 'active')
            const items = (data.schedule?.items || []).length
              ? data.schedule.items.map((i) => ({
                  weekday: i.weekday || '',
                  start_time: (i.start_time || '').substring(0, 5),
                  end_time: (i.end_time || '').substring(0, 5),
                  location: i.location || '',
                }))
              : [{ weekday: '', start_time: '', end_time: '', location: '' }]
            setScheduleItems(items)
            setStudentIds((data.students || []).map((s) => s.id))
          })
          .catch((err) => {
            if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
            else if (err.status === 404 || err.code === 'NOT_FOUND') setNotFound(true)
            else setGeneralError(err?.message || 'Não foi possível carregar a turma.')
          })
      )
    } else {
      promises.push(
        getSchoolDashboardSummary()
          .then((s) => setSchoolName(s.school_name || ''))
          .catch(() => {})
      )
    }

    Promise.all(promises).finally(() => setLoading(false))
  }, [isEdit, teamId])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const addScheduleItem = () => {
    setScheduleItems((prev) => [...prev, { weekday: '', start_time: '', end_time: '', location: '' }])
  }

  const updateScheduleItem = (index, field, value) => {
    setScheduleItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const removeScheduleItem = (index) => {
    setScheduleItems((prev) => {
      if (prev.length <= 1) return [{ weekday: '', start_time: '', end_time: '', location: '' }]
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaveError(null)
    setFieldErrors({})
    setGeneralError(null)

    const scheduleNormalized = scheduleItems
      .filter((item) => (item.weekday || '').trim() && (item.start_time || '').trim() && (item.end_time || '').trim())
      .map((item) => ({
        weekday: item.weekday.trim(),
        start_time: item.start_time.trim().length === 5 ? item.start_time.trim() : `${item.start_time.trim()}:00`.substring(0, 5),
        end_time: item.end_time.trim().length === 5 ? item.end_time.trim() : `${item.end_time.trim()}:00`.substring(0, 5),
        location: (item.location || '').trim() || undefined,
      }))

    const payload = {
      name: name.trim(),
      coach_id: coachId || undefined,
      modality: modality.trim() || undefined,
      status,
      schedule_items: scheduleNormalized,
      student_ids: studentIds,
    }

    const errors = validateForm({
      name,
      scheduleItems,
    })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setGeneralError('Preencha os campos obrigatórios.')
      return
    }

    setSaving(true)
    const request = isEdit
      ? updateSchoolTeam(teamId, payload)
      : createSchoolTeam(payload)

    request
      .then((res) => {
        if (!isEdit) {
          updateMockCounts({ teams_count: (getMockCounts().teams_count ?? 0) + 1 })
        }
        setSuccessMessage('Turma salva com sucesso.')
        setTimeout(() => {
          navigate(isEdit ? `/school/teams/${teamId}` : `/school/teams/${res.id}`)
        }, 800)
      })
      .catch((err) => {
        setSaveError(err?.message || 'Não foi possível salvar a turma. Tente novamente.')
      })
      .finally(() => setSaving(false))
  }

  if (permissionDenied) return null

  if (notFound && isEdit) {
    return (
      <SchoolLayout schoolName={schoolName}>
        <div style={{ textAlign: 'center', padding: GRID * 6, background: 'var(--branco-luz)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 16, color: 'var(--grafite-tecnico)' }}>
            Turma não encontrada ou você não tem acesso.
          </p>
          <Link to="/school/teams" style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Turmas
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  const displaySchoolName = isEdit ? (team?.school_name ?? schoolName) : schoolName

  return (
    <SchoolLayout schoolName={displaySchoolName}>
      {loading && (isEdit ? !team : true) && <FormSkeleton />}

      {!loading && (
        <form onSubmit={handleSubmit}>
          <header style={styles.header}>
            <nav style={styles.breadcrumb} aria-label="Breadcrumb">
              {isEdit ? (
                <Link to={`/school/teams/${teamId}`} style={styles.breadcrumbLink} className="btn-hover">
                  ← Detalhe da turma
                </Link>
              ) : (
                <Link to="/school/teams" style={styles.breadcrumbLink} className="btn-hover">
                  ← Turmas
                </Link>
              )}
            </nav>
            <h1 style={styles.title}>{isEdit ? 'Editar turma' : 'Nova turma'}</h1>
          </header>

          {(saveError || generalError) && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}><IconAlert /></span>
              <div style={styles.errorContent}>
                <p style={styles.errorText}>{saveError || generalError}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div style={styles.successBox} role="status">
              {successMessage}
            </div>
          )}

          {/* Dados da turma */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Dados da turma</h2>
            <div style={styles.fieldGrid}>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="team-name">
                  Nome da turma <span style={styles.labelRequiredAfter}>*</span>
                </label>
                <input
                  id="team-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ ...styles.input, ...(fieldErrors.name ? styles.inputError : {}) }}
                  placeholder="Ex.: Turma A - Iniciantes"
                  disabled={saving}
                  aria-required
                  aria-invalid={!!fieldErrors.name}
                />
                {fieldErrors.name && <p style={styles.fieldError}>{fieldErrors.name}</p>}
              </div>
              {coaches.length > 0 && (
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="team-coach">
                    Treinador responsável
                  </label>
                  <select
                    id="team-coach"
                    value={coachId}
                    onChange={(e) => setCoachId(e.target.value)}
                    style={styles.select}
                    disabled={saving}
                  >
                    <option value="">Nenhum</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="team-modality">
                  Modalidade
                </label>
                <input
                  id="team-modality"
                  type="text"
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  style={styles.input}
                  placeholder="Ex.: Futebol, Natação"
                  disabled={saving}
                />
              </div>
              {isEdit && (
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="team-status">
                    Status
                  </label>
                  <select
                    id="team-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={styles.select}
                    disabled={saving}
                  >
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Agenda */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Agenda</h2>
            {scheduleItems.map((item, i) => (
              <div
                key={i}
                style={{
                  ...styles.agendaRow,
                  ...(i === scheduleItems.length - 1 ? styles.agendaRowLast : {}),
                }}
              >
                <div style={{ ...styles.agendaField, flex: '0 0 120px' }}>
                  <label style={{ ...styles.label, fontSize: 12 }}>Dia</label>
                  <select
                    value={item.weekday}
                    onChange={(e) => updateScheduleItem(i, 'weekday', e.target.value)}
                    style={{ ...styles.select, maxWidth: 'none' }}
                    disabled={saving}
                  >
                    <option value="">Selecione</option>
                    {WEEKDAY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ ...styles.agendaField, ...styles.agendaFieldTime }}>
                  <label style={{ ...styles.label, fontSize: 12 }}>Início</label>
                  <input
                    type="time"
                    value={item.start_time}
                    onChange={(e) => updateScheduleItem(i, 'start_time', e.target.value)}
                    style={styles.input}
                    disabled={saving}
                  />
                </div>
                <div style={{ ...styles.agendaField, ...styles.agendaFieldTime }}>
                  <label style={{ ...styles.label, fontSize: 12 }}>Fim</label>
                  <input
                    type="time"
                    value={item.end_time}
                    onChange={(e) => updateScheduleItem(i, 'end_time', e.target.value)}
                    style={styles.input}
                    disabled={saving}
                  />
                </div>
                <div style={{ ...styles.agendaField, ...styles.agendaFieldWide }}>
                  <label style={{ ...styles.label, fontSize: 12 }}>Local (opcional)</label>
                  <input
                    type="text"
                    value={item.location}
                    onChange={(e) => updateScheduleItem(i, 'location', e.target.value)}
                    style={styles.input}
                    placeholder="Ex.: Quadra 1"
                    disabled={saving}
                  />
                </div>
                <div style={styles.agendaField}>
                  <button
                    type="button"
                    style={styles.btnRemove}
                    onClick={() => removeScheduleItem(i)}
                    aria-label="Remover horário"
                    disabled={saving || scheduleItems.length <= 1}
                  >
                    <IconRemove />
                  </button>
                </div>
                {fieldErrors[`schedule_${i}`] && (
                  <div style={{ flex: '1 1 100%', marginTop: -GRID }}>
                    <p style={styles.fieldError}>{fieldErrors[`schedule_${i}`]}</p>
                  </div>
                )}
              </div>
            ))}
            <button type="button" style={styles.btnAdd} onClick={addScheduleItem} disabled={saving} className="btn-hover">
              Adicionar horário
            </button>
          </section>

          {/* Alunos (opcional MVP) */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Alunos na turma</h2>
            <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
              Vincule os alunos que fazem parte desta turma. (opcional)
            </p>
            <div style={styles.studentsMultiWrap}>
              <StudentsMultiSelect
                students={students}
                selectedIds={studentIds}
                onChange={setStudentIds}
                disabled={saving}
              />
            </div>
          </section>

          {/* Rodapé de ações */}
          <footer style={styles.footerSticky}>
            <button
              type="submit"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              disabled={saving}
              className="btn-hover"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            {isEdit ? (
              <Link
                to={`/school/teams/${teamId}`}
                style={{ ...styles.btn, ...styles.btnSecondary }}
                className="btn-hover"
              >
                Cancelar
              </Link>
            ) : (
              <Link
                to="/school/teams"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                className="btn-hover"
              >
                Cancelar
              </Link>
            )}
          </footer>
        </form>
      )}
    </SchoolLayout>
  )
}
