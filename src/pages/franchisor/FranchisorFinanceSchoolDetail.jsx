import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorSchoolById,
  getFranchisorFinanceSchoolSummary,
  getFranchisorFinanceByBucket,
  getFranchisorFinanceSchoolByPeriod,
  formatCurrency,
} from '../../api/franchisorPortal'

const GRID = 8
const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

const PERIOD_OPTIONS = [
  { value: 'este_mes', label: 'Este mês' },
  { value: 'ultimos_30', label: 'Últimos 30 dias' },
  { value: 'personalizado', label: 'Personalizado' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'received', label: 'Recebido' },
  { value: 'open', label: 'Em aberto' },
  { value: 'overdue', label: 'Em atraso' },
]

const BUCKET_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: '1_7', label: '1–7' },
  { value: '8_30', label: '8–30' },
  { value: '31_60', label: '31–60' },
  { value: '61_plus', label: '61+' },
]

function getPeriodBounds(period, fromStr, toStr) {
  const now = new Date()
  const to = toStr ? new Date(toStr) : new Date(now)
  let from
  if (period === 'este_mes') {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (period === 'ultimos_30') {
    from = new Date(now)
    from.setDate(from.getDate() - 30)
  } else {
    from = fromStr ? new Date(fromStr) : new Date(now)
    from.setDate(from.getDate() - 30)
  }
  const fromValid = isNaN(from.getTime()) ? new Date(now) : from
  if (fromValid > to) fromValid.setTime(to.getTime() - 30 * 24 * 60 * 60 * 1000)
  const toValid = isNaN(to.getTime()) ? now : to
  return {
    from: fromValid.toISOString().slice(0, 10),
    to: toValid.toISOString().slice(0, 10),
  }
}

function getDefaultPeriod() {
  return getPeriodBounds('ultimos_30', '', '')
}

const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  section: { marginBottom: GRID * 4 },
  filtersCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 4,
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: GRID * 2,
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: GRID, minWidth: 140 },
  filterLabel: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  select: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    minWidth: 160,
  },
  input: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    minWidth: 140,
  },
  btnApply: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'var(--azul-arena)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  btnClear: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'var(--azul-arena)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: GRID * 3,
    marginBottom: GRID * 4,
  },
  kpiCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  kpiLabel: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9, marginBottom: GRID },
  kpiValue: { fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  skeleton: {
    height: 28,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  tableSectionTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  tableWrap: {
    overflowX: 'auto',
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    borderBottom: '2px solid var(--cinza-arquibancada)',
  },
  td: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderBottom: '1px solid #eee',
    color: 'var(--grafite-tecnico)',
  },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  emptyText: { margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
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
  deniedBox: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  deniedText: { margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  linksSection: {
    marginTop: GRID * 4,
    padding: GRID * 3,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  linksTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 14, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  linkItem: { marginBottom: GRID, fontSize: 14 },
  link: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
}

function SkeletonCards() {
  return (
    <div style={styles.kpiGrid}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={styles.kpiCard}>
          <div style={{ ...styles.skeleton, width: '60%', marginBottom: GRID }} />
          <div style={{ ...styles.skeleton, width: '80%', height: 32 }} />
        </div>
      ))}
    </div>
  )
}

