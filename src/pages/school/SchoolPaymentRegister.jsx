import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getSchoolInvoiceDetail,
  createSchoolPayment,
  formatCurrency,
} from '../../api/schoolPortal'

const GRID = 8

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'card', label: 'Cartão' },
  { value: 'other', label: 'Outro' },
]

const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
)
const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
)

const styles = {
  breadcrumb: { marginBottom: GRID * 2, fontSize: 14 },
  breadcrumbLink: {
    display: 'inline-flex', alignItems: 'center', gap: GRID,
    color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none',
  },
  title: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  card: {
    background: 'var(--branco-luz)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)', padding: GRID * 3, marginBottom: GRID * 3,
  },
  cardTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  fieldGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: GRID * 2 },
  field: { marginBottom: GRID * 2 },
  fieldLabel: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.7, marginBottom: 4, display: 'block' },
  fieldValue: { fontSize: 14, color: 'var(--grafite-tecnico)', fontWeight: 500 },
  linkStudent: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  statusBadge: {
    display: 'inline-block', padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 500,
  },
  warningBox: {
    display: 'flex', alignItems: 'flex-start', gap: GRID * 2,
    padding: GRID * 3, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 'var(--radius)', marginBottom: GRID * 3,
  },
  warningIcon: { color: '#D97706', flexShrink: 0 },
  warningText: { margin: 0, fontSize: 14, color: '#92400E' },
  formSection: {
    background: 'var(--branco-luz)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)', padding: GRID * 3, marginBottom: GRID * 3,
  },
  input: {
    width: '100%', maxWidth: 320,
    padding: `${GRID}px ${GRID * 2}px`, fontSize: 14, border: '1px solid #ddd', borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)', outline: 'none',
  },
  select: {
    padding: `${GRID}px ${GRID * 2}px`, fontSize: 14, border: '1px solid #ddd', borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)', background: 'var(--branco-luz)', minWidth: 200,
  },
  textarea: {
    width: '100%', maxWidth: 400, minHeight: 80,
    padding: `${GRID}px ${GRID * 2}px`, fontSize: 14, border: '1px solid #ddd', borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)', outline: 'none', resize: 'vertical',
  },
  errorField: { fontSize: 12, color: '#DC2626', marginTop: 4 },
  actionsRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: GRID * 2, marginTop: GRID * 4 },
  btn: {
    padding: `${GRID}px ${GRID * 2}px`, fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 'var(--radius)',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: GRID,
  },
  btnPrimary: { background: 'var(--azul-arena)', color: '#fff' },
  btnSecondary: { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)', textDecoration: 'none' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  errorBox: {
    display: 'flex', alignItems: 'flex-start', gap: GRID * 2,
    padding: GRID * 3, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius)', marginBottom: GRID * 3,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorText: { margin: 0, fontSize: 14, color: '#991B1B' },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.2s ease-in-out infinite', borderRadius: 4,
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: GRID * 2,
  },
  modal: {
    background: 'var(--branco-luz)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: GRID * 4, maxWidth: 400,
  },
  modalTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  modalActions: { display: 'flex', gap: GRID * 2, marginTop: GRID * 3, justifyContent: 'flex-end' },
}

