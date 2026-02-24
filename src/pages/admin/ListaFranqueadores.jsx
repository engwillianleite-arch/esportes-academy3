import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useDebounce } from '../../hooks/useDebounce'
import { listFranqueadores, formatCreatedAt } from '../../api/franqueadores'

const GRID = 8
const OPCOES_POR_PAGINA = [10, 25, 50]
const DEBOUNCE_MS = 500

// ——— Ícones ———
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
    s === 'ativo'
      ? { background: 'rgba(76, 203, 138, 0.15)', color: 'var(--verde-patrocinio)' }
      : s === 'pendente'
        ? { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' }
        : s === 'suspenso'
          ? { background: 'rgba(220, 53, 69, 0.15)', color: '#dc3545' }
          : { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' }
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
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} style={styles.td}>
          <span style={{ display: 'inline-block', height: 16, width: i === 1 ? 120 : 80, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  )
}

export default function ListaFranqueadores() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const searchFromUrl = searchParams.get('search') || ''
  const statusFromUrl = searchParams.get('status') || 'todos'
  const createdFromUrl = searchParams.get('created_from') || ''
  const createdToUrl = searchParams.get('created_to') || ''
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSizeFromUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size') || '10', 10)) || 10)

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)

  const [status, setStatus] = useState(statusFromUrl)
  const [createdFrom, setCreatedFrom] = useState(createdFromUrl)
  const [createdTo, setCreatedTo] = useState(createdToUrl)
  const [page, setPage] = useState(pageFromUrl)
  const [pageSize, setPageSize] = useState(pageSizeFromUrl)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [menuAberto, setMenuAberto] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Persistir filtros e paginação na URL (voltar do detalhe mantém estado)
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('search', debouncedSearch)
      next.set('status', status)
      next.set('created_from', createdFrom)
      next.set('created_to', createdTo)
      next.set('page', String(page))
      next.set('page_size', String(pageSize))
      return next
    })
  }, [debouncedSearch, status, createdFrom, createdTo, page, pageSize, setSearchParams])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listFranqueadores({
        search: debouncedSearch,
        status: status === 'todos' ? '' : status,
        created_from: createdFrom || undefined,
        created_to: createdTo || undefined,
        page,
        page_size: pageSize,
      })
      setData(res)
      // Simular permissão negada: se o backend retornar 403, setPermissionDenied(true)
    } catch (err) {
      setError(err.message || 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, createdFrom, createdTo, page, pageSize])

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
    setCreatedFrom('')
    setCreatedTo('')
    setPage(1)
    setPageSize(10)
  }

  const temFiltros = searchInput || status !== 'todos' || createdFrom || createdTo

  const irDetalhe = (id, tab = null) => {
    const url = tab ? `/admin/franqueadores/${id}?tab=escolas` : `/admin/franqueadores/${id}`
    navigate(url)
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Franqueadores', to: '/admin/franqueadores' },
    { label: 'Lista' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb}>
      <div style={styles.cardGrande}>
        {/* Cabeçalho da tela */}
        <div style={styles.cabecalho}>
          <h2 style={styles.tituloPagina}>Franqueadores</h2>
          <div style={styles.cabecalhoAcoes}>
            <div style={styles.buscaWrap}>
              <span style={styles.buscaIcon} aria-hidden="true">
                <IconSearch />
              </span>
              <input
                type="search"
                placeholder="Buscar por nome, email ou documento"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={styles.buscaInput}
                aria-label="Buscar franqueadores"
                disabled={loading}
              />
            </div>
            <button
              type="button"
              style={styles.btnPrimario}
              className="btn-hover"
              onClick={() => navigate('/admin/franqueadores/novo')}
              disabled={loading}
            >
              Novo franqueador
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={styles.filtros}>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            style={styles.select}
            aria-label="Status"
            disabled={loading}
          >
            <option value="todos">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="pendente">Pendente</option>
            <option value="suspenso">Suspenso</option>
          </select>
          <label style={styles.labelData}>
            De:
            <input
              type="date"
              value={createdFrom}
              onChange={(e) => { setCreatedFrom(e.target.value); setPage(1) }}
              style={styles.inputData}
              disabled={loading}
            />
          </label>
          <label style={styles.labelData}>
            Até:
            <input
              type="date"
              value={createdTo}
              onChange={(e) => { setCreatedTo(e.target.value); setPage(1) }}
              style={styles.inputData}
              disabled={loading}
            />
          </label>
          <button
            type="button"
            onClick={limparFiltros}
            style={styles.btnLimpar}
            disabled={loading || !temFiltros}
          >
            Limpar filtros
          </button>
        </div>

        {/* Erro de API */}
        {error && (
          <div style={styles.erro}>
            <p style={styles.erroTexto}>Não foi possível carregar os franqueadores. Tente novamente.</p>
            <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={fetchList}>
              Recarregar
            </button>
          </div>
        )}

        {/* Tabela ou estados vazio/carregando */}
        {!error && (
          <>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome do franqueador</th>
                    <th style={styles.th}>Responsável</th>
                    <th style={styles.th}>Email principal</th>
                    <th style={styles.th}>Qtde de escolas</th>
                    <th style={styles.th}>Status</th>
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
                      <td colSpan={7} style={styles.tdVazio}>
                        <div style={styles.emptyWrap}>
                          <p style={styles.emptyTitulo}>Nenhum franqueador encontrado</p>
                          <p style={styles.emptyTexto}>Ajuste os filtros ou cadastre um novo franqueador.</p>
                          <button
                            type="button"
                            style={styles.btnPrimario}
                            className="btn-hover"
                            onClick={() => navigate('/admin/franqueadores/novo')}
                          >
                            Novo franqueador
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && data?.data?.length > 0 &&
                    data.data.map((f) => (
                      <tr
                        key={f.id}
                        style={styles.trClickable}
                        onClick={() => irDetalhe(f.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && irDetalhe(f.id)}
                        aria-label={`Ver detalhes de ${f.name}`}
                      >
                        <td style={styles.td}>{f.name}</td>
                        <td style={styles.td}>{f.owner_name}</td>
                        <td style={styles.td}>{f.email}</td>
                        <td style={styles.td}>{f.schools_count}</td>
                        <td style={styles.td}>
                          <StatusBadge status={f.status} />
                        </td>
                        <td style={styles.td}>{formatCreatedAt(f.created_at)}</td>
                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                          <div style={styles.acoesCel} data-menu-wrap>
                            <button
                              type="button"
                              style={styles.btnMenu}
                              onClick={() => setMenuAberto(menuAberto === f.id ? null : f.id)}
                              aria-haspopup="true"
                              aria-expanded={menuAberto === f.id}
                              aria-label="Ações"
                              disabled={loading}
                            >
                              <IconMore />
                            </button>
                            {menuAberto === f.id && (
                              <div style={styles.dropdown}>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => { irDetalhe(f.id); setMenuAberto(null) }}
                                >
                                  Ver detalhes
                                </button>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => { irDetalhe(f.id, 'escolas'); setMenuAberto(null) }}
                                >
                                  Ver escolas
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

            {/* Rodapé: paginação */}
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
                        <option key={n} value={n}>
                          {n}
                        </option>
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
    alignItems: 'center',
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
  cabecalhoAcoes: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  buscaWrap: {
    position: 'relative',
    width: 280,
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
  labelData: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  inputData: {
    padding: `${GRID}px ${GRID * 2}px`,
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
