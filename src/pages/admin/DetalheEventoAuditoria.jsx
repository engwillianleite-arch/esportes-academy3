import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAuditLogEvent, formatOccurredAt } from '../../api/auditLogs'

const GRID = 8
const USER_AGENT_TRUNCATE = 60
const MAX_FIELD_LENGTH = 80

/** Tipos de entidade aceitos pelo backend (spec pode vir em maiúsculo) */
function normalizeEntityType(t) {
  if (!t) return t
  const lower = String(t).toLowerCase()
  const map = { school: 'school', franchisor: 'franchisor', plan: 'plan', subscription: 'subscription', user: 'user', membership: 'membership' }
  return map[lower] || lower
}

function getEntityLink(entityType, entityId) {
  if (!entityId) return null
  const type = normalizeEntityType(entityType)
  switch (type) {
    case 'school':
      return `/admin/escolas/${entityId}`
    case 'franchisor':
      return `/admin/franqueadores/${entityId}?tab=overview`
    case 'plan':
      return `/admin/plans/${entityId}/edit`
    case 'subscription':
      return `/admin/subscriptions/${entityId}`
    default:
      return null
  }
}

/** Campos sensíveis que devem ser mascarados na exibição de alterações */
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'api_key', 'secret_key', 'authorization', 'cookie']

function isSensitiveField(fieldName) {
  const key = String(fieldName || '').toLowerCase()
  return SENSITIVE_KEYS.some((s) => key.includes(s))
}

function maskValue(value) {
  return value === null || value === undefined ? '—' : '••••••••'
}

/** Extrai lista de alterações: prioridade diff_list > changes (before/after) > metadata (before/after) */
function getChangesList(event) {
  const changes = event?.changes || event?.metadata
  if (!changes) return []
  if (Array.isArray(changes.diff_list) && changes.diff_list.length > 0) {
    return changes.diff_list.map((d) => ({
      field: d.field ?? '—',
      before: d.before,
      after: d.after,
    }))
  }
  const before = changes.before && typeof changes.before === 'object' ? changes.before : {}
  const after = changes.after && typeof changes.after === 'object' ? changes.after : {}
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  return Array.from(allKeys).map((key) => ({
    field: key,
    before: before[key],
    after: after[key],
  }))
}

function SkeletonLine({ width = '80%' }) {
  return (
    <div
      style={{
        height: 16,
        background: 'var(--cinza-arquibancada)',
        borderRadius: 4,
        width,
        marginBottom: GRID,
      }}
    />
  )
}

function SkeletonCard() {
  return (
    <div style={styles.cardInner}>
      <div style={{ marginBottom: GRID * 2 }}>
        <SkeletonLine width="40%" />
      </div>
      <SkeletonLine />
      <SkeletonLine />
      <SkeletonLine width="70%" />
      <SkeletonLine width="50%" />
    </div>
  )
}

