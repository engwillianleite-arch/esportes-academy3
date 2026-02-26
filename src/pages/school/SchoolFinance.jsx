import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolFinanceSummary, formatCurrency } from '../../api/schoolPortal'

const GRID = 8

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const IconPrev = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
)
const IconNext = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
)
const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
)
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
)
const IconMoney = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
)
const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
)
const IconClock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)
const IconOverdue = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  monthSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 4,
    flexWrap: 'wrap',
  },
  monthBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    border: '1px solid #ddd',
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    color: 'var(--grafite-tecnico)',
  },
  monthLabel: { fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)', minWidth: 160 },
  section: { marginBottom: GRID * 4 },
  sectionTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: GRID * 3,
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cardLink: { display: 'block', textDecoration: 'none', color: 'inherit' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: GRID * 2 },
  cardTitulo: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  cardIcon: { color: 'var(--azul-arena)', opacity: 0.9 },
  kpiValor: { fontSize: 26, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  skeleton: {
    height: 28,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  atalhosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: GRID * 2,
  },
  atalhoLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: GRID * 2,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    textDecoration: 'none',
  },
  listCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${GRID}px 0`,
    borderBottom: '1px solid #eee',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  listItemLast: { borderBottom: 'none' },
  statusBadge: (status) => ({
    fontSize: 12,
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: 6,
    background: status === 'paid' ? '#D1FAE5' : status === 'overdue' ? '#FEE2E2' : '#FEF3C7',
    color: status === 'paid' ? '#065F46' : status === 'overdue' ? '#991B1B' : '#92400E',
  }),
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 3,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 4,
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
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${GRID}px 0`,
    borderBottom: '1px solid #eee',
    fontSize: 14,
  },
  alertItemLast: { borderBottom: 'none' },
  linkModule: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  verTodas: { marginTop: GRID * 2, fontSize: 14 },
  verTodasLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
}

function getMonthYearFromParam(monthStr) {
  const [y, m] = (monthStr || '').split('-').map(Number)
  const now = new Date()
  return { year: y || now.getFullYear(), month: m || now.getMonth() + 1 }
}

function toMonthParam(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function formatMonthLabel(year, month) {
  const name = MONTHS_PT[month - 1] || ''
  return `${name}/${year}`
}

function KpiCard({ title, value, icon: Icon, href, loading }) {
  const content = (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitulo}>{title}</span>
        {Icon && <span style={styles.cardIcon}><Icon /></span>}
      </div>
      {loading ? (
        <div style={{ ...styles.skeleton, width: '60%' }} />
      ) : (
        <div style={styles.kpiValor}>{value}</div>
      )}
    </div>
  )
  if (href && !loading) {
    return <Link to={href} style={styles.cardLink} className="btn-hover">{content}</Link>
  }
  return content
}

function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ ...styles.skeleton, width: 100, height: 14 }} />
      </div>
      <div style={{ ...styles.skeleton, width: '70%', height: 32, marginTop: GRID }} />
    </div>
  )
}

function formatDueDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function statusLabel(s) {
  if (s === 'paid') return 'Pago'
  if (s === 'overdue') return 'Atrasado'
  return 'Em aberto'
}

// Permissão para registrar pagamento: MVP pode mostrar sempre; backend pode retornar can_register_payment.
const CAN_REGISTER_PAYMENT = true

