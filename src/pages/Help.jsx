import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  HELP_ARTICLES,
  PORTALS,
  MODULES_BY_PORTAL,
  portalToFilterValue,
} from '../data/helpArticles'

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
const IconChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
)

function portalLabel(portal) {
  const p = (portal || '').toUpperCase()
  if (p === 'ADMIN') return 'Admin'
  if (p === 'FRANCHISOR') return 'Franqueador'
  if (p === 'SCHOOL') return 'Escola'
  return portal || 'Portal'
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
    maxWidth: 800,
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
  header: { marginBottom: GRID * 4 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  searchWrap: {
    position: 'relative',
    marginBottom: GRID * 3,
  },
  searchInput: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 4}px ${GRID * 2}px ${GRID * 4 + 40}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    outline: 'none',
    boxShadow: 'var(--shadow)',
  },
  searchIcon: {
    position: 'absolute',
    left: GRID * 2,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--grafite-tecnico)',
    opacity: 0.6,
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
    alignItems: 'center',
    marginBottom: GRID * 3,
  },
  filterLabel: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  select: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    minWidth: 160,
    cursor: 'pointer',
  },
  btnClear: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
  },
  accordionItem: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  accordionHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: GRID * 3,
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  accordionBody: {
    padding: `0 ${GRID * 3}px ${GRID * 3}`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
    lineHeight: 1.5,
  },
  linkVerMais: {
    marginTop: GRID * 2,
    display: 'inline-block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--azul-arena)',
    textDecoration: 'none',
  },
  empty: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  error: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(220,38,38,0.2)',
  },
  errorTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: '#DC2626' },
  stillNeedHelp: {
    marginTop: GRID * 5,
    padding: GRID * 3,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
}

export default function Help() {
  const navigate = useNavigate()
  const { defaultRedirect, isAuthenticated, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [portalFilter, setPortalFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [error, setError] = useState(null)

  const currentPortal = defaultRedirect?.portal || ''
  const portalName = portalLabel(currentPortal)
  const defaultPortalValue = portalToFilterValue(currentPortal)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (portalFilter === '' && defaultPortalValue) {
      setPortalFilter(defaultPortalValue)
    }
  }, [defaultPortalValue, portalFilter])

  const modulesForPortal = useMemo(() => {
    return MODULES_BY_PORTAL[portalFilter || defaultPortalValue] || []
  }, [portalFilter, defaultPortalValue])

  const effectivePortal = portalFilter || defaultPortalValue || ''

  const filteredArticles = useMemo(() => {
    let list = [...HELP_ARTICLES]
    if (effectivePortal) {
      list = list.filter((a) => a.portal === effectivePortal)
    }
    if (moduleFilter) {
      list = list.filter((a) => a.module === moduleFilter)
    }
    const q = (searchQuery || '').toLowerCase().trim()
    if (q) {
      list = list.filter(
        (a) =>
          (a.question && a.question.toLowerCase().includes(q)) ||
          (a.answer && a.answer.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [effectivePortal, moduleFilter, searchQuery])

  const handleClearFilters = () => {
    setPortalFilter(defaultPortalValue || '')
    setModuleFilter('')
    setSearchQuery('')
    setExpandedId(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const hasFilters = searchQuery || moduleFilter || (portalFilter && portalFilter !== defaultPortalValue && defaultPortalValue)

  if (!isAuthenticated) return null

  return (
    <div style={styles.wrap}>
      <header style={styles.topbar} role="banner">
        <span style={styles.topbarLeft}>Portal {portalName}</span>
        <div style={styles.topbarRight}>
          <span style={{ ...styles.topbarLink, ...styles.topbarLinkActive }} aria-current="page">
            <IconHelp />
            Ajuda
          </span>
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
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/me'))}
        >
          ← Voltar
        </button>

        <div style={styles.header}>
          <h1 style={styles.title}>Central de Ajuda</h1>
          <p style={styles.subtitle}>Perguntas frequentes e orientações</p>
        </div>

        <div style={styles.searchWrap}>
          <span style={styles.searchIcon} aria-hidden><IconSearch /></span>
          <input
            type="search"
            placeholder="Digite um termo (ex.: presença, mensalidade)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            aria-label="Buscar na ajuda"
          />
        </div>

        <div style={styles.filters}>
          <label style={styles.filterLabel}>
            Portal
            <select
              value={portalFilter || defaultPortalValue || ''}
              onChange={(e) => {
                setPortalFilter(e.target.value)
                setModuleFilter('')
              }}
              style={styles.select}
              aria-label="Filtrar por portal"
            >
              {PORTALS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label style={styles.filterLabel}>
            Módulo
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={styles.select}
              aria-label="Filtrar por módulo"
            >
              <option value="">Todos</option>
              {modulesForPortal.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
          {hasFilters && (
            <button type="button" style={styles.btnClear} onClick={handleClearFilters}>
              Limpar filtros
            </button>
          )}
        </div>

        {error && (
          <div style={styles.error}>
            <h2 style={styles.errorTitle}>Acesso Negado</h2>
            <p style={{ margin: `${GRID}px 0 0`, fontSize: 14 }}>{error}</p>
          </div>
        )}

        {!error && filteredArticles.length === 0 && (
          <div style={styles.empty}>
            <h2 style={styles.emptyTitle}>Nenhum artigo encontrado para sua busca.</h2>
            <p style={{ margin: `${GRID}px 0 0`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
              Tente outros termos ou limpe os filtros.
            </p>
          </div>
        )}

        {!error && filteredArticles.length > 0 && (
          <div style={styles.list} role="region" aria-label="Lista de perguntas frequentes">
            {filteredArticles.map((item) => (
              <div key={item.id} style={styles.accordionItem}>
                <button
                  type="button"
                  style={styles.accordionHeader}
                  onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                  aria-expanded={expandedId === item.id}
                  aria-controls={`help-answer-${item.id}`}
                  id={`help-question-${item.id}`}
                >
                  <span>{item.question}</span>
                  <span style={{ transform: expandedId === item.id ? 'rotate(180deg)' : 'none', display: 'flex' }}>
                    <IconChevronDown />
                  </span>
                </button>
                {expandedId === item.id && (
                  <div id={`help-answer-${item.id}`} role="region" aria-labelledby={`help-question-${item.id}`} style={styles.accordionBody}>
                    <p style={{ margin: 0 }}>{item.answer}</p>
                    <Link to={`/help/${item.id}`} style={styles.linkVerMais}>
                      Ver mais →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!error && (
          <div style={styles.stillNeedHelp}>
            <strong>Ainda precisa de ajuda?</strong>
            <p style={{ margin: `${GRID}px 0 0` }}>
              Se não encontrou o que precisa, fale com o responsável da escola ou abra um ticket no suporte (se o portal tiver suporte).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
