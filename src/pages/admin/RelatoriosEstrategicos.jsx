import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import {
  getStrategicSummary,
  getTopFranchisors,
  getTopSchools,
  getBySchoolStatus,
  formatCurrency,
  TOP_FRANCHISORS_METRICS,
  TOP_SCHOOLS_METRICS,
} from '../../api/strategicReports'
import { listFranqueadores, listEscolas } from '../../api/franqueadores'

const GRID = 8
const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_30', label: 'Últimos 30 dias' },
  { value: 'last_90', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Personalizado' },
]
const SCHOOL_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativa' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'suspenso', label: 'Suspensa' },
]

function getDefaultFromTo(period, fromParam, toParam) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  let from, to
  if (period === 'this_month') {
    from = new Date(today.getFullYear(), today.getMonth(), 1)
    to = new Date(today)
  } else if (period === 'last_30') {
    to = new Date(today)
    from = new Date(today)
    from.setDate(from.getDate() - 30)
  } else if (period === 'last_90') {
    to = new Date(today)
    from = new Date(today)
    from.setDate(from.getDate() - 90)
  } else {
    from = fromParam ? new Date(fromParam) : new Date(today.getFullYear(), today.getMonth(), 1)
    to = toParam ? new Date(toParam) : new Date(today)
  }
  const fmt = (d) => (d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '')
  return { from: fmt(from), to: fmt(to) }
}

function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={{ height: 14, width: '60%', background: 'var(--cinza-arquibancada)', borderRadius: 4, marginBottom: GRID }} />
      <div style={{ height: 24, width: '80%', background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
    </div>
  )
}

