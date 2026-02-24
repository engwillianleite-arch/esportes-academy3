import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import {
  getTicket,
  getTicketTimeline,
  postTicketMessage,
  patchTicketStatus,
  formatTicketDate,
  TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../../api/support'

const GRID = 8

const STATUS_OPCOES = [
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'closed', label: 'Fechado' },
]

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
      {STATUS_LABELS[status] || status || '—'}
    </span>
  )
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
    <div style={styles.card}>
      <SkeletonLine width="40%" />
      <SkeletonLine />
      <SkeletonLine />
      <SkeletonLine width="60%" />
    </div>
  )
}

function TimelineItem({ item }) {
  const isSystem = item.author_type === 'SYSTEM'
  const isAdmin = item.author_type === 'ADMIN'
  const authorLabel =
    isSystem ? 'Sistema' : isAdmin ? (item.author_name || 'Admin') : (item.author_name || 'Solicitante')
  const typeLabel = item.entry_type === 'STATUS_CHANGE' ? 'Mudança de status' : 'Mensagem'
  return (
    <div style={styles.timelineItem}>
      <div style={styles.timelineItemHeader}>
        <span style={styles.timelineAuthor}>{authorLabel}</span>
        <span style={styles.timelineMeta}>
          {formatTicketDate(item.occurred_at)} · {typeLabel}
        </span>
      </div>
      <div style={styles.timelineContent}>{item.content || '—'}</div>
    </div>
  )
}

