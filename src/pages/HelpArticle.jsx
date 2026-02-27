import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { HELP_ARTICLES, MODULES_BY_PORTAL, portalToFilterValue } from '../data/helpArticles'

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
const IconHelp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
)

function portalLabel(portal) {
  const p = (portal || '').toUpperCase()
  if (p === 'ADMIN') return 'Admin'
  if (p === 'FRANCHISOR') return 'Franqueador'
  if (p === 'SCHOOL') return 'Escola'
  return portal || 'Portal'
}

function moduleLabel(portal, moduleValue) {
  const list = MODULES_BY_PORTAL[portal] || []
  const found = list.find((m) => m.value === moduleValue)
  return found ? found.label : moduleValue
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
  article: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: GRID * 4,
  },
  meta: {
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.7,
    marginBottom: GRID * 2,
  },
  title: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 22, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  body: {
    fontSize: 15,
    color: 'var(--grafite-tecnico)',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  empty: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
}

export default function HelpArticle() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const { defaultRedirect, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const article = HELP_ARTICLES.find((a) => a.id === articleId)
  const portalName = portalLabel(defaultRedirect?.portal)
  const portalValue = portalToFilterValue(defaultRedirect?.portal)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!isAuthenticated) return null

  return (
    <div style={styles.wrap}>
      <header style={styles.topbar} role="banner">
        <span style={styles.topbarLeft}>Portal {portalName}</span>
        <div style={styles.topbarRight}>
          <Link to="/help" style={styles.topbarLink} aria-label="Central de Ajuda">
            <IconHelp />
            Ajuda
          </Link>
          <Link to="/me" style={styles.topbarLink} aria-label="Meu perfil">
            <IconUser />
            Meu perfil
          </Link>
          <Link to="/me/notifications" style={styles.topbarLink} aria-label="Notificações">
            <IconBell />
            Notificações
          </Link>
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
          onClick={() => navigate(-1)}
        >
          ← Voltar
        </button>

        {!article && (
          <div style={styles.empty}>
            <h2 style={styles.emptyTitle}>Artigo não encontrado.</h2>
            <p style={{ margin: `${GRID}px 0 0`, fontSize: 14 }}>
              <Link to="/help" style={{ color: 'var(--azul-arena)', fontWeight: 600 }}>Voltar à Central de Ajuda</Link>
            </p>
          </div>
        )}

        {article && (
          <article style={styles.article}>
            <p style={styles.meta}>
              {moduleLabel(article.portal, article.module)}
            </p>
            <h1 style={styles.title}>{article.question}</h1>
            <div style={styles.body}>{article.answer}</div>
          </article>
        )}
      </div>
    </div>
  )
}
