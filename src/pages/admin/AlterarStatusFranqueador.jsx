import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useFranchisorSidebar } from '../../contexts/FranchisorSidebarContext'
import {
  getFranqueadorById,
  getFranchisorStatus,
  getFranchisorStatusHistory,
  postFranchisorStatusTransition,
  formatCreatedAtDateTime,
  FRANCHISOR_STATUS_ACTIONS,
  REASON_CATEGORIES,
} from '../../api/franqueadores'

const GRID = 8
const MIN_DETALHES_LENGTH = 10
const HISTORY_PAGE_SIZE = 10
const OPCOES_POR_PAGINA = [10, 25, 50]

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

const IMPACT_TEXT = {
  [FRANCHISOR_STATUS_ACTIONS.APPROVE]:
    'O franqueador poderá acessar o portal e gerenciar suas escolas.',
  [FRANCHISOR_STATUS_ACTIONS.SUSPEND]:
    'Usuários do franqueador perderão acesso ao portal do franqueador. A gestão Admin permanece.',
  [FRANCHISOR_STATUS_ACTIONS.REACTIVATE]:
    'Usuários do franqueador voltam a ter acesso ao portal do franqueador.',
}
const IMPACT_OBS = 'As escolas vinculadas não são alteradas automaticamente.'

const ACTION_LABELS = {
  [FRANCHISOR_STATUS_ACTIONS.APPROVE]: 'Aprovar e ativar',
  [FRANCHISOR_STATUS_ACTIONS.SUSPEND]: 'Suspender franqueador',
  [FRANCHISOR_STATUS_ACTIONS.REACTIVATE]: 'Reativar franqueador',
}

const BTN_LABELS = {
  [FRANCHISOR_STATUS_ACTIONS.APPROVE]: 'Aprovar e ativar',
  [FRANCHISOR_STATUS_ACTIONS.SUSPEND]: 'Suspender franqueador',
  [FRANCHISOR_STATUS_ACTIONS.REACTIVATE]: 'Reativar franqueador',
}

function getAvailableActions(currentStatus) {
  const s = (currentStatus || '').toLowerCase()
  return {
    [FRANCHISOR_STATUS_ACTIONS.APPROVE]: s === 'pendente',
    [FRANCHISOR_STATUS_ACTIONS.SUSPEND]: s === 'ativo',
    [FRANCHISOR_STATUS_ACTIONS.REACTIVATE]: s === 'suspenso',
  }
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
  cabecalhoEsq: { flex: '1 1 300px' },
  titulo: { margin: '0 0 ' + GRID + 'px', fontSize: 22, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  subtitulo: { margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.7 },
  cabecalhoBotoes: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: GRID * 2 },
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
    border: '1px solid #E5E5E7',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
  },
  btnPrimarioDanger: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  card: {
    background: 'var(--branco-luz)',
    border: '1px solid #eee',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
  },
  cardTitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  campoLinha: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID,
    marginBottom: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  campoLabel: { fontWeight: 600, minWidth: 140, opacity: 0.85 },
  campoValor: { opacity: 0.95 },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: GRID * 2 },
  radioWrap: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 2,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  radioWrapDisabled: { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' },
  impactText: { fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.9, marginTop: GRID },
  impactObs: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.7, marginTop: GRID * 2 },
  formGroup: { marginBottom: GRID * 3 },
  label: { display: 'block', marginBottom: GRID, fontSize: 14, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  select: {
    width: '100%',
    maxWidth: 320,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    minHeight: 100,
    padding: GRID * 2,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    outline: 'none',
    resize: 'vertical',
  },
  checkboxWrap: { display: 'flex', alignItems: 'center', gap: GRID, marginBottom: GRID * 3 },
  checkbox: { width: 18, height: 18, cursor: 'pointer' },
  erroInline: { fontSize: 12, color: '#dc3545', marginTop: GRID },
  botoesAcao: { display: 'flex', flexWrap: 'wrap', gap: GRID * 2, marginTop: GRID * 3 },
  erro: {
    padding: GRID * 4,
    textAlign: 'center',
    background: 'rgba(220, 53, 69, 0.06)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
  },
  erroTexto: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
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
  tdVazio: { padding: GRID * 6, textAlign: 'center', verticalAlign: 'middle' },
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
  paginacao: { display: 'flex', alignItems: 'center', gap: GRID },
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
  paginaAtual: { fontSize: 14, color: 'var(--grafite-tecnico)', minWidth: 100, textAlign: 'center' },
  detalhesExpand: { fontSize: 12, color: 'var(--azul-arena)', cursor: 'pointer', textDecoration: 'underline' },
}

function getReasonLabel(value) {
  const item = REASON_CATEGORIES.find((c) => c.value === value)
  return item ? item.label : value || '—'
}

