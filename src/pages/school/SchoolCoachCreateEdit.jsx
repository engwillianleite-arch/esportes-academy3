import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolCoachDetail,
  getSchoolDashboardSummary,
  getSchoolTeamsList,
  createSchoolCoach,
  updateSchoolCoach,
} from '../../api/schoolPortal'

const GRID = 8

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_BASIC_REGEX = /^[\d\s()\-+]+$/

function validateForm({ name, email, phone }) {
  const errors = {}
  if (!(name || '').trim()) {
    errors.name = 'Nome completo é obrigatório.'
  }
  const emailVal = (email || '').trim()
  if (emailVal && !EMAIL_REGEX.test(emailVal)) {
    errors.email = 'Informe um e-mail válido.'
  }
  const phoneVal = (phone || '').trim()
  if (phoneVal && !PHONE_BASIC_REGEX.test(phoneVal)) {
    errors.phone = 'Informe um telefone válido.'
  }
  return errors
}

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
  textarea: {
    width: '100%',
    minHeight: 100,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
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
  teamsMultiWrap: { maxWidth: 400 },
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

function TeamsMultiSelect({ teams, selectedIds, onChange, disabled }) {
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
    ? (teams || []).filter((t) => (t.name || '').toLowerCase().includes(searchLower))
    : (teams || [])

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
  const label = count === 0 ? 'Nenhuma turma selecionada' : `${count} turma(s) selecionada(s)`
  const selectedTeams = (teams || []).filter((t) => (selectedIds || []).includes(t.id))

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={styles.teamsMultiButton}
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
      {selectedTeams.length > 0 && (
        <div style={styles.selectedChips}>
          {selectedTeams.map((t) => (
            <span key={t.id} style={styles.chip}>
              {t.name}
              <button
                type="button"
                style={styles.chipRemove}
                aria-label={`Remover ${t.name}`}
                onClick={(e) => remove(t.id, e)}
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

export default function SchoolCoachCreateEdit() {
  const { coachId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(coachId)

  const [coach, setCoach] = useState(null)
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

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('active')
  const [teamIds, setTeamIds] = useState([])

  const initialValuesRef = useRef(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const leaveToRef = useRef(null)

  const isDirty = () => {
    const init = initialValuesRef.current
    if (!init) return false
    return (
      (name || '').trim() !== (init.name || '').trim() ||
      (email || '').trim() !== (init.email || '').trim() ||
      (phone || '').trim() !== (init.phone || '').trim() ||
      (specialty || '').trim() !== (init.specialty || '').trim() ||
      (notes || '').trim() !== (init.notes || '').trim() ||
      (isEdit && status !== init.status) ||
      JSON.stringify([...(teamIds || [])].sort()) !== JSON.stringify([...(init.teamIds || [])].sort())
    )
  }

  const loadInitial = useCallback(() => {
    setLoading(true)
    setPermissionDenied(false)
    setNotFound(false)
    setSaveError(null)
    setFieldErrors({})
    setGeneralError(null)

    const promises = [
      getSchoolTeamsList({ page: 1, page_size: 200 }).then((r) => setTeams(r.items || [])).catch(() => setTeams([])),
    ]

    if (isEdit) {
      promises.push(
        getSchoolCoachDetail(coachId)
          .then((data) => {
            setCoach(data)
            setSchoolName(data.school_name || '')
            setName(data.name || '')
            setEmail(data.email || '')
            setPhone(data.phone || '')
            setSpecialty(data.specialty || '')
            setNotes(data.notes || '')
            setStatus(data.status || 'active')
            setTeamIds((data.teams || []).map((t) => t.team_id))
            initialValuesRef.current = {
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              specialty: data.specialty || '',
              notes: data.notes || '',
              status: data.status || 'active',
              teamIds: (data.teams || []).map((t) => t.team_id),
            }
          })
          .catch((err) => {
            if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
            else if (err.status === 404 || err.code === 'NOT_FOUND') setNotFound(true)
            else setGeneralError(err?.message || 'Não foi possível carregar o treinador.')
          })
      )
    } else {
      promises.push(
        getSchoolDashboardSummary()
          .then((s) => {
            setSchoolName(s.school_name || '')
            initialValuesRef.current = { name: '', email: '', phone: '', specialty: '', notes: '', status: 'active', teamIds: [] }
          })
          .catch(() => {
            initialValuesRef.current = { name: '', email: '', phone: '', specialty: '', notes: '', status: 'active', teamIds: [] }
          })
      )
    }

    Promise.all(promises).finally(() => setLoading(false))
  }, [isEdit, coachId])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const goTo = (to) => {
    if (saving) return
    if (isDirty()) {
      leaveToRef.current = to
      setShowLeaveConfirm(true)
    } else {
      navigate(to)
    }
  }

  const confirmLeave = () => {
    const to = leaveToRef.current
    setShowLeaveConfirm(false)
    leaveToRef.current = null
    if (to) navigate(to)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaveError(null)
    setFieldErrors({})
    setGeneralError(null)

    const errors = validateForm({ name, email, phone })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setGeneralError('Preencha os campos obrigatórios.')
      return
    }

    setSaving(true)
    const payload = {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      specialty: specialty.trim() || undefined,
      notes: notes.trim() || undefined,
      ...(isEdit && { status }),
      team_ids: teamIds && teamIds.length > 0 ? teamIds : undefined,
    }

    const request = isEdit
      ? updateSchoolCoach(coachId, payload)
      : createSchoolCoach(payload)

    request
      .then((res) => {
        setSuccessMessage('Treinador salvo com sucesso.')
        const id = res?.id ?? coachId
        initialValuesRef.current = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          specialty: specialty.trim(),
          notes: notes.trim(),
          status: isEdit ? status : 'active',
          teamIds: [...(teamIds || [])],
        }
        setTimeout(() => {
          navigate(`/school/coaches/${id}`)
        }, 800)
      })
      .catch((err) => {
        setSaveError(err?.message || 'Não foi possível salvar o treinador. Tente novamente.')
      })
      .finally(() => setSaving(false))
  }

  if (permissionDenied) return null

  if (notFound && isEdit) {
    return (
      <SchoolLayout schoolName={schoolName}>
        <div style={{ textAlign: 'center', padding: GRID * 6, background: 'var(--branco-luz)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 16, color: 'var(--grafite-tecnico)' }}>
            Treinador não encontrado ou você não tem acesso.
          </p>
          <Link to="/school/coaches" style={{ ...styles.btn, ...styles.btnPrimary }} className="btn-hover">
            Voltar para Professores/Treinadores
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  const displaySchoolName = isEdit ? (coach?.school_name ?? schoolName) : schoolName

  return (
    <SchoolLayout schoolName={displaySchoolName}>
      {loading && (isEdit ? !coach : true) && <FormSkeleton />}

      {!loading && (
        <form onSubmit={handleSubmit}>
          <header style={styles.header}>
            <nav style={styles.breadcrumb} aria-label="Breadcrumb">
              {isEdit ? (
                <Link
                  to={`/school/coaches/${coachId}`}
                  style={styles.breadcrumbLink}
                  className="btn-hover"
                  onClick={(e) => {
                    if (isDirty()) {
                      e.preventDefault()
                      leaveToRef.current = `/school/coaches/${coachId}`
                      setShowLeaveConfirm(true)
                    }
                  }}
                >
                  ← Detalhe do treinador
                </Link>
              ) : (
                <Link
                  to="/school/coaches"
                  style={styles.breadcrumbLink}
                  className="btn-hover"
                  onClick={(e) => {
                    if (isDirty()) {
                      e.preventDefault()
                      leaveToRef.current = '/school/coaches'
                      setShowLeaveConfirm(true)
                    }
                  }}
                >
                  ← Professores/Treinadores
                </Link>
              )}
            </nav>
            <h1 style={styles.title}>{isEdit ? 'Editar treinador' : 'Novo treinador'}</h1>
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

          {/* Dados do treinador */}
          <section style={styles.section} aria-label="Dados do treinador">
            <h2 style={styles.sectionTitle}>Dados do treinador</h2>
            <div style={styles.fieldGrid}>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="coach-name">
                  Nome completo <span style={styles.labelRequiredAfter}>*</span>
                </label>
                <input
                  id="coach-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ ...styles.input, ...(fieldErrors.name ? styles.inputError : {}) }}
                  placeholder="Ex.: João Silva"
                  disabled={saving}
                  aria-required
                  aria-invalid={!!fieldErrors.name}
                />
                {fieldErrors.name && <p style={styles.fieldError}>{fieldErrors.name}</p>}
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="coach-email">
                  E-mail
                </label>
                <input
                  id="coach-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : {}) }}
                  placeholder="Ex.: joao@escola.com"
                  disabled={saving}
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && <p style={styles.fieldError}>{fieldErrors.email}</p>}
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="coach-phone">
                  Telefone
                </label>
                <input
                  id="coach-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ ...styles.input, ...(fieldErrors.phone ? styles.inputError : {}) }}
                  placeholder="Ex.: (11) 98765-4321"
                  disabled={saving}
                  aria-invalid={!!fieldErrors.phone}
                />
                {fieldErrors.phone && <p style={styles.fieldError}>{fieldErrors.phone}</p>}
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="coach-specialty">
                  Especialidade/Modalidade
                </label>
                <input
                  id="coach-specialty"
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  style={styles.input}
                  placeholder="Ex.: Futebol, Natação"
                  disabled={saving}
                />
              </div>
              {isEdit && (
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="coach-status">
                    Status
                  </label>
                  <select
                    id="coach-status"
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
            <div style={{ ...styles.field, marginTop: GRID * 2 }}>
              <label style={styles.label} htmlFor="coach-notes">
                Observações
              </label>
              <textarea
                id="coach-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={styles.textarea}
                placeholder="Observações sobre o treinador (opcional)"
                disabled={saving}
              />
            </div>
          </section>

          {/* Turmas atribuídas (opcional MVP) */}
          {teams.length > 0 && (
            <section style={styles.section} aria-label="Turmas atribuídas">
              <h2 style={styles.sectionTitle}>Turmas atribuídas</h2>
              <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
                Selecione as turmas que este treinador responde. (opcional)
              </p>
              <div style={styles.teamsMultiWrap}>
                <TeamsMultiSelect
                  teams={teams}
                  selectedIds={teamIds}
                  onChange={setTeamIds}
                  disabled={saving}
                />
              </div>
            </section>
          )}

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
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => goTo(`/school/coaches/${coachId}`)}
                className="btn-hover"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => goTo('/school/coaches')}
                className="btn-hover"
              >
                Cancelar
              </button>
            )}
          </footer>
        </form>
      )}

      {/* Confirmação de saída com alterações não salvas */}
      {showLeaveConfirm && (
        <div
          style={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-confirm-title"
          onClick={(e) => e.target === e.currentTarget && setShowLeaveConfirm(false)}
        >
          <div style={styles.modalBox}>
            <h2 id="leave-confirm-title" style={styles.modalTitle}>
              Sair sem salvar?
            </h2>
            <p style={styles.modalText}>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setShowLeaveConfirm(false)}
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
