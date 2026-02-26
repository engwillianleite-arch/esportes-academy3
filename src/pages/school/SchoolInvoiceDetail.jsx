import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolInvoiceDetail, formatCurrency } from '../../api/schoolPortal'

const GRID = 8

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
)
const IconMoney = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
)
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)

const styles = {
  breadcrumb: {
    marginBottom: GRID * 2,
    fontSize: 14,
  },
  breadcrumbLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
  },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
  },
  actionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  btn: {
    padding: `${GRID}px ${GRID * 2}px`,
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: GRID * 2,
  },
  field: { marginBottom: GRID * 2 },
  fieldLabel: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.7, marginBottom: 2 },
  fieldValue: { fontSize: 14, color: 'var(--grafite-tecnico)', fontWeight: 500 },
  linkStudent: {
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
  },
  timeline: { listStyle: 'none', margin: 0, padding: 0 },
  timelineItem: {
    display: 'flex',
    gap: GRID * 2,
    paddingBottom: GRID * 3,
    borderLeft: '2px solid #eee',
    marginLeft: 7,
    paddingLeft: GRID * 3,
    position: 'relative',
  },
  timelineItemLast: { paddingBottom: 0 },
  timelineDot: {
    position: 'absolute',
    left: -6,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--azul-arena)',
  },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 14, fontWeight: 600, color: 'var(--grafite-tecnico)', marginBottom: 2 },
  timelineMeta: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.75, marginBottom: 4 },
  timelineDetails: { fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
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
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 15, fontWeight: 600, color: '#991B1B' },
  errorText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#991B1B', opacity: 0.9 },
  btnReload: {
    background: '#DC2626',
    color: '#fff',
    border: 'none',
    padding: `${GRID}px ${GRID * 2}px`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.9 },
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

function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoStr
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

function billingMethodLabel(m) {
  if (!m) return null
  const map = { pix: 'PIX', boleto: 'Boleto', transfer: 'Transferência', transferencia: 'Transferência' }
  return map[m.toLowerCase()] || m
}

