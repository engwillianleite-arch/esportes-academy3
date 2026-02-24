import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import {
  getDelinquencySummary,
  getDelinquencyByFranchisor,
  getDelinquencyBySchool,
  BUCKET_OPTIONS,
  formatCurrency,
} from '../../api/delinquency'
import { listFranqueadores } from '../../api/franqueadores'
import { listEscolas } from '../../api/franqueadores'

const GRID = 8
const OPCOES_POR_PAGINA = [10, 25, 50]
const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_30', label: 'Últimos 30 dias' },
  { value: 'last_90', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Personalizado' },
]
const METRIC_OPTIONS = [
  { value: 'amount', label: 'Valor em atraso' },
  { value: 'items', label: 'Quantidade de títulos em atraso' },
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

const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
)

function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={{ height: 14, width: '60%', background: 'var(--cinza-arquibancada)', borderRadius: 4, marginBottom: GRID }} />
      <div style={{ height: 24, width: '80%', background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
    </div>
  )
}

function SkeletonRow({ cols = 6 }) {
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

export default function InadimplenciaGlobal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const schoolsSectionRef = useRef(null)

  const periodFromUrl = searchParams.get('period') || 'this_month'
  const fromUrl = searchParams.get('from') || ''
  const toUrl = searchParams.get('to') || ''
  const franchisorIdUrl = searchParams.get('franchisor_id') || ''
  const schoolIdUrl = searchParams.get('school_id') || ''
  const bucketUrl = searchParams.get('bucket') || ''
  const metricUrl = searchParams.get('metric') || 'amount'
  const pageFranchisorsUrl = Math.max(1, parseInt(searchParams.get('page_franchisors') || '1', 10))
  const pageSchoolsUrl = Math.max(1, parseInt(searchParams.get('page_schools') || '1', 10))
  const pageSizeFUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size_f') || '10', 10)) || 10)
  const pageSizeSUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size_s') || '10', 10)) || 10)

  const { from: defaultFrom, to: defaultTo } = getDefaultFromTo(periodFromUrl, fromUrl, toUrl)
  const [period, setPeriod] = useState(periodFromUrl)
  const [from, setFrom] = useState(fromUrl || defaultFrom)
  const [to, setTo] = useState(toUrl || defaultTo)
  const [franchisorId, setFranchisorId] = useState(franchisorIdUrl)
  const [schoolId, setSchoolId] = useState(schoolIdUrl)
  const [bucket, setBucket] = useState(bucketUrl)
  const [metric, setMetric] = useState(metricUrl)
  const [pageFranchisors, setPageFranchisors] = useState(pageFranchisorsUrl)
  const [pageSchools, setPageSchools] = useState(pageSchoolsUrl)
  const [pageSizeF, setPageSizeF] = useState(pageSizeFUrl)
  const [pageSizeS, setPageSizeS] = useState(pageSizeSUrl)

  const [summary, setSummary] = useState(null)
  const [byFranchisor, setByFranchisor] = useState(null)
  const [bySchool, setBySchool] = useState(null)
  const [franqueadores, setFranqueadores] = useState([])
  const [escolas, setEscolas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const { from: queryFrom, to: queryTo } = getDefaultFromTo(period, from, to)
  const sortFranchisors = metric === 'items' ? 'items_desc' : 'overdue_desc'
  const sortSchools = metric === 'items' ? 'items_desc' : 'overdue_desc'

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
      if (bucket) next.set('bucket', bucket)
      else next.delete('bucket')
      next.set('metric', metric)
      next.set('page_franchisors', String(pageFranchisors))
      next.set('page_schools', String(pageSchools))
      next.set('page_size_f', String(pageSizeF))
      next.set('page_size_s', String(pageSizeS))
      return next
    })
  }, [period, queryFrom, queryTo, franchisorId, schoolId, bucket, metric, pageFranchisors, pageSchools, pageSizeF, pageSizeS, setSearchParams])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const summaryParams = { from: queryFrom, to: queryTo }
      if (franchisorId) summaryParams.franchisor_id = franchisorId
      if (schoolId) summaryParams.school_id = schoolId
      if (bucket) summaryParams.bucket = bucket

      const [summaryRes, franchisorRes, schoolRes] = await Promise.all([
        getDelinquencySummary(summaryParams),
        getDelinquencyByFranchisor({
          from: queryFrom,
          to: queryTo,
          bucket: bucket || undefined,
          franchisor_id: franchisorId || undefined,
          school_id: schoolId || undefined,
          metric,
          page: pageFranchisors,
          page_size: pageSizeF,
          sort: sortFranchisors,
        }),
        getDelinquencyBySchool({
          from: queryFrom,
          to: queryTo,
          bucket: bucket || undefined,
          franchisor_id: franchisorId || undefined,
          metric,
          page: pageSchools,
          page_size: pageSizeS,
          sort: sortSchools,
        }),
      ])
      setSummary(summaryRes)
      setByFranchisor(franchisorRes)
      setBySchool(schoolRes)
    } catch (err) {
      const isForbidden = err.status === 403 || (err.message && String(err.message).toLowerCase().includes('permissão'))
      if (isForbidden) setPermissionDenied(true)
      else setError(err.message || 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [queryFrom, queryTo, franchisorId, schoolId, bucket, metric, pageFranchisors, pageSchools, pageSizeF, pageSizeS, sortFranchisors, sortSchools])

  useEffect(() => {
    applyFiltersToUrl()
  }, [applyFiltersToUrl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const aplicarFiltros = () => {
    setPageFranchisors(1)
    setPageSchools(1)
  }

  const limparFiltros = () => {
    setPeriod('this_month')
    const { from: f, to: t } = getDefaultFromTo('this_month', '', '')
    setFrom(f)
    setTo(t)
    setFranchisorId('')
    setSchoolId('')
    setBucket('')
    setMetric('amount')
    setPageFranchisors(1)
    setPageSchools(1)
    setPageSizeF(10)
    setPageSizeS(10)
  }

  const temFiltros = franchisorId || schoolId || bucket || period === 'custom' || metric !== 'amount'

  const abrirFranqueador = (id) => {
    navigate(`/admin/franqueadores/${id}?tab=overview`)
  }

  const filtrarEscolasFranqueador = (id) => {
    setFranchisorId(id)
    setPageSchools(1)
    setTimeout(() => schoolsSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const abrirEscola = (id) => {
    navigate(`/admin/escolas/${id}`)
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Inadimplência Global' },
  ]

  const isEmpty = !loading && summary && summary.overdue_total_amount === 0 && summary.overdue_items_count === 0

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Inadimplência Global">
      <div style={styles.wrapper}>
        {/* Cabeçalho */}
        <div style={styles.cabecalho}>
          <div>
            <h2 style={styles.titulo}>Inadimplência Global</h2>
            <p style={styles.subtitulo}>Consolidado de valores vencidos e não pagos</p>
            <Link to="/admin/finance/global" style={styles.linkSecundario}>
              Ver visão financeira global
            </Link>
          </div>
          <Link
            to={`/admin/exports/new?type=delinquency&period=${period}&from=${queryFrom}&to=${queryTo}${franchisorId ? `&franchisor_id=${franchisorId}` : ''}${schoolId ? `&school_id=${schoolId}` : ''}${bucket ? `&bucket=${bucket}` : ''}`}
            style={styles.btnSecundario}
            className="btn-hover"
          >
            Exportar
          </Link>
        </div>

        {/* Filtros */}
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
                onChange={(e) => { setFranchisorId(e.target.value); setSchoolId(''); setPageSchools(1) }}
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
                onChange={(e) => { setSchoolId(e.target.value); setPageSchools(1) }}
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
              Faixa de atraso
              <select
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                style={styles.select}
                aria-label="Faixa de atraso"
                disabled={loading}
              >
                {BUCKET_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <label style={styles.label}>
              Tipo de métrica
              <select
                value={metric}
                onChange={(e) => { setMetric(e.target.value); setPageFranchisors(1); setPageSchools(1) }}
                style={styles.select}
                aria-label="Tipo de métrica"
                disabled={loading}
              >
                {METRIC_OPTIONS.map((opt) => (
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
            <p style={styles.erroTexto}>Não foi possível carregar a inadimplência global. Tente novamente.</p>
            <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={fetchData}>
              Recarregar
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* Estado vazio global */}
            {isEmpty && (
              <div style={styles.vazio}>
                Nenhum atraso encontrado para os filtros selecionados.
              </div>
            )}

            {/* Cards KPIs */}
            <div style={styles.cardsRow}>
              {loading && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}
              {!loading && summary && (
                <>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Total em atraso (R$)</span>
                    <span style={{ ...styles.cardValue, color: (summary.overdue_total_amount || 0) > 0 ? '#dc3545' : undefined }}>
                      {formatCurrency(summary.overdue_total_amount)}
                    </span>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Qtde de títulos vencidos</span>
                    <span style={styles.cardValue}>{summary.overdue_items_count ?? '—'}</span>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Escolas com atraso</span>
                    <span style={styles.cardValue}>{summary.schools_with_overdue_count ?? '—'}</span>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Maior atraso (dias)</span>
                    <span style={styles.cardValue}>{summary.max_overdue_days != null ? summary.max_overdue_days : '—'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Por Franqueador (ranking) */}
            <div style={styles.secao}>
              <h3 style={styles.secaoTitulo}>Por Franqueador (ranking)</h3>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Franqueador</th>
                      <th style={styles.th}>Escolas com atraso</th>
                      <th style={styles.th}>Valor em atraso</th>
                      <th style={styles.th}>Títulos em atraso</th>
                      <th style={styles.th}>Maior atraso (dias)</th>
                      <th style={styles.th}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <>
                        {[...Array(4)].map((_, i) => (
                          <SkeletonRow key={i} cols={6} />
                        ))}
                      </>
                    )}
                    {!loading && byFranchisor?.data?.length === 0 && (
                      <tr>
                        <td colSpan={6} style={styles.tdVazio}>
                          Nenhum franqueador com atraso nos filtros selecionados.
                        </td>
                      </tr>
                    )}
                    {!loading && byFranchisor?.data?.length > 0 &&
                      byFranchisor.data.map((row) => (
                        <tr key={row.franchisor_id}>
                          <td style={styles.td}>{row.franchisor_name}</td>
                          <td style={styles.td}>{row.schools_with_overdue_count}</td>
                          <td style={styles.td}>{formatCurrency(row.overdue_total_amount)}</td>
                          <td style={styles.td}>{row.overdue_items_count}</td>
                          <td style={styles.td}>{row.max_overdue_days != null ? row.max_overdue_days : '—'}</td>
                          <td style={styles.td}>
                            <div style={styles.acoesCel}>
                              <button
                                type="button"
                                style={styles.btnLink}
                                onClick={() => abrirFranqueador(row.franchisor_id)}
                              >
                                Abrir franqueador
                              </button>
                              <span style={styles.acoesSep}>·</span>
                              <button
                                type="button"
                                style={styles.btnLink}
                                onClick={() => filtrarEscolasFranqueador(row.franchisor_id)}
                              >
                                Filtrar escolas deste franqueador
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!loading && byFranchisor?.data?.length > 0 && byFranchisor.total_pages > 0 && (
                <div style={styles.rodape}>
                  <div style={styles.paginacao}>
                    <button
                      type="button"
                      style={styles.btnPagina}
                      onClick={() => setPageFranchisors((p) => Math.max(1, p - 1))}
                      disabled={pageFranchisors <= 1}
                      aria-label="Página anterior"
                    >
                      <IconChevronLeft />
                    </button>
                    <span style={styles.paginaAtual}>
                      Página {pageFranchisors} de {byFranchisor.total_pages}
                    </span>
                    <button
                      type="button"
                      style={styles.btnPagina}
                      onClick={() => setPageFranchisors((p) => Math.min(byFranchisor.total_pages, p + 1))}
                      disabled={pageFranchisors >= byFranchisor.total_pages}
                      aria-label="Próxima página"
                    >
                      <IconChevronRight />
                    </button>
                  </div>
                  <label style={styles.pageSizeLabel}>
                    Itens por página:
                    <select
                      value={pageSizeF}
                      onChange={(e) => { setPageSizeF(Number(e.target.value)); setPageFranchisors(1) }}
                      style={styles.selectPageSize}
                      disabled={loading}
                    >
                      {OPCOES_POR_PAGINA.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>

            {/* Por Escola (ranking) */}
            <div style={styles.secao} ref={schoolsSectionRef}>
              <h3 style={styles.secaoTitulo}>Por Escola (ranking)</h3>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Escola</th>
                      <th style={styles.th}>Franqueador</th>
                      <th style={styles.th}>Valor em atraso</th>
                      <th style={styles.th}>Títulos em atraso</th>
                      <th style={styles.th}>Maior atraso (dias)</th>
                      <th style={styles.th}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <>
                        {[...Array(4)].map((_, i) => (
                          <SkeletonRow key={i} cols={6} />
                        ))}
                      </>
                    )}
                    {!loading && bySchool?.data?.length === 0 && (
                      <tr>
                        <td colSpan={6} style={styles.tdVazio}>
                          Nenhuma escola com atraso nos filtros selecionados.
                        </td>
                      </tr>
                    )}
                    {!loading && bySchool?.data?.length > 0 &&
                      bySchool.data.map((row) => (
                        <tr key={row.school_id}>
                          <td style={styles.td}>{row.school_name}</td>
                          <td style={styles.td}>{row.franchisor_name}</td>
                          <td style={styles.td}>{formatCurrency(row.overdue_total_amount)}</td>
                          <td style={styles.td}>{row.overdue_items_count}</td>
                          <td style={styles.td}>{row.max_overdue_days != null ? row.max_overdue_days : '—'}</td>
                          <td style={styles.td}>
                            <button
                              type="button"
                              style={styles.btnLink}
                              onClick={() => abrirEscola(row.school_id)}
                            >
                              Abrir escola
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!loading && bySchool?.data?.length > 0 && bySchool.total_pages > 0 && (
                <div style={styles.rodape}>
                  <div style={styles.paginacao}>
                    <button
                      type="button"
                      style={styles.btnPagina}
                      onClick={() => setPageSchools((p) => Math.max(1, p - 1))}
                      disabled={pageSchools <= 1}
                      aria-label="Página anterior"
                    >
                      <IconChevronLeft />
                    </button>
                    <span style={styles.paginaAtual}>
                      Página {pageSchools} de {bySchool.total_pages}
                    </span>
                    <button
                      type="button"
                      style={styles.btnPagina}
                      onClick={() => setPageSchools((p) => Math.min(bySchool.total_pages, p + 1))}
                      disabled={pageSchools >= bySchool.total_pages}
                      aria-label="Próxima página"
                    >
                      <IconChevronRight />
                    </button>
                  </div>
                  <label style={styles.pageSizeLabel}>
                    Itens por página:
                    <select
                      value={pageSizeS}
                      onChange={(e) => { setPageSizeS(Number(e.target.value)); setPageSchools(1) }}
                      style={styles.selectPageSize}
                      disabled={loading}
                    >
                      {OPCOES_POR_PAGINA.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
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
  linkSecundario: {
    display: 'inline-block',
    marginTop: GRID,
    fontSize: 14,
    color: 'var(--azul-arena)',
    textDecoration: 'none',
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
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
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
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
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
  acoesCel: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID,
  },
  btnLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 14,
    color: 'var(--azul-arena)',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  acoesSep: {
    color: 'var(--grafite-tecnico)',
    opacity: 0.5,
  },
  rodape: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginTop: GRID * 3,
    paddingTop: GRID * 3,
    borderTop: '1px solid #eee',
  },
  paginacao: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
  },
  btnPagina: {
    background: 'var(--branco-luz)',
    border: '1px solid #E5E5E7',
    padding: GRID,
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    color: 'var(--grafite-tecnico)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginaAtual: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    minWidth: 100,
    textAlign: 'center',
  },
  pageSizeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  selectPageSize: {
    padding: `${GRID}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
  },
}
