import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import {
  getFinanceGlobalSummary,
  getFinanceGlobalByFranchisor,
  getFinanceGlobalBySchool,
  formatCurrency,
} from '../../api/financeGlobal'
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

function SkeletonRow({ cols = 7 }) {
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

export default function FinanceiroGlobal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const schoolsSectionRef = useRef(null)

  const periodFromUrl = searchParams.get('period') || 'this_month'
  const fromUrl = searchParams.get('from') || ''
  const toUrl = searchParams.get('to') || ''
  const franchisorIdUrl = searchParams.get('franchisor_id') || ''
  const schoolIdUrl = searchParams.get('school_id') || ''
  const statusUrl = searchParams.get('status') || 'todos'
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
  const [status, setStatus] = useState(statusUrl)
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
      next.set('status', status)
      next.set('page_franchisors', String(pageFranchisors))
      next.set('page_schools', String(pageSchools))
      next.set('page_size_f', String(pageSizeF))
      next.set('page_size_s', String(pageSizeS))
      return next
    })
  }, [period, queryFrom, queryTo, franchisorId, schoolId, status, pageFranchisors, pageSchools, pageSizeF, pageSizeS, setSearchParams])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const summaryParams = { from: queryFrom, to: queryTo }
      if (franchisorId) summaryParams.franchisor_id = franchisorId
      if (schoolId) summaryParams.school_id = schoolId
      if (status !== 'todos') summaryParams.status = status

      const [summaryRes, franchisorRes, schoolRes] = await Promise.all([
        getFinanceGlobalSummary(summaryParams),
        getFinanceGlobalByFranchisor({
          from: queryFrom,
          to: queryTo,
          status: status === 'todos' ? undefined : status,
          page: pageFranchisors,
          page_size: pageSizeF,
          sort: 'overdue_desc',
        }),
        getFinanceGlobalBySchool({
          from: queryFrom,
          to: queryTo,
          franchisor_id: franchisorId || undefined,
          status: status === 'todos' ? undefined : status,
          page: pageSchools,
          page_size: pageSizeS,
          sort: 'overdue_desc',
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
  }, [queryFrom, queryTo, franchisorId, schoolId, status, pageFranchisors, pageSchools, pageSizeF, pageSizeS])

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
    setStatus('todos')
    setPageFranchisors(1)
    setPageSchools(1)
    setPageSizeF(10)
    setPageSizeS(10)
  }

  const temFiltros = franchisorId || schoolId || status !== 'todos' || period === 'custom'

  const abrirFranqueador = (id) => {
    navigate(`/admin/franqueadores/${id}?tab=overview`)
  }

  const verEscolas = (id) => {
    setFranchisorId(id)
    setPageSchools(1)
    setTimeout(() => schoolsSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const abrirEscola = (id) => {
    navigate(`/admin/escolas/${id}`)
  }

  const verAssinaturas = (sid, fid) => {
    const q = new URLSearchParams()
    if (sid) q.set('school_id', sid)
    if (fid) q.set('franchisor_id', fid)
    navigate(`/admin/subscriptions?${q.toString()}`)
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Financeiro Global' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Financeiro Global">
      <div style={styles.wrapper}>
        {/* Cabeçalho */}
        <div style={styles.cabecalho}>
          <div>
            <h2 style={styles.titulo}>Financeiro Global</h2>
            <p style={styles.subtitulo}>Consolidação por franqueador e escola</p>
            <p style={styles.aviso}>
              Dados consolidados com base em registros internos (mensalidades/pagamentos).
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              to={`/admin/exports/new?type=finance_global&period=${period}&from=${queryFrom}&to=${queryTo}${franchisorId ? `&franchisor_id=${franchisorId}` : ''}${schoolId ? `&school_id=${schoolId}` : ''}${status !== 'todos' ? `&status=${status}` : ''}`}
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
              Status financeiro
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={styles.select}
                aria-label="Status financeiro"
                disabled={loading}
              >
                <option value="todos">Todos</option>
                <option value="pago">Pago</option>
                <option value="em_aberto">Em aberto</option>
                <option value="atrasado">Atrasado</option>
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
            <p style={styles.erroTexto}>Não foi possível carregar o financeiro global. Tente novamente.</p>
            <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={fetchData}>
              Recarregar
            </button>
          </div>
        )}

        {!error && (
          <>
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
                    <span style={styles.cardLabel}>Recebido no período</span>
                    <span style={styles.cardValue}>{formatCurrency(summary.received_total)}</span>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Em aberto</span>
                    <span style={styles.cardValue}>{formatCurrency(summary.open_total)}</span>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Em atraso</span>
                    <span style={{ ...styles.cardValue, color: summary.overdue_total > 0 ? '#dc3545' : undefined }}>
                      {formatCurrency(summary.overdue_total)}
                    </span>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Taxa de inadimplência</span>
                    <span style={styles.cardValue}>
                      {summary.delinquency_rate != null ? `${Number(summary.delinquency_rate).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Por Franqueador */}
            <div style={styles.secao}>
              <h3 style={styles.secaoTitulo}>Por Franqueador</h3>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Franqueador</th>
                      <th style={styles.th}>Qtde de escolas</th>
                      <th style={styles.th}>Recebido (período)</th>
                      <th style={styles.th}>Em aberto</th>
                      <th style={styles.th}>Em atraso</th>
                      <th style={styles.th}>Inadimplência (%)</th>
                      <th style={styles.th}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <>
                        {[...Array(4)].map((_, i) => (
                          <SkeletonRow key={i} cols={7} />
                        ))}
                      </>
                    )}
                    {!loading && byFranchisor?.data?.length === 0 && (
                      <tr>
                        <td colSpan={7} style={styles.tdVazio}>
                          Nenhum franqueador com dados no período selecionado.
                        </td>
                      </tr>
                    )}
                    {!loading && byFranchisor?.data?.length > 0 &&
                      byFranchisor.data.map((row) => (
                        <tr key={row.franchisor_id}>
                          <td style={styles.td}>{row.franchisor_name}</td>
                          <td style={styles.td}>{row.schools_count}</td>
                          <td style={styles.td}>{formatCurrency(row.received_total)}</td>
                          <td style={styles.td}>{formatCurrency(row.open_total)}</td>
                          <td style={styles.td}>{formatCurrency(row.overdue_total)}</td>
                          <td style={styles.td}>{row.delinquency_rate != null ? `${row.delinquency_rate}%` : '—'}</td>
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
                                onClick={() => verEscolas(row.franchisor_id)}
                              >
                                Ver escolas
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

            {/* Por Escola */}
            <div style={styles.secao} ref={schoolsSectionRef}>
              <h3 style={styles.secaoTitulo}>Por Escola</h3>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Escola</th>
                      <th style={styles.th}>Franqueador</th>
                      <th style={styles.th}>Recebido (período)</th>
                      <th style={styles.th}>Em aberto</th>
                      <th style={styles.th}>Em atraso</th>
                      <th style={styles.th}>Inadimplência (%)</th>
                      <th style={styles.th}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <>
                        {[...Array(4)].map((_, i) => (
                          <SkeletonRow key={i} cols={7} />
                        ))}
                      </>
                    )}
                    {!loading && bySchool?.data?.length === 0 && (
                      <tr>
                        <td colSpan={7} style={styles.tdVazio}>
                          Nenhuma escola com dados no período selecionado.
                        </td>
                      </tr>
                    )}
                    {!loading && bySchool?.data?.length > 0 &&
                      bySchool.data.map((row) => (
                        <tr key={row.school_id}>
                          <td style={styles.td}>{row.school_name}</td>
                          <td style={styles.td}>{row.franchisor_name}</td>
                          <td style={styles.td}>{formatCurrency(row.received_total)}</td>
                          <td style={styles.td}>{formatCurrency(row.open_total)}</td>
                          <td style={styles.td}>{formatCurrency(row.overdue_total)}</td>
                          <td style={styles.td}>{row.delinquency_rate != null ? `${row.delinquency_rate}%` : '—'}</td>
                          <td style={styles.td}>
                            <div style={styles.acoesCel}>
                              <button
                                type="button"
                                style={styles.btnLink}
                                onClick={() => abrirEscola(row.school_id)}
                              >
                                Abrir escola
                              </button>
                              <span style={styles.acoesSep}>·</span>
                              <button
                                type="button"
                                style={styles.btnLink}
                                onClick={() => verAssinaturas(row.school_id, row.franchisor_id)}
                              >
                                Ver assinaturas
                              </button>
                            </div>
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
