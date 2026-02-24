import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useDebounce } from '../../hooks/useDebounce'
import { listTickets, formatTicketDate } from '../../api/support'

const GRID = 8
const OPCOES_POR_PAGINA = [10, 25, 50]
const DEBOUNCE_MS = 500

const STATUS_OPCOES = [
  { value: 'todos', label: 'Todos' },
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'closed', label: 'Fechado' },
]
const TYPE_OPCOES = [
  { value: 'todos', label: 'Todos' },
  { value: 'duvida', label: 'Dúvida' },
  { value: 'problema', label: 'Problema' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'cadastro', label: 'Cadastro' },
  { value: 'outros', label: 'Outros' },
]
const PRIORITY_OPCOES = [
  { value: 'todos', label: 'Todos' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
]
const CONTEXT_OPCOES = [
  { value: 'todos', label: 'Todos' },
  { value: 'FRANCHISOR', label: 'Franqueador' },
  { value: 'SCHOOL', label: 'Escola' },
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

function getStatusLabel(value) {
  return STATUS_OPCOES.find((o) => o.value === value)?.label || value || '—'
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const estilo =
    s === 'open'
      ? { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' }
      : s === 'in_progress'
        ? { background: 'rgba(255, 193, 7, 0.2)', color: '#b8860b' }
        : s === 'resolved'
          ? { background: 'rgba(76, 203, 138, 0.15)', color: 'var(--verde-patrocinio)' }
          : s === 'closed'
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
      {getStatusLabel(status)}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} style={styles.td}>
          <span
            style={{
              display: 'inline-block',
              height: 16,
              width: i === 1 ? 120 : 80,
              background: 'var(--cinza-arquibancada)',
              borderRadius: 4,
            }}
          />
        </td>
      ))}
    </tr>
  )
}

/** Retorna texto do contexto (Escola/Franqueador + nome ou ID). */
function ContextCell({ ticket }) {
  if (ticket.context_type === 'SCHOOL' && ticket.school_id) {
    const label = ticket.school_name ? `Escola: ${ticket.school_name}` : `Escola #${ticket.school_id}`
    return (
      <Link
        to={`/admin/escolas/${ticket.school_id}`}
        style={styles.linkContexto}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </Link>
    )
  }
  if (ticket.context_type === 'FRANCHISOR' && ticket.franchisor_id) {
    const label = ticket.franchisor_name
      ? `Franqueador: ${ticket.franchisor_name}`
      : `Franqueador #${ticket.franchisor_id}`
    return (
      <Link
        to={`/admin/franqueadores/${ticket.franchisor_id}?tab=overview`}
        style={styles.linkContexto}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </Link>
    )
  }
  return <span>—</span>
}