export default function SchoolFinance() {
  const navigate = useNavigate()
  const now = new Date()
  const [monthParam, setMonthParam] = useState(() => toMonthParam(now.getFullYear(), now.getMonth() + 1))
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const fetchSummary = useCallback(() => {
    setError(null)
    setLoading(true)
    getSchoolFinanceSummary(monthParam)
      .then(setSummary)
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setError(err?.message || 'Não foi possível carregar o financeiro. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [monthParam])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const { year, month } = getMonthYearFromParam(monthParam)
  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
  const prevParam = toMonthParam(prevMonth.year, prevMonth.month)
  const nextParam = toMonthParam(nextMonth.year, nextMonth.month)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const goPrev = () => setMonthParam(prevParam)
  const goNext = () => setMonthParam(nextParam)

  const schoolName = summary?.school_name ?? ''
  const hasAnyKpi =
    summary?.total_expected != null ||
    summary?.total_received != null ||
    summary?.total_open != null ||
    summary?.total_overdue != null
  const upcoming_due = summary?.upcoming_due || []
  const alerts = summary?.alerts || []
  const showUpcoming = upcoming_due.length > 0
  const showAlerts = alerts.length > 0

  const baseInvoicesUrl = `/school/finance/invoices?month=${monthParam}`
  const overdueUrl = `/school/finance/overdue?month=${monthParam}`

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Financeiro</h1>
        <p style={styles.subtitle}>Resumo das mensalidades do mês</p>
      </header>

      {/* Seletor de competência */}
      <div style={styles.monthSelector} aria-label="Competência">
        <button
          type="button"
          style={styles.monthBtn}
          onClick={goPrev}
          aria-label="Mês anterior"
        >
          <IconPrev />
        </button>
        <span style={styles.monthLabel}>{formatMonthLabel(year, month)}</span>
        <button
          type="button"
          style={styles.monthBtn}
          onClick={goNext}
          aria-label="Próximo mês"
        >
          <IconNext />
        </button>
      </div>

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button type="button" style={styles.btnReload} onClick={fetchSummary}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!error && (
        <>
          {/* KPIs do mês */}
          <section style={styles.section} aria-label="Indicadores do mês">
            <div style={styles.kpiGrid} className="admin-kpi-grid">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : !hasAnyKpi ? (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>Sem dados financeiros para este mês ainda.</p>
                  <Link to="/school/finance/invoices" style={styles.linkModule}>
                    Ver mensalidades
                  </Link>
                </div>
              ) : (
                <>
                  {summary?.total_expected != null && (
                    <KpiCard
                      title="Previsto no mês"
                      value={formatCurrency(summary.total_expected)}
                      icon={IconMoney}
                      href={`${baseInvoicesUrl}&status=all`}
                      loading={false}
                    />
                  )}
                  {summary?.total_received != null && (
                    <KpiCard
                      title="Recebido"
                      value={formatCurrency(summary.total_received)}
                      icon={IconCheck}
                      href={`${baseInvoicesUrl}&status=paid`}
                      loading={false}
                    />
                  )}
                  {(summary?.total_open != null || summary?.total_open_count != null) && (
                    <KpiCard
                      title="Em aberto"
                      value={
                        summary.total_open != null && summary.total_open_count != null
                          ? `${summary.total_open_count} (${formatCurrency(summary.total_open)})`
                          : summary.total_open_count != null
                            ? String(summary.total_open_count)
                            : formatCurrency(summary.total_open)
                      }
                      icon={IconClock}
                      href={`${baseInvoicesUrl}&status=open`}
                      loading={false}
                    />
                  )}
                  {(summary?.total_overdue != null || summary?.total_overdue_count != null) && (
                    <KpiCard
                      title="Em atraso"
                      value={
                        summary.total_overdue != null && summary.total_overdue_count != null
                          ? `${summary.total_overdue_count} (${formatCurrency(summary.total_overdue)})`
                          : summary.total_overdue_count != null
                            ? String(summary.total_overdue_count)
                            : formatCurrency(summary.total_overdue)
                      }
                      icon={IconOverdue}
                      href={overdueUrl}
                      loading={false}
                    />
                  )}
                </>
              )}
            </div>
          </section>

          {/* Atalhos rápidos */}
          <section style={styles.section} aria-label="Atalhos rápidos">
            <h2 style={styles.sectionTitle}>Atalhos rápidos</h2>
            <div style={styles.atalhosGrid}>
              <Link to={baseInvoicesUrl} style={styles.atalhoLink} className="btn-hover">
                Mensalidades
                <IconArrowRight />
              </Link>
              <Link to={overdueUrl} style={styles.atalhoLink} className="btn-hover">
                Inadimplência
                <IconArrowRight />
              </Link>
              <Link to="/school/finance/settings" style={styles.atalhoLink} className="btn-hover">
                Configurações
                <IconArrowRight />
              </Link>
              {CAN_REGISTER_PAYMENT && (
                <Link to="/school/finance/payments/new" style={styles.atalhoLink} className="btn-hover">
                  Registrar pagamento
                  <IconArrowRight />
                </Link>
              )}
            </div>
          </section>

          {/* Vencimentos próximos (opcional MVP) */}
          {!loading && showUpcoming && (
            <section style={styles.section} aria-label="Vencimentos próximos">
              <h2 style={styles.sectionTitle}>Vencimentos próximos</h2>
              <div style={styles.listCard}>
                {upcoming_due.slice(0, 5).map((item, i) => (
                  <div
                    key={item.invoice_id}
                    style={{
                      ...styles.listItem,
                      ...(i === Math.min(4, upcoming_due.length - 1) ? styles.listItemLast : {}),
                    }}
                  >
                    <span>{item.student_name}</span>
                    <span>{formatDueDate(item.due_date)}</span>
                    <span>{formatCurrency(item.amount)}</span>
                    <span style={styles.statusBadge(item.status)}>{statusLabel(item.status)}</span>
                    <Link to={`/school/finance/invoices/${item.invoice_id}`} style={styles.linkModule}>
                      Ver detalhe
                    </Link>
                  </div>
                ))}
                <div style={styles.verTodas}>
                  <Link to={baseInvoicesUrl} style={styles.verTodasLink}>
                    Ver mensalidades
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Alertas do mês (opcional MVP) */}
          {!loading && showAlerts && (
            <section style={styles.section} aria-label="Alertas do mês">
              <h2 style={styles.sectionTitle}>Alertas do mês</h2>
              <div style={styles.listCard}>
                {alerts.map((a, i) => (
                  <div
                    key={a.type + i}
                    style={{
                      ...styles.alertItem,
                      ...(i === alerts.length - 1 ? styles.alertItemLast : {}),
                    }}
                  >
                    <span>{a.label}: {a.count}</span>
                    <Link
                      to={a.link_filter === 'overdue' ? overdueUrl : baseInvoicesUrl}
                      style={styles.linkModule}
                    >
                      Ver lista
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </SchoolLayout>
  )
}
