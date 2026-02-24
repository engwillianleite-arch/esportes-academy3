import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useFranchisorSidebar } from '../../contexts/FranchisorSidebarContext'
import {
  getFranqueadorById,
  createFranqueador,
  updateFranqueador,
} from '../../api/franqueadores'

const GRID = 8
const STATUS_OPCOES = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pendente', label: 'Pendente' },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getInitialForm() {
  return {
    name: '',
    owner_name: '',
    email: '',
    phone: '',
    document: '',
    status: 'pendente',
    notes_internal: '',
  }
}

function validateForm(values) {
  const errors = {}
  if (!(values.name || '').trim()) errors.name = 'Obrigatório'
  if (!(values.owner_name || '').trim()) errors.owner_name = 'Obrigatório'
  if (!(values.email || '').trim()) errors.email = 'Obrigatório'
  else if (!EMAIL_REGEX.test(values.email.trim())) errors.email = 'Email inválido'
  if (!(values.status || '').trim()) errors.status = 'Obrigatório'
  return errors
}

const styles = {
  cardGrande: {
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
  sucesso: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: 'rgba(76, 203, 138, 0.12)',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(76, 203, 138, 0.4)',
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
    maxWidth: 480,
  },
  label: {
    display: 'block',
    marginBottom: GRID,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  labelOpcional: {
    opacity: 0.75,
    fontWeight: 400,
  },
  input: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputErro: {
    borderColor: '#dc3545',
    background: 'rgba(220, 53, 69, 0.04)',
  },
  textarea: {
    width: '100%',
    minHeight: 100,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  ajuda: {
    marginTop: GRID,
    fontSize: 12,
    color: 'var(--grafite-tecnico)',
    opacity: 0.7,
  },
  erroCampo: {
    marginTop: GRID,
    fontSize: 12,
    color: '#dc3545',
  },
  select: {
    width: '100%',
    maxWidth: 200,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    outline: 'none',
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
  linkVoltar: {
    color: 'var(--azul-arena)',
    fontSize: 14,
    textDecoration: 'none',
    marginLeft: GRID * 2,
  },
  skeletonLine: {
    height: 40,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 2,
    maxWidth: 480,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    maxWidth: 400,
    boxShadow: 'var(--shadow-hover)',
  },
  modalTexto: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  modalBotoes: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: GRID * 2,
  },
}

function SkeletonForm() {
  return (
    <div style={styles.cardGrande}>
      <div style={styles.cabecalho}>
        <div style={{ ...styles.skeletonLine, maxWidth: 320, height: 28 }} />
        <div style={{ display: 'flex', gap: GRID * 2 }}>
          <div style={{ ...styles.skeletonLine, width: 100, height: 40 }} />
          <div style={{ ...styles.skeletonLine, width: 100, height: 40 }} />
        </div>
      </div>
      <div style={styles.secao}>
        <div style={{ ...styles.skeletonLine, width: 200, height: 18, marginBottom: GRID * 2 }} />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={styles.skeletonLine} />
        ))}
      </div>
      <div style={styles.secao}>
        <div style={{ ...styles.skeletonLine, width: 180, height: 18, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeletonLine, height: 100 }} />
      </div>
    </div>
  )
}

