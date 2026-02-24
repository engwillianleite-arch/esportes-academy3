import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useDebounce } from '../../hooks/useDebounce'
import {
  listAuditLogs,
  formatOccurredAt,
  ENTITY_TYPES,
  EVENT_TYPES,
} from '../../api/auditLogs'

const GRID = 8
const OPCOES_POR_PAGINA = [10, 25, 50]
const DEBOUNCE_MS = 500

// Default: últimos 30 dias para performance
function getDefaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
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

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} style={styles.td}>
          <span
            style={{
              display: 'inline-block',
              height: 16,
              width: i === 1 ? 100 : 80,
              background: 'var(--cinza-arquibancada)',
              borderRadius: 4,
            }}
          />
        </td>
      ))}
    </tr>
  )
}

/** Retorna a URL do detalhe da entidade conforme o tipo (quando existir rota) */
function getEntityLink(entityType, entityId) {
  if (!entityId) return null
  switch (entityType) {
    case 'school':
      return `/admin/escolas/${entityId}`
    case 'franchisor':
      return `/admin/franqueadores/${entityId}?tab=overview`
    case 'plan':
      return `/admin/plans/${entityId}/edit`
    case 'subscription':
      return `/admin/subscriptions/${entityId}`
    case 'TEMPLATE':
      return `/admin/templates/${entityId}`
    default:
      return null
  }
}

function EntityCell({ entityType, entityId }) {
  const link = getEntityLink(entityType, entityId)
  const label = entityType && entityId ? `${entityType} #${entityId}` : '—'
  if (link) {
    return (
      <Link to={link} style={styles.linkEntidade} onClick={(e) => e.stopPropagation()}>
        {label}
      </Link>
    )
  }
  return <span>{label}</span>
}

