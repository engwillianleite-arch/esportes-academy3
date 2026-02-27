/**
 * Dados da Escola — MVP (Configurações da Escola).
 * Rota: /school/settings
 * RBAC: SchoolOwner e SchoolStaff podem editar; Coach e Finance somente leitura.
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { useAuth } from '../../contexts/AuthContext'
import { getSchoolSettings, updateSchoolSettings } from '../../api/schoolPortal'

const GRID = 8

const EDIT_ROLES = ['SchoolOwner', 'SchoolStaff']

function getSchoolRole(memberships) {
  if (!Array.isArray(memberships)) return null
  const school = memberships.find((m) => m.portal === 'SCHOOL' && m.school_id)
  return school?.role ?? null
}

function statusLabel(status) {
  if (status === 'active' || status === 'ativo') return 'Ativa'
  if (status === 'suspended' || status === 'suspensa') return 'Suspensa'
  return status || '—'
}

const styles = {
  header: { marginBottom: GRID * 4 },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  section: {
    marginBottom: GRID * 4,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  sectionTitle: { margin: `0 0 ${GRID * 3}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  field: { marginBottom: GRID * 2 },
  fieldLabel: { display: 'block', marginBottom: GRID, fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' },
  input: {
    width: '100%',
    maxWidth: 400,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 15,
    border: '1px solid #ccc',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
  },
  inputReadOnly: { background: '#f5f5f5', color: 'var(--grafite-tecnico)', cursor: 'default' },
  inputError: { borderColor: '#DC2626' },
  row: { display: 'flex', flexWrap: 'wrap', gap: GRID * 3 },
  rowItem: { flex: '1 1 200px', minWidth: 0 },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
    marginTop: GRID * 4,
    flexWrap: 'wrap',
  },
  btn: {
    padding: `${GRID}px ${GRID * 3}px`,
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 'var(--radius)',
    border: 'none',
    cursor: 'pointer',
  },
  btnPrimary: { background: 'var(--azul-arena)', color: '#fff' },
  btnSecondary: { background: 'var(--branco-luz)', color: 'var(--grafite-tecnico)', border: '1px solid #ccc' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  skeleton: {
    height: 40,
    maxWidth: 400,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  message: {
    padding: GRID * 2,
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
  },
  success: { background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' },
  error: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
  fieldError: { marginTop: GRID, fontSize: 13, color: '#DC2626' },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    maxWidth: 400,
    width: '90%',
    boxShadow: 'var(--shadow)',
  },
  modalTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 18, fontWeight: 600 },
  modalText: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)' },
  modalActions: { display: 'flex', gap: GRID * 2, justifyContent: 'flex-end' },
}

function FormSkeleton() {
  return (
    <div style={styles.section}>
      <div style={{ ...styles.skeleton, width: '40%', marginBottom: GRID * 3 }} />
      <div style={styles.field}>
        <div style={{ ...styles.skeleton, width: 120, marginBottom: GRID }} />
        <div style={styles.skeleton} />
      </div>
      <div style={styles.field}>
        <div style={{ ...styles.skeleton, width: 80, marginBottom: GRID }} />
        <div style={styles.skeleton} />
      </div>
      <div style={styles.field}>
        <div style={{ ...styles.skeleton, width: 100, marginBottom: GRID }} />
        <div style={styles.skeleton} />
      </div>
    </div>
  )
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SchoolSettings() {
  const navigate = useNavigate()
  const { memberships } = useAuth()
  const userRole = getSchoolRole(memberships)
  const canEdit = userRole && EDIT_ROLES.includes(userRole)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [showExitModal, setShowExitModal] = useState(false)

  const [initial, setInitial] = useState(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    document: '',
    owner_name: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
    zip: '',
  })
  const [readOnly, setReadOnly] = useState({ school_id: '', status: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const load = useCallback(() => {
    setError('')
    setSuccess('')
    setLoading(true)
    getSchoolSettings()
      .then((data) => {
        setSchoolName(data?.name ?? '')
        setReadOnly({
          school_id: data?.school_id ?? '',
          status: data?.status ?? '',
        })
        const addr = data?.address ?? {}
        setForm({
          name: data?.name ?? '',
          phone: data?.phone ?? '',
          email: data?.email ?? '',
          document: data?.document ?? '',
          owner_name: data?.owner_name ?? '',
          street: addr?.street ?? '',
          number: addr?.number ?? '',
          district: addr?.district ?? '',
          city: addr?.city ?? '',
          state: addr?.state ?? '',
          zip: addr?.zip ?? '',
        })
        setInitial({
          name: data?.name ?? '',
          phone: data?.phone ?? '',
          email: data?.email ?? '',
          document: data?.document ?? '',
          owner_name: data?.owner_name ?? '',
          street: addr?.street ?? '',
          number: addr?.number ?? '',
          district: addr?.district ?? '',
          city: addr?.city ?? '',
          state: addr?.state ?? '',
          zip: addr?.zip ?? '',
        })
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else setError(err?.message || 'Não foi possível carregar os dados. Tente novamente.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=school', { replace: true })
  }, [permissionDenied, navigate])

  const isDirty = initial && (
    form.name !== initial.name ||
    form.phone !== initial.phone ||
    form.email !== initial.email ||
    form.document !== initial.document ||
    form.owner_name !== initial.owner_name ||
    form.street !== initial.street ||
    form.number !== initial.number ||
    form.district !== initial.district ||
    form.city !== initial.city ||
    form.state !== initial.state ||
    form.zip !== initial.zip
  )

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: null }))
  }

  const validate = () => {
    const err = {}
    const trimmedName = (form.name || '').trim()
    if (!trimmedName) err.name = 'Nome da escola é obrigatório.'
    if (form.email && form.email.trim()) {
      if (!emailRegex.test(form.email.trim())) err.email = 'Informe um e-mail válido.'
    }
    setFieldErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!canEdit) return
    setSuccess('')
    setError('')
    if (!validate()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      document: form.document.trim() || undefined,
      owner_name: form.owner_name.trim() || undefined,
      address: {
        street: form.street.trim() || undefined,
        number: form.number.trim() || undefined,
        district: form.district.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        zip: form.zip.trim() || undefined,
      },
    }
    updateSchoolSettings(payload)
      .then((data) => {
        setSuccess('Dados da escola atualizados com sucesso.')
        setError('')
        setSchoolName(data?.name ?? form.name)
        setInitial(form)
      })
      .catch((err) => {
        setError(err?.message || 'Não foi possível salvar os dados. Tente novamente.')
        setSuccess('')
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowExitModal(true)
    } else {
      navigate('/school/dashboard')
    }
  }

  const handleExitConfirm = () => {
    setShowExitModal(false)
    navigate('/school/dashboard')
  }

  const handleExitCancel = () => {
    setShowExitModal(false)
  }

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Dados da escola</h1>
        <p style={styles.subtitle}>Informações cadastrais e contato</p>
      </header>

      {success && (
        <div style={{ ...styles.message, ...styles.success }} role="status">
          {success}
        </div>
      )}
      {error && (
        <div style={{ ...styles.message, ...styles.error }} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <>
          <FormSkeleton />
          <FormSkeleton />
        </>
      ) : (
        <>
          {/* Navegação: Usuários e permissões / Preferências */}
          {canEdit && (
            <section style={styles.section} aria-label="Configurações">
              <h2 style={styles.sectionTitle}>Configurações</h2>
              <p style={{ margin: `0 0 ${GRID * 2}px`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
                Acesso ao Portal Escola e parâmetros operacionais.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: GRID * 2 }}>
                <Link
                  to="/school/settings/users"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: GRID,
                    padding: `${GRID}px ${GRID * 2}px`,
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--azul-arena)',
                    textDecoration: 'none',
                  }}
                >
                  Usuários e permissões →
                </Link>
                <Link
                  to="/school/settings/preferences"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: GRID,
                    padding: `${GRID}px ${GRID * 2}px`,
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--azul-arena)',
                    textDecoration: 'none',
                  }}
                >
                  Preferências →
                </Link>
              </div>
            </section>
          )}

          {/* Informações somente leitura */}
          {(readOnly.school_id || readOnly.status) && (
            <section style={styles.section} aria-label="Informações do sistema">
              <h2 style={styles.sectionTitle}>Informações do sistema</h2>
              <div style={styles.row}>
                {readOnly.school_id && (
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Código / ID da escola</label>
                    <input
                      type="text"
                      style={{ ...styles.input, ...styles.inputReadOnly }}
                      value={readOnly.school_id}
                      readOnly
                      disabled
                      aria-readonly="true"
                    />
                  </div>
                )}
                {readOnly.status && (
                  <div style={styles.field}>
                    <label style={styles.fieldLabel}>Status da escola</label>
                    <input
                      type="text"
                      style={{ ...styles.input, ...styles.inputReadOnly }}
                      value={statusLabel(readOnly.status)}
                      readOnly
                      disabled
                      aria-readonly="true"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Informações básicas */}
          <section style={styles.section} aria-label="Informações básicas">
            <h2 style={styles.sectionTitle}>Informações básicas</h2>
            <form onSubmit={handleSave} noValidate>
              <div style={styles.field}>
                <label htmlFor="school-name" style={styles.fieldLabel}>
                  Nome da escola <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  id="school-name"
                  type="text"
                  style={{ ...styles.input, ...(fieldErrors.name ? styles.inputError : {}) }}
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Nome da escola"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'err-name' : undefined}
                />
                {fieldErrors.name && (
                  <p id="err-name" style={styles.fieldError} role="alert">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
              <div style={styles.row}>
                <div style={styles.rowItem}>
                  <div style={styles.field}>
                    <label htmlFor="school-phone" style={styles.fieldLabel}>Telefone</label>
                    <input
                      id="school-phone"
                      type="text"
                      style={styles.input}
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      disabled={!canEdit}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                </div>
                <div style={styles.rowItem}>
                  <div style={styles.field}>
                    <label htmlFor="school-email" style={styles.fieldLabel}>E-mail de contato</label>
                    <input
                      id="school-email"
                      type="email"
                      style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : {}) }}
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      disabled={!canEdit}
                      placeholder="contato@escola.com.br"
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? 'err-email' : undefined}
                    />
                    {fieldErrors.email && (
                      <p id="err-email" style={styles.fieldError} role="alert">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div style={styles.row}>
                <div style={styles.rowItem}>
                  <div style={styles.field}>
                    <label htmlFor="school-document" style={styles.fieldLabel}>CNPJ / Documento</label>
                    <input
                      id="school-document"
                      type="text"
                      style={styles.input}
                      value={form.document}
                      onChange={(e) => updateField('document', e.target.value)}
                      disabled={!canEdit}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                </div>
                <div style={styles.rowItem}>
                  <div style={styles.field}>
                    <label htmlFor="school-owner" style={styles.fieldLabel}>Responsável (nome)</label>
                    <input
                      id="school-owner"
                      type="text"
                      style={styles.input}
                      value={form.owner_name}
                      onChange={(e) => updateField('owner_name', e.target.value)}
                      disabled={!canEdit}
                      placeholder="Nome do responsável"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <h3 style={{ margin: `${GRID * 4}px 0 ${GRID * 2}px`, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' }}>
                Endereço
              </h3>
              <div style={styles.field}>
                <label htmlFor="school-street" style={styles.fieldLabel}>Rua</label>
                <input
                  id="school-street"
                  type="text"
                  style={styles.input}
                  value={form.street}
                  onChange={(e) => updateField('street', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Rua, avenida"
                />
              </div>
              <div style={styles.row}>
                <div style={styles.rowItem}>
                  <div style={styles.field}>
                    <label htmlFor="school-number" style={styles.fieldLabel}>Número</label>
                    <input
                      id="school-number"
                      type="text"
                      style={styles.input}
                      value={form.number}
                      onChange={(e) => updateField('number', e.target.value)}
                      disabled={!canEdit}
                      placeholder="Nº"
                    />
                  </div>
                </div>
                <div style={styles.rowItem}>
                  <div style={styles.field}>
                    <label htmlFor="school-district" style={styles.fieldLabel}>Bairro</label>
                    <input
                      id="school-district"
                      type="text"
                      style={styles.input}
                      value={form.district}
                      onChange={(e) => updateField('district', e.target.value)}
                      disabled={!canEdit}
                      placeholder="Bairro"
                    />
                  </div>
                </div>
              </div>
              <div style={styles.row}>
                <div style={styles.rowItem}>
                  <div style={styles.field}>
                    <label htmlFor="school-city" style={styles.fieldLabel}>Cidade</label>
                    <input
                      id="school-city"
                      type="text"
                      style={styles.input}
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      disabled={!canEdit}
                      placeholder="Cidade"
                    />
                  </div>
                </div>
                <div style={{ flex: '0 0 80px' }}>
                  <div style={styles.field}>
                    <label htmlFor="school-state" style={styles.fieldLabel}>Estado</label>
                    <input
                      id="school-state"
                      type="text"
                      style={styles.input}
                      value={form.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      disabled={!canEdit}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div style={styles.rowItem}>
                  <div style={styles.field}>
                    <label htmlFor="school-zip" style={styles.fieldLabel}>CEP</label>
                    <input
                      id="school-zip"
                      type="text"
                      style={styles.input}
                      value={form.zip}
                      onChange={(e) => updateField('zip', e.target.value)}
                      disabled={!canEdit}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              {/* Rodapé de ações */}
              <div style={styles.footer}>
                {canEdit && (
                  <button
                    type="submit"
                    style={{ ...styles.btn, ...styles.btnPrimary, ...(saving ? styles.btnDisabled : {}) }}
                    disabled={saving}
                  >
                    {saving ? 'Salvando…' : 'Salvar'}
                  </button>
                )}
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      {/* Modal: alterações não salvas */}
      {showExitModal && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="exit-modal-title">
          <div style={styles.modal}>
            <h2 id="exit-modal-title" style={styles.modalTitle}>
              Alterações não salvas
            </h2>
            <p style={styles.modalText}>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </p>
            <div style={styles.modalActions}>
              <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handleExitCancel}>
                Continuar
              </button>
              <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleExitConfirm}>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