function SkeletonRow({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={styles.td}>
          <span style={{ display: 'inline-block', height: 16, width: i === 0 ? 120 : 80, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  )
}

export default function RelatoriosEstrategicos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const periodFromUrl = searchParams.get('period') || 'this_month'
  const fromUrl = searchParams.get('from') || ''
  const toUrl = searchParams.get('to') || ''
  const franchisorIdUrl = searchParams.get('franchisor_id') || ''
  const schoolIdUrl = searchParams.get('school_id') || ''
  const schoolStatusUrl = searchParams.get('school_status') || 'todos'
  const metricFranchisorsUrl = searchParams.get('metric_franchisors') || 'schools_active'
  const metricSchoolsUrl = searchParams.get('metric_schools') || 'students'
  const pageFUrl = Math.max(1, parseInt(searchParams.get('page_f') || '1', 10))
  const pageSUrl = Math.max(1, parseInt(searchParams.get('page_s') || '1', 10))
  const pageSizeUrl = Math.min(50, Math.max(5, parseInt(searchParams.get('page_size') || '10', 10)) || 10)

  const { from: defaultFrom, to: defaultTo } = getDefaultFromTo(periodFromUrl, fromUrl, toUrl)
  const [period, setPeriod] = useState(periodFromUrl)
  const [from, setFrom] = useState(fromUrl || defaultFrom)
  const [to, setTo] = useState(toUrl || defaultTo)
  const [franchisorId, setFranchisorId] = useState(franchisorIdUrl)
  const [schoolId, setSchoolId] = useState(schoolIdUrl)
  const [schoolStatus, setSchoolStatus] = useState(schoolStatusUrl)
  const [metricFranchisors, setMetricFranchisors] = useState(metricFranchisorsUrl)
  const [metricSchools, setMetricSchools] = useState(metricSchoolsUrl)
  const [pageF, setPageF] = useState(pageFUrl)
  const [pageS, setPageS] = useState(pageSUrl)
  const [pageSize, setPageSize] = useState(pageSizeUrl)

  const [summary, setSummary] = useState(null)
  const [topFranchisors, setTopFranchisors] = useState(null)
  const [topSchools, setTopSchools] = useState(null)
  const [bySchoolStatus, setBySchoolStatus] = useState(null)
  const [franqueadores, setFranqueadores] = useState([])
  const [escolas, setEscolas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const { from: queryFrom, to: queryTo } = getDefaultFromTo(period, from, to)

  useEffect(() => {
    let cancelled = false
    listFranqueadores({ page: 1, page_size: 500 })
      .then((res) => { if (!cancelled) setFranqueadores(res.data || []) })
      .catch(() => { if (!cancelled) setFranqueadores([]) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const params = { page: 1, page_size: 500 }
    if (franchisorId) params.franchisor_id = franchisorId
    listEscolas(params)
      .then((res) => { if (!cancelled) setEscolas(res.data || []) })
      .catch(() => { if (!cancelled) setEscolas([]) })
    return () => { cancelled = true }
  }, [franchisorId])

  useEffect(() => {
    if (franchisorId && schoolId) {
      const pertence = escolas.some((e) => String(e.id) === String(schoolId))
      if (!pertence) setSchoolId('')
    }
  }, [franchisorId, schoolId, escolas])

  const applyFiltersToUrl = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('period', period)
      if (queryFrom) next.set('from', queryFrom)
      else next.delete('from')
      if (queryTo) next.set('to', queryTo)
      else next.delete('to')
      if (franchisorId) next.set('franchisor_id', franchisorId)
      else next.delete('franchisor_id')
      if (schoolId) next.set('school_id', schoolId)
      else next.delete('school_id')
      next.set('school_status', schoolStatus)
      next.set('metric_franchisors', metricFranchisors)
      next.set('metric_schools', metricSchools)
      next.set('page_f', String(pageF))
      next.set('page_s', String(pageS))
      next.set('page_size', String(pageSize))
      return next
    })
  }, [period, queryFrom, queryTo, franchisorId, schoolId, schoolStatus, metricFranchisors, metricSchools, pageF, pageS, pageSize, setSearchParams])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const summaryParams = { from: queryFrom, to: queryTo }
      if (franchisorId) summaryParams.franchisor_id = franchisorId
      if (schoolId) summaryParams.school_id = schoolId
      if (schoolStatus !== 'todos') summaryParams.school_status = schoolStatus

      const [summaryRes, topFRes, topSRes, byStatusRes] = await Promise.all([
        getStrategicSummary(summaryParams),
        getTopFranchisors({
          from: queryFrom,
          to: queryTo,
          metric: metricFranchisors,
          franchisor_id: franchisorId || undefined,
          school_status: schoolStatus !== 'todos' ? schoolStatus : undefined,
          page: pageF,
          page_size: pageSize,
        }),
        getTopSchools({
          from: queryFrom,
          to: queryTo,
          metric: metricSchools,
          franchisor_id: franchisorId || undefined,
          school_status: schoolStatus !== 'todos' ? schoolStatus : undefined,
          page: pageS,
          page_size: pageSize,
        }),
        getBySchoolStatus({ from: queryFrom, to: queryTo, franchisor_id: franchisorId || undefined }),
      ])
      setSummary(summaryRes)
      setTopFranchisors(topFRes)
      setTopSchools(topSRes)
      setBySchoolStatus(byStatusRes)
    } catch (err) {
      const isForbidden = err.status === 403 || (err.message && String(err.message).toLowerCase().includes('permissão'))
      if (isForbidden) setPermissionDenied(true)
      else setError(err.message || 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [queryFrom, queryTo, franchisorId, schoolId, schoolStatus, metricFranchisors, metricSchools, pageF, pageS, pageSize])

  useEffect(() => {
    applyFiltersToUrl()
  }, [applyFiltersToUrl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const aplicarFiltros = () => {
    setPageF(1)
    setPageS(1)
  }

  const limparFiltros = () => {
    setPeriod('this_month')
    const { from: f, to: t } = getDefaultFromTo('this_month', '', '')
    setFrom(f)
    setTo(t)
    setFranchisorId('')
    setSchoolId('')
    setSchoolStatus('todos')
    setMetricFranchisors('schools_active')
    setMetricSchools('students')
    setPageF(1)
    setPageS(1)
    setPageSize(10)
  }

  const temFiltros = franchisorId || schoolId || schoolStatus !== 'todos' || period === 'custom'

  const buildEscolasUrl = (statusFilter) => {
    const q = new URLSearchParams()
    if (statusFilter && statusFilter !== 'todos') q.set('status', statusFilter)
    if (franchisorId) q.set('franchisor_id', franchisorId)
    return `/admin/escolas?${q.toString()}`
  }

  const buildFranqueadoresUrl = () => {
    const q = new URLSearchParams()
    q.set('status', 'ativo')
    return `/admin/franqueadores?${q.toString()}`
  }

  const buildSubscriptionsUrl = () => {
    const q = new URLSearchParams()
    q.set('status', 'ativa')
    if (franchisorId) q.set('franchisor_id', franchisorId)
    if (schoolId) q.set('school_id', schoolId)
    return `/admin/subscriptions?${q.toString()}`
  }

  const buildFinanceGlobalUrl = () => {
    const q = new URLSearchParams()
    if (queryFrom) q.set('from', queryFrom)
    if (queryTo) q.set('to', queryTo)
    return `/admin/finance/global?${q.toString()}`
  }

  const buildDelinquencyUrl = () => {
    const q = new URLSearchParams()
    if (queryFrom) q.set('from', queryFrom)
    if (queryTo) q.set('to', queryTo)
    return `/admin/finance/delinquency?${q.toString()}`
  }

  const formatMetricValue = (metric, value) => {
    if (value == null) return '—'
    if (metric === 'received_total' || metric === 'overdue_total') return formatCurrency(value)
    return Number(value).toLocaleString('pt-BR')
  }

  const statusLabel = (s) => (s === 'ativo' ? 'Ativa' : s === 'pendente' ? 'Pendente' : s === 'suspenso' ? 'Suspensa' : s)

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Relatórios Estratégicos' },
  ]

  const hasFinanceData = summary && (summary.received_total != null || summary.overdue_total != null)
  const isEmpty = !loading && summary && summary.schools_active_count === 0 && summary.schools_pending_count === 0 && summary.franchisors_active_count === 0 && summary.subscriptions_active_count === 0 && !hasFinanceData

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Relatórios Estratégicos">
      <div style={styles.wrapper}>
        {/* Cabeçalho */}
        <div style={styles.cabecalho}>
          <div>
            <h2 style={styles.titulo}>Relatórios Estratégicos</h2>
            <p style={styles.subtitulo}>KPIs globais da plataforma</p>
            <p style={styles.aviso}>KPIs consolidados por período selecionado.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              to={`/admin/exports/new?type=kpis_summary&period=${period}&from=${queryFrom}&to=${queryTo}${franchisorId ? `&franchisor_id=${franchisorId}` : ''}${schoolId ? `&school_id=${schoolId}` : ''}${schoolStatus !== 'todos' ? `&school_status=${schoolStatus}` : ''}`}
              style={styles.btnSecundario}
              className="btn-hover"
            >
              Exportar
            </Link>
            <button
              type="button"
              style={styles.btnPrimario}
              className="btn-hover"
              onClick={() => fetchData()}
              disabled={loading}
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* Filtros globais */}
        <div style={styles.filtrosCard}>
          <div style={styles.filtros}>
            <label style={styles.label}>
              Período
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value)
                  const { from: f, to: t } = getDefaultFromTo(e.target.value, from, to)
                  setFrom(f)
                  setTo(t)
                }}
                style={styles.select}
                aria-label="Período"
                disabled={loading}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            {period === 'custom' && (
              <>
                <label style={styles.label}>
                  De
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    style={styles.inputDate}
                    disabled={loading}
                  />
                </label>
                <label style={styles.label}>
                  Até
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    style={styles.inputDate}
                    disabled={loading}
                  />
                </label>
              </>
            )}
            <label style={styles.label}>
              Franqueador
              <select
                value={franchisorId}
                onChange={(e) => { setFranchisorId(e.target.value); setSchoolId(''); setPageF(1); setPageS(1) }}
                style={styles.select}
                aria-label="Franqueador"
                disabled={loading}
              >
                <option value="">Todos</option>
                {franqueadores.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>
            <label style={styles.label}>
              Escola
              <select
                value={schoolId}
                onChange={(e) => { setSchoolId(e.target.value); setPageS(1) }}
                style={styles.select}
                aria-label="Escola"
                disabled={loading}
              >
                <option value="">Todas</option>
                {escolas.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </label>
            <label style={styles.label}>
              Status da escola
              <select
                value={schoolStatus}
                onChange={(e) => { setSchoolStatus(e.target.value); setPageF(1); setPageS(1) }}
                style={styles.select}
                aria-label="Status da escola"
                disabled={loading}
              >
                {SCHOOL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              style={styles.btnPrimario}
              className="btn-hover"
              onClick={aplicarFiltros}
              disabled={loading}
            >
              Aplicar filtros
            </button>
            <button
              type="button"
              style={styles.btnLimpar}
              onClick={limparFiltros}
              disabled={loading || !temFiltros}
            >
              Limpar filtros
            </button>
          </div>
        </div>

        {/* Erro API */}
        {error && (
          <div style={styles.erro}>
            <p style={styles.erroTexto}>Não foi possível carregar os relatórios. Tente novamente.</p>
            <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={fetchData}>
              Recarregar
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* KPIs principais */}
            <div style={styles.cardsRow}>
              {loading && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}
              {!loading && summary && (
                <>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Escolas ativas</span>
                    <span style={styles.cardValue}>{summary.schools_active_count ?? 0}</span>
                    <Link to={buildEscolasUrl('ativo')} style={styles.cardLink}>Ver escolas</Link>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Escolas pendentes</span>
                    <span style={styles.cardValue}>{summary.schools_pending_count ?? 0}</span>
                    <Link to={buildEscolasUrl('pendente')} style={styles.cardLink}>Ver escolas</Link>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Franqueadores ativos</span>
                    <span style={styles.cardValue}>{summary.franchisors_active_count ?? 0}</span>
                    <Link to={buildFranqueadoresUrl()} style={styles.cardLink}>Ver franqueadores</Link>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Assinaturas ativas</span>
                    <span style={styles.cardValue}>{summary.subscriptions_active_count ?? 0}</span>
                    <Link to={buildSubscriptionsUrl()} style={styles.cardLink}>Ver assinaturas</Link>
                  </div>
                  {summary.received_total != null && (
                    <div style={styles.card}>
                      <span style={styles.cardLabel}>Receita recebida no período</span>
                      <span style={styles.cardValue}>{formatCurrency(summary.received_total)}</span>
                      <Link to={buildFinanceGlobalUrl()} style={styles.cardLink}>Ver financeiro global</Link>
                    </div>
                  )}
                  {summary.overdue_total != null && (
                    <div style={styles.card}>
                      <span style={styles.cardLabel}>Valor em atraso no período</span>
                      <span style={{ ...styles.cardValue, color: summary.overdue_total > 0 ? '#dc3545' : undefined }}>
                        {formatCurrency(summary.overdue_total)}
                      </span>
                      <Link to={buildDelinquencyUrl()} style={styles.cardLink}>Ver inadimplência global</Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {!loading && isEmpty && (
              <div style={styles.vazio}>
                Não há dados para o período selecionado.
              </div>
            )}

            {/* Rankings e distribuição (sempre visíveis; skeleton quando loading) */}
            {(loading || !isEmpty) && (
              <>
                {/* Top Franqueadores */}
                <div style={styles.secao}>
                  <h3 style={styles.secaoTitulo}>Top Franqueadores</h3>
                  <label style={styles.labelInline}>
                    Métrica do ranking
                    <select
                      value={metricFranchisors}
                      onChange={(e) => { setMetricFranchisors(e.target.value); setPageF(1) }}
                      style={styles.select}
                      disabled={loading}
                    >
                      {TOP_FRANCHISORS_METRICS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </label>
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Franqueador</th>
                          <th style={styles.th}>Métrica</th>
                          <th style={styles.th}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          [...Array(3)].map((_, i) => <SkeletonRow key={i} cols={3} />)
                        )}
                        {!loading && topFranchisors?.data?.length === 0 && (
                          <tr>
                            <td colSpan={3} style={styles.tdVazio}>Nenhum dado no período.</td>
                          </tr>
                        )}
                        {!loading && topFranchisors?.data?.length > 0 &&
                          topFranchisors.data.map((row) => (
                            <tr key={row.franchisor_id}>
                              <td style={styles.td}>{row.franchisor_name}</td>
                              <td style={styles.td}>{formatMetricValue(metricFranchisors, row.metric_value)}</td>
                              <td style={styles.td}>
                                <Link
                                  to={`/admin/franqueadores/${row.franchisor_id}?tab=overview`}
                                  style={styles.btnLink}
                                >
                                  Abrir franqueador
                                </Link>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Escolas */}
                <div style={styles.secao}>
                  <h3 style={styles.secaoTitulo}>Top Escolas</h3>
                  <label style={styles.labelInline}>
                    Métrica do ranking
                    <select
                      value={metricSchools}
                      onChange={(e) => { setMetricSchools(e.target.value); setPageS(1) }}
                      style={styles.select}
                      disabled={loading}
                    >
                      {TOP_SCHOOLS_METRICS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </label>
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Escola</th>
                          <th style={styles.th}>Franqueador</th>
                          <th style={styles.th}>Métrica</th>
                          <th style={styles.th}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          [...Array(3)].map((_, i) => <SkeletonRow key={i} cols={4} />)
                        )}
                        {!loading && topSchools?.data?.length === 0 && (
                          <tr>
                            <td colSpan={4} style={styles.tdVazio}>Nenhum dado no período.</td>
                          </tr>
                        )}
                        {!loading && topSchools?.data?.length > 0 &&
                          topSchools.data.map((row) => (
                            <tr key={row.school_id}>
                              <td style={styles.td}>{row.school_name}</td>
                              <td style={styles.td}>{row.franchisor_name}</td>
                              <td style={styles.td}>{formatMetricValue(metricSchools, row.metric_value)}</td>
                              <td style={styles.td}>
                                <Link to={`/admin/escolas/${row.school_id}`} style={styles.btnLink}>
                                  Abrir escola
                                </Link>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Distribuição por status de escola */}
                {bySchoolStatus?.data?.length > 0 && (
                  <div style={styles.secao}>
                    <h3 style={styles.secaoTitulo}>Por status de escola</h3>
                    <div style={styles.tableWrap}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Contagem</th>
                            <th style={styles.th}>Link</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bySchoolStatus.data.map((row) => (
                            <tr key={row.status}>
                              <td style={styles.td}>{statusLabel(row.status)}</td>
                              <td style={styles.td}>{row.count}</td>
                              <td style={styles.td}>
                                <Link to={buildEscolasUrl(row.status)} style={styles.btnLink}>
                                  Ver escolas
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 3,
  },
  cabecalho: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 3,
  },
  titulo: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  subtitulo: {
    margin: 0,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.7,
  },
  aviso: {
    margin: `${GRID}px 0 0`,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.6,
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
    border: '1px solid #ccc',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  filtrosCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: GRID * 2,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 0.5,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  labelInline: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    marginBottom: GRID * 2,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  select: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    minWidth: 160,
    outline: 'none',
  },
  inputDate: {
    padding: `${GRID * 2}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
  },
  btnLimpar: {
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #ccc',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    cursor: 'pointer',
  },
  erro: {
    padding: GRID * 4,
    textAlign: 'center',
    background: 'rgba(220, 53, 69, 0.06)',
    borderRadius: 'var(--radius)',
  },
  erroTexto: {
    margin: `0 0 ${GRID * 2}px`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  vazio: {
    padding: GRID * 4,
    textAlign: 'center',
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: GRID * 2,
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cardLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
    marginBottom: GRID,
  },
  cardValue: {
    display: 'block',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    marginBottom: GRID,
  },
  cardLink: {
    fontSize: 13,
    color: 'var(--azul-arena)',
    textDecoration: 'underline',
  },
  secao: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  secaoTitulo: {
    margin: `0 0 ${GRID * 3}px`,
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  tableWrap: { overflowX: 'auto' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
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
  tdVazio: {
    padding: GRID * 6,
    textAlign: 'center',
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  btnLink: {
    fontSize: 14,
    color: 'var(--azul-arena)',
    textDecoration: 'underline',
  },
}
