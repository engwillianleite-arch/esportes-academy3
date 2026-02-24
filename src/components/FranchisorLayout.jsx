import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { getFranchisorSchools } from '../api/franchisorPortal'

const GRID = 8

const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
)
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
  switcherWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
  },
  switcherLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  switcherButton: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    minWidth: 220,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    background: 'var(--branco-luz)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  switcherDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    border: '1px solid #E5E5E7',
    minWidth: 280,
    maxHeight: 320,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
  },
  switcherSearch: {
    padding: GRID * 2,
    borderBottom: '1px solid #eee',
  },
  switcherSearchInput: {
    width: '100%',
    padding: `${GRID}px ${GRID * 2}px ${GRID}px 36px`,
    border: '1px solid #E5E5E7',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
  },
  switcherSearchIcon: {
    position: 'absolute',
    left: GRID * 2 + 8,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--grafite-tecnico)',
    opacity: 0.6,
  },
  switcherList: {
    overflowY: 'auto',
    maxHeight: 240,
    padding: GRID,
  },
  switcherOption: {
    display: 'block',
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: 'none',
    borderRadius: 8,
    background: 'none',
    textAlign: 'left',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
  },
  switcherOptionActive: {
    background: 'rgba(44, 110, 242, 0.1)',
    color: 'var(--azul-arena)',
    fontWeight: 600,
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

function SchoolSwitcher({ schoolId, schools, onSelect, isLoading }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  const searchLower = (search || '').toLowerCase().trim()
  const filtered = searchLower
    ? schools.filter(
        (s) =>
          (s.school_name && s.school_name.toLowerCase().includes(searchLower)) ||
          (s.city && s.city.toLowerCase().includes(searchLower)) ||
          (s.state && s.state.toLowerCase().includes(searchLower))
      )
    : schools

  const selectedSchool = schoolId ? schools.find((s) => s.school_id === schoolId) : null
  const displayLabel = selectedSchool ? selectedSchool.school_name : 'Todas as escolas'
  const showSearch = schools.length > 5

  return (
    <div style={styles.switcherWrap} ref={dropdownRef}>
      <span style={styles.switcherLabel}>Escola</span>
      <button
        type="button"
        style={styles.switcherButton}
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Selecionar escola"
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isLoading ? 'Carregando...' : displayLabel}
        </span>
        <span style={{ flexShrink: 0, display: 'flex' }}><IconChevronDown /></span>
      </button>
      {open && (
        <div style={styles.switcherDropdown} role="listbox">
          {showSearch && (
            <div style={{ position: 'relative', ...styles.switcherSearch }}>
              <span style={styles.switcherSearchIcon}><IconSearch /></span>
              <input
                type="search"
                placeholder="Buscar escola..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.switcherSearchInput}
                aria-label="Buscar escola"
              />
            </div>
          )}
          <div style={styles.switcherList}>
            <button
              type="button"
              style={{
                ...styles.switcherOption,
                ...(!schoolId ? styles.switcherOptionActive : {}),
              }}
              onClick={() => { onSelect(null); setOpen(false); }}
            >
              Todas as escolas
            </button>
            {filtered.map((s) => (
              <button
                key={s.school_id}
                type="button"
                style={{
                  ...styles.switcherOption,
                  ...(schoolId === s.school_id ? styles.switcherOptionActive : {}),
                }}
                onClick={() => { onSelect(s.school_id); setOpen(false); }}
              >
                {s.school_name}
                {(s.city || s.state) && (
                  <span style={{ fontSize: 12, opacity: 0.8, display: 'block', marginTop: 2 }}>
                    {[s.city, s.state].filter(Boolean).join(' / ')}
                  </span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: GRID * 2, fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.7 }}>
                Nenhuma escola encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FranchisorLayout({ children, pageTitle, breadcrumb = [] }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useParams()
  const navigate = useNavigate()
  const schoolIdFromPath = params.school_id || null
  const schoolIdFromQuery = searchParams.get('school_id') || null
  const schoolId = schoolIdFromQuery || schoolIdFromPath
  const [schools, setSchools] = useState([])
  const [schoolsLoading, setSchoolsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getFranchisorSchools()
      .then((res) => { if (!cancelled) setSchools(res.items || []); })
      .catch(() => { if (!cancelled) setSchools([]); })
      .finally(() => { if (!cancelled) setSchoolsLoading(false); })
    return () => { cancelled = true }
  }, [])

  const handleSelectSchool = (id) => {
    const next = new URLSearchParams(searchParams)
    if (id) next.set('school_id', id)
    else next.delete('school_id')
    setSearchParams(next, { replace: true })
    if (!id && schoolIdFromPath) navigate('/franchisor/dashboard', { replace: true })
  }

  return (
    <div style={styles.layout}>
      <header style={styles.topbar} role="banner">
        <div style={styles.topbarLeft}>
          <span style={styles.portalBadge}>Portal Franqueador</span>
          <SchoolSwitcher
            schoolId={schoolId}
            schools={schools}
            onSelect={handleSelectSchool}
            isLoading={schoolsLoading}
          />
        </div>
        <div style={styles.topbarRight}>
          <Link to="/perfil" style={styles.topbarLink} aria-label="Meu perfil">
            <IconUser />
            Meu perfil
          </Link>
          <button type="button" style={styles.topbarBtn} aria-label="Sair" onClick={() => { /* logout */ }}>
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

export { SchoolSwitcher }
