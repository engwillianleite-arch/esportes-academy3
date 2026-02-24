import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useDebounce } from '../../hooks/useDebounce'
import { listSubscriptions, formatSubscriptionDate } from '../../api/subscriptions'
import { listFranqueadores } from '../../api/franqueadores'
import { listEscolas } from '../../api/franqueadores'
import { listPlans } from '../../api/plans'

const GRID = 8
const OPCOES_POR_PAGINA = [10, 25, 50]
const DEBOUNCE_MS = 500

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)
const IconMore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="6" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="18" r="1.5" />
  </svg>
)
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

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const estilo =
    s === 'ativa'
      ? { background: 'rgba(76, 203, 138, 0.15)', color: 'var(--verde-patrocinio)' }
      : s === 'inativa'
        ? { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' }
        : s === 'cancelada'
          ? { background: 'rgba(220, 53, 69, 0.15)', color: '#dc3545' }
          : { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'capitalize',
        ...estilo,
      }}
    >
      {s || '—'}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <td key={i} style={styles.td}>
          <span style={{ display: 'inline-block', height: 16, width: i === 1 ? 120 : 80, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  )
}

export default function ListaAssinaturas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const searchFromUrl = searchParams.get('search') || ''
  const franchisorIdFromUrl = searchParams.get('franchisor_id') || ''
  const schoolIdFromUrl = searchParams.get('school_id') || ''
  const planIdFromUrl = searchParams.get('plan_id') || ''
  const statusFromUrl = searchParams.get('status') || 'todos'
  const startFromUrl = searchParams.get('start_from') || ''
  const startToUrl = searchParams.get('start_to') || ''
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSizeFromUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size') || '10', 10)) || 10)

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)

  const [franchisorId, setFranchisorId] = useState(franchisorIdFromUrl)
  const [schoolId, setSchoolId] = useState(schoolIdFromUrl)
  const [planId, setPlanId] = useState(planIdFromUrl)
  const [status, setStatus] = useState(statusFromUrl)
  const [startFrom, setStartFrom] = useState(startFromUrl)
  const [startTo, setStartTo] = useState(startToUrl)
  const [page, setPage] = useState(pageFromUrl)
  const [pageSize, setPageSize] = useState(pageSizeFromUrl)

  const [data, setData] = useState(null)
  const [franqueadores, setFranqueadores] = useState([])
  const [escolas, setEscolas] = useState([])
  const [planos, setPlanos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [menuAberto, setMenuAberto] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Sincronizar estado com URL quando entrar com query (ex.: ?plan_id=1)
  useEffect(() => {
    if (planIdFromUrl && !planId) setPlanId(planIdFromUrl)
    if (schoolIdFromUrl && !schoolId) setSchoolId(schoolIdFromUrl)
    if (franchisorIdFromUrl && !franchisorId) setFranchisorId(franchisorIdFromUrl)
  }, [planIdFromUrl, schoolIdFromUrl, franchisorIdFromUrl])

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('search', debouncedSearch)
      next.set('franchisor_id', franchisorId)
      next.set('school_id', schoolId)
      next.set('plan_id', planId)
      next.set('status', status)
      if (startFrom) next.set('start_from', startFrom)
      else next.delete('start_from')
      if (startTo) next.set('start_to', startTo)
      else next.delete('start_to')
      next.set('page', String(page))
      next.set('page_size', String(pageSize))
      return next
    })
  }, [debouncedSearch, franchisorId, schoolId, planId, status, startFrom, startTo, page, pageSize, setSearchParams])

  // Listar franqueadores para o select (Todos + lista)
  useEffect(() => {
    let cancelled = false
    listFranqueadores({ page: 1, page_size: 500 })
      .then((res) => { if (!cancelled) setFranqueadores(res.data || []) })
      .catch(() => { if (!cancelled) setFranqueadores([]) })
    return () => { cancelled = true }
  }, [])

  // Listar planos para o select (Todos + lista)
  useEffect(() => {
    let cancelled = false
    listPlans({ page: 1, page_size: 100 })
      .then((res) => { if (!cancelled) setPlanos(res.data || []) })
      .catch(() => { if (!cancelled) setPlanos([]) })
    return () => { cancelled = true }
  }, [])

  // Listar escolas: todas ou só do franqueador selecionado
  useEffect(() => {
    let cancelled = false
    const params = { page: 1, page_size: 500 }
    if (franchisorId) params.franchisor_id = franchisorId
    listEscolas(params)
      .then((res) => { if (!cancelled) setEscolas(res.data || []) })
      .catch(() => { if (!cancelled) setEscolas([]) })
    return () => { cancelled = true }
  }, [franchisorId])

  // Quando mudar franqueador, limpar escola selecionada se não pertencer ao novo franqueador
  useEffect(() => {
    if (!franchisorId || !schoolId) return
    const pertence = escolas.some((e) => String(e.id) === String(schoolId))
    if (!pertence) setSchoolId('')
  }, [franchisorId, schoolId, escolas])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listSubscriptions({
        search: debouncedSearch,
        franchisor_id: franchisorId || undefined,
        school_id: schoolId || undefined,
        plan_id: planId || undefined,
        status: status === 'todos' ? '' : status,
        start_from: startFrom || undefined,
        start_to: startTo || undefined,
        page,
        page_size: pageSize,
      })
      setData(res)
    } catch (err) {
      const isForbidden = err.status === 403 || (err.message && String(err.message).toLowerCase().includes('permissão'))
      if (isForbidden) setPermissionDenied(true)
      else setError(err.message || 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, franchisorId, schoolId, planId, status, startFrom, startTo, page, pageSize])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuAberto && !e.target.closest('[data-menu-wrap]')) setMenuAberto(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuAberto])

  const limparFiltros = () => {
    setSearchInput('')
    setFranchisorId('')
    setSchoolId('')
    setPlanId('')
    setStatus('todos')
    setStartFrom('')
    setStartTo('')
    setPage(1)
    setPageSize(10)
  }

  const temFiltros = searchInput || franchisorId || schoolId || planId || status !== 'todos' || startFrom || startTo

  const buildReturnSearch = () => {
    const p = new URLSearchParams()
    if (planId) p.set('plan_id', planId)
    if (schoolId) p.set('school_id', schoolId)
    if (franchisorId) p.set('franchisor_id', franchisorId)
    const q = p.toString()
    return q ? `?${q}` : ''
  }

  const abrirEscola = (id) => {
    navigate(`/admin/escolas/${id}`, { state: { returnTo: `/admin/subscriptions${buildReturnSearch()}` } })
    setMenuAberto(null)
  }
  const abrirFranqueador = (id) => {
    navigate(`/admin/franqueadores/${id}?tab=overview`)
    setMenuAberto(null)
  }
  const abrirPlano = (id) => {
    navigate(`/admin/plans/${id}/edit${location.search || ''}`)
    setMenuAberto(null)
  }

  const verDetalhesAssinatura = (subId) => {
    const returnTo = `/admin/subscriptions${location.search || ''}`
    navigate(`/admin/subscriptions/${subId}`, { state: { returnTo } })
    setMenuAberto(null)
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Planos e Assinaturas', to: '/admin/plans' },
    { label: 'Assinaturas' },
  ]

  const colCount = 8

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Assinaturas">
      <div style={styles.cardGrande}>
        <div style={styles.cabecalho}>
          <div>
            <h2 style={styles.tituloPagina}>Assinaturas</h2>
            <p style={styles.subtitulo}>Visão global de assinaturas do SaaS</p>
          </div>
          <div style={styles.buscaWrap}>
            <span style={styles.buscaIcon} aria-hidden="true">
              <IconSearch />
            </span>
            <input
              type="search"
              placeholder="Buscar por escola, franqueador ou ID da assinatura"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={styles.buscaInput}
              aria-label="Buscar assinaturas"
              disabled={loading}
            />
          </div>
        </div>

        <div style={styles.filtros}>
          <select
            value={franchisorId}
            onChange={(e) => { setFranchisorId(e.target.value); setSchoolId(''); setPage(1) }}
            style={styles.select}
            aria-label="Franqueador"
            disabled={loading}
          >
            <option value="">Todos</option>
            {franqueadores.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <select
            value={schoolId}
            onChange={(e) => { setSchoolId(e.target.value); setPage(1) }}
            style={styles.select}
            aria-label="Escola"
            disabled={loading}
          >
            <option value="">Todas</option>
            {escolas.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select
            value={planId}
            onChange={(e) => { setPlanId(e.target.value); setPage(1) }}
            style={styles.select}
            aria-label="Plano"
            disabled={loading}
          >
            <option value="">Todos</option>
            {planos.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            style={styles.select}
            aria-label="Status"
            disabled={loading}
          >
            <option value="todos">Todos</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <span style={styles.filtroPeriodo}>
            <label style={styles.labelPeriodo}>Início entre</label>
            <input
              type="date"
              value={startFrom}
              onChange={(e) => { setStartFrom(e.target.value); setPage(1) }}
              style={styles.inputDate}
              disabled={loading}
              aria-label="Data início de"
            />
            <input
              type="date"
              value={startTo}
              onChange={(e) => { setStartTo(e.target.value); setPage(1) }}
              style={styles.inputDate}
              disabled={loading}
              aria-label="Data início até"
            />
          </span>
          <button
            type="button"
            onClick={limparFiltros}
            style={styles.btnLimpar}
            disabled={loading || !temFiltros}
          >
            Limpar filtros
          </button>
        </div>

        {error && (
          <div style={styles.erro}>
            <p style={styles.erroTexto}>Não foi possível carregar as assinaturas. Tente novamente.</p>
            <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={fetchList}>
              Recarregar
            </button>
          </div>
        )}

        {!error && (
          <>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Escola</th>
                    <th style={styles.th}>Franqueador</th>
                    <th style={styles.th}>Plano</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Início</th>
                    <th style={styles.th}>Próxima renovação</th>
                    <th style={styles.th}>Criado em</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </>
                  )}
                  {!loading && data?.data?.length === 0 && (
                    <tr>
                      <td colSpan={colCount} style={styles.tdVazio}>
                        <div style={styles.emptyWrap}>
                          <p style={styles.emptyTitulo}>Nenhuma assinatura encontrada</p>
                          <p style={styles.emptyTexto}>Ajuste os filtros para ver resultados.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && data?.data?.length > 0 &&
                    data.data.map((sub) => (
                      <tr
                        key={sub.id}
                        style={styles.trClickable}
                        onClick={() => abrirEscola(sub.school_id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && abrirEscola(sub.school_id)}
                        aria-label={`Abrir escola ${sub.school_name}`}
                      >
                        <td style={styles.td}>{sub.school_name || '—'}</td>
                        <td style={styles.td}>{sub.franchisor_name || '—'}</td>
                        <td style={styles.td}>{sub.plan_name || '—'}</td>
                        <td style={styles.td}>
                          <StatusBadge status={sub.status} />
                        </td>
                        <td style={styles.td}>{formatSubscriptionDate(sub.start_date)}</td>
                        <td style={styles.td}>{formatSubscriptionDate(sub.next_renewal_date)}</td>
                        <td style={styles.td}>{formatSubscriptionDate(sub.created_at)}</td>
                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                          <div style={styles.acoesCel} data-menu-wrap>
                            <button
                              type="button"
                              style={styles.btnMenu}
                              onClick={() => setMenuAberto(menuAberto === sub.id ? null : sub.id)}
                              aria-haspopup="true"
                              aria-expanded={menuAberto === sub.id}
                              aria-label="Ações"
                              disabled={loading}
                            >
                              <IconMore />
                            </button>
                            {menuAberto === sub.id && (
                              <div style={styles.dropdown}>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => verDetalhesAssinatura(sub.id)}
                                >
                                  Ver detalhes
                                </button>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => abrirEscola(sub.school_id)}
                                >
                                  Abrir escola
                                </button>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => abrirFranqueador(sub.franchisor_id)}
                                >
                                  Abrir franqueador
                                </button>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => abrirPlano(sub.plan_id)}
                                >
                                  Abrir plano
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {!loading && data?.data?.length > 0 && data.total_pages > 0 && (
              <div style={styles.rodape}>
                <div style={styles.paginacao}>
                  <button
                    type="button"
                    style={styles.btnPagina}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="Página anterior"
                  >
                    <IconChevronLeft />
                  </button>
                  <span style={styles.paginaAtual}>
                    Página {page} de {data.total_pages}
                  </span>
                  <button
                    type="button"
                    style={styles.btnPagina}
                    onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                    disabled={page >= data.total_pages}
                    aria-label="Próxima página"
                  >
                    <IconChevronRight />
                  </button>
                </div>
                <div style={styles.pageSizeWrap}>
                  <label style={styles.pageSizeLabel}>
                    Itens por página:
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                      style={styles.selectPageSize}
                      disabled={loading}
                    >
                      {OPCOES_POR_PAGINA.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
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
    marginBottom: GRID * 3,
  },
  tituloPagina: {
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
  buscaWrap: {
    position: 'relative',
    width: 320,
  },
  buscaIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--grafite-tecnico)',
    opacity: 0.6,
    pointerEvents: 'none',
  },
  buscaInput: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 2}px ${GRID * 2}px 40px`,
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
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  select: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    minWidth: 140,
    outline: 'none',
  },
  filtroPeriodo: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    flexWrap: 'wrap',
  },
  labelPeriodo: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
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
    marginBottom: GRID * 3,
  },
  erroTexto: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 14,
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
    verticalAlign: 'middle',
  },
  trClickable: {
    cursor: 'pointer',
  },
  emptyWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: GRID * 2,
  },
  emptyTitulo: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  emptyTexto: {
    margin: 0,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  acoesCel: { position: 'relative' },
  btnMenu: {
    background: 'none',
    border: 'none',
    padding: GRID,
    cursor: 'pointer',
    color: 'var(--grafite-tecnico)',
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: 4,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    border: '1px solid #E5E5E7',
    minWidth: 160,
    zIndex: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: 'none',
    background: 'none',
    textAlign: 'left',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
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
  pageSizeWrap: {},
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