function formatCompetence(competenceMonth) {
  if (!competenceMonth) return '—'
  const [y, m] = competenceMonth.split('-')
  return `${MONTHS_PT[Number(m) - 1] || m}/${y}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function statusLabel(s) {
  const map = { open: 'Em aberto', paid: 'Pago', overdue: 'Em atraso', canceled: 'Cancelado' }
  return map[s] || s
}

function statusBadgeStyle(s) {
  const base = styles.statusBadge
  if (s === 'paid') return { ...base, background: '#D1FAE5', color: '#065F46' }
  if (s === 'overdue') return { ...base, background: '#FEE2E2', color: '#991B1B' }
  if (s === 'canceled') return { ...base, background: '#F3F4F6', color: '#6B7280' }
  return { ...base, background: '#FEF3C7', color: '#92400E' }
}

/** Retorna data no formato YYYY-MM-DD (hoje por padrão). */
function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function ContextSkeleton() {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Contexto da cobrança</div>
      <div style={styles.fieldGrid}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={styles.field}>
            <div style={{ ...styles.skeleton, width: 80, marginBottom: 4 }} />
            <div style={{ ...styles.skeleton, width: i % 2 ? '70%' : 120 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SchoolPaymentRegister() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const invoiceId = searchParams.get('invoiceId') || ''

  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const [paidAt, setPaidAt] = useState(todayISO())
  const [amountPaid, setAmountPaid] = useState('')
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const amountFinal = invoice?.amount_final != null ? Number(invoice.amount_final) : 0
  const isPaid = invoice?.status === 'paid'
  const backUrl = invoiceId ? `/school/finance/invoices/${invoiceId}` : '/school/finance/invoices'

  const fetchInvoice = useCallback(() => {
    if (!invoiceId) {
      setLoading(false)
      setNotFound(true)
      return
    }
    setError(null)
    setNotFound(false)
    setLoading(true)
    getSchoolInvoiceDetail(invoiceId)
      .then((data) => {
        setInvoice(data)
        setPaidAt(todayISO())
        setAmountPaid(String(data.amount_final ?? data.amount ?? 0))
        setMethod('')
        setNote('')
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else if (err.status === 404 || err.code === 'NOT_FOUND') setNotFound(true)
        else setError(err?.message || 'Não foi possível carregar a mensalidade.')
      })
      .finally(() => setLoading(false))
  }, [invoiceId])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=school', { replace: true })
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (!invoiceId && !loading) navigate('/school/finance/invoices', { replace: true })
  }, [invoiceId, loading, navigate])

  const validate = () => {
    const err = {}
    if (!paidAt?.trim()) err.paidAt = 'Informe a data do pagamento.'
    const amount = parseFloat(String(amountPaid).replace(',', '.'))
    if (amountPaid === '' || isNaN(amount) || amount <= 0) err.amountPaid = 'Informe o valor pago.'
    else if (Math.abs(amount - amountFinal) > 0.01) {
      err.amountPaid = 'No MVP, o pagamento deve ser do valor total da mensalidade.'
    }
    if (!method?.trim()) err.method = 'Selecione o método de pagamento.'
    setFieldErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    setSubmitError(null)
    if (!validate()) return
    setShowConfirm(true)
  }

  const handleConfirmPayment = () => {
    setSubmitError(null)
    setSubmitLoading(true)
    const amount = parseFloat(String(amountPaid).replace(',', '.'))
    createSchoolPayment({
      invoice_id: invoiceId,
      paid_at: paidAt,
      amount_paid: amount,
      method: method,
      note: note.trim() || undefined,
    })
      .then(() => {
        navigate(backUrl, { replace: true, state: { paymentRegistered: true } })
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          navigate('/acesso-negado?from=school', { replace: true })
          return
        }
        setSubmitError(err?.message || 'Não foi possível registrar o pagamento. Tente novamente.')
      })
      .finally(() => {
        setSubmitLoading(false)
        setShowConfirm(false)
      })
  }

  const schoolName = invoice?.school_name ?? ''

  if (permissionDenied) return null
  if (!invoiceId) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <div style={styles.breadcrumb}>
        <Link to={backUrl} style={styles.breadcrumbLink} aria-label="Voltar para Mensalidade">
          <IconArrowLeft />
          {invoiceId ? 'Mensalidade' : 'Mensalidades'}
        </Link>
      </div>

      <h1 style={styles.title}>Registrar pagamento</h1>

      {notFound && (
        <div style={styles.card}>
          <p style={{ margin: 0 }}>Mensalidade não informada ou não encontrada.</p>
          <Link to="/school/finance/invoices" style={{ ...styles.btn, ...styles.btnSecondary, marginTop: GRID * 2 }}>
            Voltar para Mensalidades
          </Link>
        </div>
      )}

      {error && !notFound && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {loading && !notFound && <ContextSkeleton />}

      {!loading && invoice && !notFound && (
        <>
          {/* Contexto da cobrança */}
          <section style={styles.card} aria-labelledby="context-title">
            <h2 id="context-title" style={styles.cardTitle}>Contexto da cobrança</h2>
            {isPaid && (
              <div style={styles.warningBox} role="alert">
                <span style={styles.warningIcon}><IconAlert /></span>
                <p style={styles.warningText}>Esta mensalidade já está paga.</p>
              </div>
            )}
            <div style={styles.fieldGrid}>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Aluno</span>
                <div style={styles.fieldValue}>
                  <Link to={`/school/students/${invoice.student_id}`} style={styles.linkStudent}>
                    {invoice.student_name}
                  </Link>
                </div>
              </div>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Competência</span>
                <div style={styles.fieldValue}>{formatCompetence(invoice.competence_month)}</div>
              </div>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Vencimento</span>
                <div style={styles.fieldValue}>{formatDate(invoice.due_date)}</div>
              </div>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Valor final</span>
                <div style={{ ...styles.fieldValue, fontSize: 16, fontWeight: 700 }}>{formatCurrency(invoice.amount_final)}</div>
              </div>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Status atual</span>
                <div style={styles.fieldValue}>
                  <span style={statusBadgeStyle(invoice.status)}>{statusLabel(invoice.status)}</span>
                </div>
              </div>
            </div>
            {isPaid && (
              <div style={{ marginTop: GRID * 2 }}>
                <Link to={backUrl} style={{ ...styles.btn, ...styles.btnSecondary }}>
                  Voltar para mensalidade
                </Link>
              </div>
            )}
          </section>

          {!isPaid && (
            <form onSubmit={handleSubmit} style={styles.formSection} aria-label="Formulário de pagamento">
              <h2 style={styles.cardTitle}>Dados do pagamento</h2>

              <div style={styles.field}>
                <label htmlFor="paid_at" style={styles.fieldLabel}>Data do pagamento *</label>
                <input
                  id="paid_at"
                  type="date"
                  style={styles.input}
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  aria-invalid={!!fieldErrors.paidAt}
                  aria-describedby={fieldErrors.paidAt ? 'err-paid_at' : undefined}
                />
                {fieldErrors.paidAt && <span id="err-paid_at" style={styles.errorField} role="alert">{fieldErrors.paidAt}</span>}
              </div>

              <div style={styles.field}>
                <label htmlFor="amount_paid" style={styles.fieldLabel}>Valor pago *</label>
                <input
                  id="amount_paid"
                  type="text"
                  inputMode="decimal"
                  style={styles.input}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={formatCurrency(amountFinal)}
                  aria-invalid={!!fieldErrors.amountPaid}
                  aria-describedby={fieldErrors.amountPaid ? 'err-amount_paid' : undefined}
                />
                {fieldErrors.amountPaid && <span id="err-amount_paid" style={styles.errorField} role="alert">{fieldErrors.amountPaid}</span>}
              </div>

              <div style={styles.field}>
                <label htmlFor="method" style={styles.fieldLabel}>Método de pagamento *</label>
                <select
                  id="method"
                  style={styles.select}
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  aria-invalid={!!fieldErrors.method}
                  aria-describedby={fieldErrors.method ? 'err-method' : undefined}
                >
                  <option value="">Selecione</option>
                  {PAYMENT_METHODS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {fieldErrors.method && <span id="err-method" style={styles.errorField} role="alert">{fieldErrors.method}</span>}
              </div>

              <div style={styles.field}>
                <label htmlFor="note" style={styles.fieldLabel}>Observação (opcional)</label>
                <textarea
                  id="note"
                  style={styles.textarea}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex.: Pagamento recebido na secretaria."
                  rows={3}
                />
              </div>

              {submitError && (
                <div style={styles.errorBox} role="alert">
                  <span style={styles.errorIcon}><IconAlert /></span>
                  <p style={styles.errorText}>{submitError}</p>
                </div>
              )}

              <div style={styles.actionsRow}>
                <button
                  type="submit"
                  style={{ ...styles.btn, ...styles.btnPrimary, ...(submitLoading ? styles.btnDisabled : {}) }}
                  disabled={submitLoading}
                  aria-busy={submitLoading}
                >
                  {submitLoading ? 'Salvando…' : 'Confirmar pagamento'}
                </button>
                <Link to={backUrl} style={{ ...styles.btn, ...styles.btnSecondary }}>
                  Cancelar
                </Link>
              </div>
            </form>
          )}
        </>
      )}

      {showConfirm && invoice && !isPaid && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div style={styles.modal}>
            <h2 id="confirm-title" style={styles.modalTitle}>
              Confirmar pagamento de {formatCurrency(amountPaid)} para a mensalidade {formatCompetence(invoice.competence_month)}?
            </h2>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnPrimary, ...(submitLoading ? styles.btnDisabled : {}) }}
                onClick={handleConfirmPayment}
                disabled={submitLoading}
              >
                {submitLoading ? 'Salvando…' : 'Confirmar'}
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => { setShowConfirm(false); setSubmitError(null); }}
                disabled={submitLoading}
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