export default function AlterarStatusFranqueador() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { setFranchisorName } = useFranchisorSidebar()

  const returnTo = location.state?.returnTo || `/admin/franqueadores/${id}?tab=overview`

  const [franqueador, setFranqueador] = useState(null)
  const [statusData, setStatusData] = useState(null)
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [selectedAction, setSelectedAction] = useState(null)
  const [reasonCategory, setReasonCategory] = useState('')
  const [reasonDetails, setReasonDetails] = useState('')
  const [confirmImpact, setConfirmImpact] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPageSize, setHistoryPageSize] = useState(HISTORY_PAGE_SIZE)
  const [expandedDetails, setExpandedDetails] = useState(null)

  const fetchFranqueador = useCallback(async () => {
    if (!id) return
    try {
      const data = await getFranqueadorById(id)
      setFranqueador(data)
      setFranchisorName(data?.name ?? '')
      if (data && (data.status === 403 || data.permission_denied)) setPermissionDenied(true)
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else setError(err.message || 'Não foi possível carregar o franqueador.')
    } finally {
      setLoading(false)
    }
  }, [id, setFranchisorName])

  const fetchStatus = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getFranchisorStatus(id)
      setStatusData(data)
      if (data && (data.permission_denied || data.status === 403)) setPermissionDenied(true)
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else setError(err.message || 'Não foi possível carregar o status.')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchInitial = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [franq, status] = await Promise.all([getFranqueadorById(id), getFranchisorStatus(id)])
      setFranqueador(franq)
      setFranchisorName(franq?.name ?? '')
      setStatusData(status)
      if (franq?.permission_denied || franq?.status === 403 || status?.permission_denied)
        setPermissionDenied(true)
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else setError(err.message || 'Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }, [id, setFranchisorName])

  const fetchHistory = useCallback(async () => {
    if (!id) return
    setLoadingHistory(true)
    try {
      const res = await getFranchisorStatusHistory(id, { page: historyPage, page_size: historyPageSize })
      setHistoryData(res)
    } catch {
      setHistoryData({ items: [], total: 0, total_pages: 0 })
    } finally {
      setLoadingHistory(false)
    }
  }, [id, historyPage, historyPageSize])

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  useEffect(() => {
    return () => setFranchisorName('')
  }, [id, setFranchisorName])

  useEffect(() => {
    if (!id || loading || !statusData) return
    fetchHistory()
  }, [id, loading, statusData, fetchHistory])

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const franqueadorNome = franqueador?.name || 'Franqueador'
  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Franqueadores', to: '/admin/franqueadores' },
    { label: `Franqueador: ${franqueadorNome}`, to: `/admin/franqueadores/${id}?tab=overview` },
    { label: 'Status' },
  ]

  const currentStatus = statusData?.current_status || 'pendente'
  const available = getAvailableActions(currentStatus)
  const needsConfirmCheckbox =
    selectedAction === FRANCHISOR_STATUS_ACTIONS.SUSPEND ||
    selectedAction === FRANCHISOR_STATUS_ACTIONS.REACTIVATE
  const reasonDetailsValid = (reasonDetails || '').trim().length >= MIN_DETALHES_LENGTH
  const canSubmit =
    selectedAction &&
    reasonCategory &&
    reasonDetailsValid &&
    (!needsConfirmCheckbox || confirmImpact) &&
    !submitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    if (!canSubmit || !id) return
    setSubmitting(true)
    try {
      await postFranchisorStatusTransition(id, {
        action: selectedAction,
        reason_category: reasonCategory,
        reason_details: (reasonDetails || '').trim(),
      })
      navigate(returnTo, { state: { toast: 'Status atualizado com sucesso!' }, replace: true })
    } catch (err) {
      const msg =
        err.message ||
        (err.status === 403 ? 'Você não tem permissão.' : 'Não foi possível atualizar o status. Tente novamente.')
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(returnTo)
  }

  return (
    <AdminLayout breadcrumb={breadcrumb}>
      <div style={styles.cardGrande}>
        {/* ——— Cabeçalho ——— */}
        <div style={styles.cabecalho}>
          <div style={styles.cabecalhoEsq}>
            {loading ? (
              <>
                <SkeletonLine width="60%" />
                <SkeletonLine width="40%" />
              </>
            ) : (
              <>
                <h1 style={styles.titulo}>Alterar status do franqueador</h1>
                <p style={styles.subtitulo}>
                  {franqueadorNome}
                  {statusData && (
                    <>
                      {' · '}
                      <StatusBadge status={statusData.current_status} />
                    </>
                  )}
                </p>
              </>
            )}
          </div>
          {!loading && (
            <div style={styles.cabecalhoBotoes}>
              <Link to={returnTo} style={styles.btnSecundario} className="btn-hover">
                <IconChevronLeft />
                Voltar
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div style={styles.erro}>
            <p style={styles.erroTexto}>{error}</p>
            <div style={{ display: 'flex', gap: GRID * 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={fetchInitial}>
                Recarregar
              </button>
              <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={() => navigate('/admin/franqueadores')}>
                Voltar para lista
              </button>
            </div>
          </div>
        )}

        {!error && loading && (
          <>
            <div style={styles.card}>
              <h3 style={styles.cardTitulo}>Status atual</h3>
              <SkeletonLine />
              <SkeletonLine />
              <SkeletonLine />
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitulo}>Ação</h3>
              <SkeletonLine />
              <SkeletonLine />
            </div>
          </>
        )}

        {!error && !loading && statusData && (
          <>
            {/* ——— Card Status atual ——— */}
            <div style={styles.card}>
              <h3 style={styles.cardTitulo}>Status atual</h3>
              <div style={styles.campoLinha}>
                <span style={styles.campoLabel}>Status atual</span>
                <span style={styles.campoValor}>
                  <StatusBadge status={statusData.current_status} />
                </span>
              </div>
              {statusData.last_changed_at && (
                <>
                  <div style={styles.campoLinha}>
                    <span style={styles.campoLabel}>Última mudança</span>
                    <span style={styles.campoValor}>
                      {formatCreatedAtDateTime(statusData.last_changed_at)}
                    </span>
                  </div>
                  {statusData.last_changed_by && (
                    <div style={styles.campoLinha}>
                      <span style={styles.campoLabel}>Alterado por</span>
                      <span style={styles.campoValor}>
                        {statusData.last_changed_by.name}
                        {statusData.last_changed_by.email ? ` (${statusData.last_changed_by.email})` : ''}
                      </span>
                    </div>
                  )}
                </>
              )}
              {statusData.last_reason_category && (
                <div style={styles.campoLinha}>
                  <span style={styles.campoLabel}>Motivo da última mudança</span>
                  <span style={styles.campoValor}>
                    {getReasonLabel(statusData.last_reason_category)}
                    {statusData.last_reason_details ? ` — ${statusData.last_reason_details}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* ——— Card Ação ——— */}
            <div style={styles.card}>
              <h3 style={styles.cardTitulo}>Ação</h3>
              <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                Selecione a ação desejada
              </p>
              <div style={styles.radioGroup}>
                {[FRANCHISOR_STATUS_ACTIONS.APPROVE, FRANCHISOR_STATUS_ACTIONS.SUSPEND, FRANCHISOR_STATUS_ACTIONS.REACTIVATE].map(
                  (action) => (
                    <label
                      key={action}
                      style={{
                        ...styles.radioWrap,
                        ...(available[action] ? {} : styles.radioWrapDisabled),
                      }}
                      onClick={() => available[action] && setSelectedAction(action)}
                    >
                      <input
                        type="radio"
                        name="action"
                        value={action}
                        checked={selectedAction === action}
                        onChange={() => available[action] && setSelectedAction(action)}
                        disabled={!available[action]}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <span style={{ fontWeight: 600 }}>{ACTION_LABELS[action]}</span>
                        {selectedAction === action && (
                          <>
                            <p style={styles.impactText}>{IMPACT_TEXT[action]}</p>
                            <p style={styles.impactObs}>{IMPACT_OBS}</p>
                          </>
                        )}
                      </div>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* ——— Card Motivo e confirmação ——— */}
            <div style={styles.card}>
              <h3 style={styles.cardTitulo}>Motivo e confirmação</h3>
              {submitError && (
                <div style={{ ...styles.erro, marginBottom: GRID * 3, padding: GRID * 2 }}>
                  <p style={styles.erroTexto}>{submitError}</p>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="reason_category">
                    Motivo *
                  </label>
                  <select
                    id="reason_category"
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    style={styles.select}
                    required
                    disabled={submitting}
                  >
                    <option value="">Selecione...</option>
                    {REASON_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="reason_details">
                    Detalhes do motivo * (mín. {MIN_DETALHES_LENGTH} caracteres)
                  </label>
                  <textarea
                    id="reason_details"
                    value={reasonDetails}
                    onChange={(e) => setReasonDetails(e.target.value)}
                    placeholder="Descreva o motivo da alteração…"
                    style={{
                      ...styles.textarea,
                      ...(reasonDetails.trim().length > 0 && reasonDetails.trim().length < MIN_DETALHES_LENGTH
                        ? { borderColor: '#dc3545' }
                        : {}),
                    }}
                    disabled={submitting}
                  />
                  {reasonDetails.trim().length > 0 && reasonDetails.trim().length < MIN_DETALHES_LENGTH && (
                    <p style={styles.erroInline}>
                      Informe pelo menos {MIN_DETALHES_LENGTH} caracteres.
                    </p>
                  )}
                </div>
                {needsConfirmCheckbox && (
                  <div style={styles.checkboxWrap}>
                    <input
                      type="checkbox"
                      id="confirm_impact"
                      checked={confirmImpact}
                      onChange={(e) => setConfirmImpact(e.target.checked)}
                      style={styles.checkbox}
                      disabled={submitting}
                    />
                    <label htmlFor="confirm_impact" style={{ cursor: 'pointer', fontSize: 14 }}>
                      Confirmo que entendo o impacto desta ação.
                    </label>
                  </div>
                )}
                <div style={styles.botoesAcao}>
                  <button
                    type="submit"
                    style={
                      selectedAction === FRANCHISOR_STATUS_ACTIONS.SUSPEND
                        ? styles.btnPrimarioDanger
                        : styles.btnPrimario
                    }
                    className="btn-hover"
                    disabled={!canSubmit}
                  >
                    {selectedAction ? BTN_LABELS[selectedAction] : 'Selecione uma ação'}
                  </button>
                  <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={handleCancel} disabled={submitting}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>

            {/* ——— Card Histórico de status ——— */}
            <div style={styles.card}>
              <h3 style={styles.cardTitulo}>Histórico de status</h3>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Data/hora</th>
                      <th style={styles.th}>De → Para</th>
                      <th style={styles.th}>Admin (ator)</th>
                      <th style={styles.th}>Motivo (categoria)</th>
                      <th style={styles.th}>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingHistory &&
                      [...Array(3)].map((_, i) => (
                        <tr key={i}>
                          <td style={styles.td}>
                            <span style={{ display: 'inline-block', height: 16, width: 100, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
                          </td>
                          <td style={styles.td}>
                            <span style={{ display: 'inline-block', height: 16, width: 80, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
                          </td>
                          <td style={styles.td}>
                            <span style={{ display: 'inline-block', height: 16, width: 120, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
                          </td>
                          <td style={styles.td}>
                            <span style={{ display: 'inline-block', height: 16, width: 100, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
                          </td>
                          <td style={styles.td}>
                            <span style={{ display: 'inline-block', height: 16, width: 40, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
                          </td>
                        </tr>
                      ))}
                    {!loadingHistory && (!historyData?.items?.length || historyData.items.length === 0) && (
                      <tr>
                        <td colSpan={5} style={styles.tdVazio}>
                          Nenhuma mudança de status registrada.
                        </td>
                      </tr>
                    )}
                    {!loadingHistory &&
                      historyData?.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.td}>{formatCreatedAtDateTime(item.changed_at)}</td>
                          <td style={styles.td}>
                            <StatusBadge status={item.from_status} /> → <StatusBadge status={item.to_status} />
                          </td>
                          <td style={styles.td}>
                            {item.actor_name}
                            {item.actor_email ? ` (${item.actor_email})` : ''}
                          </td>
                          <td style={styles.td}>{getReasonLabel(item.reason_category)}</td>
                          <td style={styles.td}>
                            {item.reason_details ? (
                              expandedDetails === idx ? (
                                <span style={styles.detalhesExpand} onClick={() => setExpandedDetails(null)}>
                                  Ocultar
                                </span>
                              ) : (
                                <span style={styles.detalhesExpand} onClick={() => setExpandedDetails(idx)}>
                                  Ver
                                </span>
                              )
                            ) : (
                              '—'
                            )}
                            {expandedDetails === idx && item.reason_details && (
                              <div style={{ marginTop: GRID, fontSize: 13 }}>{item.reason_details}</div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!loadingHistory && historyData?.total_pages > 0 && (
                <div style={styles.rodape}>
                  <div style={styles.paginacao}>
                    <button
                      type="button"
                      style={styles.btnPagina}
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                      aria-label="Página anterior"
                    >
                      <IconChevronLeft />
                    </button>
                    <span style={styles.paginaAtual}>
                      Página {historyPage} de {historyData.total_pages}
                    </span>
                    <button
                      type="button"
                      style={styles.btnPagina}
                      onClick={() => setHistoryPage((p) => Math.min(historyData.total_pages, p + 1))}
                      disabled={historyPage >= historyData.total_pages}
                      aria-label="Próxima página"
                    >
                      <IconChevronRight />
                    </button>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: GRID, fontSize: 14 }}>
                    Itens por página:
                    <select
                      value={historyPageSize}
                      onChange={(e) => {
                        setHistoryPageSize(Number(e.target.value))
                        setHistoryPage(1)
                      }}
                      style={{ padding: `${GRID}px ${GRID * 2}px`, border: '1px solid #E5E5E7', borderRadius: 'var(--radius)', fontSize: 14 }}
                    >
                      {OPCOES_POR_PAGINA.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
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
