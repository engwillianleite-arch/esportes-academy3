import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorSchools,
  getFranchisorReportsSummary,
  getFranchisorReportsBySchool,
  formatCurrency,
} from '../../api/franchisorPortal'

const GRID = 8
const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

const PERIOD_OPTIONS = [
  { value: 'este_mes', label: 'Este mês' },
  { value: 'ultimos_30', label: 'Últimos 30 dias' },
  { value: 'ultimos_90', label: 'Últimos 90 dias' },
  { value: 'personalizado', label: 'Personalizado (de/até)' },
]

const SCHOOL_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ativa', label: 'Ativa' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'suspensa', label: 'Suspensa' },
]

const PAGE_SIZES = [10, 25, 50]

function getPeriodBounds(period, fromStr, toStr) {
  const now = new Date()
  const to = toStr ? new Date(toStr) : new Date(now)
  let from
  if (period === 'este_mes') {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (period === 'ultimos_30') {
    from = new Date(now)
    from.setDate(from.getDate() - 30)
  } else if (period === 'ultimos_90') {
    from = new Date(now)
    from.setDate(from.getDate() - 90)
  } else {
    from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1)
  }
  const fromValid = isNaN(from.getTime()) ? new Date(now.getFullYear(), now.getMonth(), 1) : from
  const toValid = isNaN(to.getTime()) ? now : to
  return {
    from: fromValid.toISOString().slice(0, 10),
    to: toValid.toISOString().slice(0, 10),
  }
}

const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
)
const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
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
    marginBottom: GRID * 2,
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: GRID, minWidth: 160 },
  filterLabel: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  select: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    minWidth: 180,
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
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
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
    verticalAlign: 'middle',
  },
  linkAbrir: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  badge: {
    display: 'inline-block',
    padding: `${GRID / 2}px ${GRID * 1.5}px`,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  statusAtivo: { background: 'rgba(76, 203, 138, 0.2)', color: 'var(--verde-patrocinio)' },
  statusPendente: { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' },
  statusSuspenso: { background: 'rgba(58, 58, 60, 0.12)', color: 'var(--grafite-tecnico)', opacity: 0.9 },
  actionsCell: { whiteSpace: 'nowrap' },
  btnAction: {
    marginRight: GRID,
    fontSize: 13,
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginTop: GRID * 3,
    padding: `${GRID * 2} 0`,
  },
  paginationInfo: { fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  paginationControls: { display: 'flex', alignItems: 'center', gap: GRID },
  btnPage: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 36,
    padding: `0 ${GRID}`,
    border: '1px solid #E5E5E7',
    borderRadius: 8,
    background: 'var(--branco-luz)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
  },
  btnPageDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  pageSizeSelect: { marginLeft: GRID * 2 },
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
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const style =
    s === 'ativo'
      ? { ...styles.badge, ...styles.statusAtivo }
      : s === 'pendente'
        ? { ...styles.badge, ...styles.statusPendente }
        : { ...styles.badge, ...styles.statusSuspenso }
  const label = s === 'ativo' ? 'Ativa' : s === 'pendente' ? 'Pendente' : s === 'suspenso' ? 'Suspensa' : status || '—'
  return <span style={style}>{label}</span>
}

function SkeletonCards() {
  return (
    <div style={styles.kpiGrid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={styles.kpiCard}>
          <div style={{ ...styles.skeleton, width: '60%', marginBottom: GRID }} />
          <div style={{ ...styles.skeleton, width: '80%', height: 32 }} />
        </div>
      ))}
    </div>
  )
}