function SkeletonTable({ rows = 4, cols = 3 }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} style={styles.th}><div style={{ ...styles.skeleton, width: '70%' }} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, i) => (
                <td key={i} style={styles.td}><div style={{ ...styles.skeleton, width: i === 0 ? '80%' : '50%' }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function FranchisorFinanceSchoolDetail() {
  const { school_id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const fromParam = searchParams.get('from') || ''
  const toParam = searchParams.get('to') || ''
  const periodParam = searchParams.get('period') || 'ultimos_30'
  const statusParam = searchParams.get('status') || ''
  const bucketParam = searchParams.get('bucket') || ''

  const defaultPeriod = useMemo(getDefaultPeriod, [])
  const { from, to } = useMemo(
    () => getPeriodBounds(periodParam, fromParam || defaultPeriod.from, toParam || defaultPeriod.to),
    [periodParam, fromParam, toParam, defaultPeriod.from, defaultPeriod.to]
  )

  // Persistir período na URL: se from/to ausentes, usar default (últimos 30 dias)
  useEffect(() => {
    if (!fromParam && !toParam && from && to) {
      setSearchParams(
        new URLSearchParams({ period: 'ultimos_30', from, to }),
        { replace: true }
      )
    }
  }, [fromParam, toParam, from, to, setSearchParams])

  const [school, setSchool] = useState(null)
  const [summary, setSummary] = useState(null)
  const [byBucket, setByBucket] = useState([])
  const [byPeriod, setByPeriod] = useState([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingBucket, setLoadingBucket] = useState(false)
  const [loadingPeriod, setLoadingPeriod] = useState(false)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [period, setPeriod] = useState(periodParam)
  const [fromInput, setFromInput] = useState(fromParam || from)
  const [toInput, setToInput] = useState(toParam || to)
  const [statusFilter, setStatusFilter] = useState(statusParam)
  const [bucketFilter, setBucketFilter] = useState(bucketParam)

  const financeUrl = useMemo(() => {
    const q = new URLSearchParams()
    q.set('from', from)
    q.set('to', to)
    return `/franchisor/finance?${q.toString()}`
  }, [from, to])

  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((me) => {
        if (!cancelled && !ALLOWED_ROLES.includes(me.user_role)) setPermissionDenied(true)
      })
      .catch(() => { if (!cancelled) setPermissionDenied(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=franchisor', { replace: true })
    }
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (permissionDenied || !school_id) return
    let cancelled = false
    getFranchisorSchoolById(school_id)
      .then((data) => { if (!cancelled) setSchool(data || null) })
      .catch(() => { if (!cancelled) setSchool(null) })
    return () => { cancelled = true }
  }, [school_id, permissionDenied])

  useEffect(() => {
    if (permissionDenied || !school_id) return
    let cancelled = false
    setError(null)
    setLoadingSummary(true)
    getFranchisorFinanceSchoolSummary(school_id, {
      from,
      to,
      status: statusParam || undefined,
      bucket: bucketParam || undefined,
    })
      .then((data) => { if (!cancelled) setSummary(data) })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Não foi possível carregar o financeiro da escola. Tente novamente.')
      })
      .finally(() => { if (!cancelled) setLoadingSummary(false) })
    return () => { cancelled = true }
  }, [permissionDenied, school_id, from, to, statusParam, bucketParam])

  useEffect(() => {
    if (permissionDenied || !school_id) return
    let cancelled = false
    setLoadingBucket(true)
    getFranchisorFinanceByBucket({ from, to, school_id })
      .then((data) => { if (!cancelled) setByBucket(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setByBucket([]) })
      .finally(() => { if (!cancelled) setLoadingBucket(false) })
    return () => { cancelled = true }
  }, [permissionDenied, school_id, from, to])

  useEffect(() => {
    if (permissionDenied || !school_id) return
    let cancelled = false
    setLoadingPeriod(true)
    getFranchisorFinanceSchoolByPeriod(school_id, { from, to, granularity: 'MONTH' })
      .then((data) => { if (!cancelled) setByPeriod(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setByPeriod([]) })
      .finally(() => { if (!cancelled) setLoadingPeriod(false) })
    return () => { cancelled = true }
  }, [permissionDenied, school_id, from, to])

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams)
    next.set('period', period)
    if (period === 'personalizado') {
      next.set('from', fromInput)
      next.set('to', toInput)
    } else {
      next.set('from', from)
      next.set('to', to)
    }
    if (statusFilter) next.set('status', statusFilter)
    else next.delete('status')
    if (bucketFilter) next.set('bucket', bucketFilter)
    else next.delete('bucket')
    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => {
    const { from: f, to: t } = getPeriodBounds('ultimos_30', '', '')
    setPeriod('ultimos_30')
    setFromInput(f)
    setToInput(t)
    setStatusFilter('')
    setBucketFilter('')
    setSearchParams(
      new URLSearchParams({ period: 'ultimos_30', from: f, to: t }),
      { replace: true }
    )
  }

  const breadcrumb = [
    { label: 'Financeiro', to: financeUrl },
    { label: school?.school_name || school_id || 'Escola' },
  ]

  const hasData = summary && (
    (summary.received_total != null && summary.received_total !== 0) ||
    (summary.open_total != null && summary.open_total !== 0) ||
    (summary.overdue_total != null && summary.overdue_total !== 0)
  )

  if (permissionDenied) return null

  return (
    <FranchisorLayout
      pageTitle="Financeiro da escola"
      breadcrumb={breadcrumb}
    >
      <div style={styles.header}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Financeiro da escola</h1>
            <p style={styles.subtitle}>{school?.school_name || school_id} • {from} a {to}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: GRID * 2 }}>
            <Link to={financeUrl} style={styles.btnSecondary}>
              <IconArrowLeft />
              Voltar
            </Link>
            <Link to={`/franchisor/schools/${school_id}`} style={styles.btnPrimary}>
              Abrir escola
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <p style={styles.errorText}>{error}</p>
            <button type="button" style={styles.btnReload} onClick={() => window.location.reload()}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <section style={styles.section} aria-label="Filtros do detalhe">
        <div style={styles.filtersCard}>
          <div style={styles.filtersRow}>
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Período</span>
              <select
                style={styles.select}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                aria-label="Período"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {period === 'personalizado' && (
              <>
                <div style={styles.filterGroup}>
                  <span style={styles.filterLabel}>De</span>
                  <input
                    type="date"
                    style={styles.input}
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    aria-label="Data inicial"
                  />
                </div>
                <div style={styles.filterGroup}>
                  <span style={styles.filterLabel}>Até</span>
                  <input
                    type="date"
                    style={styles.input}
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    aria-label="Data final"
                  />
                </div>
              </>
            )}
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Status</span>
              <select
                style={styles.select}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Status"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Faixa de atraso</span>
              <select
                style={styles.select}
                value={bucketFilter}
                onChange={(e) => setBucketFilter(e.target.value)}
                aria-label="Faixa de atraso"
              >
                {BUCKET_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ ...styles.filterGroup, flexDirection: 'row', alignItems: 'flex-end', gap: GRID }}>
              <button type="button" style={styles.btnApply} onClick={applyFilters}>
                Aplicar
              </button>
              <button type="button" style={styles.btnClear} onClick={clearFilters}>
                Limpar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section style={styles.section} aria-label="Indicadores">
        {loadingSummary ? (
          <SkeletonCards />
        ) : !hasData && !error ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Nenhum dado financeiro encontrado para este período.</p>
          </div>
        ) : (
          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Recebido</div>
              <div style={styles.kpiValue}>{summary?.received_total != null ? formatCurrency(summary.received_total) : '—'}</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Em aberto</div>
              <div style={styles.kpiValue}>{summary?.open_total != null ? formatCurrency(summary.open_total) : '—'}</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Em atraso</div>
              <div style={styles.kpiValue}>{summary?.overdue_total != null ? formatCurrency(summary.overdue_total) : '—'}</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Taxa de inadimplência</div>
              <div style={styles.kpiValue}>
                {summary?.delinquency_rate != null ? `${Number(summary.delinquency_rate).toFixed(1)}%` : '—'}
              </div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Maior atraso (dias)</div>
              <div style={styles.kpiValue}>{summary?.max_overdue_days != null ? summary.max_overdue_days : '—'}</div>
            </div>
          </div>
        )}
      </section>

      {/* Distribuição por faixa de atraso */}
      {byBucket.length > 0 && (
        <section style={styles.section} aria-label="Distribuição por faixa de atraso">
          <h2 style={styles.tableSectionTitle}>Distribuição por faixa de atraso</h2>
          {loadingBucket ? (
            <SkeletonTable rows={4} cols={3} />
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Faixa</th>
                    <th style={styles.th}>Valor</th>
                    <th style={styles.th}>Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {byBucket.map((row, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{row.bucket_label}</td>
                      <td style={styles.td}>{formatCurrency(row.overdue_total)}</td>
                      <td style={styles.td}>{row.overdue_count ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Evolução no período (opcional) */}
      {byPeriod.length > 0 && (
        <section style={styles.section} aria-label="Evolução no período">
          <h2 style={styles.tableSectionTitle}>Evolução no período</h2>
          {loadingPeriod ? (
            <SkeletonTable rows={3} cols={3} />
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Período</th>
                    <th style={styles.th}>Recebido</th>
                    <th style={styles.th}>Em atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {byPeriod.map((row, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{row.period_label}</td>
                      <td style={styles.td}>{formatCurrency(row.received_total)}</td>
                      <td style={styles.td}>{formatCurrency(row.overdue_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Links úteis */}
      <section style={styles.section} aria-label="Links úteis">
        <div style={styles.linksSection}>
          <h2 style={styles.linksTitle}>Links úteis</h2>
          <div style={styles.linkItem}>
            <Link to={financeUrl} style={styles.link}>Voltar para Financeiro consolidado</Link>
          </div>
          <div style={styles.linkItem}>
            <Link to={`/franchisor/schools/${school_id}`} style={styles.link}>Abrir detalhe da escola</Link>
          </div>
          <div style={styles.linkItem}>
            <Link to={`/franchisor/reports/${school_id}?from=${from}&to=${to}`} style={styles.link}>Ver relatórios</Link>
          </div>
        </div>
      </section>
    </FranchisorLayout>
  )
}