function DetailSkeleton() {
  return (
    <>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <div style={{ ...styles.skeleton, width: 180 }} />
        </div>
        <div style={styles.fieldGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={styles.field}>
              <div style={{ ...styles.skeleton, width: 100, marginBottom: 4 }} />
              <div style={{ ...styles.skeleton, width: i % 2 ? '80%' : 120 }} />
            </div>
          ))}
        </div>
      </div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <div style={{ ...styles.skeleton, width: 160 }} />
        </div>
        <div style={{ ...styles.skeleton, height: 80, width: '100%' }} />
      </div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <div style={{ ...styles.skeleton, width: 100 }} />
        </div>
        <ul style={styles.timeline}>
          {[1, 2, 3].map((i) => (
            <li key={i} style={styles.timelineItem}>
              <div style={styles.timelineDot} />
              <div style={styles.timelineContent}>
                <div style={{ ...styles.skeleton, width: 200, marginBottom: 4 }} />
                <div style={{ ...styles.skeleton, width: 140, height: 14 }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default function SchoolInvoiceDetail() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const fetchInvoice = useCallback(() => {
    if (!invoiceId) return
    setError(null)
    setNotFound(false)
    setLoading(true)
    getSchoolInvoiceDetail(invoiceId)
      .then(setData)
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setNotFound(true)
        } else {
          setError(err?.message || 'Não foi possível carregar a mensalidade. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [invoiceId])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const schoolName = data?.school_name ?? ''
  const competenceLabel = data?.competence_month ? formatCompetence(data.competence_month) : '—'
  const canRegisterPayment =
    (data?.can_register_payment !== false && data?.status !== 'paid' && data?.status !== 'canceled') ?? false

  const showPaymentSuccess = location.state?.paymentRegistered === true

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      {showPaymentSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: GRID * 2,
            padding: GRID * 2,
            marginBottom: GRID * 3,
            background: '#D1FAE5',
            border: '1px solid #6EE7B7',
            borderRadius: 'var(--radius)',
            color: '#065F46',
            fontSize: 14,
            fontWeight: 500,
          }}
          role="status"
          aria-live="polite"
        >
          <span style={{ flexShrink: 0 }}>✓</span>
          Pagamento registrado com sucesso.
        </div>
      )}
      {/* Breadcrumb e título */}
      <div style={styles.breadcrumb}>
        <Link to="/school/finance/invoices" style={styles.breadcrumbLink} aria-label="Voltar para Mensalidades">
          <IconArrowLeft />
          Mensalidades
        </Link>
      </div>

      {notFound && (
        <div style={styles.emptyState} role="alert">
          <p style={styles.emptyText}>Mensalidade não encontrada ou você não tem acesso.</p>
          <Link to="/school/finance/invoices" style={{ ...styles.btn, ...styles.btnSecondary }}>
            Voltar para Mensalidades
          </Link>
        </div>
      )}

      {error && !notFound && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button type="button" style={styles.btnReload} onClick={fetchInvoice}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {loading && !notFound && !error && <DetailSkeleton />}

      {!loading && data && !notFound && (
        <>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>Mensalidade — {competenceLabel}</h1>
            <span style={statusBadgeStyle(data.status)}>{statusLabel(data.status)}</span>
          </div>

          <div style={styles.actionsRow}>
            {canRegisterPayment && (
              <Link
                to={`/school/finance/payments/new?invoiceId=${encodeURIComponent(data.id)}`}
                style={{ ...styles.btn, ...styles.btnPrimary }}
              >
                <IconMoney />
                Registrar pagamento
              </Link>
            )}
          </div>

          {/* Resumo da mensalidade */}
          <section style={styles.section} aria-labelledby="resumo-title">
            <h2 id="resumo-title" style={styles.sectionTitle}>Resumo da mensalidade</h2>
            <div style={styles.fieldGrid}>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Aluno</div>
                <div style={styles.fieldValue}>
                  <Link to={`/school/students/${data.student_id}`} style={styles.linkStudent}>
                    {data.student_name}
                  </Link>
                </div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Competência</div>
                <div style={styles.fieldValue}>{formatCompetence(data.competence_month)}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Vencimento</div>
                <div style={styles.fieldValue}>{formatDate(data.due_date)}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Valor original</div>
                <div style={styles.fieldValue}>{formatCurrency(data.amount_original)}</div>
              </div>
              {(data.discount != null && Number(data.discount) !== 0) || (data.fees != null && Number(data.fees) !== 0) ? (
                <>
                  {data.discount != null && Number(data.discount) !== 0 && (
                    <div style={styles.field}>
                      <div style={styles.fieldLabel}>Desconto</div>
                      <div style={styles.fieldValue}>- {formatCurrency(data.discount)}</div>
                    </div>
                  )}
                  {data.fees != null && Number(data.fees) !== 0 && (
                    <div style={styles.field}>
                      <div style={styles.fieldLabel}>Juros / ajustes</div>
                      <div style={styles.fieldValue}>{formatCurrency(data.fees)}</div>
                    </div>
                  )}
                </>
              ) : null}
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Valor final</div>
                <div style={{ ...styles.fieldValue, fontSize: 16, fontWeight: 700 }}>
                  {formatCurrency(data.amount_final)}
                </div>
              </div>
              {data.billing_method && (
                <div style={styles.field}>
                  <div style={styles.fieldLabel}>Forma de cobrança</div>
                  <div style={styles.fieldValue}>{billingMethodLabel(data.billing_method)}</div>
                </div>
              )}
              {data.notes && (
                <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                  <div style={styles.fieldLabel}>Observações</div>
                  <div style={styles.fieldValue}>{data.notes}</div>
                </div>
              )}
            </div>
          </section>

          {/* Status e pagamentos */}
          <section style={styles.section} aria-labelledby="status-title">
            <h2 id="status-title" style={styles.sectionTitle}>Status e pagamentos</h2>
            <p style={{ margin: '0 0 ' + GRID + 'px', fontSize: 14, color: 'var(--grafite-tecnico)' }}>
              Status atual: <span style={statusBadgeStyle(data.status)}>{statusLabel(data.status)}</span>
            </p>
            {data.status === 'paid' && data.payment && (
              <div style={styles.fieldGrid}>
                <div style={styles.field}>
                  <div style={styles.fieldLabel}>Data de pagamento</div>
                  <div style={styles.fieldValue}>{formatDate(data.payment.paid_at)}</div>
                </div>
                <div style={styles.field}>
                  <div style={styles.fieldLabel}>Valor pago</div>
                  <div style={styles.fieldValue}>{formatCurrency(data.payment.amount_paid)}</div>
                </div>
                <div style={styles.field}>
                  <div style={styles.fieldLabel}>Método de pagamento</div>
                  <div style={styles.fieldValue}>
                    {(data.payment.method || '').toUpperCase()}
                  </div>
                </div>
                {data.payment.reference && (
                  <div style={styles.field}>
                    <div style={styles.fieldLabel}>Referência / identificador</div>
                    <div style={styles.fieldValue}>{data.payment.reference}</div>
                  </div>
                )}
              </div>
            )}
            {(data.status === 'open' || data.status === 'overdue') && data.days_overdue != null && data.days_overdue > 0 && (
              <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', display: 'flex', alignItems: 'center', gap: GRID }}>
                <IconClock />
                {data.days_overdue} dia(s) em atraso
              </p>
            )}
          </section>

          {/* Histórico (timeline) */}
          <section style={styles.section} aria-labelledby="historico-title">
            <h2 id="historico-title" style={styles.sectionTitle}>Histórico</h2>
            {data.history && data.history.length > 0 ? (
              <ul style={styles.timeline}>
                {data.history.map((ev, i) => (
                  <li
                    key={ev.id || i}
                    style={{
                      ...styles.timelineItem,
                      ...(i === data.history.length - 1 ? styles.timelineItemLast : {}),
                    }}
                  >
                    <span style={styles.timelineDot} aria-hidden />
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineLabel}>{ev.label}</div>
                      <div style={styles.timelineMeta}>
                        {formatDateTime(ev.created_at)}
                        {ev.actor?.name && ` · ${ev.actor.name}`}
                      </div>
                      {ev.details && <div style={styles.timelineDetails}>{ev.details}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
                Nenhum evento registrado.
              </p>
            )}
          </section>
        </>
      )}
    </SchoolLayout>
  )
}
