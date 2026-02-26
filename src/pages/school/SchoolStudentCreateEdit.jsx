import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolStudent,
  getSchoolTeams,
  createSchoolStudent,
  updateSchoolStudent,
} from '../../api/schoolPortal'

const GRID = 8
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_BASIC = /^[\d\s()\-+]+$/ // formato básico

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
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
  labelRequired: { position: 'relative' },
  labelRequiredAfter: {
    position: 'absolute',
    marginLeft: 2,
    color: '#dc2626',
  },
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
    maxWidth: 200,
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
  teamsMultiWrap: {
    maxWidth: 400,
  },
  teamsMultiButton: {
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
  teamsDropdown: {
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
  teamsSearch: {
    width: '100%',
    padding: `${GRID}px ${GRID * 2}px`,
    border: 'none',
    borderBottom: '1px solid #eee',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  teamsList: {
    maxHeight: 220,
    overflowY: 'auto',
    padding: GRID,
  },
  teamOption: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    cursor: 'pointer',
    borderRadius: 4,
  },
  emptyTeams: {
    padding: GRID * 3,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
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
    </>
  )
}

function TeamsMultiSelect({ teams, selectedIds, onChange, disabled, error }) {
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
    ? teams.filter((t) => (t.name || '').toLowerCase().includes(searchLower))
    : teams

  const toggle = (id) => {
    const set = new Set(selectedIds || [])
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange(Array.from(set))
  }

  const count = (selectedIds || []).length
  const label = count === 0 ? 'Nenhuma turma selecionada' : `${count} turma(s) selecionada(s)`

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={{
          ...styles.teamsMultiButton,
          borderColor: error ? 'rgba(220, 53, 69, 0.6)' : '#ddd',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div style={styles.teamsDropdown} role="listbox">
          <input
            type="search"
            placeholder="Buscar turma..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.teamsSearch}
            aria-label="Buscar turma"
          />
          <div style={styles.teamsList}>
            {filtered.length === 0 ? (
              <div style={styles.emptyTeams}>Nenhuma turma encontrada.</div>
            ) : (
              filtered.map((t) => {
                const checked = (selectedIds || []).includes(t.id)
                return (
                  <label
                    key={t.id}
                    style={{ ...styles.teamOption, margin: 0 }}
                    className="btn-hover"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(t.id)}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14 }}>{t.name}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function validateForm(values) {
  const errors = {}
  if (!(values.name || '').trim()) {
    errors.name = 'Nome é obrigatório.'
  }
  if (values.email && values.email.trim()) {
    if (!EMAIL_REGEX.test(values.email.trim())) {
      errors.email = 'Informe um e-mail válido.'
    }
  }
  if (values.phone && values.phone.trim()) {
    if (!PHONE_BASIC.test(values.phone.trim()) || values.phone.trim().length < 8) {
      errors.phone = 'Informe um telefone válido.'
    }
  }
  return errors
}

const canCreateOrEdit = true // MVP: backend valida role (SchoolOwner, SchoolStaff)

export default function SchoolStudentCreateEdit() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(studentId)

  const [student, setStudent] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState(null)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [document, setDocument] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState('active')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [guardianRelation, setGuardianRelation] = useState('')
  const [teamIds, setTeamIds] = useState([])

  const fetchStudent = useCallback(() => {
    if (!studentId) return
    setLoading(true)
    setSaveError(null)
    setNotFound(false)
    setPermissionDenied(false)
    getSchoolStudent(studentId)
      .then((data) => {
        setStudent(data)
        setName(data.name || '')
        setBirthDate(data.birth_date ? data.birth_date.slice(0, 10) : '')
        setDocument(data.document || '')
        setEmail(data.email || '')
        setPhone(data.phone || '')
        setStatus(data.status || 'active')
        const g = data.guardian || {}
        setGuardianName(g.name || '')
        setGuardianPhone(g.phone || '')
        setGuardianEmail(g.email || '')
        setGuardianRelation(g.relation || '')
        setTeamIds((data.teams || []).map((t) => t.team_id))
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else if (err.status === 404 || err.code === 'NOT_FOUND') setNotFound(true)
        else setSaveError(err?.message || 'Não foi possível carregar os dados do aluno.')
      })
      .finally(() => setLoading(false))
  }, [studentId])

  const fetchTeams = useCallback(() => {
    getSchoolTeams()
      .then((list) => setTeams(Array.isArray(list) ? list : []))
      .catch(() => setTeams([]))
  }, [])

  useEffect(() => {
    if (isEdit) {
      fetchStudent()
    } else {
      setLoading(false)
    }
    fetchTeams()
  }, [isEdit, fetchStudent, fetchTeams])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const schoolName = student?.school_name ?? (isEdit ? '' : null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setGeneralError(null)
    setFieldErrors({})

    const values = {
      name: name.trim(),
      birth_date: birthDate.trim() || undefined,
      document: document.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      status: isEdit ? status : undefined,
      guardian:
        guardianName.trim() || guardianPhone.trim() || guardianEmail.trim() || guardianRelation.trim()
          ? {
              name: guardianName.trim() || undefined,
              phone: guardianPhone.trim() || undefined,
              email: guardianEmail.trim() || undefined,
              relation: guardianRelation.trim() || undefined,
            }
          : undefined,
      team_ids: teamIds,
    }

    const errors = validateForm({ ...values, name: values.name || '' })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setGeneralError('Preencha os campos obrigatórios.')
      return
    }

    setSaving(true)
    const payload = {
      name: values.name,
      birth_date: values.birth_date,
      document: values.document,
      email: values.email,
      phone: values.phone,
      guardian: values.guardian,
      team_ids: values.team_ids,
    }
    if (isEdit) payload.status = values.status

    const promise = isEdit ? updateSchoolStudent(studentId, payload) : createSchoolStudent(payload)
    promise
      .then((res) => {
        setSuccessMessage('Aluno salvo com sucesso.')
        const id = res?.id ?? studentId
        setTimeout(() => {
          navigate(id ? `/school/students/${id}` : '/school/students', { replace: true })
        }, 800)
      })
      .catch((err) => {
        setSaveError(err?.message || 'Não foi possível salvar o aluno. Tente novamente.')
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    if (isEdit) {
      navigate(`/school/students/${studentId}`, { replace: true })
    } else {
      navigate('/school/students', { replace: true })
    }
  }

  if (permissionDenied) return null

  if (notFound && isEdit) {
    return (
      <SchoolLayout schoolName={schoolName}>
        <div style={{ ...styles.section, textAlign: 'center', padding: GRID * 6 }}>
          <p style={{ margin: '0 0 ' + GRID * 3 + 'px', fontSize: 16, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
            Aluno não encontrado ou você não tem acesso.
          </p>
          <Link to="/school/students" style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Alunos
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  if (!canCreateOrEdit && !isEdit) {
    navigate('/acesso-negado?from=school', { replace: true })
    return null
  }

  return (
    <SchoolLayout schoolName={schoolName}>
      {loading && isEdit && <FormSkeleton />}

      {(!isEdit || student) && (
        <>
          <header style={styles.header}>
            <nav style={styles.breadcrumb} aria-label="Breadcrumb">
              {isEdit ? (
                <Link to={`/school/students/${studentId}`} style={styles.breadcrumbLink} className="btn-hover">
                  ← Detalhe do aluno
                </Link>
              ) : (
                <Link to="/school/students" style={styles.breadcrumbLink} className="btn-hover">
                  ← Alunos
                </Link>
              )}
            </nav>
            <h1 style={styles.title}>{isEdit ? 'Editar aluno' : 'Novo aluno'}</h1>
          </header>

          {saveError && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}><IconAlert /></span>
              <div style={styles.errorContent}>
                <p style={styles.errorText}>{saveError}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div style={styles.successBox} role="status">
              {successMessage}
            </div>
          )}

          {generalError && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}><IconAlert /></span>
              <div style={styles.errorContent}>
                <p style={styles.errorText}>{generalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <section style={styles.section} aria-labelledby="dados-aluno-sec">
              <h2 id="dados-aluno-sec" style={styles.sectionTitle}>Dados do aluno</h2>
              <div style={styles.fieldGrid}>
                <div style={styles.field}>
                  <label htmlFor="student-name" style={{ ...styles.label, ...styles.labelRequired }}>
                    Nome completo <span style={styles.labelRequiredAfter} aria-hidden>*</span>
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ ...styles.input, ...(fieldErrors.name ? styles.inputError : {}) }}
                    placeholder="Nome completo"
                    disabled={saving}
                    autoComplete="name"
                    aria-required
                    aria-invalid={Boolean(fieldErrors.name)}
                  />
                  {fieldErrors.name && <div style={styles.fieldError}>{fieldErrors.name}</div>}
                </div>
                <div style={styles.field}>
                  <label htmlFor="student-birth_date" style={styles.label}>Data de nascimento</label>
                  <input
                    id="student-birth_date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    style={styles.input}
                    disabled={saving}
                  />
                </div>
                <div style={styles.field}>
                  <label htmlFor="student-document" style={styles.label}>Documento (CPF/ID)</label>
                  <input
                    id="student-document"
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    style={styles.input}
                    placeholder="Opcional"
                    disabled={saving}
                  />
                </div>
                <div style={styles.field}>
                  <label htmlFor="student-email" style={styles.label}>E-mail</label>
                  <input
                    id="student-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : {}) }}
                    placeholder="Opcional"
                    disabled={saving}
                    autoComplete="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                  {fieldErrors.email && <div style={styles.fieldError}>{fieldErrors.email}</div>}
                </div>
                <div style={styles.field}>
                  <label htmlFor="student-phone" style={styles.label}>Telefone</label>
                  <input
                    id="student-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ ...styles.input, ...(fieldErrors.phone ? styles.inputError : {}) }}
                    placeholder="Opcional"
                    disabled={saving}
                    autoComplete="tel"
                    aria-invalid={Boolean(fieldErrors.phone)}
                  />
                  {fieldErrors.phone && <div style={styles.fieldError}>{fieldErrors.phone}</div>}
                </div>
                {isEdit && (
                  <div style={styles.field}>
                    <label htmlFor="student-status" style={styles.label}>Status</label>
                    <select
                      id="student-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={styles.select}
                      disabled={saving}
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                )}
              </div>
            </section>

            <section style={styles.section} aria-labelledby="responsavel-sec">
              <h2 id="responsavel-sec" style={styles.sectionTitle}>Responsável</h2>
              <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
                Opcional. Preencha se o aluno for menor de idade ou precisar de contato do responsável.
              </p>
              <div style={styles.fieldGrid}>
                <div style={styles.field}>
                  <label htmlFor="guardian-name" style={styles.label}>Nome do responsável</label>
                  <input
                    id="guardian-name"
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    style={styles.input}
                    disabled={saving}
                  />
                </div>
                <div style={styles.field}>
                  <label htmlFor="guardian-phone" style={styles.label}>Telefone do responsável</label>
                  <input
                    id="guardian-phone"
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    style={styles.input}
                    disabled={saving}
                  />
                </div>
                <div style={styles.field}>
                  <label htmlFor="guardian-email" style={styles.label}>E-mail do responsável</label>
                  <input
                    id="guardian-email"
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    style={styles.input}
                    disabled={saving}
                  />
                </div>
                <div style={styles.field}>
                  <label htmlFor="guardian-relation" style={styles.label}>Relação</label>
                  <select
                    id="guardian-relation"
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    style={{ ...styles.select, maxWidth: '100%' }}
                    disabled={saving}
                  >
                    <option value="">Selecione</option>
                    <option value="pai">Pai</option>
                    <option value="mãe">Mãe</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
            </section>

            {teams.length > 0 && (
              <section style={styles.section} aria-labelledby="turmas-sec">
                <h2 id="turmas-sec" style={styles.sectionTitle}>Turmas</h2>
                <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
                  Vincule o aluno às turmas da escola. Deixe em branco se não houver turmas ou não for necessário.
                </p>
                <div style={styles.field}>
                  <TeamsMultiSelect
                    teams={teams}
                    selectedIds={teamIds}
                    onChange={setTeamIds}
                    disabled={saving}
                  />
                </div>
                {teamIds.length === 0 && (
                  <p style={styles.emptyTeams}>Sem turmas vinculadas</p>
                )}
              </section>
            )}

            <div style={styles.footerSticky}>
              <button
                type="submit"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                disabled={saving}
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
            </div>
          </form>
        </>
      )}
    </SchoolLayout>
  )
}
