import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getPlan, createPlan, updatePlan } from '../../api/plans'

const GRID = 8

const STATUS_OPCOES = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
]

const PERIODICIDADE_OPCOES = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' },
]

const MOEDA_OPCOES = [{ value: 'BRL', label: 'BRL' }]

function getInitialForm() {
  return {
    name: '',
    description: '',
    status: 'ativo',
    billing_cycle: 'mensal',
    price: '', // em reais para o input
    price_currency: 'BRL',
    schools_limit: '',
    notes_internal: '',
  }
}

/**
 * Valida formulário. Preço no form está em reais (string/number).
 */
function validateForm(values) {
  const errors = {}
  if (!(values.name || '').trim()) errors.name = 'Obrigatório'
  if (!(values.status || '').trim()) errors.status = 'Obrigatório'
  if (!(values.billing_cycle || '').trim()) errors.billing_cycle = 'Obrigatório'
  if (!(values.price_currency || '').trim()) errors.price_currency = 'Obrigatório'

  const priceNum = values.price === '' || values.price == null ? NaN : Number(values.price)
  if (values.price !== '' && values.price != null) {
    if (Number.isNaN(priceNum)) errors.price = 'Valor inválido'
    else if (priceNum < 0) errors.price = 'O preço não pode ser negativo'
    else {
      const decimals = (String(values.price).split('.')[1] || '').length
      if (decimals > 2) errors.price = 'Use no máximo 2 casas decimais'
    }
  } else {
    errors.price = 'Obrigatório'
  }

  if (values.schools_limit !== '' && values.schools_limit != null) {
    const n = Number(values.schools_limit)
    if (Number.isNaN(n) || n < 0 || !Number.isInteger(n)) {
      errors.schools_limit = 'Deve ser um número inteiro não negativo'
    }
  }

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
  labelOpcional: { opacity: 0.75, fontWeight: 400 },
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
  linkAssinaturas: {
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
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={styles.skeletonLine} />
        ))}
      </div>
      <div style={styles.secao}>
        <div style={{ ...styles.skeletonLine, width: 180, height: 18, marginBottom: GRID * 2 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={styles.skeletonLine} />
        ))}
      </div>
      <div style={styles.secao}>
        <div style={{ ...styles.skeletonLine, width: 220, height: 18, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeletonLine, height: 100 }} />
      </div>
    </div>
  )
}

