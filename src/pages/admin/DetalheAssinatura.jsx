import { useState, useEffect, useCallback, Fragment } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import {
  getSubscription,
  getSubscriptionHistory,
  transitionSubscription,
  formatSubscriptionDate,
  formatSubscriptionDateTime,
  getTransicoesPermitidas,
  getMotivos,
} from '../../api/subscriptions'

const GRID = 8
const PAGE_SIZE_HISTORY = 10

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const label = s === 'expirada' ? 'Expirada' : (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—')
  const estilo =
    s === 'ativa'
      ? { background: 'rgba(76, 203, 138, 0.15)', color: 'var(--verde-patrocinio)' }
      : s === 'inativa'
        ? { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' }
        : s === 'cancelada' || s === 'expirada'
          ? { background: 'rgba(220, 53, 69, 0.15)', color: '#dc3545' }
          : { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        textTransform: 'capitalize',
        ...estilo,
      }}
    >
      {label}
    </span>
  )
}

function SkeletonLine({ width = '80%' }) {
  return (
    <div style={{ height: 16, background: 'var(--cinza-arquibancada)', borderRadius: 4, width, marginBottom: GRID }} />
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

const styles = {
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
    marginBottom: GRID * 4,
  },
  cabecalhoEsq: {
    flex: '1 1 300px',
  },
  titulo: {
    margin: '0 0 ' + GRID + 'px',
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
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
  linkTerciario: {
    color: 'var(--azul-arena)',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
  },
  linha: {
    marginBottom: GRID * 2,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  label: {
    opacity: 0.75,
    marginRight: GRID,
  },
  alertaErro: {
    background: 'rgba(220, 53, 69, 0.08)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
    color: '#721c24',
  },
  alertaAviso: {
    background: 'rgba(255, 193, 7, 0.12)',
    border: '1px solid rgba(255, 193, 7, 0.4)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
    color: '#856404',
  },
  toast: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'rgba(76, 203, 138, 0.15)',
    color: 'var(--verde-patrocinio)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
    fontWeight: 500,
  },
  tabs: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid #E5E5E7',
    marginBottom: GRID * 3,
  },
  tab: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    marginBottom: -1,
  },
  tabActive: {
    color: 'var(--azul-arena)',
    borderBottomColor: 'var(--azul-arena)',
  },
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
  formGroup: {
    marginBottom: GRID * 3,
  },
  formLabel: {
    display: 'block',
    marginBottom: GRID,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  select: {
    width: '100%',
    maxWidth: 320,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
  },
  textarea: {
    width: '100%',
    minHeight: 80,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
  },
  checkboxWrap: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID,
    marginBottom: GRID * 3,
  },
  checkbox: {
    marginTop: 4,
  },
  paginacao: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    marginTop: GRID * 3,
  },
  btnPagina: {
    background: 'var(--branco-luz)',
    border: '1px solid #E5E5E7',
    padding: GRID,
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    color: 'var(--grafite-tecnico)',
  },
  paginaAtual: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  detalhesExpandir: {
    fontSize: 12,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    fontStyle: 'italic',
  },
}

const EVENT_LABELS = {
  created: 'Criada',
  status_changed: 'Status alterado',
  plan_changed: 'Plano alterado',
}