export default function DetalheTicket() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const [ticket, setTicket] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [toast, setToast] = useState(null)
  const [alertError, setAlertError] = useState(null)

  const [statusSelect, setStatusSelect] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const returnUrl = returnTo || '/admin/support'
  const isClosed = (ticket?.status || '').toLowerCase() === 'closed'

  const voltar = () => {
    if (returnTo) {
      navigate(returnTo, { replace: true })
    } else {
      navigate('/admin/support')
    }
  }

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)
    setNotFound(false)
    setPermissionDenied(false)
    setAlertError(null)
    try {
      const [t, tl] = await Promise.all([getTicket(ticketId), getTicketTimeline(ticketId)])
      setTicket(t)
      setTimeline(tl.items || [])
      setStatusSelect(t.status)
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else if (err.status === 404) {
        setNotFound(true)
      } else {
        setAlertError(err.message || 'Não foi possível carregar o ticket.')
      }
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleUpdateStatus = async () => {
    if (!ticketId || statusSelect === ticket?.status || updatingStatus) return
    setAlertError(null)
    setUpdatingStatus(true)
    try {
      const updated = await patchTicketStatus(ticketId, { status: statusSelect })
      setTicket(updated)
      const tlRes = await getTicketTimeline(ticketId)
      setTimeline(tlRes.items || [])
      setToast('Status atualizado!')
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else {
        setAlertError('Não foi possível atualizar o status. Tente novamente.')
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSendMessage = async () => {
    const content = (messageContent || '').trim()
    if (!content || !ticketId || sendingMessage) return
    setAlertError(null)
    setSendingMessage(true)
    try {
      const newItem = await postTicketMessage(ticketId, { content, visibility: 'INTERNAL' })
      setTimeline((prev) => [...prev, newItem])
      setMessageContent('')
      setToast('Mensagem enviada!')
      if (ticket) {
        setTicket((prev) => (prev ? { ...prev, updated_at: newItem.occurred_at } : prev))
      }
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else {
        setAlertError('Não foi possível enviar a mensagem. Tente novamente.')
      }
    } finally {
      setSendingMessage(false)
    }
  }

  const copyId = () => {
    if (ticketId) {
      navigator.clipboard.writeText(ticketId).then(() => setToast('ID copiado!'))
    }
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Suporte', to: returnUrl },
    { label: 'Ticket' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle={`Ticket #${ticketId || '—'}`}>
      {toast && (
        <div style={styles.toast} role="status">
          {toast}
        </div>
      )}
      {alertError && (
        <div style={styles.alertaErro} role="alert">
          {alertError}
        </div>
      )}

      {notFound && (
        <div style={styles.card}>
          <p style={styles.notFoundText}>Ticket não encontrado.</p>
          <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={voltar}>
            Voltar para suporte
          </button>
        </div>
      )}

      {!notFound && loading && (
        <>
          <div style={styles.card}>
            <SkeletonLine width="30%" />
            <SkeletonLine width="60%" />
            <SkeletonLine />
          </div>
          <div style={{ ...styles.card, marginTop: GRID * 3 }}>
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine width="90%" />
            <SkeletonLine width="70%" />
          </div>
        </>
      )}

      {!notFound && !loading && ticket && (
        <>
          {/* Cabeçalho */}
          <div style={styles.cabecalho}>
            <div style={styles.cabecalhoEsq}>
              <h2 style={styles.titulo}>Ticket #{ticket.id}</h2>
              <p style={styles.subtitulo}>{ticket.subject || '—'}</p>
              <div style={styles.badgeWrap}>
                <StatusBadge status={ticket.status} />
              </div>
            </div>
            <div style={styles.cabecalhoAcoes}>
              <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={voltar}>
                Voltar
              </button>
              <button type="button" style={styles.btnTerciario} className="btn-hover" onClick={copyId}>
                Copiar ID
              </button>
            </div>
          </div>

          {/* Card Resumo */}
          <div style={styles.card}>
            <h3 style={styles.cardTitulo}>Resumo</h3>
            <div style={styles.resumoGrid}>
              <div style={styles.resumoRow}>
                <span style={styles.resumoLabel}>Assunto</span>
                <span style={styles.resumoValor}>{ticket.subject || '—'}</span>
              </div>
              <div style={styles.resumoRow}>
                <span style={styles.resumoLabel}>Tipo/Categoria</span>
                <span style={styles.resumoValor}>{TYPE_LABELS[ticket.type] || ticket.type || '—'}</span>
              </div>
              {ticket.priority != null && (
                <div style={styles.resumoRow}>
                  <span style={styles.resumoLabel}>Prioridade</span>
                  <span style={styles.resumoValor}>{PRIORITY_LABELS[ticket.priority] || ticket.priority || '—'}</span>
                </div>
              )}
              <div style={styles.resumoRow}>
                <span style={styles.resumoLabel}>Solicitante</span>
                <span style={styles.resumoValor}>
                  {ticket.requester_name ? `${ticket.requester_name} — ${ticket.requester_email || '—'}` : ticket.requester_email || '—'}
                </span>
              </div>
              <div style={styles.resumoRow}>
                <span style={styles.resumoLabel}>Contexto</span>
                <span style={styles.resumoValor}>
                  {ticket.context_type === 'SCHOOL' && ticket.school_id ? (
                    <>
                      Escola: {ticket.school_name || `#${ticket.school_id}`}
                      <Link
                        to={`/admin/escolas/${ticket.school_id}`}
                        style={styles.linkContexto}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {' '}
                        Abrir escola
                      </Link>
                    </>
                  ) : ticket.context_type === 'FRANCHISOR' && ticket.franchisor_id ? (
                    <>
                      Franqueador: {ticket.franchisor_name || `#${ticket.franchisor_id}`}
                      <Link
                        to={`/admin/franqueadores/${ticket.franchisor_id}?tab=overview`}
                        style={styles.linkContexto}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {' '}
                        Abrir franqueador
                      </Link>
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div style={styles.resumoRow}>
                <span style={styles.resumoLabel}>Criado em</span>
                <span style={styles.resumoValor}>{formatTicketDate(ticket.created_at)}</span>
              </div>
              <div style={styles.resumoRow}>
                <span style={styles.resumoLabel}>Última atualização</span>
                <span style={styles.resumoValor}>{formatTicketDate(ticket.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Card Status */}
          <div style={styles.card}>
            <h3 style={styles.cardTitulo}>Status</h3>
            <div style={styles.statusRow}>
              <label style={styles.selectLabel}>
                Status
                <select
                  value={statusSelect}
                  onChange={(e) => setStatusSelect(e.target.value)}
                  style={styles.select}
                  disabled={isClosed}
                  aria-label="Status do ticket"
                >
                  {STATUS_OPCOES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              {!isClosed && (
                <button
                  type="button"
                  style={styles.btnPrimario}
                  className="btn-hover"
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus || statusSelect === ticket.status}
                >
                  {updatingStatus ? 'Atualizando…' : 'Atualizar status'}
                </button>
              )}
            </div>
            {isClosed && (
              <p style={styles.statusHint}>Ticket fechado. Alteração de status bloqueada no MVP.</p>
            )}
          </div>

          {/* Linha do tempo */}
          <div style={styles.card}>
            <h3 style={styles.cardTitulo}>Linha do tempo</h3>
            {timeline.length === 0 ? (
              <p style={styles.timelineVazio}>Nenhum evento ainda.</p>
            ) : (
              <div style={styles.timelineList}>
                {timeline.map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <div style={styles.card}>
            <h3 style={styles.cardTitulo}>Adicionar resposta/nota</h3>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Digite uma resposta ou nota interna…"
              style={styles.textarea}
              rows={4}
              disabled={isClosed}
              aria-label="Nova mensagem"
            />
            <div style={styles.composerAcoes}>
              <button
                type="button"
                style={styles.btnPrimario}
                className="btn-hover"
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageContent.trim() || isClosed}
              >
                {sendingMessage ? 'Enviando…' : 'Enviar'}
              </button>
              <button
                type="button"
                style={styles.btnSecundario}
                className="btn-hover"
                onClick={() => setMessageContent('')}
                disabled={sendingMessage || !messageContent}
              >
                Limpar
              </button>
            </div>
            {isClosed && (
              <p style={styles.statusHint}>Ticket fechado. Não é possível adicionar mensagens.</p>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}

const styles = {
  toast: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'rgba(76, 203, 138, 0.15)',
    color: 'var(--verde-patrocinio)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
    fontWeight: 500,
  },
  alertaErro: {
    background: 'rgba(220, 53, 69, 0.08)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
    color: '#721c24',
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 3,
  },
  cardTitulo: {
    margin: '0 0 ' + GRID * 3 + 'px',
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
    marginBottom: GRID * 3,
  },
  cabecalhoEsq: { flex: '1 1 300px' },
  titulo: {
    margin: '0 0 ' + GRID + 'px',
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  subtitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 15,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  badgeWrap: { marginBottom: GRID },
  cabecalhoAcoes: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
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
  },
  btnTerciario: {
    background: 'none',
    color: 'var(--grafite-tecnico)',
    border: 'none',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    cursor: 'pointer',
    opacity: 0.9,
  },
  notFoundText: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 16,
    color: 'var(--grafite-tecnico)',
  },
  resumoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
  },
  resumoRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: GRID,
  },
  resumoLabel: {
    minWidth: 140,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  resumoValor: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  linkContexto: {
    color: 'var(--azul-arena)',
    textDecoration: 'none',
    marginLeft: GRID,
  },
  statusRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 3,
  },
  selectLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  select: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    minWidth: 200,
    outline: 'none',
  },
  statusHint: {
    margin: `${GRID * 2}px 0 0`,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
  },
  timelineItem: {
    padding: GRID * 2,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 'var(--radius)',
    borderLeft: '3px solid var(--azul-arena)',
  },
  timelineItemHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID,
    marginBottom: GRID,
  },
  timelineAuthor: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  timelineMeta: {
    fontSize: 12,
    color: 'var(--grafite-tecnico)',
    opacity: 0.75,
  },
  timelineContent: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  timelineVazio: {
    margin: 0,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  textarea: {
    width: '100%',
    minHeight: 100,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    marginBottom: GRID * 2,
    fontFamily: 'inherit',
  },
  composerAcoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
  },
}
