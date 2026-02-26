import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolFinanceSettings,
  updateSchoolFinanceSettings,
  generateSchoolInvoices,
  getSchoolFinanceSummary,
} from '../../api/schoolPortal'

const GRID = 8

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
    maxWidth: 320,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 15,
    border: '1px solid #ccc',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
  },
  inputError: { borderColor: '#DC2626' },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    background: '#ccc',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
  },
  toggleOn: { background: 'var(--azul-arena)' },
  toggleKnob: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  },
  toggleKnobOn: { transform: 'translateX(20px)' },
  toggleLabel: { fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' },
  subFields: { marginLeft: GRID * 2, marginTop: GRID * 2, paddingLeft: GRID * 2, borderLeft: '2px solid #eee' },
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
  btnPrimary: {
    background: 'var(--azul-arena)',
    color: '#fff',
  },
  btnSecondary: {
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #ccc',
  },
  btnDanger: {
    background: '#DC2626',
    color: '#fff',
  },
  skeleton: {
    height: 40,
    maxWidth: 320,
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

function parseCurrency(value) {
  if (value === '' || value == null) return null
  const s = String(value).replace(/\./g, '').replace(',', '.')
  const n = parseFloat(s)
  return Number.isNaN(n) ? null : n
}

function formatCurrencyInput(value) {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function SchoolFinanceSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  const [form, setForm] = useState({
    default_amount: '',
    default_discount: '',
    default_extra_fee: '',
    due_day: 10,
    generation_days_before_due: 5,
    grace_days: 0,
    late_fee_enabled: false,
    late_fee_type: 'percent',
    late_fee_value: '',
    daily_interest_enabled: false,
    daily_interest_percent: '',
    generation_enabled: false,
    generation_day_of_month: 1,
    apply_to_active_students_only: true,
    create_invoice_on_enrollment: true,
  })

  const [fieldErrors, setFieldErrors] = useState({})

  const loadSettings = useCallback(() => {
    setError('')
    setSuccess('')
    setLoading(true)
    Promise.all([getSchoolFinanceSettings(), getSchoolFinanceSummary()])
      .then(([settings, summary]) => {
        setSchoolName(summary?.school_name ?? settings?.school_name ?? '')
        if (settings) {
          setForm({
            default_amount: settings.default_amount != null ? formatCurrencyInput(settings.default_amount) : '',
            default_discount: settings.default_discount != null ? formatCurrencyInput(settings.default_discount) : '',
            default_extra_fee: settings.default_extra_fee != null ? formatCurrencyInput(settings.default_extra_fee) : '',
            due_day: settings.due_day ?? 10,
            generation_days_before_due: settings.generation_days_before_due ?? 5,
            grace_days: settings.grace_days ?? 0,
            late_fee_enabled: !!settings.late_fee_enabled,
            late_fee_type: settings.late_fee_type || 'percent',
            late_fee_value: settings.late_fee_value != null ? String(settings.late_fee_value) : '',
            daily_interest_enabled: !!settings.daily_interest_enabled,
            daily_interest_percent: settings.daily_interest_percent != null ? String(settings.daily_interest_percent) : '',
            generation_enabled: !!settings.generation_enabled,
            generation_day_of_month: settings.generation_day_of_month ?? 1,
            apply_to_active_students_only: settings.apply_to_active_students_only !== false,
            create_invoice_on_enrollment: settings.create_invoice_on_enrollment !== false,
          })
        }
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else setError(err?.message || 'Não foi possível carregar as configurações. Tente novamente.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=school', { replace: true })
  }, [permissionDenied, navigate])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: null }))
  }

  const validate = () => {
    const err = {}
    const amount = parseCurrency(form.default_amount)
    if (amount === null || amount <= 0) err.default_amount = 'Informe um valor válido (maior que zero).'
    const dueDay = parseInt(form.due_day, 10)
    if (Number.isNaN(dueDay) || dueDay < 1 || dueDay > 28) err.due_day = 'Informe um dia entre 1 e 28.'
    if (form.late_fee_enabled) {
      const feeVal = form.late_fee_type === 'percent' ? parseFloat(form.late_fee_value) : parseCurrency(form.late_fee_value)
      if (feeVal === null || feeVal === '' || (typeof feeVal === 'number' && feeVal < 0))
        err.late_fee_value = 'Informe um valor válido.'
    }
    if (form.daily_interest_enabled) {
      const juros = parseFloat(form.daily_interest_percent)
      if (Number.isNaN(juros) || juros < 0) err.daily_interest_percent = 'Informe um percentual não negativo.'
    }
    if (form.generation_enabled) {
      const genDay = parseInt(form.generation_day_of_month, 10)
      if (Number.isNaN(genDay) || genDay < 1 || genDay > 28) err.generation_day_of_month = 'Informe um dia entre 1 e 28.'
    }
    setFieldErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSuccess('')
    setError('')
    if (!validate()) return
    setSaving(true)
    const payload = {
      default_amount: parseCurrency(form.default_amount),
      due_day: Math.min(28, Math.max(1, parseInt(form.due_day, 10) || 10)),
      generation_enabled: form.generation_enabled,
      generation_days_before_due: form.generation_enabled ? (parseInt(form.generation_days_before_due, 10) || 0) : undefined,
      grace_days: parseInt(form.grace_days, 10) || 0,
      late_fee_enabled: form.late_fee_enabled,
      late_fee_type: form.late_fee_type,
      late_fee_value: form.late_fee_enabled
        ? (form.late_fee_type === 'percent' ? parseFloat(form.late_fee_value) : parseCurrency(form.late_fee_value))
        : undefined,
      daily_interest_enabled: form.daily_interest_enabled,
      daily_interest_percent: form.daily_interest_enabled ? parseFloat(form.daily_interest_percent) || 0 : undefined,
      generation_day_of_month: form.generation_enabled ? Math.min(28, Math.max(1, parseInt(form.generation_day_of_month, 10) || 1)) : undefined,
      apply_to_active_students_only: form.apply_to_active_students_only,
      create_invoice_on_enrollment: form.create_invoice_on_enrollment,
    }
    if (form.default_discount !== '') payload.default_discount = parseCurrency(form.default_discount)
    if (form.default_extra_fee !== '') payload.default_extra_fee = parseCurrency(form.default_extra_fee)

    updateSchoolFinanceSettings(payload)
      .then(() => {
        setSuccess('Configurações salvas com sucesso.')
        setError('')
      })
      .catch((err) => {
        setError(err?.message || 'Não foi possível salvar as configurações. Tente novamente.')
        setSuccess('')
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    navigate('/school/finance')
  }

  const handleGenerateClick = () => setShowGenerateModal(true)
  const handleGenerateConfirm = () => {
    setGenerating(true)
    setShowGenerateModal(false)
    generateSchoolInvoices({})
      .then((res) => {
        setSuccess(
          `Mensalidades geradas: ${res.generated_count ?? 0} criada(s), ${res.skipped_count ?? 0} ignorada(s).`
        )
      })
      .catch((err) => setError(err?.message || 'Não foi possível gerar as mensalidades. Tente novamente.'))
      .finally(() => setGenerating(false))
  }
  const handleGenerateCancel = () => setShowGenerateModal(false)

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Configurações de Mensalidade</h1>
        <p style={styles.subtitle}>Valores, vencimento e geração</p>
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

      <form onSubmit={handleSave}>
        {/* Valor padrão */}
        <section style={styles.section} aria-labelledby="sec-valor">
          <h2 id="sec-valor" style={styles.sectionTitle}>Valor padrão</h2>
          <div style={styles.field}>
            <label htmlFor="default_amount" style={styles.fieldLabel}>
              Valor padrão da mensalidade (R$) *
            </label>
            {loading ? (
              <div style={styles.skeleton} />
            ) : (
              <>
                <input
                  id="default_amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.default_amount}
                  onChange={(e) => updateField('default_amount', e.target.value)}
                  style={{ ...styles.input, ...(fieldErrors.default_amount ? styles.inputError : {}) }}
                  aria-invalid={!!fieldErrors.default_amount}
                  aria-describedby={fieldErrors.default_amount ? 'err_default_amount' : undefined}
                />
                {fieldErrors.default_amount && (
                  <div id="err_default_amount" style={styles.fieldError}>{fieldErrors.default_amount}</div>
                )}
              </>
            )}
          </div>
          <div style={styles.field}>
            <label htmlFor="default_discount" style={styles.fieldLabel}>
              Desconto padrão (R$)
            </label>
            {loading ? (
              <div style={{ ...styles.skeleton, maxWidth: 200 }} />
            ) : (
              <input
                id="default_discount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.default_discount}
                onChange={(e) => updateField('default_discount', e.target.value)}
                style={styles.input}
              />
            )}
          </div>
          <div style={styles.field}>
            <label htmlFor="default_extra_fee" style={styles.fieldLabel}>
              Taxa adicional padrão (R$)
            </label>
            {loading ? (
              <div style={{ ...styles.skeleton, maxWidth: 200 }} />
            ) : (
              <input
                id="default_extra_fee"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.default_extra_fee}
                onChange={(e) => updateField('default_extra_fee', e.target.value)}
                style={styles.input}
              />
            )}
          </div>
        </section>

        {/* Vencimento */}
        <section style={styles.section} aria-labelledby="sec-vencimento">
          <h2 id="sec-vencimento" style={styles.sectionTitle}>Vencimento</h2>
          <div style={styles.field}>
            <label htmlFor="due_day" style={styles.fieldLabel}>
              Dia de vencimento (1 a 28)
            </label>
            {loading ? (
              <div style={{ ...styles.skeleton, maxWidth: 100 }} />
            ) : (
              <>
                <input
                  id="due_day"
                  type="number"
                  min={1}
                  max={28}
                  value={form.due_day}
                  onChange={(e) => updateField('due_day', e.target.value)}
                  style={{ ...styles.input, maxWidth: 100, ...(fieldErrors.due_day ? styles.inputError : {}) }}
                  aria-invalid={!!fieldErrors.due_day}
                />
                {fieldErrors.due_day && <div style={styles.fieldError}>{fieldErrors.due_day}</div>}
              </>
            )}
          </div>
          <div style={styles.field}>
            <label htmlFor="generation_days_before_due" style={styles.fieldLabel}>
              Antecedência de geração (dias)
            </label>
            {loading ? (
              <div style={{ ...styles.skeleton, maxWidth: 100 }} />
            ) : (
              <input
                id="generation_days_before_due"
                type="number"
                min={0}
                value={form.generation_days_before_due}
                onChange={(e) => updateField('generation_days_before_due', e.target.value)}
                style={{ ...styles.input, maxWidth: 100 }}
              />
            )}
          </div>
          <div style={styles.field}>
            <label htmlFor="grace_days" style={styles.fieldLabel}>
              Tolerância (dias)
            </label>
            {loading ? (
              <div style={{ ...styles.skeleton, maxWidth: 100 }} />
            ) : (
              <input
                id="grace_days"
                type="number"
                min={0}
                value={form.grace_days}
                onChange={(e) => updateField('grace_days', e.target.value)}
                style={{ ...styles.input, maxWidth: 100 }}
              />
            )}
          </div>
        </section>

        {/* Multa e juros */}
        <section style={styles.section} aria-labelledby="sec-multa">
          <h2 id="sec-multa" style={styles.sectionTitle}>Multa e juros</h2>
          <div style={styles.toggleRow}>
            <button
              type="button"
              role="switch"
              aria-checked={form.late_fee_enabled}
              style={{
                ...styles.toggle,
                ...(form.late_fee_enabled ? styles.toggleOn : {}),
              }}
              onClick={() => updateField('late_fee_enabled', !form.late_fee_enabled)}
            >
              <span style={{ ...styles.toggleKnob, ...(form.late_fee_enabled ? styles.toggleKnobOn : {}) }} />
            </button>
            <span style={styles.toggleLabel}>Aplicar multa por atraso</span>
          </div>
          {form.late_fee_enabled && (
            <div style={styles.subFields}>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Tipo</label>
                <select
                  value={form.late_fee_type}
                  onChange={(e) => updateField('late_fee_type', e.target.value)}
                  style={{ ...styles.input, maxWidth: 200 }}
                >
                  <option value="percent">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>
                  {form.late_fee_type === 'percent' ? 'Multa (%)' : 'Multa (R$)'}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.late_fee_value}
                  onChange={(e) => updateField('late_fee_value', e.target.value)}
                  style={{ ...styles.input, maxWidth: 120, ...(fieldErrors.late_fee_value ? styles.inputError : {}) }}
                />
                {fieldErrors.late_fee_value && <div style={styles.fieldError}>{fieldErrors.late_fee_value}</div>}
              </div>
            </div>
          )}
          <div style={styles.toggleRow}>
            <button
              type="button"
              role="switch"
              aria-checked={form.daily_interest_enabled}
              style={{
                ...styles.toggle,
                ...(form.daily_interest_enabled ? styles.toggleOn : {}),
              }}
              onClick={() => updateField('daily_interest_enabled', !form.daily_interest_enabled)}
            >
              <span style={{ ...styles.toggleKnob, ...(form.daily_interest_enabled ? styles.toggleKnobOn : {}) }} />
            </button>
            <span style={styles.toggleLabel}>Aplicar juros ao dia</span>
          </div>
          {form.daily_interest_enabled && (
            <div style={styles.subFields}>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Juros ao dia (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.daily_interest_percent}
                  onChange={(e) => updateField('daily_interest_percent', e.target.value)}
                  style={{ ...styles.input, maxWidth: 120, ...(fieldErrors.daily_interest_percent ? styles.inputError : {}) }}
                />
                {fieldErrors.daily_interest_percent && (
                  <div style={styles.fieldError}>{fieldErrors.daily_interest_percent}</div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Geração automática */}
        <section style={styles.section} aria-labelledby="sec-geracao">
          <h2 id="sec-geracao" style={styles.sectionTitle}>Geração automática</h2>
          <div style={styles.toggleRow}>
            <button
              type="button"
              role="switch"
              aria-checked={form.generation_enabled}
              style={{
                ...styles.toggle,
                ...(form.generation_enabled ? styles.toggleOn : {}),
              }}
              onClick={() => updateField('generation_enabled', !form.generation_enabled)}
            >
              <span style={{ ...styles.toggleKnob, ...(form.generation_enabled ? styles.toggleKnobOn : {}) }} />
            </button>
            <span style={styles.toggleLabel}>Gerar mensalidades automaticamente</span>
          </div>
          {form.generation_enabled && (
            <div style={styles.subFields}>
              <div style={styles.field}>
                <label htmlFor="generation_day_of_month" style={styles.fieldLabel}>
                  Dia do mês para gerar (1 a 28)
                </label>
                <input
                  id="generation_day_of_month"
                  type="number"
                  min={1}
                  max={28}
                  value={form.generation_day_of_month}
                  onChange={(e) => updateField('generation_day_of_month', e.target.value)}
                  style={{ ...styles.input, maxWidth: 100, ...(fieldErrors.generation_day_of_month ? styles.inputError : {}) }}
                />
                {fieldErrors.generation_day_of_month && (
                  <div style={styles.fieldError}>{fieldErrors.generation_day_of_month}</div>
                )}
              </div>
              <div style={styles.toggleRow}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.apply_to_active_students_only}
                  style={{
                    ...styles.toggle,
                    ...(form.apply_to_active_students_only ? styles.toggleOn : {}),
                  }}
                  onClick={() => updateField('apply_to_active_students_only', !form.apply_to_active_students_only)}
                >
                  <span
                    style={{
                      ...styles.toggleKnob,
                      ...(form.apply_to_active_students_only ? styles.toggleKnobOn : {}),
                    }}
                  />
                </button>
                <span style={styles.toggleLabel}>Gerar para alunos ativos apenas</span>
              </div>
              <div style={styles.toggleRow}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.create_invoice_on_enrollment}
                  style={{
                    ...styles.toggle,
                    ...(form.create_invoice_on_enrollment ? styles.toggleOn : {}),
                  }}
                  onClick={() => updateField('create_invoice_on_enrollment', !form.create_invoice_on_enrollment)}
                >
                  <span
                    style={{
                      ...styles.toggleKnob,
                      ...(form.create_invoice_on_enrollment ? styles.toggleKnobOn : {}),
                    }}
                  />
                </button>
                <span style={styles.toggleLabel}>Criar mensalidade na matrícula/entrada do aluno</span>
              </div>
            </div>
          )}
          <div style={{ marginTop: GRID * 2 }}>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleGenerateClick}
              disabled={loading || generating}
            >
              {generating ? 'Gerando…' : 'Gerar mensalidades agora'}
            </button>
          </div>
        </section>

        {/* Rodapé de ações */}
        <div style={styles.footer}>
          <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }} disabled={loading || saving}>
            {saving ? 'Salvando…' : 'Salvar configurações'}
          </button>
          <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handleCancel} disabled={saving}>
            Cancelar
          </button>
        </div>
      </form>

      {/* Modal confirmação geração */}
      {showGenerateModal && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-gen-title">
          <div style={styles.modal}>
            <h3 id="modal-gen-title" style={styles.modalTitle}>Gerar mensalidades</h3>
            <p style={styles.modalText}>
              Gerar mensalidades para a competência atual?
            </p>
            <div style={styles.modalActions}>
              <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handleGenerateCancel}>
                Não
              </button>
              <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleGenerateConfirm}>
                Sim, gerar
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
