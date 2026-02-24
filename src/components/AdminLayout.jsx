import { Link, useLocation } from 'react-router-dom'
import { FranchisorSidebarProvider, useFranchisorSidebar } from '../contexts/FranchisorSidebarContext'

const GRID = 8

/** Extrai o ID do franqueador da URL quando estamos no contexto de um franqueador */
function getFranchisorIdFromPath(pathname) {
  const segments = pathname.split('/').filter(Boolean)
  // ['admin', 'franqueadores', ...]
  if (segments[0] !== 'admin' || segments[1] !== 'franqueadores') return null
  const third = segments[2]
  if (!third || third === 'novo') return null
  if (third === 'editar') return segments[3] || null
  return third // /admin/franqueadores/:id ou /admin/franqueadores/:id/usuarios
}

function AdminSidebar() {
  const location = useLocation()
  const { franchisorName } = useFranchisorSidebar()
  const path = location.pathname
  const search = location.search || ''
  const franchisorId = getFranchisorIdFromPath(path)

  const isLista = path === '/admin/franqueadores'
  const isNovo = path === '/admin/franqueadores/novo'
  const tabOverview = !search.includes('tab=schools') && !path.includes('/usuarios') && !path.includes('/status')
  const tabSchools = search.includes('tab=schools')
  const isUsuarios = path.includes('/usuarios')
  const isStatus = path.includes('/status')

  const isListaEscolas = path === '/admin/escolas'
  const isNovaEscola = path === '/admin/escolas/nova'

  const styles = {
    sidebar: {
      width: 260,
      minWidth: 260,
      background: 'var(--branco-luz)',
      boxShadow: 'var(--shadow)',
      padding: `${GRID * 2}px 0`,
      display: 'flex',
      flexDirection: 'column',
      gap: GRID * 2,
    },
    groupLabel: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--grafite-tecnico)',
      opacity: 0.6,
      padding: `0 ${GRID * 3}px`,
      marginBottom: GRID,
    },
    link: {
      display: 'block',
      padding: `${GRID * 1.5}px ${GRID * 3}px`,
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--grafite-tecnico)',
      textDecoration: 'none',
      borderLeft: '3px solid transparent',
    },
    linkActive: {
      color: 'var(--azul-arena)',
      background: 'rgba(44, 110, 242, 0.08)',
      borderLeftColor: 'var(--azul-arena)',
    },
    submenuWrap: {
      marginTop: GRID,
      paddingLeft: GRID * 2,
      borderLeft: '1px solid rgba(0,0,0,0.06)',
    },
    contextLabel: {
      fontSize: 12,
      color: 'var(--grafite-tecnico)',
      opacity: 0.85,
      padding: `${GRID}px ${GRID * 3}px`,
      marginBottom: GRID * 0.5,
      fontWeight: 600,
    },
  }

  return (
    <aside style={styles.sidebar} aria-label="Menu lateral">
      <nav style={{ display: 'flex', flexDirection: 'column', gap: GRID }}>
        <Link
          to="/admin/dashboard"
          style={{
            ...styles.link,
            ...(path === '/admin/dashboard' ? styles.linkActive : {}),
          }}
        >
          Dashboard
        </Link>
      </nav>

      <div>
        <div style={styles.groupLabel}>Franqueadores</div>
        <Link
          to="/admin/franqueadores"
          style={{
            ...styles.link,
            ...(isLista ? styles.linkActive : {}),
          }}
        >
          Franqueadores
        </Link>
        <Link
          to="/admin/franqueadores/novo"
          style={{
            ...styles.link,
            ...(isNovo ? styles.linkActive : {}),
          }}
        >
          Novo franqueador
        </Link>

        {franchisorId && (
          <div style={styles.submenuWrap}>
            <div style={styles.contextLabel}>
              Contexto do franqueador: {franchisorName || '…'}
            </div>
            <Link
              to={`/admin/franqueadores/${franchisorId}?tab=overview`}
              style={{
                ...styles.link,
                ...(tabOverview && !isUsuarios ? styles.linkActive : {}),
              }}
            >
              Visão geral
            </Link>
            <Link
              to={`/admin/franqueadores/${franchisorId}?tab=schools`}
              style={{
                ...styles.link,
                ...(tabSchools ? styles.linkActive : {}),
              }}
            >
              Escolas vinculadas
            </Link>
            <Link
              to={`/admin/franqueadores/${franchisorId}/usuarios`}
              style={{
                ...styles.link,
                ...(isUsuarios ? styles.linkActive : {}),
              }}
            >
              Usuários
            </Link>
            <Link
              to={`/admin/franqueadores/${franchisorId}/status`}
              style={{
                ...styles.link,
                ...(isStatus ? styles.linkActive : {}),
              }}
            >
              Status
            </Link>
          </div>
        )}
      </div>

      <div>
        <div style={styles.groupLabel}>Escolas</div>
        <Link
          to="/admin/escolas"
          style={{
            ...styles.link,
            ...(isListaEscolas ? styles.linkActive : {}),
          }}
        >
          Escolas
        </Link>
        <Link
          to="/admin/escolas/nova"
          style={{
            ...styles.link,
            ...(isNovaEscola ? styles.linkActive : {}),
          }}
        >
          Nova escola
        </Link>
      </div>

      <div>
        <div style={styles.groupLabel}>Suporte</div>
        <Link
          to="/admin/support"
          style={{
            ...styles.link,
            ...(path === '/admin/support' ? styles.linkActive : {}),
          }}
        >
          Central de solicitações
        </Link>
        <Link
          to="/admin/support/categories"
          style={{
            ...styles.link,
            ...(path === '/admin/support/categories' ? styles.linkActive : {}),
          }}
        >
          Categorias
        </Link>
      </div>

      <div>
        <div style={styles.groupLabel}>Configurações</div>
        <Link
          to="/admin/settings"
          style={{
            ...styles.link,
            ...(path === '/admin/settings' ? styles.linkActive : {}),
          }}
        >
          Configurações Globais
        </Link>
        <Link
          to="/admin/templates"
          style={{
            ...styles.link,
            ...(path === '/admin/templates' || path.startsWith('/admin/templates/') ? styles.linkActive : {}),
          }}
        >
          Templates
        </Link>
      </div>

      <div>
        <div style={styles.groupLabel}>Auditoria</div>
        <Link
          to="/admin/audit-logs"
          style={{
            ...styles.link,
            ...(path === '/admin/audit-logs' || path.startsWith('/admin/audit-logs/') ? styles.linkActive : {}),
          }}
        >
          Auditoria
        </Link>
      </div>

      <div>
        <div style={styles.groupLabel}>Relatórios</div>
        <Link
          to="/admin/reports/strategic"
          style={{
            ...styles.link,
            ...(path === '/admin/reports/strategic' ? styles.linkActive : {}),
          }}
        >
          Relatórios Estratégicos
        </Link>
      </div>

      <div>
        <div style={styles.groupLabel}>Financeiro</div>
        <Link
          to="/admin/finance/global"
          style={{
            ...styles.link,
            ...(path === '/admin/finance/global' ? styles.linkActive : {}),
          }}
        >
          Financeiro Global
        </Link>
        <Link
          to="/admin/finance/delinquency"
          style={{
            ...styles.link,
            ...(path === '/admin/finance/delinquency' ? styles.linkActive : {}),
          }}
        >
          Inadimplência
        </Link>
      </div>

      <div>
        <div style={styles.groupLabel}>Planos e Assinaturas</div>
        <Link
          to="/admin/plans"
          style={{
            ...styles.link,
            ...(path === '/admin/plans' ? styles.linkActive : {}),
          }}
        >
          Planos
        </Link>
        <Link
          to="/admin/subscriptions"
          style={{
            ...styles.link,
            ...(path === '/admin/subscriptions' ? styles.linkActive : {}),
          }}
        >
          Assinaturas
        </Link>
      </div>
    </aside>
  )
}