export default function DetalheAssinatura() {
  const { subscriptionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = location.state?.returnTo || '/admin/subscriptions'

  const [subscription, setSubscription] = useState(null)
  const [history, setHistory] = useState({ items: [], total_pages: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [toast, setToast] = useState(null)
  const [alertError, setAlertError] = useState(null)

  const [tab, setTab] = useState('historico')
  const [historyPage, setHistoryPage] = useState(1)

  const [action, setAction] = useState('')
  const [reasonCategory, setReasonCategory] = useState('')
  const [reasonDetails, setReasonDetails] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)

  const loadSubscription = useCallback(async () => {
    if (!subscriptionId) return
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const data = await getSubscription(subscriptionId)
      setSubscription(data)
    } catch (e) {
      if (e?.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(e?.message || 'Não foi possível carregar a assinatura.')
      }
    } finally {
      setLoading(false)
    }
  }, [subscriptionId])

  const loadHistory = useCallback(async () => {
    if (!subscriptionId) return
    setHistoryLoading(true)
    try {
      const res = await getSubscriptionHistory(subscriptionId, { page: historyPage, page_size: PAGE_SIZE_HISTORY })
      setHistory(res)
    } catch {
      setHistory({ items: [], total_pages: 0, total: 0 })
    } finally {
      setHistoryLoading(false)
    }
  }, [subscriptionId, historyPage])

  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  useEffect(() => {
    if (tab === 'historico') loadHistory()
  }, [tab, loadHistory])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado', { replace: true })
    }
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleVoltar = () => {
    navigate(returnTo)
  }

  const transicoes = subscription ? getTransicoesPermitidas(subscription.status) : []
  const motivos = getMotivos()

  const handleTransition = async () => {
    setAlertError(null)
    if (!action || !reasonCategory || !reasonDetails.trim() || !confirmed) {
      setAlertError('Preencha ação, motivo, detalhes e confirme que entende o impacto.')
      return
    }
    setSubmitting(true)
    try {
      await transitionSubscription(subscriptionId, {
        action,
        reason_category: reasonCategory,
        reason_details: reasonDetails.trim(),
        confirmed,
      })
      setToast('Assinatura atualizada com sucesso!')
      setAction('')
      setReasonCategory('')
      setReasonDetails('')
      setConfirmed(false)
      await loadSubscription()
      if (tab === 'historico') await loadHistory()
    } catch (e) {
      if (e?.message && String(e.message).toLowerCase().includes('transição')) {
        setAlertError('Não foi possível aplicar: transição de status inválida.')
      } else {
        setAlertError('Ocorreu um erro. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const breadcrumb = [
    { label: 'Assinaturas', to: returnTo },
    { label: 'Detalhe' },
  ]

  const titulo = subscription?.school_name
    ? `Assinatura de ${subscription.school_name}`
    : `Assinatura: ${subscriptionId}`

  const urlEscola = subscription?.school_id ? `/admin/escolas/${subscription.school_id}` : '#'
  const urlFranqueador = subscription?.franchisor_id
    ? `/admin/franqueadores/${subscription.franchisor_id}?tab=overview`
    : '#'
  const urlPlano = subscription?.plan_id ? `/admin/plans/${subscription.plan_id}/edit` : '#'

  if (permissionDenied) return null

  return (
    <AdminLayout breadcrumb={breadcrumb}>
      {toast && <div style={styles.toast} role="status">{toast}</div>}
      {error && (
        <div style={styles.alertaErro} role="alert">
          <strong>{error}</strong>
          <div style={{ display: 'flex', gap: GRID * 2, marginTop: GRID * 2 }}>
            <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={loadSubscription}>
              Recarregar
            </button>
            <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={handleVoltar}>
              Voltar
            </button>
          </div>
        </div>
      )}

      {!error && loading && (
        <>
          <div style={styles.cabecalho}>
            <div style={styles.cabecalhoEsq}>
              <SkeletonLine width={320} />
              <SkeletonLine width={100} />
            </div>
            <div style={{ display: 'flex', gap: GRID * 2 }}>
              <div style={{ height: 40, width: 100, background: 'var(--cinza-arquibancada)', borderRadius: 8 }} />
            </div>
          </div>
          <SkeletonCard />
          <SkeletonCard />
          <div style={styles.card}>
            <SkeletonLine width="30%" />
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine />
          </div>
        </>
      )}

      {!error && !loading && subscription && (
        <>
          {subscription.school_suspended && (
            <div style={styles.alertaAviso} role="status">
              A escola está suspensa.
            </div>
          )}

          <div style={styles.cabecalho}>
            <div style={styles.cabecalhoEsq}>
              <h2 style={styles.titulo}>{titulo}</h2>
              <StatusBadge status={subscription.status} />
            </div>
            <div style={styles.cabecalhoAcoes}>
              <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={handleVoltar}>
                Voltar
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitulo}>Resumo</h3>
            <div style={styles.linha}>
              <span style={styles.label}>Escola:</span>
              {subscription.school_name || '—'}
              {subscription.school_id && (
                <>
                  {' · '}
                  <Link to={urlEscola} style={styles.linkTerciario} className="btn-hover">
                    Abrir escola
                  </Link>
                </>
              )}
            </div>
            <div style={styles.linha}>
              <span style={styles.label}>Franqueador:</span>
              {subscription.franchisor_name || '—'}
              {subscription.franchisor_id && (
                <>
                  {' · '}
                  <Link to={urlFranqueador} style={styles.linkTerciario} className="btn-hover">
                    Abrir franqueador
                  </Link>
                </>
              )}
            </div>
            <div style={styles.linha}>
              <span style={styles.label}>Plano:</span>
              {subscription.plan_name || '—'}
              {subscription.plan_id && (
                <>
                  {' · '}
                  <Link to={urlPlano} style={styles.linkTerciario} className="btn-hover">
                    Abrir plano
                  </Link>
                </>
              )}
            </div>
            <div style={styles.linha}>
              <span style={styles.label}>Status atual:</span>
              <StatusBadge status={subscription.status} />
            </div>
            <div style={styles.linha}>
              <span style={styles.label}>Data de início:</span>
              {formatSubscriptionDate(subscription.start_date)}
            </div>
            <div style={styles.linha}>
              <span style={styles.label}>Próxima renovação:</span>
              {formatSubscriptionDate(subscription.next_renewal_date)}
            </div>
            <div style={styles.linha}>
              <span style={styles.label}>Criado em:</span>
              {formatSubscriptionDate(subscription.created_at)}
            </div>
          </div>

          {transicoes.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitulo}>Status e ações</h3>
              <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
                Transições permitidas: {transicoes.map((t) => t.label).join(', ')}
              </p>
              {alertError && (
                <div style={styles.alertaErro} role="alert">
                  {alertError}
                </div>
              )}
              <div style={styles.formGroup}>
                <label style={styles.formLabel} htmlFor="acao">
                  Ação
                </label>
                <select
                  id="acao"
                  style={styles.select}
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Selecione</option>
                  {transicoes.map((t) => (
                    <option key={t.action} value={t.action}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel} htmlFor="motivo">
                  Motivo
                </label>
                <select
                  id="motivo"
                  style={styles.select}
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Selecione</option>
                  {motivos.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel} htmlFor="detalhes">
                  Detalhes do motivo
                </label>
                <textarea
                  id="detalhes"
                  style={styles.textarea}
                  value={reasonDetails}
                  onChange={(e) => setReasonDetails(e.target.value)}
                  placeholder="Descreva o motivo da alteração..."
                  disabled={submitting}
                />
              </div>
              <div style={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  id="confirmar"
                  style={styles.checkbox}
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={submitting}
                />
                <label htmlFor="confirmar" style={{ fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                  Confirmo que entendo o impacto desta ação.
                </label>
              </div>
              <button
                type="button"
                style={styles.btnPrimario}
                className="btn-hover"
                onClick={handleTransition}
                disabled={submitting || !action || !reasonCategory || !reasonDetails.trim() || !confirmed}
              >
                Aplicar alteração
              </button>
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.tabs}>
              <button
                type="button"
                style={{ ...styles.tab, ...(tab === 'historico' ? styles.tabActive : {}) }}
                onClick={() => setTab('historico')}
              >
                Histórico
              </button>
            </div>

            {tab === 'historico' && (
              <>
                {historyLoading && (
                  <div style={{ padding: GRID * 4 }}>
                    <SkeletonLine />
                    <SkeletonLine />
                    <SkeletonLine />
                    <SkeletonLine />
                  </div>
                )}
                {!historyLoading && history.items.length === 0 && (
                  <p style={{ margin: 0, padding: GRID * 4, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
                    Nenhum registro no histórico.
                  </p>
                )}
                {!historyLoading && history.items.length > 0 && (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Data/hora</th>
                            <th style={styles.th}>Evento</th>
                            <th style={styles.th}>De → Para</th>
                            <th style={styles.th}>Ator</th>
                            <th style={styles.th}>Motivo</th>
                            <th style={styles.th}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.items.map((item, idx) => (
                            <Fragment key={idx}>
                              <tr>
                                <td style={styles.td}>{formatSubscriptionDateTime(item.occurred_at)}</td>
                                <td style={styles.td}>
                                  {EVENT_LABELS[item.event_type] || item.event_type}
                                </td>
                                <td style={styles.td}>
                                  {item.from_value != null && item.to_value != null
                                    ? `${item.from_value} → ${item.to_value}`
                                    : '—'}
                                </td>
                                <td style={styles.td}>{item.actor || '—'}</td>
                                <td style={styles.td}>{item.reason_category || '—'}</td>
                                <td style={styles.td}>
                                  {item.reason_details && (
                                    <button
                                      type="button"
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--azul-arena)',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                      }}
                                      onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                    >
                                      {expandedRow === idx ? 'Ocultar' : 'Detalhes'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                              {item.reason_details && expandedRow === idx && (
                                <tr>
                                  <td colSpan={6} style={{ ...styles.td, background: 'rgba(0,0,0,0.02)' }}>
                                    <div style={styles.detalhesExpandir}>{item.reason_details}</div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {history.total_pages > 1 && (
                      <div style={styles.paginacao}>
                        <button
                          type="button"
                          style={styles.btnPagina}
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={historyPage <= 1}
                          aria-label="Página anterior"
                        >
                          ‹
                        </button>
                        <span style={styles.paginaAtual}>
                          Página {historyPage} de {history.total_pages}
                        </span>
                        <button
                          type="button"
                          style={styles.btnPagina}
                          onClick={() => setHistoryPage((p) => Math.min(history.total_pages, p + 1))}
                          disabled={historyPage >= history.total_pages}
                          aria-label="Próxima página"
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
