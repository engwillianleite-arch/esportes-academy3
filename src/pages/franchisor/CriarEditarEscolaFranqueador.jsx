import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorSchoolById,
  createFranchisorSchool,
  updateFranchisorSchool,
} from '../../api/franchisorPortal'

const GRID = 8

const STATUS_LABELS = {
  pendente: 'Pendente',
  ativo: 'Ativa',
  suspenso: 'Suspensa',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getInitialForm() {
  return {
    name: '',
    responsible_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    address: '',
    notes: '',
  }
}

function validateForm(values) {
  const errors = {}
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
  inputReadOnly: {
    background: 'var(--cinza-arquibancada)',
    cursor: 'not-allowed',
    opacity: 0.95,
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
  statusMensagem: {
    marginTop: GRID,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
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

const ALLOWED_ROLES_EDIT = ['FranchisorOwner', 'FranchisorStaff']
const ALLOWED_ROLES_CREATE = ['FranchisorOwner']

export default function CriarEditarEscolaFranqueador() {
  const { school_id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const isEdit = Boolean(school_id)

  const [me, setMe] = useState(null)
  const [school, setSchool] = useState(null)
  const [loadingMe, setLoadingMe] = useState(true)
  const [loadingSchool, setLoadingSchool] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [toast, setToast] = useState(null)
  const [modalDiscard, setModalDiscard] = useState(false)
  const [pendingCancel, setPendingCancel] = useState(null)

  const [form, setForm] = useState(getInitialForm)
  const [backendErrors, setBackendErrors] = useState({})

  const returnToCreate = `/franchisor/schools?${searchParams.toString()}`
  const returnToEdit = `/franchisor/schools/${school_id}`

  const isDirty = useCallback(() => {
    if (!isEdit || !school) return true
    return (
      (form.name || '').trim() !== (school.school_name || '').trim() ||
      (form.responsible_name || '').trim() !== (school.responsible_name || '').trim() ||
      (form.email || '').trim() !== (school.email || '').trim() ||
      (form.phone || '').trim() !== (school.phone || '').trim() ||
      (form.city || '').trim() !== (school.city || '').trim() ||
      (form.state || '').trim() !== (school.state || '').trim() ||
      (form.address || '').trim() !== (school.address || '').trim() ||
      (form.notes || '').trim() !== (school.notes || '').trim()
    )
  }, [isEdit, school, form])

  const errors = validateForm(form)
  const isValid = Object.keys(errors).length === 0
  const canSave = !saving && isValid

  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((data) => { if (!cancelled) setMe(data); })
      .catch(() => { if (!cancelled) setPermissionDenied(true); })
      .finally(() => { if (!cancelled) setLoadingMe(false); })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!isEdit || !school_id) return
    let cancelled = false
    setLoadingSchool(true)
    getFranchisorSchoolById(school_id)
      .then((data) => {
        if (!cancelled) {
          if (!data) {
            setPermissionDenied(true)
            return
          }
          setSchool(data)
          setForm({
            name: data.school_name || '',
            responsible_name: data.responsible_name || '',
            email: data.email || '',
            phone: data.phone || '',
            city: data.city || '',
            state: data.state || '',
            address: data.address || '',
            notes: data.notes || '',
          })
        }
      })
      .catch(() => { if (!cancelled) setPermissionDenied(true); })
      .finally(() => { if (!cancelled) setLoadingSchool(false); })
    return () => { cancelled = true }
  }, [isEdit, school_id])

  useEffect(() => {
    if (!loadingMe && me) {
      if (isEdit && !ALLOWED_ROLES_EDIT.includes(me.user_role)) setPermissionDenied(true)
      if (!isEdit && !ALLOWED_ROLES_CREATE.includes(me.user_role)) setPermissionDenied(true)
    }
  }, [loadingMe, me, isEdit])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=franchisor', { replace: true })
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

  const doSubmit = async (e) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setBackendErrors({})
    try {
      const payload = {
        name: form.name.trim(),
        responsible_name: form.responsible_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      }
      if (isEdit) {
        await updateFranchisorSchool(school_id, payload)
        setToast('Escola salva com sucesso!')
        navigate(returnToEdit, { replace: true })
      } else {
        const created = await createFranchisorSchool(payload)
        setToast('Escola salva com sucesso!')
        navigate(`/franchisor/schools/${created.school_id}`, { replace: true })
      }
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
        return
      }
      if (err.status === 404) {
        setBackendErrors((prev) => ({ ...prev, _general: 'Escola não encontrada ou sem permissão.' }))
        return
      }
      const msg = err.message || 'Não foi possível salvar. Revise os campos.'
      setBackendErrors((prev) => ({ ...prev, _general: msg }))
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

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Escolas', to: '/franchisor/schools' },
    { label: isEdit ? 'Editar escola' : 'Nova escola' },
  ]

  const pageTitle = isEdit ? (school ? `Editar escola: ${school.school_name}` : 'Editar escola') : 'Nova escola'
  const statusDisplay = school ? (STATUS_LABELS[(school.status || '').toLowerCase()] || school.status || '—') : '—'

  if (permissionDenied) return null

  return (
    <FranchisorLayout pageTitle={pageTitle} breadcrumb={breadcrumb}>
      <div style={styles.card}>
        <div style={styles.cabecalho}>
          <h2 style={styles.tituloPagina}>{pageTitle}</h2>
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
            <Link
              to={isEdit ? returnToEdit : returnToCreate}
              style={styles.btnSecundario}
              className="btn-hover"
              onClick={(e) => { e.preventDefault(); handleCancel(); }}
            >
              Cancelar
            </Link>
          </div>
        </div>

        {toast && <div style={styles.toast} role="status">{toast}</div>}

        {backendErrors._general && (
          <div style={styles.erroGeral} role="alert">
            {backendErrors._general}
          </div>
        )}

        {(loadingSchool && isEdit) ? (
          <SkeletonForm />
        ) : (
          <form onSubmit={doSubmit} noValidate>
            {/* Seção A — Dados da escola */}
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
                <label htmlFor="responsible_name" style={styles.label}>Responsável local</label>
                <input
                  id="responsible_name"
                  type="text"
                  value={form.responsible_name}
                  onChange={(e) => handleChange('responsible_name', e.target.value)}
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
                  style={styles.input}
                  placeholder="Rua, número, bairro"
                />
              </div>
            </section>

            {/* Seção B — Status (somente leitura) */}
            <section style={styles.secao} aria-labelledby="secao-status">
              <h3 id="secao-status" style={styles.secaoTitulo}>Status</h3>
              <div style={styles.campo}>
                <label htmlFor="status_display" style={styles.label}>Status</label>
                <input
                  id="status_display"
                  type="text"
                  readOnly
                  value={statusDisplay}
                  style={{ ...styles.input, ...styles.inputReadOnly }}
                  aria-readonly="true"
                />
                <p style={styles.statusMensagem}>
                  A aprovação e mudanças de status são feitas pelo Admin.
                </p>
              </div>
            </section>

            {/* Seção C — Observações internas */}
            <section style={styles.secao} aria-labelledby="secao-observacoes">
              <h3 id="secao-observacoes" style={styles.secaoTitulo}>Observações internas</h3>
              <div style={styles.campo}>
                <label htmlFor="notes" style={styles.label}>Observações</label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  style={{
                    ...styles.textarea,
                    ...(backendErrors.notes ? styles.inputError : {}),
                  }}
                  placeholder="Anotações sobre a escola (opcional)."
                  rows={3}
                />
                {backendErrors.notes && (
                  <div style={styles.erroCampo}>{backendErrors.notes}</div>
                )}
              </div>
            </section>

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
            </div>
          </form>
        )}
      </div>

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
    </FranchisorLayout>
  )
}
