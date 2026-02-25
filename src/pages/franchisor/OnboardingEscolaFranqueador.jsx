import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorSchoolById,
  getFranchisorSchoolOnboarding,
  patchFranchisorSchoolOnboardingChecklist,
  postFranchisorSchoolRequestApproval,
} from '../../api/franchisorPortal'

const GRID = 8
const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconExternal = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const styles = {
  section: { marginBottom: GRID * 4 },
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  badge: {
    display: 'inline-block',
    padding: `${GRID / 2}px ${GRID * 1.5}px`,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  statusAtivo: { background: 'rgba(76, 203, 138, 0.2)', color: 'var(--verde-patrocinio)' },
  statusPendente: { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' },
  statusSuspenso: { background: 'rgba(58, 58, 60, 0.12)', color: 'var(--grafite-tecnico)', opacity: 0.9 },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 3}px`,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 3}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 3,
  },
  cardTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  row: { marginBottom: GRID * 1.5, fontSize: 14, color: 'var(--grafite-tecnico)' },
  label: { fontWeight: 600, marginRight: GRID, opacity: 0.9 },
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: GRID * 2,
    padding: `${GRID * 2}px 0`,
    borderBottom: '1px solid #eee',
  },
  checklistItemLast: { borderBottom: 'none' },
  checklistLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--azul-arena)',
    textDecoration: 'none',
  },
  checkboxWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    cursor: 'pointer',
  },
  note: { fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.85, marginTop: GRID * 2 },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 4,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 4,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 15, fontWeight: 600, color: '#991B1B' },
  errorText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#991B1B', opacity: 0.9 },
  btnReload: {
    background: '#DC2626',
    color: '#fff',
    border: 'none',
    padding: `${GRID}px ${GRID * 2}px`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    marginRight: GRID * 2,
  },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  emptyLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  actionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: GRID * 4,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    maxWidth: 440,
    width: '100%',
    boxShadow: 'var(--shadow-hover)',
  },
  modalTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  modalText: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', lineHeight: 1.5 },
  modalField: {
    width: '100%',
    minHeight: 80,
    padding: GRID * 2,
    border: '1px solid #E5E5E7',
    borderRadius: 8,
    fontSize: 14,
    resize: 'vertical',
    marginBottom: GRID * 2,
  },
  modalCheckbox: { display: 'flex', alignItems: 'flex-start', gap: GRID, marginBottom: GRID * 3, cursor: 'pointer' },
  modalBotoes: { display: 'flex', gap: GRID * 2, justifyContent: 'flex-end', flexWrap: 'wrap' },
  toast: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'rgba(76, 203, 138, 0.15)',
    color: 'var(--verde-patrocinio)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
    fontWeight: 500,
  },
  toastErro: {
    background: '#FEF2F2',
    color: '#991B1B',
  },
  approvalBadge: {
    display: 'inline-block',
    padding: `${GRID / 2}px ${GRID * 1.5}px`,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
  },
  approvalNone: { background: 'rgba(58, 58, 60, 0.1)', color: 'var(--grafite-tecnico)' },
  approvalRequested: { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' },
  approvalApproved: { background: 'rgba(76, 203, 138, 0.2)', color: 'var(--verde-patrocinio)' },
  approvalRejected: { background: 'rgba(220, 38, 38, 0.15)', color: '#B91C1C' },
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const normalized = s === 'ativo' ? 'Ativa' : s === 'suspenso' ? 'Suspensa' : s === 'pendente' ? 'Pendente' : status || '—'
  const style =
    s === 'ativo'
      ? { ...styles.badge, ...styles.statusAtivo }
      : s === 'pendente'
        ? { ...styles.badge, ...styles.statusPendente }
        : { ...styles.badge, ...styles.statusSuspenso }
  return <span style={style}>{normalized}</span>
}

function ApprovalStatusLabel({ status }) {
  const labels = {
    NONE: 'Não solicitado',
    REQUESTED: 'Solicitado (em análise pelo Admin)',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado / precisa ajustes',
  }
  const style =
    status === 'REQUESTED'
      ? { ...styles.approvalBadge, ...styles.approvalRequested }
      : status === 'APPROVED'
        ? { ...styles.approvalBadge, ...styles.approvalApproved }
        : status === 'REJECTED'
          ? { ...styles.approvalBadge, ...styles.approvalRejected }
          : { ...styles.approvalBadge, ...styles.approvalNone }
  return <span style={style}>{labels[status] || labels.NONE}</span>
}

function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.skeleton, width: '40%', marginBottom: GRID * 2, height: 18 }} />
      <div style={{ ...styles.skeleton, width: '90%', marginBottom: GRID }} />
      <div style={{ ...styles.skeleton, width: '70%', marginBottom: GRID }} />
      <div style={{ ...styles.skeleton, width: '60%' }} />
    </div>
  )
}

export default function OnboardingEscolaFranqueador() {
  const { school_id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.returnTo || `/franchisor/schools/${school_id}`

  const [school, setSchool] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [toast, setToast] = useState(null)
  const [modalRequest, setModalRequest] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [requestConfirmed, setRequestConfirmed] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [togglingItem, setTogglingItem] = useState(null)

  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((me) => {
        if (!cancelled && !ALLOWED_ROLES.includes(me.user_role)) setPermissionDenied(true)
      })
      .catch(() => { if (!cancelled) setPermissionDenied(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (permissionDenied || !school_id) return
    let cancelled = false
    setError(null)
    setLoading(true)
    Promise.all([getFranchisorSchoolById(school_id), getFranchisorSchoolOnboarding(school_id)])
      .then(([schoolData, onboardingData]) => {
        if (!cancelled) {
          setSchool(schoolData)
          setData(onboardingData)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err?.status === 404) navigate('/acesso-negado?from=franchisor', { replace: true })
          else setError(err?.message || 'Não foi possível carregar. Tente novamente.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [school_id, permissionDenied, navigate])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=franchisor', { replace: true })
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const checklistItems = data?.checklist_items || []
  const concludedCount = checklistItems.filter((i) => i.state === 'CONCLUDED').length
  const totalCount = checklistItems.length
  const progressLabel = totalCount ? `${concludedCount}/${totalCount}` : '0/0'
  const statusLower = (data?.status || '').toLowerCase()
  const isPending = statusLower === 'pendente'
  const approvalStatus = data?.approval_request_status || 'NONE'
  const hasPendingRequest = approvalStatus === 'REQUESTED'
  const checklistComplete = totalCount > 0 && concludedCount === totalCount
  const canRequestApproval = isPending && checklistComplete && !hasPendingRequest

  const handleToggleChecklistItem = async (item) => {
    if (item.type !== 'MANUAL') return
    setTogglingItem(item.id)
    const nextState = item.state === 'CONCLUDED' ? 'PENDING' : 'CONCLUDED'
    try {
      await patchFranchisorSchoolOnboardingChecklist(school_id, item.id, { state: nextState })
      const res = await getFranchisorSchoolOnboarding(school_id)
      setData(res)
      setToast('Pendência atualizada!')
    } catch {
      setToast('Não foi possível atualizar. Tente novamente.')
    } finally {
      setTogglingItem(null)
    }
  }

  const handleOpenRequestModal = () => {
    setRequestMessage('')
    setRequestConfirmed(false)
    setModalRequest(true)
  }

  const handleSubmitRequest = async () => {
    if (!requestConfirmed) return
    setSubmittingRequest(true)
    try {
      await postFranchisorSchoolRequestApproval(school_id, { message: requestMessage.trim() || undefined, confirmed: true })
      const res = await getFranchisorSchoolOnboarding(school_id)
      setData(res)
      setModalRequest(false)
      setToast('Solicitação enviada ao Admin!')
    } catch (err) {
      setToast(err?.message || 'Não foi possível enviar. Tente novamente.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Escolas', to: '/franchisor/schools' },
    { label: school?.school_name || school_id || 'Escola', to: `/franchisor/schools/${school_id}` },
    { label: 'Onboarding' },
  ]

  if (permissionDenied) return null

  return (
    <FranchisorLayout
      pageTitle="Onboarding da escola"
      breadcrumb={breadcrumb}
    >
      {toast && (
        <div
          style={{
            ...styles.toast,
            ...(toast.startsWith('Não') ? styles.toastErro : {}),
          }}
          role="status"
        >
          {toast}
        </div>
      )}

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro</div>
            <div style={styles.errorText}>{error}</div>
            <div>
              <button type="button" style={styles.btnReload} onClick={() => window.location.reload()}>
                Recarregar
              </button>
              <Link to={returnTo} style={styles.btnSecondary}>
                Voltar
              </Link>
            </div>
          </div>
        </div>
      )}

      {!error && !loading && !data && (
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>Escola não encontrada.</h2>
          <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
            Você não tem permissão para acessar o onboarding desta escola.
          </p>
          <Link to="/franchisor/schools" style={styles.emptyLink}>
            Voltar para escolas
          </Link>
        </div>
      )}

      {!error && data && (
        <>
          <div style={styles.headerRow}>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>Onboarding da escola</h1>
              <StatusBadge status={data.status} />
            </div>
            <Link to={returnTo} style={styles.btnSecondary} state={{ returnTo }} className="btn-hover">
              <IconArrowLeft />
              Voltar para a escola
            </Link>
          </div>

          {/* Card Status e andamento */}
          <section style={styles.section} aria-label="Status e andamento">
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Status e andamento</h2>
              <div style={styles.row}>
                <span style={styles.label}>Status atual:</span>
                <StatusBadge status={data.status} />
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Pendências concluídas:</span>
                {progressLabel}
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Pedido de aprovação:</span>
                <ApprovalStatusLabel status={approvalStatus} />
              </div>
              <p style={styles.note}>
                A ativação da escola é feita pelo Admin.
              </p>
            </div>
          </section>

          {/* Card Checklist */}
          <section style={styles.section} aria-label="Checklist de pendências">
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Checklist de pendências</h2>
              {checklistItems.length === 0 ? (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
                  Nenhum item de checklist no momento.
                </p>
              ) : (
                checklistItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      ...styles.checklistItem,
                      ...(idx === checklistItems.length - 1 ? styles.checklistItemLast : {}),
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: GRID * 2, flexWrap: 'wrap' }}>
                      {item.type === 'MANUAL' ? (
                        <label style={styles.checkboxWrap}>
                          <input
                            type="checkbox"
                            checked={item.state === 'CONCLUDED'}
                            onChange={() => handleToggleChecklistItem(item)}
                            disabled={togglingItem === item.id}
                            style={{ width: 18, height: 18 }}
                          />
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{item.title}</span>
                        </label>
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 500 }}>
                          {item.state === 'CONCLUDED' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: GRID, color: 'var(--verde-patrocinio)' }}>
                              <IconCheck />
                              {item.title}
                            </span>
                          ) : (
                            item.title
                          )}
                        </span>
                      )}
                      {item.state !== 'CONCLUDED' && item.action_link && (
                        <Link
                          to={item.action_link}
                          style={styles.checklistLink}
                          state={{ returnTo: `/franchisor/schools/${school_id}/onboarding` }}
                          className="btn-hover"
                        >
                          Ir para
                          <IconExternal />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Card Ações */}
          <section style={styles.section} aria-label="Ações">
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Ações</h2>
              <div style={styles.actionsGrid}>
                <Link
                  to={`/franchisor/schools/${school_id}/edit`}
                  state={{ returnTo: `/franchisor/schools/${school_id}/onboarding` }}
                  style={styles.btnSecondary}
                  className="btn-hover"
                >
                  <IconEdit />
                  Editar dados da escola
                </Link>
                <button
                  type="button"
                  style={styles.btnPrimary}
                  onClick={handleOpenRequestModal}
                  disabled={!canRequestApproval}
                  className="btn-hover"
                  title={!canRequestApproval ? 'Conclua o checklist e não tenha solicitação pendente para solicitar aprovação.' : 'Solicitar aprovação ao Admin'}
                >
                  Solicitar aprovação ao Admin
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {loading && !data && (
        <>
          <div style={styles.headerRow}>
            <div style={{ ...styles.skeleton, width: 280, height: 28 }} />
            <div style={{ ...styles.skeleton, width: 180, height: 36 }} />
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* Modal Solicitar aprovação */}
      {modalRequest && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-request-title">
          <div style={styles.modal}>
            <h2 id="modal-request-title" style={styles.modalTitle}>
              Enviar solicitação de aprovação para o Admin?
            </h2>
            <p style={styles.modalText}>
              O Admin analisará as pendências e poderá ativar a escola. A ativação só é feita pelo Admin.
            </p>
            <label style={{ display: 'block', marginBottom: GRID, fontSize: 14, fontWeight: 500 }}>
              Mensagem para o Admin (opcional)
            </label>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Ex.: Todas as pendências foram conferidas."
              style={styles.modalField}
              rows={3}
            />
            <label style={styles.modalCheckbox}>
              <input
                type="checkbox"
                checked={requestConfirmed}
                onChange={(e) => setRequestConfirmed(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2 }}
              />
              <span style={{ fontSize: 14 }}>Confirmo que revisei as pendências.</span>
            </label>
            <div style={styles.modalBotoes}>
              <button
                type="button"
                style={styles.btnSecondary}
                onClick={() => setModalRequest(false)}
                disabled={submittingRequest}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={styles.btnPrimary}
                onClick={handleSubmitRequest}
                disabled={!requestConfirmed || submittingRequest}
                className="btn-hover"
              >
                {submittingRequest ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FranchisorLayout>
  )
}
