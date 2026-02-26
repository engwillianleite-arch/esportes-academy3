import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const GRID = 8

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const IconLogOut = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
)

const styles = {
  layout: {
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
  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 4,
    flexWrap: 'wrap',
  },
  portalBadge: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  schoolName: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
    maxWidth: 280,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
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
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  main: {
    flex: 1,
    maxWidth: 1200,
    margin: '0 auto',
    padding: GRID * 4,
    width: '100%',
  },
}

/**
 * Layout do Portal Escola: topbar sem School Switcher.
 * @param {{ children: React.ReactNode, pageTitle?: string, breadcrumb?: Array<{ to?: string, label: string }>, schoolName?: string }} props
 */
export default function SchoolLayout({ children, pageTitle, breadcrumb = [], schoolName }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={styles.layout}>
      <header style={styles.topbar} role="banner">
        <div style={styles.topbarLeft}>
          <span style={styles.portalBadge}>Portal Escola</span>
          {schoolName != null && schoolName !== '' && (
            <span style={styles.schoolName} title={schoolName}>{schoolName}</span>
          )}
        </div>
        <div style={styles.topbarRight}>
          <Link to="/me" style={styles.topbarLink} aria-label="Meu perfil">
            <IconUser />
            Meu perfil
          </Link>
          <button type="button" style={styles.topbarBtn} aria-label="Sair" onClick={handleLogout}>
            <IconLogOut />
            Sair
          </button>
        </div>
      </header>
      <div style={styles.contentArea}>
        {pageTitle && (
          <div style={{ padding: `${GRID * 2}px ${GRID * 4}px`, background: 'var(--branco-luz)', borderBottom: '1px solid #eee' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--grafite-tecnico)' }}>{pageTitle}</h1>
            {breadcrumb.length > 0 && (
              <nav style={{ marginTop: GRID, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 }} aria-label="Breadcrumb">
                {breadcrumb.map((item, i) => (
                  <span key={i}>
                    {i > 0 && ' / '}
                    {item.to ? <Link to={item.to}>{item.label}</Link> : item.label}
                  </span>
                ))}
              </nav>
            )}
          </div>
        )}
        <main style={styles.main} role="main">
          {children}
        </main>
      </div>
    </div>
  )
}