export default function CentralSuporte() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const searchFromUrl = searchParams.get('search') || ''
  const statusFromUrl = searchParams.get('status') || 'todos'
  const typeFromUrl = searchParams.get('type') || 'todos'
  const priorityFromUrl = searchParams.get('priority') || 'todos'
  const contextFromUrl = searchParams.get('context') || 'todos'
  const schoolIdFromUrl = searchParams.get('school_id') || ''
  const franchisorIdFromUrl = searchParams.get('franchisor_id') || ''
  const fromFromUrl = searchParams.get('from') || ''
  const toFromUrl = searchParams.get('to') || ''
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSizeFromUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size') || '10', 10)) || 10)

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)

  const [status, setStatus] = useState(statusFromUrl)
  const [type, setType] = useState(typeFromUrl)
  const [priority, setPriority] = useState(priorityFromUrl)
  const [context, setContext] = useState(contextFromUrl)
  const [schoolId, setSchoolId] = useState(schoolIdFromUrl)
  const [franchisorId, setFranchisorId] = useState(franchisorIdFromUrl)
  const [from, setFrom] = useState(fromFromUrl)
  const [to, setTo] = useState(toFromUrl)
  const [page, setPage] = useState(pageFromUrl)
  const [pageSize, setPageSize] = useState(pageSizeFromUrl)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [menuAberto, setMenuAberto] = useState(null)

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('search', debouncedSearch)
      next.set('status', status)
      next.set('type', type)
      next.set('priority', priority)
      next.set('context', context)
      next.set('school_id', schoolId)
      next.set('franchisor_id', franchisorId)
      next.set('from', from)
      next.set('to', to)
      next.set('page', String(page))
      next.set('page_size', String(pageSize))
      return next
    })
  }, [
    debouncedSearch,
    status,
    type,
    priority,
    context,
    schoolId,
    franchisorId,
    from,
    to,
    page,
    pageSize,
    setSearchParams,
  ])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listTickets({
        search: debouncedSearch,
        status: status === 'todos' ? '' : status,
        type: type === 'todos' ? '' : type,
        priority: priority === 'todos' ? '' : priority,
        context_type: context === 'todos' ? '' : context,
        school_id: schoolId.trim() || undefined,
        franchisor_id: franchisorId.trim() || undefined,
        from: from.trim() || undefined,
        to: to.trim() || undefined,
        page,
        page_size: pageSize,
      })
      setData(res)
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(err.message || 'Erro ao carregar')
      }
    } finally {
      setLoading(false)
    }
  }, [
    debouncedSearch,
    status,
    type,
    priority,
    context,
    schoolId,
    franchisorId,
    from,
    to,
    page,
    pageSize,
  ])

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
    setPriority('todos')
    setContext('todos')
    setSchoolId('')
    setFranchisorId('')
    setFrom('')
    setTo('')
    setPage(1)
    setPageSize(10)
  }

  const temFiltros =
    searchInput ||
    status !== 'todos' ||
    type !== 'todos' ||
    priority !== 'todos' ||
    context !== 'todos' ||
    schoolId ||
    franchisorId ||
    from ||
    to

  const returnToQuery = searchParams.toString()
  const baseSupportUrl = '/admin/support'
  const detailUrlWithReturn = (ticketId) =>
    `${baseSupportUrl}/${ticketId}${returnToQuery ? `?returnTo=${encodeURIComponent(baseSupportUrl + '?' + returnToQuery)}` : ''}`

  const irDetalhe = (ticketId) => {
    navigate(detailUrlWithReturn(ticketId))
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Suporte', to: '/admin/support' },
    { label: 'Central de solicitações' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Suporte">
      <div style={styles.cardGrande}>
        <div style={styles.cabecalho}>
          <h2 style={styles.tituloPagina}>Suporte</h2>
          <div style={styles.cabecalhoAcoes}>
            <Link
              to={`/admin/support/categories${returnToQuery ? `?returnTo=${encodeURIComponent(baseSupportUrl + '?' + returnToQuery)}` : ''}`}
              style={styles.linkGerenciarCategorias}
            >
              Gerenciar categorias
            </Link>
            <div style={styles.buscaWrap}>
              <span style={styles.buscaIcon} aria-hidden="true">
                <IconSearch />
              </span>
              <input
                type="search"
                placeholder="Buscar por assunto, ID do ticket, email do solicitante"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={styles.buscaInput}
                aria-label="Buscar solicitações"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div style={styles.filtros}>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            style={styles.select}
            aria-label="Status"
            disabled={loading}
          >
            {STATUS_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setPage(1)
            }}
            style={styles.select}
            aria-label="Tipo"
            disabled={loading}
          >
            {TYPE_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value)
              setPage(1)
            }}
            style={styles.select}
            aria-label="Prioridade"
            disabled={loading}
          >
            {PRIORITY_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={context}
            onChange={(e) => {
              setContext(e.target.value)
              setPage(1)
            }}
            style={styles.select}
            aria-label="Contexto"
            disabled={loading}
          >
            {CONTEXT_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filtrar por school_id"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            onBlur={() => setPage(1)}
            style={styles.inputFiltro}
            aria-label="ID da escola"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Filtrar por franchisor_id"
            value={franchisorId}
            onChange={(e) => setFranchisorId(e.target.value)}
            onBlur={() => setPage(1)}
            style={styles.inputFiltro}
            aria-label="ID do franqueador"
            disabled={loading}
          />
          <label style={styles.labelData}>
            De:
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={styles.inputData}
              disabled={loading}
            />
          </label>
          <label style={styles.labelData}>
            Até:
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={styles.inputData}
              disabled={loading}
            />
          </label>
          <button
            type="button"
            onClick={() => setPage(1)}
            style={styles.btnAplicar}
            disabled={loading}
          >
            Aplicar filtros
          </button>
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
          <div style={styles.erro} role="alert">
            <p style={styles.erroTexto}>Não foi possível carregar as solicitações. Tente novamente.</p>
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
                    <th style={styles.th}>Assunto</th>
                    <th style={styles.th}>Solicitante</th>
                    <th style={styles.th}>Contexto</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Última atualização</th>
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
                          <p style={styles.emptyTitulo}>Nenhuma solicitação encontrada</p>
                          <p style={styles.emptyTexto}>Ajuste os filtros para ver resultados.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    data?.data?.length > 0 &&
                    data.data.map((ticket) => (
                      <tr
                        key={ticket.id}
                        style={styles.trClickable}
                        onClick={() => irDetalhe(ticket.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && irDetalhe(ticket.id)}
                        aria-label={`Ver ticket ${ticket.id}`}
                      >
                        <td style={styles.td}>{ticket.id}</td>
                        <td style={styles.td}>{ticket.subject || '—'}</td>
                        <td style={styles.td}>
                          {ticket.requester_name
                            ? `${ticket.requester_name} (${ticket.requester_email || '—'})`
                            : ticket.requester_email || '—'}
                        </td>
                        <td style={styles.td}>
                          <ContextCell ticket={ticket} />
                        </td>
                        <td style={styles.td}>
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td style={styles.td}>{formatTicketDate(ticket.updated_at)}</td>
                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                          <div style={styles.acoesCel} data-menu-wrap>
                            <button
                              type="button"
                              style={styles.btnMenu}
                              onClick={() => setMenuAberto(menuAberto === ticket.id ? null : ticket.id)}
                              aria-haspopup="true"
                              aria-expanded={menuAberto === ticket.id}
                              aria-label="Ações"
                              disabled={loading}
                            >
                              <IconMore />
                            </button>
                            {menuAberto === ticket.id && (
                              <div style={styles.dropdown}>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => {
                                    irDetalhe(ticket.id)
                                    setMenuAberto(null)
                                  }}
                                >
                                  Ver ticket
                                </button>
                                {ticket.school_id && (
                                  <button
                                    type="button"
                                    data-dropdown-item
                                    style={styles.dropdownItem}
                                    onClick={() => {
                                      navigate(`/admin/escolas/${ticket.school_id}`)
                                      setMenuAberto(null)
                                    }}
                                  >
                                    Abrir escola
                                  </button>
                                )}
                                {ticket.franchisor_id && (
                                  <button
                                    type="button"
                                    data-dropdown-item
                                    style={styles.dropdownItem}
                                    onClick={() => {
                                      navigate(`/admin/franqueadores/${ticket.franchisor_id}?tab=overview`)
                                      setMenuAberto(null)
                                    }}
                                  >
                                    Abrir franqueador
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
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1)
                      }}
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
    width: 380,
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
  inputFiltro: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    width: 160,
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
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
  },
  btnAplicar: {
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
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
  linkContexto: {
    color: 'var(--azul-arena)',
    textDecoration: 'none',
  },
  linkGerenciarCategorias: {
    color: 'var(--azul-arena)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid var(--azul-arena)',
    borderRadius: 'var(--radius)',
    display: 'inline-block',
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
    textDecoration: 'none',
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
