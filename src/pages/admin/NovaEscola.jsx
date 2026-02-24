import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import {
  listFranchisorsForSelect,
  getSchoolById,
  createSchool,
  updateSchool,
} from '../../api/franqueadores'

const GRID = 8

const STATUS_ESCOLA_OPCOES = [
  { value: 'ativo', label: 'Ativa' },
  { value: 'pendente', label: 'Pendente' },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getInitialForm() {
  return {
    franchisor_id: '',
    status: 'pendente',
    name: '',
    responsible_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    address: '',
    notes_internal: '',
  }
}

function validateForm(values, franchisorLocked) {
  const errors = {}
  if (!franchisorLocked && !(values.franchisor_id || '').trim()) errors.franchisor_id = 'Obrigatório'
  if (!(values.status || '').trim()) errors.status = 'Obrigatório'
  if (!(values.name || '').trim()) errors.name = 'Obrigatório'
  if ((values.email || '').trim() && !EMAIL_REGEX.test(values.email.trim())) errors.email = 'Email inválido'
  return errors
}

function SkeletonLine({ width = '80%' }) {
  return (
    <div style={{ height: 40, background: 'var(--cinza-arquibancada)', borderRadius: 8, width, marginBottom: GRID * 2 }} />
  )
}

function SkeletonForm() {
  return (
    <div style={{ maxWidth: 560 }}>
      <SkeletonLine width="50%" />
      <SkeletonLine />
      <SkeletonLine />
      <SkeletonLine width="70%" />
      <SkeletonLine />
      <SkeletonLine width="40%" />
    </div>
  )
}

const styles = {
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cabecalho: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 3,
    marginBottom: GRID * 4,
  },
  tituloPagina: {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  cabecalhoAcoes: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  btnPrimario: {
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(44, 110, 242, 0.3)',
  },
  btnSecundario: {
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #E5E5E7',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  linkTerciario: {
    color: 'var(--azul-arena)',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
  },
  erroGeral: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: 'rgba(220, 53, 69, 0.08)',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  secao: {
    marginBottom: GRID * 4,
  },
  secaoTitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  campo: {
    marginBottom: GRID * 2,
  },
  label: {
    display: 'block',
    marginBottom: GRID,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  input: {
    width: '100%',
    maxWidth: 400,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: 'rgba(220, 53, 69, 0.6)',
  },
  select: {
    width: '100%',
    maxWidth: 400,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    background: 'var(--branco-luz)',
    cursor: 'pointer',
  },
  selectDisabled: {
    background: 'var(--cinza-arquibancada)',
    cursor: 'not-allowed',
    opacity: 0.9,
  },
  textarea: {
    width: '100%',
    maxWidth: 560,
    minHeight: 80,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  erroCampo: {
    marginTop: GRID,
    fontSize: 13,
    color: '#dc3545',
  },
  rodapeForm: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginTop: GRID * 4,
    paddingTop: GRID * 3,
    borderTop: '1px solid #eee',
  },
  linkDiscreto: {
    marginLeft: GRID * 2,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
    textDecoration: 'none',
  },
  overlay: {
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
    boxShadow: 'var(--shadow-hover)',
  },
  modalTitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  modalTexto: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  modalBotoes: {
    display: 'flex',
    gap: GRID * 2,
    justifyContent: 'flex-end',
  },
  toast: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'rgba(76, 203, 138, 0.15)',
    color: 'var(--verde-patrocinio)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
    fontWeight: 500,
  },
}

export default function NovaEscola() {
  const { id: schoolId } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const isEdit = Boolean(schoolId)
  const franchisorIdFromQuery = searchParams.get('franchisor_id') || ''
  const returnToFromQuery = searchParams.get('returnTo') || ''

  const [franchisors, setFranchisors] = useState([])
  const [school, setSchool] = useState(null)
  const [loadingFranchisors, setLoadingFranchisors] = useState(true)
  const [loadingSchool, setLoadingSchool] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [toast, setToast] = useState(null)
  const [modalDiscard, setModalDiscard] = useState(false)
  const [pendingCancel, setPendingCancel] = useState(null)

  const [form, setForm] = useState(getInitialForm)
  const [touched, setTouched] = useState({})
  const [backendErrors, setBackendErrors] = useState({})

  const franchisorLocked = Boolean(franchisorIdFromQuery)

  const returnToCreate = returnToFromQuery || '/admin/escolas'
  const returnToEdit = location.state?.returnTo || (schoolId ? `/admin/escolas/${schoolId}` : '/admin/escolas')

  const isDirty = useCallback(() => {
    if (!isEdit || !school) return true
    return (
      form.name !== (school.name || '') ||
      form.status !== (school.status || '') ||
      form.responsible_name !== (school.responsible_name || '') ||
      form.email !== (school.email || '') ||
      form.phone !== (school.phone || '') ||
      form.city !== (school.city || '') ||
      form.state !== (school.state || '') ||
      form.address !== (school.address || '') ||
      form.notes_internal !== (school.notes_internal || '')
    )
  }, [isEdit, school, form])

  const errors = validateForm(form, franchisorLocked)
  const isValid = Object.keys(errors).length === 0 && (franchisorLocked ? true : Boolean(form.franchisor_id?.trim()))
  const canSave = !saving && isValid

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingFranchisors(true)
      try {
        const list = await listFranchisorsForSelect()
        if (!cancelled) setFranchisors(list || [])
      } catch (e) {
        if (e.status === 403 && !cancelled) setPermissionDenied(true)
      } finally {
        if (!cancelled) setLoadingFranchisors(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!isEdit || !schoolId) return
    let cancelled = false
    setLoadingSchool(true)
    getSchoolById(schoolId)
      .then((data) => {
        if (!cancelled) {
          setSchool(data)
          setForm({
            franchisor_id: data.franchisor_id || '',
            status: (data.status || 'pendente').toLowerCase(),
            name: data.name || '',
            responsible_name: data.responsible_name || '',
            email: data.email || '',
            phone: data.phone || '',
            city: data.city || '',
            state: data.state || '',
            address: data.address || '',
            notes_internal: data.notes_internal || '',
          })
        }
      })
      .catch((e) => {
        if (!cancelled) {
          if (e.status === 403) setPermissionDenied(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSchool(false)
      })
    return () => { cancelled = true }
  }, [isEdit, schoolId])

  useEffect(() => {
    if (franchisorIdFromQuery && franchisors.length > 0 && !form.franchisor_id) {
      setForm((prev) => ({ ...prev, franchisor_id: franchisorIdFromQuery }))
    }
  }, [franchisorIdFromQuery, franchisors.length, form.franchisor_id])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado', { replace: true })
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setBackendErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const doSubmit = async (e) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setBackendErrors({})
    try {
      if (isEdit) {
        await updateSchool(schoolId, {
          name: form.name.trim(),
          status: form.status,
          responsible_name: form.responsible_name.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          address: form.address.trim() || null,
          notes_internal: form.notes_internal.trim() || null,
        })
        setToast('Escola salva com sucesso!')
        navigate(`/admin/escolas/${schoolId}`, { replace: true })
      } else {
        const created = await createSchool({
          franchisor_id: form.franchisor_id.trim(),
          name: form.name.trim(),
          status: form.status,
          responsible_name: form.responsible_name.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          address: form.address.trim() || null,
          notes_internal: form.notes_internal.trim() || null,
        })
        setToast('Escola salva com sucesso!')
        navigate(`/admin/escolas/${created.id}`, { replace: true })
      }
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
        return
      }
      const msg = err.message || 'Ocorreu um erro ao salvar. Tente novamente.'
      setBackendErrors((prev) => ({ ...prev, _general: msg }))
      if (err.fields) setBackendErrors((prev) => ({ ...prev, ...err.fields }))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (isDirty()) {
      setPendingCancel(isEdit ? returnToEdit : returnToCreate)
      setModalDiscard(true)
    } else {
      navigate(isEdit ? returnToEdit : returnToCreate)
    }
  }

  const confirmDiscard = () => {
    setModalDiscard(false)
    if (pendingCancel) {
      navigate(pendingCancel)
      setPendingCancel(null)
    }
  }

  const cancelDiscard = () => {
    setModalDiscard(false)
    setPendingCancel(null)
  }

  const breadcrumbEscolasTo = returnToFromQuery || '/admin/escolas'
  const breadcrumb = [
    { label: 'Escolas', to: breadcrumbEscolasTo },
    { label: isEdit ? (school ? `Editar escola: ${school.name}` : 'Editar escola') : 'Nova escola' },
  ]

  const tituloPagina = isEdit ? (school ? `Editar escola: ${school.name}` : 'Editar escola') : 'Nova escola'
  const franqueadorNome = franchisors.find((f) => String(f.id) === String(form.franchisor_id))?.name || school?.franchisor_name

  if (permissionDenied) return null

  return (
    <AdminLayout breadcrumb={breadcrumb}>
      <div style={styles.card}>
        {/* Cabeçalho */}
        <div style={styles.cabecalho}>
          <h2 style={styles.tituloPagina}>{tituloPagina}</h2>
          <div style={styles.cabecalhoAcoes}>
            <button
              type="button"
              style={styles.btnPrimario}
              className="btn-hover"
              disabled={!canSave}
              onClick={doSubmit}
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        </div>

        {toast && <div style={styles.toast} role="status">{toast}</div>}

        {backendErrors._general && (
          <div style={styles.erroGeral} role="alert">
            {backendErrors._general === 'Não foi possível salvar. Revise os campos.'
              ? backendErrors._general
              : 'Ocorreu um erro ao salvar. Tente novamente.'}
          </div>
        )}

        {(loadingSchool && isEdit) ? (
          <SkeletonForm />
        ) : (
          <form onSubmit={doSubmit} noValidate>
            {/* Seção A — Vínculo e status */}
            <section style={styles.secao} aria-labelledby="secao-vinculo">
              <h3 id="secao-vinculo" style={styles.secaoTitulo}>Vínculo e status</h3>

              <div style={styles.campo}>
                <label htmlFor="franchisor_id" style={styles.label}>
                  Franqueador <span style={{ color: '#dc3545' }}>*</span>
                </label>
                {franchisorLocked ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: GRID * 2, flexWrap: 'wrap' }}>
                    <input
                      id="franchisor_id"
                      type="text"
                      readOnly
                      value={franqueadorNome || `ID: ${form.franchisor_id}`}
                      style={{ ...styles.input, background: 'var(--cinza-arquibancada)', cursor: 'not-allowed' }}
                      aria-readonly="true"
                    />
                    <Link
                      to={`/admin/franqueadores/${form.franchisor_id}?tab=overview`}
                      style={styles.linkTerciario}
                      className="btn-hover"
                    >
                      Ver franqueador
                    </Link>
                  </div>
                ) : (
                  <>
                    <select
                      id="franchisor_id"
                      value={form.franchisor_id}
                      onChange={(e) => handleChange('franchisor_id', e.target.value)}
                      onBlur={() => handleBlur('franchisor_id')}
                      style={{
                        ...styles.select,
                        ...(backendErrors.franchisor_id ? styles.inputError : {}),
                      }}
                      disabled={loadingFranchisors}
                      aria-required="true"
                      aria-invalid={Boolean(errors.franchisor_id || backendErrors.franchisor_id)}
                    >
                      <option value="">Selecione o franqueador</option>
                      {franchisors.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} {f.status ? `(${f.status})` : ''}
                        </option>
                      ))}
                    </select>
                    {(errors.franchisor_id || backendErrors.franchisor_id) && (
                      <div style={styles.erroCampo}>{errors.franchisor_id || backendErrors.franchisor_id}</div>
                    )}
                  </>
                )}
              </div>

              <div style={styles.campo}>
                <label htmlFor="status" style={styles.label}>
                  Status da escola <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  onBlur={() => handleBlur('status')}
                  style={{
                    ...styles.select,
                    ...(backendErrors.status ? styles.inputError : {}),
                  }}
                  aria-required="true"
                  aria-invalid={Boolean(errors.status || backendErrors.status)}
                >
                  {STATUS_ESCOLA_OPCOES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {(errors.status || backendErrors.status) && (
                  <div style={styles.erroCampo}>{errors.status || backendErrors.status}</div>
                )}
              </div>
            </section>

            {/* Seção B — Dados da escola */}
            <section style={styles.secao} aria-labelledby="secao-dados">
              <h3 id="secao-dados" style={styles.secaoTitulo}>Dados da escola</h3>

              <div style={styles.campo}>
                <label htmlFor="name" style={styles.label}>
                  Nome da escola <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  style={{
                    ...styles.input,
                    ...((errors.name || backendErrors.name) ? styles.inputError : {}),
                  }}
                  placeholder="Ex.: Arena São Paulo"
                  aria-required="true"
                  aria-invalid={Boolean(errors.name || backendErrors.name)}
                />
                {(errors.name || backendErrors.name) && (
                  <div style={styles.erroCampo}>{errors.name || backendErrors.name}</div>
                )}
              </div>

              <div style={styles.campo}>
                <label htmlFor="responsible_name" style={styles.label}>Nome do responsável local</label>
                <input
                  id="responsible_name"
                  type="text"
                  value={form.responsible_name}
                  onChange={(e) => handleChange('responsible_name', e.target.value)}
                  onBlur={() => handleBlur('responsible_name')}
                  style={styles.input}
                  placeholder="Ex.: João Silva"
                />
              </div>

              <div style={styles.campo}>
                <label htmlFor="email" style={styles.label}>Email da escola</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  style={{
                    ...styles.input,
                    ...((errors.email || backendErrors.email) ? styles.inputError : {}),
                  }}
                  placeholder="contato@escola.com.br"
                  aria-invalid={Boolean(errors.email || backendErrors.email)}
                />
                {(errors.email || backendErrors.email) && (
                  <div style={styles.erroCampo}>{errors.email || backendErrors.email}</div>
                )}
              </div>

              <div style={styles.campo}>
                <label htmlFor="phone" style={styles.label}>Telefone</label>
                <input
                  id="phone"
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  style={styles.input}
                  placeholder="(11) 3333-0000"
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: GRID * 3 }}>
                <div style={styles.campo}>
                  <label htmlFor="city" style={styles.label}>Cidade</label>
                  <input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    onBlur={() => handleBlur('city')}
                    style={styles.input}
                    placeholder="São Paulo"
                  />
                </div>
                <div style={styles.campo}>
                  <label htmlFor="state" style={styles.label}>UF/Estado</label>
                  <input
                    id="state"
                    type="text"
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    onBlur={() => handleBlur('state')}
                    style={{ ...styles.input, maxWidth: 120 }}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              <div style={styles.campo}>
                <label htmlFor="address" style={styles.label}>Endereço</label>
                <input
                  id="address"
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  onBlur={() => handleBlur('address')}
                  style={styles.input}
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div style={styles.campo}>
                <label htmlFor="notes_internal" style={styles.label}>Observações internas (Admin)</label>
                <textarea
                  id="notes_internal"
                  value={form.notes_internal}
                  onChange={(e) => handleChange('notes_internal', e.target.value)}
                  onBlur={() => handleBlur('notes_internal')}
                  style={{
                    ...styles.textarea,
                    ...(backendErrors.notes_internal ? styles.inputError : {}),
                  }}
                  placeholder="Anotações visíveis apenas para o Admin."
                  rows={3}
                />
                {backendErrors.notes_internal && (
                  <div style={styles.erroCampo}>{backendErrors.notes_internal}</div>
                )}
              </div>
            </section>

            {/* Rodapé do formulário */}
            <div style={styles.rodapeForm}>
              <button
                type="submit"
                style={styles.btnPrimario}
                className="btn-hover"
                disabled={!canSave}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={handleCancel}>
                Cancelar
              </button>
              {isEdit && schoolId && (
                <Link to={`/admin/escolas/${schoolId}`} style={styles.linkDiscreto} className="btn-hover">
                  Voltar para o detalhe
                </Link>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Modal descartar alterações */}
      {modalDiscard && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-discard-title">
          <div style={styles.modal}>
            <h3 id="modal-discard-title" style={styles.modalTitulo}>Alterações não salvas</h3>
            <p style={styles.modalTexto}>Você tem alterações não salvas. Deseja descartar?</p>
            <div style={styles.modalBotoes}>
              <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={cancelDiscard}>
                Voltar
              </button>
              <button type="button" style={{ ...styles.btnPrimario, background: '#dc3545' }} className="btn-hover" onClick={confirmDiscard}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