export default function DetalheEventoAuditoria() {
  const { audit_event_id: eventId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const search = location.search || ''
  const backUrl = `/admin/audit-logs${search}`

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [userAgentExpanded, setUserAgentExpanded] = useState(false)
  const [metadataExpanded, setMetadataExpanded] = useState(false)
  const [expandedFields, setExpandedFields] = useState({})

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    setPermissionDenied(false)
    try {
      const data = await getAuditLogEvent(eventId)
      setEvent(data)
    } catch (e) {
      if (e.status === 403) {
        setPermissionDenied(true)
      } else if (e.status === 404) {
        setNotFound(true)
      } else {
        setError(e?.message || 'Não foi possível carregar o evento de auditoria.')
      }
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  const copyToClipboard = (text, label) => {
    if (typeof navigator?.clipboard?.writeText === 'function') {
      navigator.clipboard.writeText(text)
      // Opcional: toast "Copiado"
    }
  }

  const toggleFieldExpand = (key) => {
    setExpandedFields((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Auditoria', to: '/admin/audit-logs' },
    { label: 'Logs de Auditoria', to: '/admin/audit-logs' + search },
    { label: event ? `Evento` : 'Evento' },
  ]

  const hasChanges = event && getChangesList(event).length > 0
  const changesList = event ? getChangesList(event) : []
  const hasMetadata = event && event.metadata != null && Object.keys(event.metadata || {}).length > 0
  const metadataJson = hasMetadata ? JSON.stringify(event.metadata, null, 2) : '{}'
  const userAgent = event?.user_agent ?? ''
  const showUserAgentExpand = userAgent.length > USER_AGENT_TRUNCATE

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Detalhe do evento de auditoria">
      <div style={styles.wrapper}>
        {loading && (
          <>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <SkeletonLine width="35%" />
              </div>
              <SkeletonCard />
            </div>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <SkeletonLine width="30%" />
              </div>
              <SkeletonCard />
            </div>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <SkeletonLine width="25%" />
              </div>
              <SkeletonCard />
            </div>
          </>
        )}

        {!loading && error && (
          <div style={styles.card}>
            <div style={styles.erro}>
              <p style={styles.erroTexto}>Não foi possível carregar o evento de auditoria.</p>
              <div style={styles.botoesErro}>
                <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={load}>
                  Recarregar
                </button>
                <Link to={backUrl} style={styles.btnSecundario}>
                  Voltar
                </Link>
              </div>
            </div>
          </div>
        )}

        {!loading && notFound && (
          <div style={styles.card}>
            <div style={styles.erro}>
              <p style={styles.erroTexto}>Evento não encontrado.</p>
              <Link to={backUrl} style={styles.btnPrimario}>
                Voltar para auditoria
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && !notFound && event && (
          <>
            {/* Cabeçalho */}
            <div style={styles.cabecalho}>
              <div>
                <h1 style={styles.titulo}>Evento de Auditoria</h1>
                <p style={styles.subtitulo}>ID: {event.id}</p>
              </div>
              <div style={styles.cabecalhoBotoes}>
                <button
                  type="button"
                  style={styles.btnCopiar}
                  className="btn-hover"
                  onClick={() => copyToClipboard(event.id, 'ID')}
                  title="Copiar ID"
                >
                  Copiar ID
                </button>
                <Link to={backUrl} style={styles.btnVoltar}>
                  Voltar
                </Link>
              </div>
            </div>

            {/* Card Resumo do evento */}
            <div style={styles.card}>
              <h2 style={styles.cardTitulo}>Resumo do evento</h2>
              <dl style={styles.dl}>
                <div style={styles.dlRow}>
                  <dt style={styles.dt}>Data/hora</dt>
                  <dd style={styles.dd}>{formatOccurredAt(event.occurred_at)}</dd>
                </div>
                <div style={styles.dlRow}>
                  <dt style={styles.dt}>Ação / event_type</dt>
                  <dd style={styles.dd}>{event.event_type || '—'}</dd>
                </div>
                <div style={styles.dlRow}>
                  <dt style={styles.dt}>Ator</dt>
                  <dd style={styles.dd}>
                    <span>{event.actor_name || '—'}</span>
                    {event.actor_email && <span style={styles.actorEmail}> — {event.actor_email}</span>}
                    {event.actor_user_id && (
                      <span style={styles.actorUserId}> (user_id: {event.actor_user_id})</span>
                    )}
                  </dd>
                </div>
                <div style={styles.dlRow}>
                  <dt style={styles.dt}>Entidade</dt>
                  <dd style={styles.dd}>
                    {event.entity_type || '—'} {event.entity_id != null && `#${event.entity_id}`}
                    {getEntityLink(event.entity_type, event.entity_id) ? (
                      <Link
                        to={getEntityLink(event.entity_type, event.entity_id)}
                        style={styles.link}
                      >
                        {' '}
                        Abrir entidade
                      </Link>
                    ) : event.entity_id != null ? (
                      <button
                        type="button"
                        style={styles.btnCopiarInline}
                        onClick={() => copyToClipboard(String(event.entity_id), 'entity_id')}
                        title="Copiar ID"
                      >
                        Copiar ID
                      </button>
                    ) : null}
                  </dd>
                </div>
                {event.school_id != null && (
                  <div style={styles.dlRow}>
                    <dt style={styles.dt}>Contexto de escola</dt>
                    <dd style={styles.dd}>
                      school_id: {event.school_id}{' '}
                      <Link to={`/admin/escolas/${event.school_id}`} style={styles.link}>
                        Abrir escola
                      </Link>
                    </dd>
                  </div>
                )}
                {event.franchisor_id != null && (
                  <div style={styles.dlRow}>
                    <dt style={styles.dt}>Contexto de franqueador</dt>
                    <dd style={styles.dd}>
                      franchisor_id: {event.franchisor_id}{' '}
                      <Link
                        to={`/admin/franqueadores/${event.franchisor_id}?tab=overview`}
                        style={styles.link}
                      >
                        Abrir franqueador
                      </Link>
                    </dd>
                  </div>
                )}
                {(event.ip_address != null || event.user_agent || event.source_portal) && (
                  <>
                    {event.ip_address != null && (
                      <div style={styles.dlRow}>
                        <dt style={styles.dt}>IP address</dt>
                        <dd style={styles.dd}>{event.ip_address}</dd>
                      </div>
                    )}
                    {event.user_agent != null && event.user_agent !== '' && (
                      <div style={styles.dlRow}>
                        <dt style={styles.dt}>User-Agent</dt>
                        <dd style={styles.dd}>
                          {userAgentExpanded || userAgent.length <= USER_AGENT_TRUNCATE
                            ? userAgent
                            : userAgent.slice(0, USER_AGENT_TRUNCATE) + '…'}
                          {showUserAgentExpand && (
                            <button
                              type="button"
                              style={styles.btnVerCompleto}
                              onClick={() => setUserAgentExpanded((v) => !v)}
                            >
                              {userAgentExpanded ? 'Ocultar' : 'Ver completo'}
                            </button>
                          )}
                        </dd>
                      </div>
                    )}
                    {event.source_portal != null && event.source_portal !== '' && (
                      <div style={styles.dlRow}>
                        <dt style={styles.dt}>Fonte</dt>
                        <dd style={styles.dd}>{event.source_portal}</dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </div>

            {/* Card Alterações */}
            {hasChanges && (
              <div style={styles.card}>
                <h2 style={styles.cardTitulo}>Alterações</h2>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Campo</th>
                        <th style={styles.th}>Antes</th>
                        <th style={styles.th}>Depois</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changesList.map((row, idx) => {
                        const key = row.field + idx
                        const sensitive = isSensitiveField(row.field)
                        const beforeStr =
                          sensitive ? maskValue(row.before) : (row.before === undefined || row.before === null ? '—' : String(row.before))
                        const afterStr =
                          sensitive ? maskValue(row.after) : (row.after === undefined || row.after === null ? '—' : String(row.after))
                        const beforeLong = !sensitive && beforeStr.length > MAX_FIELD_LENGTH
                        const afterLong = !sensitive && afterStr.length > MAX_FIELD_LENGTH
                        const beforeExpanded = expandedFields[`before-${key}`]
                        const afterExpanded = expandedFields[`after-${key}`]
                        return (
                          <tr key={key}>
                            <td style={styles.td}>{row.field}</td>
                            <td style={styles.td}>
                              {beforeLong
                                ? beforeExpanded
                                  ? beforeStr
                                  : beforeStr.slice(0, MAX_FIELD_LENGTH) + '…'
                                : beforeStr}
                              {beforeLong && (
                                <button
                                  type="button"
                                  style={styles.btnVerCompleto}
                                  onClick={() => toggleFieldExpand(`before-${key}`)}
                                >
                                  {beforeExpanded ? 'Ocultar' : 'Ver mais'}
                                </button>
                              )}
                            </td>
                            <td style={styles.td}>
                              {afterLong
                                ? afterExpanded
                                  ? afterStr
                                  : afterStr.slice(0, MAX_FIELD_LENGTH) + '…'
                                : afterStr}
                              {afterLong && (
                                <button
                                  type="button"
                                  style={styles.btnVerCompleto}
                                  onClick={() => toggleFieldExpand(`after-${key}`)}
                                >
                                  {afterExpanded ? 'Ocultar' : 'Ver mais'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Card Detalhes (metadata) */}
            <div style={styles.card}>
              <div style={styles.cardHeaderFlex}>
                <h2 style={styles.cardTitulo}>Detalhes (metadata)</h2>
                <button
                  type="button"
                  style={styles.btnCopiar}
                  className="btn-hover"
                  onClick={() => copyToClipboard(metadataJson, 'JSON')}
                >
                  Copiar JSON
                </button>
              </div>
              <div style={styles.metadataWrap}>
                {metadataExpanded || metadataJson.length <= 500 ? (
                  <pre style={styles.pre}>{metadataJson}</pre>
                ) : (
                  <pre style={styles.pre}>{metadataJson.slice(0, 500)}…</pre>
                )}
                {metadataJson.length > 500 && (
                  <button
                    type="button"
                    style={styles.btnVerCompleto}
                    onClick={() => setMetadataExpanded((v) => !v)}
                  >
                    {metadataExpanded ? 'Colapsar' : 'Expandir'}
                  </button>
                )}
              </div>
            </div>

            {/* Card Correlação (opcional) */}
            {event.correlation_id != null && event.correlation_id !== '' && (
              <div style={styles.card}>
                <h2 style={styles.cardTitulo}>Correlação</h2>
                <p style={styles.dl}>
                  <strong>Correlation ID:</strong> {event.correlation_id}
                </p>
                <Link
                  to={`/admin/audit-logs?correlation_id=${encodeURIComponent(event.correlation_id)}`}
                  style={styles.link}
                >
                  Ver eventos relacionados
                </Link>
              </div>
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
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cardInner: {
    padding: 0,
  },
  cardHeader: {
    marginBottom: GRID * 2,
  },
  cardHeaderFlex: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  cardTitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  cabecalho: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 3,
    marginBottom: GRID * 2,
  },
  titulo: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  subtitulo: {
    margin: `${GRID}px 0 0`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  cabecalhoBotoes: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
  },
  btnVoltar: {
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-block',
  },
  btnCopiar: {
    background: 'transparent',
    color: 'var(--azul-arena)',
    border: '1px solid var(--azul-arena)',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnCopiarInline: {
    background: 'none',
    border: 'none',
    color: 'var(--azul-arena)',
    cursor: 'pointer',
    fontSize: 13,
    marginLeft: GRID,
    textDecoration: 'underline',
  },
  erro: {
    padding: GRID * 4,
    background: 'rgba(220, 53, 69, 0.06)',
    borderRadius: 'var(--radius)',
  },
  erroTexto: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  botoesErro: {
    display: 'flex',
    gap: GRID * 2,
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
    textDecoration: 'none',
    display: 'inline-block',
  },
  btnSecundario: {
    background: 'transparent',
    color: 'var(--azul-arena)',
    border: '1px solid var(--azul-arena)',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  dl: {
    margin: 0,
  },
  dlRow: {
    marginBottom: GRID * 2,
    fontSize: 14,
  },
  dt: {
    margin: 0,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  dd: {
    margin: `${GRID * 0.5}px 0 0`,
    color: 'var(--grafite-tecnico)',
  },
  actorEmail: {
    opacity: 0.9,
  },
  actorUserId: {
    fontSize: 13,
    opacity: 0.8,
  },
  link: {
    color: 'var(--azul-arena)',
    textDecoration: 'none',
    marginLeft: GRID,
  },
  btnVerCompleto: {
    background: 'none',
    border: 'none',
    color: 'var(--azul-arena)',
    cursor: 'pointer',
    fontSize: 13,
    marginLeft: GRID,
    textDecoration: 'underline',
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
    verticalAlign: 'top',
  },
  metadataWrap: {
    position: 'relative',
  },
  pre: {
    margin: 0,
    fontSize: 12,
    fontFamily: 'monospace',
    color: 'var(--grafite-tecnico)',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    background: 'var(--cinza-arquibancada)',
    padding: GRID * 2,
    borderRadius: 'var(--radius)',
  },
}
