import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getNotifications, patchNotification, markAllNotificationsRead } from '../api/notifications'

const GRID = 8

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
)
const IconLogOut = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
)
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
)
const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
)

function portalLabel(portal) {
  const p = (portal || '').toUpperCase()
  if (p === 'ADMIN') return 'Admin'
  if (p === 'FRANCHISOR') return 'Franqueador'
  if (p === 'SCHOOL') return 'Escola'
  return portal || 'Portal'
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const styles = {
  wrap: {
    minHeight: '100vh',
    background: 'var(--cinza-arquibancada)',
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    background: 'var(--branco-luz)',
    boxShadow: 'var(--shadow)',
    padding: `${GRID * 2}px ${GRID * 4}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: GRID * 2,
  },
  topbarLeft: { fontSize: 14, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
  },
  topbarLink: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    textDecoration: 'none',
    borderRadius: 'var(--radius)',
  },
  topbarLinkActive: { color: 'var(--azul-arena)', fontWeight: 600 },
  topbarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 'var(--radius)',
  },
  container: {
    flex: 1,
    maxWidth: 720,
    margin: '0 auto',
    padding: GRID * 4,
    width: '100%',
  },
  header: {
    marginBottom: GRID * 4,
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  tabs: {
    display: 'flex',
    gap: GRID,
    marginBottom: GRID * 3,
    flexWrap: 'wrap',
  },
  tab: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  tabActive: {
    background: 'var(--branco-luz)',
    borderColor: '#E5E5E7',
    color: 'var(--azul-arena)',
    boxShadow: 'var(--shadow)',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  btnSecondary: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnSecondaryDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  cardUnread: {
    borderLeft: '4px solid var(--azul-arena)',
  },
  cardInner: {
    padding: GRID * 3,
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    border: 'none',
    background: 'none',
    font: 'inherit',
    color: 'inherit',
  },
  cardIcon: { flexShrink: 0, color: 'var(--azul-arena)', opacity: 0.9 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  cardPreview: { margin: `${GRID}px 0 0`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85, lineHeight: 1.4 },
  cardMeta: { marginTop: GRID * 2, fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.65 },
  cardActions: {
    marginTop: GRID * 2,
    paddingTop: GRID * 2,
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: GRID * 2,
    flexWrap: 'wrap',
  },
  cardActionBtn: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--azul-arena)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 'var(--radius)',
  },
  expandedBody: {
    padding: `0 ${GRID * 3}px ${GRID * 3}`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  loadMore: {
    marginTop: GRID * 3,
    width: '100%',
    padding: GRID * 2,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  emptyText: { margin: `${GRID}px 0 0`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 },
  error: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(220,38,38,0.2)',
  },
  errorTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: '#DC2626' },
  errorText: { margin: `${GRID}px 0 ${GRID * 3}px`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  btnPrimary: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  skeleton: {
    height: 80,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 'var(--radius)',
  },
  toast: {
    position: 'fixed',
    bottom: GRID * 4,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: `${GRID * 2}px ${GRID * 4}px`,
    background: 'var(--grafite-tecnico)',
    color: '#fff',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    boxShadow: 'var(--shadow-hover)',
    zIndex: 1001,
  },
  toastSuccess: { background: 'var(--verde-patrocinio)' },
  toastError: { background: '#DC2626' },
  btnBack: {
    marginBottom: GRID * 3,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
  },
}

function SkeletonList() {
  return (
    <div style={styles.list}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ ...styles.skeleton, height: 96 }} />
      ))}
    </div>
  )
}

export default function Notifications() {
  const navigate = useNavigate()
  const { defaultRedirect, isAuthenticated, logout } = useAuth()
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'unread'
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [toast, setToast] = useState(null)
  const [toastType, setToastType] = useState('info')
  const [markingId, setMarkingId] = useState(null)
  const [markAllLoading, setMarkAllLoading] = useState(false)

  const portal = defaultRedirect?.portal || ''
  const portalName = portalLabel(portal)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
  }, [isAuthenticated, navigate])

  const fetchList = useCallback(async (cursor = null, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await getNotifications({
        status: statusFilter === 'unread' ? 'unread' : 'all',
        page_size: 20,
        ...(cursor ? { cursor } : {}),
      })
      if (append) {
        setItems((prev) => [...prev, ...(res.items || [])])
      } else {
        setItems(res.items || [])
      }
      setNextCursor(res.next_cursor || null)
    } catch (e) {
      if (e.code === 'FORBIDDEN' || e.status === 403) {
        setError('Acesso Negado.')
      } else {
        setError(e.message || 'Não foi possível carregar suas notificações. Tente novamente.')
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchList()
  }, [isAuthenticated, fetchList])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleMarkRead = async (id, read) => {
    if (markingId) return
    setMarkingId(id)
    try {
      await patchNotification(id, { read })
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: read ? new Date().toISOString() : undefined } : n))
      )
      setToast(read ? 'Marcada como lida.' : 'Marcada como não lida.', 'success')
    } catch (e) {
      setToast(e.message || 'Não foi possível atualizar.', 'error')
    } finally {
      setMarkingId(null)
    }
  }

  const handleMarkAllRead = async () => {
    const unreadCount = items.filter((n) => !n.read_at).length
    if (unreadCount === 0 || markAllLoading) return
    setMarkAllLoading(true)
    try {
      await markAllNotificationsRead()
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
      setToast('Todas marcadas como lidas.', 'success')
    } catch (e) {
      setToast(e.message || 'Não foi possível marcar todas como lidas.', 'error')
    } finally {
      setMarkAllLoading(false)
    }
  }

  const handleItemClick = (item) => {
    if (item.target_url) {
      navigate(item.target_url)
      return
    }
    setExpandedId((prev) => (prev === item.id ? null : item.id))
  }

  const hasUnread = items.some((n) => !n.read_at)
  const isEmpty = !loading && !loadingMore && items.length === 0
  const emptyMessage =
    statusFilter === 'unread'
      ? 'Nenhuma notificação não lida.'
      : 'Você não tem notificações.'

  if (!isAuthenticated) return null

  return (
    <div style={styles.wrap}>
      <header style={styles.topbar} role="banner">
        <span style={styles.topbarLeft}>Portal {portalName}</span>
        <div style={styles.topbarRight}>
          <Link to="/help" style={styles.topbarLink} aria-label="Ajuda">
            Central de Ajuda
          </Link>
          <Link
            to="/me"
            style={styles.topbarLink}
            aria-label="Meu perfil"
          >
            <IconUser />
            Meu perfil
          </Link>
          <span style={{ ...styles.topbarLink, ...styles.topbarLinkActive }} aria-current="page">
            <IconBell />
            Notificações
          </span>
          <button type="button" style={styles.topbarBtn} aria-label="Sair" onClick={handleLogout}>
            <IconLogOut />
            Sair
          </button>
        </div>
      </header>

      <div style={styles.container}>
        <button
          type="button"
          style={styles.btnBack}
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/me'))}
        >
          ← Voltar
        </button>

        <div style={styles.header}>
          <h1 style={styles.title}>Notificações</h1>
          <p style={styles.subtitle}>Atualizações e alertas do sistema</p>
        </div>

        <div style={styles.tabs}>
          <button
            type="button"
            style={{ ...styles.tab, ...(statusFilter === 'all' ? styles.tabActive : {}) }}
            onClick={() => setStatusFilter('all')}
          >
            Todas
          </button>
          <button
            type="button"
            style={{ ...styles.tab, ...(statusFilter === 'unread' ? styles.tabActive : {}) }}
            onClick={() => setStatusFilter('unread')}
          >
            Não lidas
          </button>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            style={{
              ...styles.btnSecondary,
              ...(!hasUnread || markAllLoading ? styles.btnSecondaryDisabled : {}),
            }}
            disabled={!hasUnread || markAllLoading}
            onClick={handleMarkAllRead}
          >
            {markAllLoading ? 'Salvando…' : 'Marcar todas como lidas'}
          </button>
        </div>

        {loading && !loadingMore && <SkeletonList />}

        {error && (
          <div style={styles.error}>
            <h2 style={styles.errorTitle}>{error === 'Acesso Negado.' ? 'Acesso Negado' : 'Erro'}</h2>
            <p style={styles.errorText}>{error}</p>
            {error !== 'Acesso Negado.' && (
              <button type="button" style={styles.btnPrimary} onClick={() => fetchList()}>
                Recarregar
              </button>
            )}
            {error === 'Acesso Negado.' && (
              <Link to="/me" style={styles.btnPrimary}>Ir para Meu perfil</Link>
            )}
          </div>
        )}

        {!loading && !error && isEmpty && (
          <div style={styles.empty}>
            <h2 style={styles.emptyTitle}>Nenhuma notificação</h2>
            <p style={styles.emptyText}>{emptyMessage}</p>
          </div>
        )}

        {!loading && !error && !isEmpty && (
          <div style={styles.list}>
            {items.map((item) => {
              const isUnread = !item.read_at
              const isExpanded = expandedId === item.id
              return (
                <div
                  key={item.id}
                  style={{
                    ...styles.card,
                    ...(isUnread ? styles.cardUnread : {}),
                  }}
                >
                  <button
                    type="button"
                    style={styles.cardInner}
                    onClick={() => handleItemClick(item)}
                  >
                    <span style={styles.cardIcon}><IconAlert /></span>
                    <div style={styles.cardBody}>
                      <h3 style={styles.cardTitle}>{item.title || 'Sem título'}</h3>
                      <p style={styles.cardPreview}>{item.body_preview || item.body_full || '—'}</p>
                      <p style={styles.cardMeta}>
                        {formatDateTime(item.created_at)}
                        {isUnread && <span> · Não lida</span>}
                      </p>
                    </div>
                    {item.target_url && <span style={{ flexShrink: 0, opacity: 0.6 }}><IconChevronRight /></span>}
                  </button>
                  {isExpanded && (item.body_full || item.body_preview) && !item.target_url && (
                    <div style={styles.expandedBody}>{item.body_full || item.body_preview}</div>
                  )}
                  <div style={styles.cardActions}>
                    <button
                      type="button"
                      style={styles.cardActionBtn}
                      disabled={markingId === item.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkRead(item.id, !item.read_at)
                      }}
                    >
                      {item.read_at ? 'Marcar como não lida' : 'Marcar como lida'}
                    </button>
                  </div>
                </div>
              )
            })}
            {nextCursor && (
              <button
                type="button"
                style={styles.loadMore}
                disabled={loadingMore}
                onClick={() => fetchList(nextCursor, true)}
              >
                {loadingMore ? 'Carregando…' : 'Carregar mais'}
              </button>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div
          role="status"
          style={{
            ...styles.toast,
            ...(toastType === 'success' ? styles.toastSuccess : {}),
            ...(toastType === 'error' ? styles.toastError : {}),
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