const layoutStyles = {
  layout: {
    minHeight: '100vh',
    background: 'var(--cinza-arquibancada)',
    display: 'flex',
  },
  header: {
    background: 'var(--branco-luz)',
    boxShadow: 'var(--shadow)',
    padding: `${GRID * 3}px ${GRID * 4}px`,
  },
  headerContent: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    maxWidth: 1400,
    margin: '0 auto',
  },
  titulo: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  main: {
    flex: 1,
    maxWidth: 1400,
    margin: '0 auto',
    padding: GRID * 4,
    width: '100%',
  },
  breadcrumb: {
    marginBottom: GRID * 3,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  breadcrumbSep: {
    margin: '0 6px',
    opacity: 0.6,
  },
  breadcrumbLink: {
    color: 'var(--azul-arena)',
    textDecoration: 'none',
  },
  breadcrumbCurrent: {
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
}

function AdminLayoutInner({ children, breadcrumb = [], pageTitle }) {
  return (
    <div style={layoutStyles.layout}>
      <AdminSidebar />
      <div style={layoutStyles.contentArea}>
        <header style={layoutStyles.header}>
          <div style={layoutStyles.headerContent}>
            <h1 style={layoutStyles.titulo}>{pageTitle || 'Admin'}</h1>
          </div>
        </header>
        <main style={layoutStyles.main}>
          {breadcrumb.length > 0 && (
            <nav style={layoutStyles.breadcrumb} aria-label="Breadcrumb">
              {breadcrumb.map((item, i) => (
                <span key={i}>
                  {i > 0 && <span style={layoutStyles.breadcrumbSep}>/</span>}
                  {item.to ? (
                    <Link to={item.to} style={layoutStyles.breadcrumbLink}>
                      {item.label}
                    </Link>
                  ) : (
                    <span style={layoutStyles.breadcrumbCurrent}>{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout(props) {
  return (
    <FranchisorSidebarProvider>
      <AdminLayoutInner {...props} />
    </FranchisorSidebarProvider>
  )
}
