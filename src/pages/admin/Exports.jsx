import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useDebounce } from '../../hooks/useDebounce'
import {
  listExports,
  getExportTypes,
  formatExportDate,
} from '../../api/exports'

const GRID = 8
const OPCOES_POR_PAGINA = [10, 25, 50]
const DEBOUNCE_MS = 500

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pending', label: 'Em fila' },
  { value: 'processing', label: 'Processando' },
  { value: 'completed', label: 'Concluída' },
  { value: 'failed', label: 'Falhou' },
  { value: 'expired', label: 'Expirada' },
]

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
  const labels = {
    pending: 'Em fila',
    processing: 'Processando',
    completed: 'Concluída',
    failed: 'Falhou',
    expired: 'Expirada',
  }
  const estilo =
    s === 'completed'
      ? { background: 'rgba(76, 203, 138, 0.15)', color: 'var(--verde-patrocinio)' }
      : s === 'processing' || s === 'pending'
        ? { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' }
        : s === 'failed'
          ? { background: 'rgba(220, 53, 69, 0.15)', color: '#dc3545' }
          : s === 'expired'
            ? { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' }
            : { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        ...estilo,
      }}
    >
      {labels[s] || s || '—'}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <td key={i} style={styles.td}>
          <span
            style={{
              display: 'inline-block',
              height: 16,
              width: i === 1 ? 80 : 100,
              background: 'var(--cinza-arquibancada)',
              borderRadius: 4,
            }}
          />
        </td>
      ))}
    </tr>
  )
}

function typeLabel(value) {
  const map = {
    schools: 'Escolas',
    franchisors: 'Franqueadores',
    subscriptions: 'Assinaturas',
    finance_global: 'Financeiro (global)',
    delinquency: 'Inadimplência',
    kpis_summary: 'KPIs (resumo)',
  }
  return map[value] || value || '—'
}