export default function LogsAuditoria() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const defaultRange = getDefaultDateRange()

  const searchFromUrl = searchParams.get('search') || ''
  const actorFromUrl = searchParams.get('actor') || ''
  const entityTypeFromUrl = searchParams.get('entity_type') || ''
  const entityIdFromUrl = searchParams.get('entity_id') || ''
  const schoolIdFromUrl = searchParams.get('school_id') || ''
  const eventTypeFromUrl = searchParams.get('event_type') || ''
  const fromFromUrl = searchParams.get('from') || defaultRange.from
  const toFromUrl = searchParams.get('to') || defaultRange.to
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSizeFromUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size') || '10', 10)) || 10)

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)

  const [actor, setActor] = useState(actorFromUrl)
  const [entityType, setEntityType] = useState(entityTypeFromUrl)
  const [entityId, setEntityId] = useState(entityIdFromUrl)
  const [schoolId, setSchoolId] = useState(schoolIdFromUrl)
  const [eventType, setEventType] = useState(eventTypeFromUrl)
  const [from, setFrom] = useState(fromFromUrl)
  const [to, setTo] = useState(toFromUrl)
  const [page, setPage] = useState(pageFromUrl)
  const [pageSize, setPageSize] = useState(pageSizeFromUrl)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('search', debouncedSearch)
      next.set('actor', actor)
      next.set('entity_type', entityType)
      next.set('entity_id', entityId)
      next.set('school_id', schoolId)
      next.set('event_type', eventType)
      next.set('from', from)
      next.set('to', to)
      next.set('page', String(page))
      next.set('page_size', String(pageSize))
      return next
    })
  }, [debouncedSearch, actor, entityType, entityId, schoolId, eventType, from, to, page, pageSize, setSearchParams])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAuditLogs({
        search: debouncedSearch,
        actor: actor.trim() || undefined,
        entity_type: entityType || undefined,
        entity_id: entityId.trim() || undefined,
        school_id: schoolId === '__empty__' ? '__empty__' : schoolId.trim() || undefined,
        event_type: eventType || undefined,
        from: from || undefined,
        to: to || undefined,
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
    actor,
    entityType,
    entityId,
    schoolId,
    eventType,
    from,
    to,
    page,
    pageSize,
  ])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const limparFiltros = () => {
    setSearchInput('')
    setActor('')
    setEntityType('')
    setEntityId('')
    setSchoolId('')
    setEventType('')
    const def = getDefaultDateRange()
    setFrom(def.from)
    setTo(def.to)
    setPage(1)
    setPageSize(10)
  }

  const temFiltros =
    searchInput ||
    actor ||
    entityType ||
    entityId ||
    schoolId ||
    eventType ||
    from !== defaultRange.from ||
    to !== defaultRange.to

  const irDetalhe = (eventId) => {
    navigate(`/admin/audit-logs/${eventId}?${searchParams.toString()}`)
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Auditoria', to: '/admin/audit-logs' },
    { label: 'Logs' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Auditoria">
      <div style={styles.cardGrande}>
        <div style={styles.cabecalho}>
          <div>
            <h2 style={styles.tituloPagina}>Auditoria</h2>
            <p style={styles.subtitulo}>Registro de ações administrativas e operacionais</p>
          </div>
          <div style={styles.buscaWrap}>
            <span style={styles.buscaIcon} aria-hidden="true">
              <IconSearch />
            </span>
            <input
              type="search"
              placeholder="Buscar por ID, email do ator ou ID da entidade"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={styles.buscaInput}
              aria-label="Buscar logs"
              disabled={loading}
            />
          </div>
        </div>

        <div style={styles.filtros}>
          <input
            type="text"
            placeholder="Ator (email ou nome)"
            value={actor}
            onChange={(e) => {
              setActor(e.target.value)
              setPage(1)
            }}
            style={styles.inputTexto}
            aria-label="Ator"
            disabled={loading}
          />
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value)
              setPage(1)
            }}
            style={styles.select}
            aria-label="Tipo de entidade"
            disabled={loading}
          >
            {ENTITY_TYPES.map((opt) => (
              <option key={opt.value || 'todos'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="ID da entidade"
            value={entityId}
            onChange={(e) => {
              setEntityId(e.target.value)
              setPage(1)
            }}
            style={styles.inputTexto}
            aria-label="ID da entidade"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Escola (school_id)"
            value={schoolId === '__empty__' ? '' : schoolId}
            onChange={(e) => {
              setSchoolId(e.target.value)
              setPage(1)
            }}
            style={styles.inputTexto}
            aria-label="ID da escola"
            disabled={loading}
            title="Deixe vazio para todas; use para filtrar por escola"
          />
          <select
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value)
              setPage(1)
            }}
            style={styles.select}
            aria-label="Ação / Event Type"
            disabled={loading}
          >
            {EVENT_TYPES.map((opt) => (
              <option key={opt.value || 'todos'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label style={styles.labelData}>
            De:
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
              style={styles.inputData}
              disabled={loading}
            />
          </label>
          <label style={styles.labelData}>
            Até:
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
              style={styles.inputData}
              disabled={loading}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setPage(1)
              fetchList()
            }}
            style={styles.btnPrimario}
            className="btn-hover"
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
          <div style={styles.erro}>
            <p style={styles.erroTexto}>
              Não foi possível carregar os logs de auditoria. Tente novamente.
            </p>
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
                    <th style={styles.th}>Data/hora</th>
                    <th style={styles.th}>Ator</th>
                    <th style={styles.th}>Ação</th>
                    <th style={styles.th}>Entidade</th>
                    <th style={styles.th}>Escola</th>
                    <th style={styles.th}>IP / Origem</th>
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
                          <p style={styles.emptyTitulo}>Nenhum evento encontrado</p>
                          <p style={styles.emptyTexto}>Ajuste os filtros ou amplie o período.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    data?.data?.length > 0 &&
                    data.data.map((ev) => (
                      <tr
                        key={ev.id}
                        style={styles.trClickable}
                        onClick={() => irDetalhe(ev.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && irDetalhe(ev.id)}
                        aria-label={`Ver detalhe do evento ${ev.id}`}
                      >
                        <td style={styles.td}>{formatOccurredAt(ev.occurred_at)}</td>
                        <td style={styles.td}>
                          {ev.actor_name || ev.actor_email || '—'}
                          {ev.actor_email && (
                            <span style={styles.actorEmail}> ({ev.actor_email})</span>
                          )}
                        </td>
                        <td style={styles.td}>{ev.event_type || '—'}</td>
                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                          <EntityCell entityType={ev.entity_type} entityId={ev.entity_id} />
                        </td>
                        <td style={styles.td}>{ev.school_id ?? '—'}</td>
                        <td style={styles.td}>{ev.ip_address ?? '—'}</td>
                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            style={styles.btnVerDetalhe}
                            className="btn-hover"
                            onClick={() => irDetalhe(ev.id)}
                            disabled={loading}
                          >
                            Ver detalhe
                          </button>
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
    margin: `${GRID}px 0 0`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  buscaWrap: {
    position: 'relative',
    width: 360,
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
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  inputTexto: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    minWidth: 140,
    outline: 'none',
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
  actorEmail: {
    fontSize: 12,
    opacity: 0.85,
  },
  linkEntidade: {
    color: 'var(--azul-arena)',
    textDecoration: 'none',
  },
  btnVerDetalhe: {
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    padding: `${GRID}px ${GRID * 2}px`,
    borderRadius: 'var(--radius)',
    fontSize: 13,
    fontWeight: 500,
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
