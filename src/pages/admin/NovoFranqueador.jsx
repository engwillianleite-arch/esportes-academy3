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

const DOCUMENT_TYPE_OPCOES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
]

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const TABS = [
  { id: 'dados', label: 'Dados do franqueador' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'outros', label: 'Outros' },
]

/** Dados de exemplo para "Preencher com exemplo" (apenas em novo cadastro) */
const FORM_EXAMPLE = {
  name: 'Rede Arena Esportes Educacional Ltda',
  trade_name: 'Arena Kids',
  commercial_name: 'Arena Esportes Ltda',
  owner_name: 'Carlos Silva',
  email: 'contato@arenaesportes.com.br',
  phone: '(11) 3456-7890',
  document_type: 'cnpj',
  document: '12.345.678/0001-90',
  status: 'pendente',
  notes_internal: 'Franqueador em fase de onboarding. Documentação em análise.',
  address_cep: '01310-100',
  address_street: 'Avenida Paulista',
  address_number: '1000',
  address_complement: 'Sala 101',
  address_neighborhood: 'Bela Vista',
  address_city: 'São Paulo',
  address_state: 'SP',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function onlyDigits(str) {
  return (str || '').replace(/\D/g, '')
}

function formatCpf(value) {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function formatCnpj(value) {
  const d = onlyDigits(value).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

function formatCep(value) {
  const d = onlyDigits(value).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

function getInitialForm() {
  return {
    name: '',
    trade_name: '',
    commercial_name: '',
    owner_name: '',
    email: '',
    phone: '',
    document_type: 'cnpj',
    document: '',
    status: 'pendente',
    notes_internal: '',
    address_cep: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
  }
}

function validateForm(values) {
  const errors = {}
  if (!(values.name || '').trim()) errors.name = 'Obrigatório'
  if (!(values.owner_name || '').trim()) errors.owner_name = 'Obrigatório'
  if (!(values.email || '').trim()) errors.email = 'Obrigatório'
  else if (!EMAIL_REGEX.test(values.email.trim())) errors.email = 'Email inválido'
  if (!(values.status || '').trim()) errors.status = 'Obrigatório'
  const docType = (values.document_type || '').trim()
  const doc = (values.document || '').trim()
  if (docType && !doc) errors.document = 'Informe o documento'
  else if (docType === 'cpf' && doc && onlyDigits(doc).length !== 11) errors.document = 'CPF deve ter 11 dígitos'
  else if (docType === 'cnpj' && doc && onlyDigits(doc).length !== 14) errors.document = 'CNPJ deve ter 14 dígitos'
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
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  subtitulo: {
    margin: `${GRID}px 0 0`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.75,
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
  btnExemplo: {
    background: 'rgba(44, 110, 242, 0.08)',
    color: 'var(--azul-arena)',
    border: '1px solid rgba(44, 110, 242, 0.3)',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
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
  radioGroup: {
    display: 'flex',
    gap: GRID * 3,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  radioLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    cursor: 'pointer',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  tabs: {
    display: 'flex',
    gap: GRID,
    marginBottom: GRID * 3,
    borderBottom: '1px solid #E5E5E7',
  },
  tab: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: 'none',
    background: 'none',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
    opacity: 0.85,
  },
  tabAtivo: {
    color: 'var(--azul-arena)',
    borderBottomColor: 'var(--azul-arena)',
    opacity: 1,
  },
  tabBadge: {
    marginLeft: GRID,
    fontSize: 11,
    color: 'var(--grafite-tecnico)',
    opacity: 0.7,
  },
  card: {
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
  },
  cardTitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: GRID * 2,
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
  const [activeTab, setActiveTab] = useState('dados')

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
        trade_name: data.trade_name || '',
        commercial_name: data.commercial_name || '',
        owner_name: data.owner_name || '',
        email: data.email || '',
        phone: data.phone || '',
        document_type: data.document_type || 'cnpj',
        document: data.document || '',
        status: data.status || 'pendente',
        notes_internal: data.notes_internal || '',
        address_cep: data.address_cep || '',
        address_street: data.address_street || '',
        address_number: data.address_number || '',
        address_complement: data.address_complement || '',
        address_neighborhood: data.address_neighborhood || '',
        address_city: data.address_city || '',
        address_state: data.address_state || '',
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

  const handleDocumentChange = (value) => {
    const type = form.document_type || 'cnpj'
    const formatted = type === 'cpf' ? formatCpf(value) : formatCnpj(value)
    handleChange('document', formatted)
  }

  const handleCepChange = (value) => {
    const formatted = formatCep(value)
    handleChange('address_cep', formatted)
    if (onlyDigits(value).length === 8) {
      fetch(`https://viacep.com.br/ws/${onlyDigits(value)}/json/`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.erro) {
            setForm((prev) => ({
              ...prev,
              address_street: data.logradouro || prev.address_street,
              address_neighborhood: data.bairro || prev.address_neighborhood,
              address_city: data.localidade || prev.address_city,
              address_state: data.uf || prev.address_state,
            }))
          }
        })
        .catch(() => {})
    }
  }

  const fillExample = () => {
    setForm({ ...getInitialForm(), ...FORM_EXAMPLE })
    setErrors({})
    setErrorGeral(null)
    setActiveTab('dados')
  }

  /** Retorna a aba que contém o primeiro campo com erro (para focar após validação) */
  const getTabForField = (field) => {
    const dadosFields = ['name', 'trade_name', 'commercial_name', 'owner_name', 'email', 'phone', 'document_type', 'document', 'status']
    const enderecoFields = ['address_cep', 'address_street', 'address_number', 'address_complement', 'address_neighborhood', 'address_city', 'address_state']
    if (dadosFields.includes(field)) return 'dados'
    if (enderecoFields.includes(field)) return 'endereco'
    return 'outros'
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
      trade_name: form.trade_name.trim() || undefined,
      commercial_name: form.commercial_name.trim() || undefined,
      owner_name: form.owner_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      document_type: form.document_type || undefined,
      document: form.document.trim() || undefined,
      status: form.status,
      notes_internal: form.notes_internal.trim() || undefined,
      address_cep: form.address_cep.trim() || undefined,
      address_street: form.address_street.trim() || undefined,
      address_number: form.address_number.trim() || undefined,
      address_complement: form.address_complement.trim() || undefined,
      address_neighborhood: form.address_neighborhood.trim() || undefined,
      address_city: form.address_city.trim() || undefined,
      address_state: form.address_state.trim() || undefined,
    }
    const validation = validateForm(payload)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      setErrorGeral('Não foi possível salvar. Revise os campos.')
      const firstErrorField = Object.keys(validation)[0]
      setActiveTab(getTabForField(firstErrorField))
      setTimeout(() => {
        const el = document.getElementById(firstErrorField)
        if (el) el.focus()
      }, 100)
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
            <div>
              <h2 style={styles.tituloPagina}>{titulo}</h2>
              <p style={styles.subtitulo}>
                {isEdicao ? 'Altere os dados nas abas abaixo e salve.' : 'Preencha os dados em cada aba. Use o exemplo para ver um cadastro completo.'}
              </p>
            </div>
            <div style={styles.cabecalhoAcoes}>
              {!isEdicao && (
                <button
                  type="button"
                  style={styles.btnExemplo}
                  onClick={fillExample}
                  disabled={saving}
                >
                  Preencher com exemplo
                </button>
              )}
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
            {/* Abas */}
            <nav style={styles.tabs} role="tablist" aria-label="Seções do formulário">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabAtivo : {}) }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Aba: Dados do franqueador */}
            {activeTab === 'dados' && (
              <div id="panel-dados" role="tabpanel" aria-labelledby="tab-dados">
                <div style={styles.card}>
                  <h3 style={styles.cardTitulo}>Identificação</h3>
                  <div style={styles.grid2}>
                    <div style={styles.campo}>
                      <label htmlFor="name" style={styles.label}>
                        Razão social <span style={{ color: '#dc3545' }}>*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        style={{ ...styles.input, ...(errors.name ? styles.inputErro : {}) }}
                        disabled={saving}
                        placeholder="Ex.: Rede Arena Esportes Educacional Ltda"
                        aria-required="true"
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && <div style={styles.erroCampo}>{errors.name}</div>}
                    </div>
                    <div style={styles.campo}>
                      <label htmlFor="trade_name" style={styles.label}>Nome fantasia</label>
                      <input
                        id="trade_name"
                        type="text"
                        value={form.trade_name}
                        onChange={(e) => handleChange('trade_name', e.target.value)}
                        style={styles.input}
                        disabled={saving}
                        placeholder="Ex.: Arena Kids"
                      />
                    </div>
                    <div style={styles.campo}>
                      <label htmlFor="commercial_name" style={styles.label}>Nome comercial</label>
                      <input
                        id="commercial_name"
                        type="text"
                        value={form.commercial_name}
                        onChange={(e) => handleChange('commercial_name', e.target.value)}
                        style={styles.input}
                        disabled={saving}
                        placeholder="Ex.: Arena Esportes Ltda"
                      />
                    </div>
                  </div>
                </div>
                <div style={styles.card}>
                  <h3 style={styles.cardTitulo}>Contato e responsável</h3>
                  <div style={styles.grid2}>
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
                        placeholder="Ex.: Carlos Silva"
                        aria-required="true"
                      />
                      {errors.owner_name && <div style={styles.erroCampo}>{errors.owner_name}</div>}
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
                        placeholder="contato@arenaesportes.com.br"
                        aria-required="true"
                      />
                      {errors.email && <div style={styles.erroCampo}>{errors.email}</div>}
                    </div>
                    <div style={styles.campo}>
                      <label htmlFor="phone" style={{ ...styles.label, ...styles.labelOpcional }}>Telefone</label>
                      <input
                        id="phone"
                        type="text"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        style={styles.input}
                        disabled={saving}
                        placeholder="(11) 3456-7890"
                      />
                    </div>
                  </div>
                </div>
                <div style={styles.card}>
                  <h3 style={styles.cardTitulo}>Documento e status</h3>
                  <div style={styles.grid2}>
                    <div style={styles.campo}>
                      <span style={styles.label}>Tipo de documento</span>
                      <div style={styles.radioGroup}>
                        {DOCUMENT_TYPE_OPCOES.map((opt) => (
                          <label key={opt.value} style={styles.radioLabel}>
                            <input
                              type="radio"
                              name="document_type"
                              value={opt.value}
                              checked={(form.document_type || 'cnpj') === opt.value}
                              onChange={() => { handleChange('document_type', opt.value); handleChange('document', '') }}
                              disabled={saving}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={styles.campo}>
                      <label htmlFor="document" style={styles.label}>
                        {form.document_type === 'cpf' ? 'CPF' : 'CNPJ'}
                      </label>
                      <input
                        id="document"
                        type="text"
                        value={form.document}
                        onChange={(e) => handleDocumentChange(e.target.value)}
                        placeholder={form.document_type === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'}
                        style={{ ...styles.input, ...(errors.document ? styles.inputErro : {}) }}
                        disabled={saving}
                      />
                      {errors.document && <div style={styles.erroCampo}>{errors.document}</div>}
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
                      >
                        {STATUS_OPCOES.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {errors.status && <div style={styles.erroCampo}>{errors.status}</div>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: GRID * 2, marginTop: GRID * 2 }}>
                  <button type="button" style={styles.btnSecundario} onClick={() => setActiveTab('endereco')}>
                    Próximo: Endereço →
                  </button>
                </div>
              </div>
            )}

            {/* Aba: Endereço */}
            {activeTab === 'endereco' && (
              <div id="panel-endereco" role="tabpanel" aria-labelledby="tab-endereco">
                <div style={styles.card}>
                  <h3 style={styles.cardTitulo}>Endereço da sede</h3>
                  <p style={{ ...styles.ajuda, marginBottom: GRID * 2 }}>Informe o CEP para preenchimento automático do logradouro, bairro, cidade e UF.</p>
                  <div style={{ ...styles.grid2, maxWidth: 560 }}>
                    <div style={styles.campo}>
                      <label htmlFor="address_cep" style={styles.label}>CEP</label>
                      <input
                        id="address_cep"
                        type="text"
                        value={form.address_cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        style={{ ...styles.input, maxWidth: 140 }}
                        disabled={saving}
                      />
                    </div>
                    <div style={{ ...styles.campo, gridColumn: '1 / -1' }}>
                      <label htmlFor="address_street" style={styles.label}>Logradouro</label>
                      <input
                        id="address_street"
                        type="text"
                        value={form.address_street}
                        onChange={(e) => handleChange('address_street', e.target.value)}
                        placeholder="Rua, avenida..."
                        style={styles.input}
                        disabled={saving}
                      />
                    </div>
                    <div style={styles.campo}>
                      <label htmlFor="address_number" style={styles.label}>Número</label>
                      <input
                        id="address_number"
                        type="text"
                        value={form.address_number}
                        onChange={(e) => handleChange('address_number', e.target.value)}
                        style={styles.input}
                        disabled={saving}
                      />
                    </div>
                    <div style={styles.campo}>
                      <label htmlFor="address_complement" style={{ ...styles.label, ...styles.labelOpcional }}>Complemento</label>
                      <input
                        id="address_complement"
                        type="text"
                        value={form.address_complement}
                        onChange={(e) => handleChange('address_complement', e.target.value)}
                        style={styles.input}
                        disabled={saving}
                      />
                    </div>
                    <div style={styles.campo}>
                      <label htmlFor="address_neighborhood" style={styles.label}>Bairro</label>
                      <input
                        id="address_neighborhood"
                        type="text"
                        value={form.address_neighborhood}
                        onChange={(e) => handleChange('address_neighborhood', e.target.value)}
                        style={styles.input}
                        disabled={saving}
                      />
                    </div>
                    <div style={styles.campo}>
                      <label htmlFor="address_city" style={styles.label}>Cidade</label>
                      <input
                        id="address_city"
                        type="text"
                        value={form.address_city}
                        onChange={(e) => handleChange('address_city', e.target.value)}
                        style={styles.input}
                        disabled={saving}
                      />
                    </div>
                    <div style={styles.campo}>
                      <label htmlFor="address_state" style={styles.label}>UF</label>
                      <select
                        id="address_state"
                        value={form.address_state}
                        onChange={(e) => handleChange('address_state', e.target.value)}
                        style={{ ...styles.select, maxWidth: 100 }}
                        disabled={saving}
                      >
                        <option value="">—</option>
                        {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: GRID * 2, marginTop: GRID * 2, flexWrap: 'wrap' }}>
                  <button type="button" style={styles.btnSecundario} onClick={() => setActiveTab('dados')}>
                    ← Voltar: Dados
                  </button>
                  <button type="button" style={styles.btnSecundario} onClick={() => setActiveTab('outros')}>
                    Próximo: Outros →
                  </button>
                </div>
              </div>
            )}

            {/* Aba: Outros */}
            {activeTab === 'outros' && (
              <div id="panel-outros" role="tabpanel" aria-labelledby="tab-outros">
                <div style={styles.card}>
                  <h3 style={styles.cardTitulo}>Notas internas</h3>
                  <p style={{ ...styles.ajuda, marginBottom: GRID * 2 }}>Anotações visíveis apenas para administradores. Use para observações sobre documentação, contratos ou acompanhamento.</p>
                  <div style={styles.campo}>
                    <label htmlFor="notes_internal" style={{ ...styles.label, ...styles.labelOpcional }}>
                      Notas (Admin)
                    </label>
                    <textarea
                      id="notes_internal"
                      value={form.notes_internal}
                      onChange={(e) => handleChange('notes_internal', e.target.value)}
                      style={styles.textarea}
                      disabled={saving}
                      placeholder="Ex.: Franqueador em fase de onboarding. Documentação em análise."
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: GRID * 2, marginTop: GRID * 2 }}>
                  <button type="button" style={styles.btnSecundario} onClick={() => setActiveTab('endereco')}>
                    ← Voltar: Endereço
                  </button>
                </div>
              </div>
            )}

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