export default function CriarEditarPlano() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isNew = !planId || planId === 'new'

  const listUrl = '/admin/plans' + (location.search || '')

  const [form, setForm] = useState(getInitialForm)
  const [initialForm, setInitialForm] = useState(null)
  const [planName, setPlanName] = useState(null) // para título "Editar plano: {Nome}"
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [errorGeral, setErrorGeral] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [modalDescartar, setModalDescartar] = useState(false)

  const errors = validateForm(form)
  const isValid = Object.keys(errors).length === 0
  const canSave = !saving && isValid
  const hasChanges = initialForm && JSON.stringify(form) !== JSON.stringify(initialForm)

  const fetchPlan = useCallback(async () => {
    if (!planId || isNew) return
    setLoading(true)
    setErrorGeral(null)
    try {
      const data = await getPlan(planId)
      const priceReais = data.price_amount != null ? (Number(data.price_amount) / 100).toFixed(2) : ''
      const initial = {
        name: data.name || '',
        description: data.description ?? '',
        status: data.status || 'ativo',
        billing_cycle: data.billing_cycle || 'mensal',
        price: priceReais,
        price_currency: data.price_currency || 'BRL',
        schools_limit: data.schools_limit != null && data.schools_limit !== '' ? String(data.schools_limit) : '',
        notes_internal: data.notes_internal ?? '',
      }
      setForm(initial)
      setInitialForm(initial)
      setPlanName(data.name || '')
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else if (err.status === 404) setErrorGeral('Plano não encontrado.')
      else setErrorGeral(err.message || 'Não foi possível carregar o plano.')
    } finally {
      setLoading(false)
    }
  }, [planId, isNew])

  useEffect(() => {
    if (isNew) {
      setInitialForm(getInitialForm())
      setPlanName(null)
      setLoading(false)
    } else {
      fetchPlan()
    }
  }, [isNew, fetchPlan])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrorGeral(null)
  }

  const handleCancel = () => {
    if (hasChanges) {
      setModalDescartar(true)
      return
    }
    navigate(listUrl)
  }

  const confirmDiscard = () => {
    setModalDescartar(false)
    navigate(listUrl)
  }

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    const priceNum = Number(form.price)
    const price_amount = Number.isNaN(priceNum) ? 0 : Math.round(priceNum * 100)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      billing_cycle: form.billing_cycle,
      price_amount,
      price_currency: form.price_currency,
      schools_limit: form.schools_limit === '' ? undefined : (parseInt(form.schools_limit, 10) || undefined),
      notes_internal: form.notes_internal.trim() || undefined,
    }
    if (Object.keys(errors).length > 0) {
      setErrorGeral('Não foi possível salvar. Revise os campos.')
      return
    }
    setErrorGeral(null)
    setSaving(true)
    try {
      if (isNew) {
        await createPlan(payload)
      } else {
        await updatePlan(planId, payload)
      }
      navigate(listUrl, { state: { toast: 'Plano salvo com sucesso!' }, replace: true })
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
        return
      }
      if (err.status === 400 || (err.body && typeof err.body === 'object')) {
        setErrorGeral('Não foi possível salvar. Revise os campos.')
        if (err.body && typeof err.body === 'object') {
          setForm((prev) => ({ ...prev, ...err.body }))
        }
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

  const pageTitle = isNew ? 'Novo plano' : (planName ? `Editar plano: ${planName}` : 'Editar plano')
  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Planos', to: '/admin/plans' },
    { label: isNew ? 'Novo plano' : 'Editar plano' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle={pageTitle}>
      {loading ? (
        <SkeletonForm />
      ) : (
        <form onSubmit={handleSubmit} style={styles.cardGrande}>
          <div style={styles.cabecalho}>
            <h2 style={styles.tituloPagina}>{isNew ? 'Novo plano' : `Editar plano: ${form.name || planName || '…'}`}</h2>
            <div style={styles.cabecalhoAcoes}>
              <button
                type="submit"
                style={styles.btnPrimario}
                className="btn-hover"
                disabled={!canSave}
                aria-busy={saving}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button type="button" style={styles.btnSecundario} onClick={handleCancel} disabled={saving}>
                Cancelar
              </button>
            </div>
          </div>

          {errorGeral && (
            <div style={styles.erroGeral} role="alert">
              {errorGeral}
            </div>
          )}

          {/* Seção A — Identidade do plano */}
          <section style={styles.secao} aria-labelledby="sec-identidade">
            <h3 id="sec-identidade" style={styles.secaoTitulo}>
              Identidade do plano
            </h3>
            <div style={styles.campo}>
              <label htmlFor="plan-name" style={styles.label}>
                Nome do plano *
              </label>
              <input
                id="plan-name"
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={{ ...styles.input, ...(errors.name ? styles.inputErro : {}) }}
                placeholder="Ex.: Plano Básico"
                disabled={saving}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'plan-name-err' : undefined}
              />
              {errors.name && (
                <span id="plan-name-err" style={styles.erroCampo} role="alert">
                  {errors.name}
                </span>
              )}
            </div>
            <div style={styles.campo}>
              <label htmlFor="plan-description" style={{ ...styles.label, ...styles.labelOpcional }}>
                Descrição (opcional)
              </label>
              <textarea
                id="plan-description"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                style={styles.textarea}
                placeholder="Texto curto sobre o plano"
                disabled={saving}
                rows={3}
              />
            </div>
            <div style={styles.campo}>
              <label htmlFor="plan-status" style={styles.label}>
                Status *
              </label>
              <select
                id="plan-status"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                style={{ ...styles.select, ...(errors.status ? styles.inputErro : {}) }}
                disabled={saving}
                aria-required="true"
                aria-invalid={!!errors.status}
              >
                {STATUS_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.status && <span style={styles.erroCampo} role="alert">{errors.status}</span>}
            </div>
          </section>

          {/* Seção B — Cobrança */}
          <section style={styles.secao} aria-labelledby="sec-cobranca">
            <h3 id="sec-cobranca" style={styles.secaoTitulo}>
              Cobrança
            </h3>
            <div style={styles.campo}>
              <label htmlFor="plan-billing" style={styles.label}>
                Periodicidade *
              </label>
              <select
                id="plan-billing"
                value={form.billing_cycle}
                onChange={(e) => handleChange('billing_cycle', e.target.value)}
                style={{ ...styles.select, ...(errors.billing_cycle ? styles.inputErro : {}) }}
                disabled={saving}
                aria-required="true"
              >
                {PERIODICIDADE_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.billing_cycle && <span style={styles.erroCampo} role="alert">{errors.billing_cycle}</span>}
            </div>
            <div style={styles.campo}>
              <label htmlFor="plan-price" style={styles.label}>
                Preço *
              </label>
              <input
                id="plan-price"
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                style={{ ...styles.input, ...(errors.price ? styles.inputErro : {}), maxWidth: 200 }}
                placeholder="0,00"
                disabled={saving}
                aria-required="true"
                aria-invalid={!!errors.price}
              />
              {errors.price && (
                <span style={styles.erroCampo} role="alert">
                  {errors.price}
                </span>
              )}
            </div>
            <div style={styles.campo}>
              <label htmlFor="plan-currency" style={styles.label}>
                Moeda *
              </label>
              <select
                id="plan-currency"
                value={form.price_currency}
                onChange={(e) => handleChange('price_currency', e.target.value)}
                style={{ ...styles.select, ...(errors.price_currency ? styles.inputErro : {}) }}
                disabled={saving}
                aria-required="true"
              >
                {MOEDA_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.price_currency && (
                <span style={styles.erroCampo} role="alert">{errors.price_currency}</span>
              )}
            </div>
            <div style={styles.campo}>
              <label htmlFor="plan-schools-limit" style={{ ...styles.label, ...styles.labelOpcional }}>
                Limite de escolas (opcional)
              </label>
              <input
                id="plan-schools-limit"
                type="number"
                min={0}
                step={1}
                value={form.schools_limit}
                onChange={(e) => handleChange('schools_limit', e.target.value)}
                style={{ ...styles.input, ...(errors.schools_limit ? styles.inputErro : {}), maxWidth: 160 }}
                placeholder="Ilimitado"
                disabled={saving}
              />
              <p style={styles.ajuda}>Deixe em branco para ilimitado.</p>
              {errors.schools_limit && (
                <span style={styles.erroCampo} role="alert">{errors.schools_limit}</span>
              )}
            </div>
          </section>

          {/* Seção C — Observações internas */}
          <section style={styles.secao} aria-labelledby="sec-notas">
            <h3 id="sec-notas" style={styles.secaoTitulo}>
              Observações internas
            </h3>
            <div style={styles.campo}>
              <label htmlFor="plan-notes" style={{ ...styles.label, ...styles.labelOpcional }}>
                Notas internas (Admin)
              </label>
              <textarea
                id="plan-notes"
                value={form.notes_internal}
                onChange={(e) => handleChange('notes_internal', e.target.value)}
                style={styles.textarea}
                placeholder="Visível apenas para Admin."
                disabled={saving}
                rows={3}
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
              disabled={!canSave}
              aria-busy={saving}
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" style={styles.btnSecundario} onClick={handleCancel} disabled={saving}>
              Cancelar
            </button>
            {!isNew && planId && (
              <Link to={`/admin/subscriptions?plan_id=${planId}`} style={styles.linkAssinaturas}>
                Ver assinaturas deste plano
              </Link>
            )}
          </div>
        </form>
      )}

      {/* Modal: alterações não salvas */}
      {modalDescartar && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-discard-title">
          <div style={styles.modal}>
            <h3 id="modal-discard-title" style={styles.modalTitulo}>
              Alterações não salvas
            </h3>
            <p style={styles.modalTexto}>Você tem alterações não salvas. Deseja descartar?</p>
            <div style={styles.modalBotoes}>
              <button type="button" style={styles.btnSecundario} onClick={() => setModalDescartar(false)}>
                Voltar
              </button>
              <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={confirmDiscard}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