function SkeletonTable({ cols = 6 }) {
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
          {[1, 2, 3, 4, 5].map((r) => (
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

export default function FranchisorReports() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const periodParam = searchParams.get('period') || 'este_mes'
  const fromParam = searchParams.get('from') || ''
  const toParam = searchParams.get('to') || ''
  const schoolIdParam = searchParams.get('school_id') || ''
  const schoolStatusParam = searchParams.get('school_status') || ''
  const pageParam = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
  const pageSizeParam = Math.min(50, Math.max(10, parseInt(searchParams.get('page_size'), 10) || 10))

  const { from, to } = useMemo(
    () => getPeriodBounds(periodParam, fromParam, toParam),
    [periodParam, fromParam, toParam]
  )

  const [schools, setSchools] = useState([])
  const [summary, setSummary] = useState(null)
  const [bySchool, setBySchool] = useState({ items: [], total: 0, page: 1, page_size: 10 })
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingTable, setLoadingTable] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [period, setPeriod] = useState(periodParam)
  const [fromInput, setFromInput] = useState(fromParam || from)
  const [toInput, setToInput] = useState(toParam || to)
  const [schoolFilter, setSchoolFilter] = useState(schoolIdParam)
  const [schoolStatusFilter, setSchoolStatusFilter] = useState(schoolStatusParam)

  // Sincronizar filtro Escola com school_id da URL (ex.: quando usuário troca no School Switcher)
  useEffect(() => {
    setSchoolFilter(schoolIdParam)
  }, [schoolIdParam])

  const appliedSchoolId = schoolIdParam || null
  const appliedSchoolStatus = schoolStatusParam || ''

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
    if (permissionDenied) return
    let cancelled = false
    getFranchisorSchools()
      .then((res) => { if (!cancelled) setSchools(res.items || []) })
      .catch(() => { if (!cancelled) setSchools([]) })
    return () => { cancelled = true }
  }, [permissionDenied])

  useEffect(() => {
    if (permissionDenied) return
    let cancelled = false
    setError(null)
    setLoadingSummary(true)
    getFranchisorReportsSummary({ from, to, school_id: appliedSchoolId || undefined })
      .then((data) => { if (!cancelled) setSummary(data) })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Não foi possível carregar os relatórios. Tente novamente.') })
      .finally(() => { if (!cancelled) setLoadingSummary(false) })
    return () => { cancelled = true }
  }, [permissionDenied, from, to, appliedSchoolId])

  useEffect(() => {
    if (permissionDenied) return
    let cancelled = false
    setLoadingTable(true)
    const statusForApi = appliedSchoolStatus === 'ativa' ? 'ativo' : appliedSchoolStatus === 'suspensa' ? 'suspenso' : appliedSchoolStatus
    getFranchisorReportsBySchool({
      from,
      to,
      school_status: statusForApi || undefined,
      page: pageParam,
      page_size: pageSizeParam,
      sort: summary?.received_total != null ? 'received_total_desc' : 'students_count_desc',
    })
      .then((res) => {
        if (!cancelled) setBySchool({ items: res.items || [], total: res.total ?? 0, page: res.page ?? 1, page_size: res.page_size ?? 10 })
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Não foi possível carregar os relatórios. Tente novamente.')
      })
      .finally(() => { if (!cancelled) setLoadingTable(false) })
    return () => { cancelled = true }
  }, [permissionDenied, from, to, appliedSchoolStatus, pageParam, pageSizeParam])

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams)
    next.set('period', period)
    if (period === 'personalizado') {
      next.set('from', fromInput)
      next.set('to', toInput)
    } else {
      next.delete('from')
      next.delete('to')
    }
    if (schoolFilter) next.set('school_id', schoolFilter)
    else next.delete('school_id')
    if (schoolStatusFilter) next.set('school_status', schoolStatusFilter)
    else next.delete('school_status')
    next.set('page', '1')
    next.set('page_size', String(pageSizeParam))
    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => {
    const { from: f, to: t } = getPeriodBounds('este_mes', '', '')
    setPeriod('este_mes')
    setFromInput(f)
    setToInput(t)
    setSchoolFilter('')
    setSchoolStatusFilter('')
    setSearchParams(
      new URLSearchParams({ period: 'este_mes', page: '1', page_size: String(pageSizeParam) }),
      { replace: true }
    )
  }

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(Math.max(1, p)))
    setSearchParams(next, { replace: true })
  }

  const setPageSize = (size) => {
    const next = new URLSearchParams(searchParams)
    next.set('page_size', String(size))
    next.set('page', '1')
    setSearchParams(next, { replace: true })
  }

  const buildReportUrl = (schoolId) => {
    const q = new URLSearchParams(searchParams)
    if (schoolId) q.set('school_id', schoolId)
    else q.delete('school_id')
    q.set('from', from)
    q.set('to', to)
    return `/franchisor/reports?${q.toString()}`
  }

  const drilldownReportUrl = (schoolId) => {
    const q = new URLSearchParams()
    q.set('from', from)
    q.set('to', to)
    return `/franchisor/reports/${schoolId}?${q.toString()}`
  }

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Relatórios' },
  ]

  const exportNewUrl = (() => {
    const q = new URLSearchParams()
    q.set('type', 'CONSOLIDATED_REPORT')
    q.set('from', from)
    q.set('to', to)
    if (appliedSchoolId) q.set('school_id', appliedSchoolId)
    return `/franchisor/exports/new?${q.toString()}`
  })()

  const hasFinance = summary?.received_total != null || summary?.overdue_total != null
  const hasAttendances = summary?.attendances_count != null

  if (permissionDenied) return null

  return (
    <FranchisorLayout
      pageTitle="Relatórios consolidados"
      breadcrumb={breadcrumb}
    >
      <div style={styles.header}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: GRID * 2 }}>
          <div>
            <h1 style={styles.title}>Relatórios consolidados</h1>
            <p style={styles.subtitle}>Comparação por escola e por período</p>
          </div>
          <Link to={exportNewUrl} style={styles.btnApply}>
            Exportar
          </Link>
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
      <section style={styles.section} aria-label="Filtros">
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
              <span style={styles.filterLabel}>Escola</span>
              <select
                style={styles.select}
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                aria-label="Escola"
              >
                <option value="">Todas</option>
                {schools.map((s) => (
                  <option key={s.school_id} value={s.school_id}>{s.school_name}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Status da escola</span>
              <select
                style={styles.select}
                value={schoolStatusFilter}
                onChange={(e) => setSchoolStatusFilter(e.target.value)}
                aria-label="Status da escola"
              >
                {SCHOOL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ ...styles.filterGroup, flexDirection: 'row', alignItems: 'flex-end', gap: GRID }}>
              <button type="button" style={styles.btnApply} onClick={applyFilters}>
                Aplicar filtros
              </button>
              <button type="button" style={styles.btnClear} onClick={clearFilters}>
                Limpar filtros
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section style={styles.section} aria-label="Indicadores do período">
        {loadingSummary ? (
          <SkeletonCards />
        ) : (
          <div style={styles.kpiGrid}>
            {summary?.students_count != null && (
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Alunos</div>
                <div style={styles.kpiValue}>{summary.students_count}</div>
              </div>
            )}
            {summary?.teams_count != null && (
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Turmas</div>
                <div style={styles.kpiValue}>{summary.teams_count}</div>
              </div>
            )}
            {summary?.received_total != null && (
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Recebido</div>
                <div style={styles.kpiValue}>{formatCurrency(summary.received_total)}</div>
              </div>
            )}
            {summary?.overdue_total != null && (
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Em atraso</div>
                <div style={styles.kpiValue}>{formatCurrency(summary.overdue_total)}</div>
              </div>
            )}
            {summary?.attendances_count != null && (
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Presenças registradas</div>
                <div style={styles.kpiValue}>{summary.attendances_count}</div>
              </div>
            )}
            {!loadingSummary && summary && [summary.students_count, summary.teams_count, summary.received_total, summary.overdue_total, summary.attendances_count].every((v) => v == null) && (
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>—</div>
                <div style={{ ...styles.kpiValue, fontSize: 14, opacity: 0.8 }}>Nenhum indicador disponível para o período.</div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Tabela por escola */}
      <section style={styles.section} aria-label="Comparativo por escola">
        <h2 style={styles.tableSectionTitle}>Comparativo por escola</h2>
        {loadingTable ? (
          <SkeletonTable cols={hasFinance ? 7 : 5} />
        ) : bySchool.items.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Nenhum dado encontrado para o período selecionado.</p>
          </div>
        ) : (
          <>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Escola</th>
                    <th style={styles.th}>Status da escola</th>
                    {(hasFinance || bySchool.items.some((i) => i.students_count != null)) && <th style={styles.th}>Alunos</th>}
                    {bySchool.items.some((i) => i.teams_count != null) && <th style={styles.th}>Turmas</th>}
                    {hasFinance && <th style={styles.th}>Recebido</th>}
                    {hasFinance && <th style={styles.th}>Em atraso</th>}
                    {hasAttendances && <th style={styles.th}>Presenças</th>}
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {bySchool.items.map((row) => (
                    <tr key={row.school_id}>
                      <td style={styles.td}>{row.school_name}</td>
                      <td style={styles.td}><StatusBadge status={row.school_status} /></td>
                      {(hasFinance || bySchool.items.some((i) => i.students_count != null)) && (
                        <td style={styles.td}>{row.students_count != null ? row.students_count : '—'}</td>
                      )}
                      {bySchool.items.some((i) => i.teams_count != null) && (
                        <td style={styles.td}>{row.teams_count != null ? row.teams_count : '—'}</td>
                      )}
                      {hasFinance && (
                        <td style={styles.td}>{row.received_total != null ? formatCurrency(row.received_total) : '—'}</td>
                      )}
                      {hasFinance && (
                        <td style={styles.td}>{row.overdue_total != null ? formatCurrency(row.overdue_total) : '—'}</td>
                      )}
                      {hasAttendances && (
                        <td style={styles.td}>{row.attendances_count != null ? row.attendances_count : '—'}</td>
                      )}
                      <td style={{ ...styles.td, ...styles.actionsCell }}>
                        <Link to={`/franchisor/schools/${row.school_id}`} style={styles.linkAbrir}>
                          Abrir escola
                        </Link>
                        <Link to={drilldownReportUrl(row.school_id)} style={styles.linkAbrir}>
                          Filtrar relatório desta escola
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bySchool.total > pageSizeParam && (
              <div style={styles.footer}>
                <span style={styles.paginationInfo}>
                  {bySchool.items.length} de {bySchool.total} escolas
                </span>
                <div style={styles.paginationControls}>
                  <button
                    type="button"
                    style={{ ...styles.btnPage, ...(pageParam <= 1 ? styles.btnPageDisabled : {}) }}
                    onClick={() => setPage(pageParam - 1)}
                    disabled={pageParam <= 1}
                    aria-label="Página anterior"
                  >
                    <IconChevronLeft />
                  </button>
                  <span style={{ padding: `0 ${GRID}`, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                    Página {pageParam}
                  </span>
                  <button
                    type="button"
                    style={{ ...styles.btnPage, ...(pageParam * pageSizeParam >= bySchool.total ? styles.btnPageDisabled : {}) }}
                    onClick={() => setPage(pageParam + 1)}
                    disabled={pageParam * pageSizeParam >= bySchool.total}
                    aria-label="Próxima página"
                  >
                    <IconChevronRight />
                  </button>
                  <label style={{ marginLeft: GRID * 2, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                    Por página:
                    <select
                      style={{ ...styles.select, marginLeft: GRID, padding: `${GRID}px ${GRID * 1.5}px`, minWidth: 70 }}
                      value={pageSizeParam}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      aria-label="Itens por página"
                    >
                      {PAGE_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </FranchisorLayout>
  )
}