export default function NovoFranqueador() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setFranchisorName } = useFranchisorSidebar()
  const isEdicao = Boolean(id)
  const tabFromUrl = searchParams.get('tab') || 'overview'
  const returnTo = searchParams.get('returnTo')

  const [form, setForm] = useState(getInitialForm())
  const [initialForm, setInitialForm] = useState(null)
  const [loading, setLoading] = useState(isEdicao)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [errorGeral, setErrorGeral] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [modalDescartar, setModalDescartar] = useState(false)

  const getCancelPath = useCallback(() => {
    if (returnTo) return returnTo
    if (isEdicao) return `/admin/franqueadores/${id}?tab=${tabFromUrl}`
    return '/admin/franqueadores'
  }, [returnTo, isEdicao, id, tabFromUrl])

  const hasChanges = initialForm && JSON.stringify(form) !== JSON.stringify(initialForm)

  const fetchFranqueador = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setErrorGeral(null)
    try {
      const data = await getFranqueadorById(id)
      if (data && (data.status === 403 || data.permission_denied)) {
        setPermissionDenied(true)
        return
      }
      const initial = {
        name: data.name || '',
        owner_name: data.owner_name || '',
        email: data.email || '',
        phone: data.phone || '',
        document: data.document || '',
        status: data.status || 'pendente',
        notes_internal: data.notes_internal || '',
      }
      setForm(initial)
      setInitialForm(initial)
      setFranchisorName(data.name ?? '')
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else setErrorGeral(err.message || 'Não foi possível carregar o franqueador.')
    } finally {
      setLoading(false)
    }
  }, [id, setFranchisorName])

  useEffect(() => {
    if (isEdicao) fetchFranqueador()
    else {
      setInitialForm(getInitialForm())
      setFranchisorName('')
    }
  }, [isEdicao, fetchFranqueador, setFranchisorName])

  useEffect(() => {
    return () => setFranchisorName('')
  }, [setFranchisorName])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setErrorGeral(null)
  }

  const handleCancel = () => {
    if (hasChanges) {
      setModalDescartar(true)
      return
    }
    navigate(getCancelPath())
  }

  const confirmDiscard = () => {
    setModalDescartar(false)
    navigate(getCancelPath())
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const payload = {
      name: form.name.trim(),
      owner_name: form.owner_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      document: form.document.trim() || undefined,
      status: form.status,
      notes_internal: form.notes_internal.trim() || undefined,
    }
    const validation = validateForm(payload)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      setErrorGeral('Não foi possível salvar. Revise os campos.')
      return
    }
    setErrors({})
    setErrorGeral(null)
    setSaving(true)
    try {
      if (isEdicao) {
        await updateFranqueador(id, payload)
      } else {
        const created = await createFranqueador(payload)
        setSuccessMessage('Franqueador salvo com sucesso!')
        setTimeout(() => {
          navigate(`/admin/franqueadores/${created.id}?tab=overview`, { replace: true })
        }, 800)
        return
      }
      setSuccessMessage('Franqueador salvo com sucesso!')
      setTimeout(() => {
        navigate(`/admin/franqueadores/${id}?tab=overview`, { replace: true })
      }, 800)
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
        return
      }
      if (err.status === 400 || err.validation) {
        setErrorGeral('Não foi possível salvar. Revise os campos.')
        setErrors(err.errors || {})
      } else {
        setErrorGeral('Ocorreu um erro ao salvar. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Franqueadores', to: '/admin/franqueadores' },
    { label: isEdicao ? 'Editar franqueador' : 'Novo franqueador' },
  ]

  const titulo = isEdicao
    ? `Editar franqueador: ${form.name || '…'}`
    : 'Novo franqueador'

  return (
    <AdminLayout breadcrumb={breadcrumb}>
      {loading && <SkeletonForm />}

      {!loading && (
        <div style={styles.cardGrande}>
          {/* Cabeçalho */}
          <div style={styles.cabecalho}>
            <h2 style={styles.tituloPagina}>{titulo}</h2>
            <div style={styles.cabecalhoAcoes}>
              <button
                type="button"
                style={styles.btnPrimario}
                className="btn-hover"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                type="button"
                style={styles.btnSecundario}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </div>

          {errorGeral && !successMessage && (
            <div style={styles.erroGeral} role="alert">
              {errorGeral}
            </div>
          )}
          {successMessage && (
            <div style={styles.sucesso} role="status">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Seção A — Dados do franqueador */}
            <section style={styles.secao} aria-labelledby="secao-dados">
              <h3 id="secao-dados" style={styles.secaoTitulo}>
                Dados do franqueador
              </h3>
              <div style={styles.campo}>
                <label htmlFor="name" style={styles.label}>
                  Nome do franqueador <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  style={{ ...styles.input, ...(errors.name ? styles.inputErro : {}) }}
                  disabled={saving}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'err-name' : undefined}
                />
                {errors.name && (
                  <div id="err-name" style={styles.erroCampo}>
                    {errors.name}
                  </div>
                )}
              </div>
              <div style={styles.campo}>
                <label htmlFor="owner_name" style={styles.label}>
                  Nome do responsável <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  id="owner_name"
                  type="text"
                  value={form.owner_name}
                  onChange={(e) => handleChange('owner_name', e.target.value)}
                  style={{ ...styles.input, ...(errors.owner_name ? styles.inputErro : {}) }}
                  disabled={saving}
                  aria-required="true"
                  aria-invalid={!!errors.owner_name}
                />
                {errors.owner_name && (
                  <div style={styles.erroCampo}>{errors.owner_name}</div>
                )}
              </div>
              <div style={styles.campo}>
                <label htmlFor="email" style={styles.label}>
                  Email principal <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  style={{ ...styles.input, ...(errors.email ? styles.inputErro : {}) }}
                  disabled={saving}
                  aria-required="true"
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <div style={styles.erroCampo}>{errors.email}</div>
                )}
              </div>
              <div style={styles.campo}>
                <label htmlFor="phone" style={{ ...styles.label, ...styles.labelOpcional }}>
                  Telefone (opcional)
                </label>
                <input
                  id="phone"
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  style={styles.input}
                  disabled={saving}
                />
              </div>
              <div style={styles.campo}>
                <label htmlFor="document" style={{ ...styles.label, ...styles.labelOpcional }}>
                  Documento (opcional)
                </label>
                <input
                  id="document"
                  type="text"
                  value={form.document}
                  onChange={(e) => handleChange('document', e.target.value)}
                  style={styles.input}
                  disabled={saving}
                />
              </div>
              <div style={styles.campo}>
                <label htmlFor="status" style={styles.label}>
                  Status <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  style={styles.select}
                  disabled={saving}
                  aria-required="true"
                  aria-invalid={!!errors.status}
                >
                  {STATUS_OPCOES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <div style={styles.erroCampo}>{errors.status}</div>
                )}
              </div>
            </section>

            {/* Seção B — Notas internas */}
            <section style={styles.secao} aria-labelledby="secao-notas">
              <h3 id="secao-notas" style={styles.secaoTitulo}>
                Notas internas (opcional)
              </h3>
              <div style={styles.campo}>
                <label htmlFor="notes_internal" style={{ ...styles.label, ...styles.labelOpcional }}>
                  Notas internas (Admin)
                </label>
                <textarea
                  id="notes_internal"
                  value={form.notes_internal}
                  onChange={(e) => handleChange('notes_internal', e.target.value)}
                  style={styles.textarea}
                  disabled={saving}
                  placeholder="Anotações visíveis apenas para Admin."
                />
                <p style={styles.ajuda}>Visível apenas para Admin.</p>
              </div>
            </section>

            {/* Rodapé do formulário */}
            <div style={styles.rodapeForm}>
              <button
                type="submit"
                style={styles.btnPrimario}
                className="btn-hover"
                disabled={saving}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                type="button"
                style={styles.btnSecundario}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              {isEdicao && (
                <Link
                  to={getCancelPath()}
                  style={styles.linkVoltar}
                  onClick={(e) => {
                    if (hasChanges) {
                      e.preventDefault()
                      setModalDescartar(true)
                    }
                  }}
                >
                  Voltar para o detalhe
                </Link>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Modal: alterações não salvas */}
      {modalDescartar && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
          <div style={styles.modal}>
            <h3 id="modal-titulo" style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 16 }}>
              Descartar alterações?
            </h3>
            <p style={styles.modalTexto}>
              Você tem alterações não salvas. Deseja descartar?
            </p>
            <div style={styles.modalBotoes}>
              <button
                type="button"
                style={styles.btnSecundario}
                onClick={() => setModalDescartar(false)}
              >
                Voltar
              </button>
              <button
                type="button"
                style={{ ...styles.btnPrimario, background: '#dc3545', boxShadow: 'none' }}
                className="btn-hover"
                onClick={confirmDiscard}
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