export default function Exports() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const searchFromUrl = searchParams.get('search') || ''
  const statusFromUrl = searchParams.get('status') || 'todos'
  const typeFromUrl = searchParams.get('type') || 'todos'
  const fromUrl = searchParams.get('from') || ''
  const toUrl = searchParams.get('to') || ''
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSizeFromUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size') || '10', 10)) || 10)

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)
  const [status, setStatus] = useState(statusFromUrl)
  const [type, setType] = useState(typeFromUrl)
  const [from, setFrom] = useState(fromUrl)
  const [to, setTo] = useState(toUrl)
  const [page, setPage] = useState(pageFromUrl)
  const [pageSize, setPageSize] = useState(pageSizeFromUrl)

  const [types, setTypes] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [menuAberto, setMenuAberto] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    let cancelled = false
    getExportTypes()
      .then((list) => { if (!cancelled) setTypes(list) })
      .catch(() => { if (!cancelled) setTypes([]) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('search', debouncedSearch)
      next.set('status', status)
      next.set('type', type)
      if (from) next.set('from', from)
      else next.delete('from')
      if (to) next.set('to', to)
      else next.delete('to')
      next.set('page', String(page))
      next.set('page_size', String(pageSize))
      return next
    })
  }, [debouncedSearch, status, type, from, to, page, pageSize, setSearchParams])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listExports({
        search: debouncedSearch,
        status: status === 'todos' ? '' : status,
        type: type === 'todos' ? '' : type,
        requested_from: from || undefined,
        requested_to: to || undefined,
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
  }, [debouncedSearch, status, type, from, to, page, pageSize])

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
    setStatus('todos')
    setType('todos')
    setFrom('')
    setTo('')
    setPage(1)
    setPageSize(10)
  }

  const temFiltros = searchInput || status !== 'todos' || type !== 'todos' || from || to

  const verDetalhes = (exportId) => {
    navigate(`/admin/exports/${exportId}`, { state: { returnTo: `/admin/exports${location.search || ''}` } })
    setMenuAberto(null)
  }

  const canDownload = (item) => {
    if (item.status !== 'completed') return false
    if (!item.expires_at) return true
    return new Date(item.expires_at) > new Date()
  }

  const handleDownload = async (exportId) => {
    setMenuAberto(null)
    try {
      const { getDownloadLink } = await import('../../api/exports')
      const { temporary_download_url } = await getDownloadLink(exportId)
      window.open(temporary_download_url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      alert(err.message || 'Não foi possível obter o link de download.')
    }
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Relatórios Estratégicos', to: '/admin/reports/strategic' },
    { label: 'Exportações' },
  ]

  const colCount = 8

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Exportações">
      <div style={styles.cardGrande}>
        <div style={styles.cabecalho}>
          <div>
            <h2 style={styles.tituloPagina}>Exportações</h2>
            <p style={styles.subtitulo}>Gere e baixe relatórios em CSV</p>
          </div>
          <div style={styles.cabecalhoDireita}>
            <div style={styles.buscaWrap}>
              <span style={styles.buscaIcon} aria-hidden="true">
                <IconSearch />
              </span>
              <input
                type="search"
                placeholder="Buscar por ID ou tipo de exportação"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={styles.buscaInput}
                aria-label="Buscar exportações"
                disabled={loading}
              />
            </div>
            <Link to="/admin/exports/new" style={styles.btnPrimario} className="btn-hover">
              Nova exportação
            </Link>
          </div>
        </div>

        <div style={styles.filtros}>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            style={styles.select}
            aria-label="Status"
            disabled={loading}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1) }}
            style={styles.select}
            aria-label="Tipo"
            disabled={loading}
          >
            <option value="todos">Todos</option>
            {(types.length ? types : [{ value: 'schools', label: 'Escolas' }, { value: 'franchisors', label: 'Franqueadores' }, { value: 'subscriptions', label: 'Assinaturas' }, { value: 'finance_global', label: 'Financeiro (global)' }, { value: 'delinquency', label: 'Inadimplência' }, { value: 'kpis_summary', label: 'KPIs (resumo)' }]).map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <span style={styles.filtroPeriodo}>
            <label style={styles.labelPeriodo}>Data de solicitação</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1) }}
              style={styles.inputDate}
              disabled={loading}
              aria-label="De"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1) }}
              style={styles.inputDate}
              disabled={loading}
              aria-label="Até"
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
            <p style={styles.erroTexto}>Não foi possível carregar exportações. Tente novamente.</p>
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
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Filtros aplicados</th>
                    <th style={styles.th}>Solicitado por</th>
                    <th style={styles.th}>Solicitado em</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Expira em</th>
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
                          <p style={styles.emptyTitulo}>Nenhuma exportação encontrada.</p>
                          <p style={styles.emptyTexto}>Crie uma nova exportação ou ajuste os filtros.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    data?.data?.length > 0 &&
                    data.data.map((exp) => (
                      <tr key={exp.id} style={styles.tr}>
                        <td style={styles.td}>{exp.id || '—'}</td>
                        <td style={styles.td}>{typeLabel(exp.type)}</td>
                        <td style={styles.td}>{exp.filters_summary || '—'}</td>
                        <td style={styles.td}>{exp.requested_by || '—'}</td>
                        <td style={styles.td}>{formatExportDate(exp.requested_at)}</td>
                        <td style={styles.td}>
                          <StatusBadge status={exp.status} />
                        </td>
                        <td style={styles.td}>{exp.expires_at ? formatExportDate(exp.expires_at) : '—'}</td>
                        <td style={styles.td}>
                          <div style={styles.acoesCel} data-menu-wrap>
                            <button
                              type="button"
                              style={styles.btnMenu}
                              onClick={() => setMenuAberto(menuAberto === exp.id ? null : exp.id)}
                              aria-haspopup="true"
                              aria-expanded={menuAberto === exp.id}
                              aria-label="Ações"
                              disabled={loading}
                            >
                              <IconMore />
                            </button>
                            {menuAberto === exp.id && (
                              <div style={styles.dropdown}>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => verDetalhes(exp.id)}
                                >
                                  Ver detalhes
                                </button>
                                {canDownload(exp) && (
                                  <button
                                    type="button"
                                    data-dropdown-item
                                    style={styles.dropdownItem}
                                    onClick={() => handleDownload(exp.id)}
                                  >
                                    Baixar
                                  </button>
                                )}
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
  cabecalhoDireita: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
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
    textDecoration: 'none',
    display: 'inline-block',
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
  tr: {},
  tdVazio: {
    padding: GRID * 6,
    textAlign: 'center',
    verticalAlign: 'middle',
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
