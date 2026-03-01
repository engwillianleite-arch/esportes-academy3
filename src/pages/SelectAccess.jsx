import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPostLoginOptions, selectAccess } from '../api/auth'
import { setMockSession } from '../data/mockSchoolSession'

const GRID = 8

const ALLOWED_RETURN_PREFIXES = ['/admin/', '/franchisor/', '/school/']

function isReturnToAllowed(returnTo) {
  if (!returnTo || typeof returnTo !== 'string') return false
  const trimmed = returnTo.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) return false
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return ALLOWED_RETURN_PREFIXES.some((p) => normalized.startsWith(p))
}

const PORTAL_LABELS = {
  ADMIN: 'Admin',
  FRANCHISOR: 'Franqueador',
  SCHOOL: 'Escola',
}
const PORTAL_DESCRIPTIONS = {
  ADMIN: 'Gerenciar plataforma',
  FRANCHISOR: 'Gerenciar escolas do franqueador',
  SCHOOL: 'Operação da escola',
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--cinza-arquibancada)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: GRID * 4,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    padding: GRID * 5,
    border: '1px solid rgba(0,0,0,0.04)',
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--azul-arena)',
    letterSpacing: '-0.02em',
    marginBottom: GRID * 4,
    textAlign: 'center',
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: `${GRID}px 0 ${GRID * 4}px`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  sectionTitle: {
    margin: `0 0 ${GRID * 2}px`,
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  cardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
  },
  portalCard: {
    padding: GRID * 3,
    border: '2px solid rgba(58,58,60,0.15)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    background: 'var(--branco-luz)',
  },
  portalCardSelected: {
    borderColor: 'var(--azul-arena)',
    background: 'rgba(0, 100, 180, 0.04)',
  },
  portalCardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  portalCardDesc: {
    margin: `${GRID}px 0 0`,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  contextCard: {
    padding: GRID * 2,
    border: '1px solid rgba(58,58,60,0.2)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    background: 'var(--branco-luz)',
  },
  contextCardSelected: {
    borderColor: 'var(--azul-arena)',
    background: 'rgba(0, 100, 180, 0.04)',
  },
  contextCardDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    borderStyle: 'dashed',
  },
  searchInput: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 2}`,
    fontSize: 14,
    border: '1px solid rgba(58,58,60,0.2)',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    marginBottom: GRID * 2,
    boxSizing: 'border-box',
  },
  actions: {
    marginTop: GRID * 5,
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
  },
  btnPrimary: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 3}`,
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--branco-luz)',
    background: 'var(--azul-arena)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GRID,
  },
  btnSecondary: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 3}`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: '1px solid rgba(58,58,60,0.25)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  errorBox: {
    marginTop: GRID * 2,
    padding: GRID * 2,
    background: 'rgba(220, 53, 69, 0.08)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    color: '#b02a37',
  },
  skeleton: {
    height: 72,
    borderRadius: 'var(--radius)',
    background: 'linear-gradient(90deg, rgba(58,58,60,0.08) 25%, rgba(58,58,60,0.12) 50%, rgba(58,58,60,0.08) 75%)',
    backgroundSize: '200% 100%',
    animation: 'select-access-shimmer 1.2s ease-in-out infinite',
  },
  supportText: {
    marginTop: GRID * 2,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
}

function SkeletonCards({ count = 3 }) {
  return (
    <div style={styles.cardGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={styles.skeleton} />
      ))}
    </div>
  )
}

export default function SelectAccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnToParam = searchParams.get('returnTo') || ''
  const { user, logout } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState(null)
  const [noAccessError, setNoAccessError] = useState(false)
  const [portals, setPortals] = useState([])
  const [selectedPortal, setSelectedPortal] = useState(null)
  const [selectedContext, setSelectedContext] = useState(null)
  const [schoolSearch, setSchoolSearch] = useState('')

  const returnTo = useMemo(() => {
    if (!isReturnToAllowed(returnToParam)) return null
    return returnToParam.startsWith('/') ? returnToParam : `/${returnToParam}`
  }, [returnToParam])

  const hasAdmin = useMemo(() => portals.some((p) => (p.portal || '').toUpperCase() === 'ADMIN'), [portals])
  const franchisorOptions = useMemo(
    () => portals.filter((p) => (p.portal || '').toUpperCase() === 'FRANCHISOR'),
    [portals]
  )
  const schoolOption = useMemo(
    () => portals.find((p) => (p.portal || '').toUpperCase() === 'SCHOOL'),
    [portals]
  )
  const schools = useMemo(() => schoolOption?.schools || [], [schoolOption])
  const multipleFranchisors = franchisorOptions.length > 1
  const multipleSchools = schools.length > 1

  const filteredSchools = useMemo(() => {
    if (!schoolSearch.trim()) return schools
    const q = schoolSearch.trim().toLowerCase()
    return schools.filter(
      (s) =>
        (s.school_name || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.state || '').toLowerCase().includes(q)
    )
  }, [schools, schoolSearch])

  const needsContextSelection =
    selectedPortal === 'SCHOOL' && multipleSchools ||
    selectedPortal === 'FRANCHISOR' && multipleFranchisors

  const canContinue = useMemo(() => {
    if (!selectedPortal) return false
    if (selectedPortal === 'ADMIN') return true
    if (selectedPortal === 'FRANCHISOR') return multipleFranchisors ? !!selectedContext : true
    if (selectedPortal === 'SCHOOL') return multipleSchools ? !!selectedContext : true
    return false
  }, [selectedPortal, selectedContext, multipleFranchisors, multipleSchools])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setNoAccessError(false)
    getPostLoginOptions()
      .then((data) => {
        if (cancelled) return
        const list = data.portals || []
        setPortals(list)
        if (list.length === 0) setNoAccessError(true)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Não foi possível carregar as opções.')
        setPortals([])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleSelectPortal = (portalKey) => {
    setSelectedPortal(portalKey)
    setSelectedContext(null)
    setError(null)
  }

  const handleContinue = async () => {
    if (!canContinue) return
    setError(null)
    setSubmitLoading(true)
    const context = {}
    if (selectedPortal === 'SCHOOL' && selectedContext) context.school_id = selectedContext
    if (selectedPortal === 'FRANCHISOR' && selectedContext) context.franchisor_id = selectedContext
    const payload = {
      portal: selectedPortal,
      ...(Object.keys(context).length ? { context } : {}),
      ...(returnTo ? { returnTo } : {}),
    }
    try {
      const { redirect_to } = await selectAccess(payload)
      const path = redirect_to.startsWith('/') ? redirect_to : `/${redirect_to}`

      if (path.startsWith('/school/') && selectedPortal === 'SCHOOL') {
        const schoolId = context.school_id ?? schools[0]?.school_id ?? 'demo-school-1'
        const chosen = schools.find((s) => s.school_id === schoolId)
        setMockSession({
          user_id: user?.id ?? 'u1',
          school_id: schoolId,
          school_name: chosen?.school_name ?? 'Minha Escola',
          role: schoolOption?.role ?? 'SchoolOwner',
        })
      }

      navigate(path, { replace: true })
    } catch (err) {
      setError(err.message || 'Não foi possível validar seu acesso. Tente novamente.')
      setSubmitLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (noAccessError) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>Esportes Academy</div>
          <h1 style={styles.title}>Escolha como deseja acessar</h1>
          <p style={styles.subtitle}>Sua conta não possui acesso a nenhum portal no momento.</p>
          <div style={styles.actions}>
            <button type="button" onClick={handleLogout} style={styles.btnPrimary}>
              Sair
            </button>
            <p style={styles.supportText}>Contato do suporte</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Esportes Academy</div>
        <h1 style={styles.title}>Escolha como deseja acessar</h1>
        <p style={styles.subtitle}>Selecione o portal e, se necessário, a escola</p>

        {loading ? (
          <SkeletonCards count={3} />
        ) : (
          <>
            {/* Seção A — Seleção de Portal */}
            <section aria-label="Seleção de portal">
              <h2 style={styles.sectionTitle}>Portal</h2>
              <div style={styles.cardGrid}>
                {hasAdmin && (
                  <button
                    type="button"
                    style={{
                      ...styles.portalCard,
                      ...(selectedPortal === 'ADMIN' ? styles.portalCardSelected : {}),
                    }}
                    onClick={() => handleSelectPortal('ADMIN')}
                  >
                    <div style={styles.portalCardTitle}>{PORTAL_LABELS.ADMIN}</div>
                    <div style={styles.portalCardDesc}>{PORTAL_DESCRIPTIONS.ADMIN}</div>
                  </button>
                )}
                {franchisorOptions.length > 0 && (
                  <button
                    type="button"
                    style={{
                      ...styles.portalCard,
                      ...(selectedPortal === 'FRANCHISOR' ? styles.portalCardSelected : {}),
                    }}
                    onClick={() => handleSelectPortal('FRANCHISOR')}
                  >
                    <div style={styles.portalCardTitle}>{PORTAL_LABELS.FRANCHISOR}</div>
                    <div style={styles.portalCardDesc}>{PORTAL_DESCRIPTIONS.FRANCHISOR}</div>
                  </button>
                )}
                {schoolOption && (
                  <button
                    type="button"
                    style={{
                      ...styles.portalCard,
                      ...(selectedPortal === 'SCHOOL' ? styles.portalCardSelected : {}),
                    }}
                    onClick={() => handleSelectPortal('SCHOOL')}
                  >
                    <div style={styles.portalCardTitle}>{PORTAL_LABELS.SCHOOL}</div>
                    <div style={styles.portalCardDesc}>{PORTAL_DESCRIPTIONS.SCHOOL}</div>
                  </button>
                )}
              </div>
            </section>

            {/* Seção B — Seleção de Contexto */}
            {selectedPortal === 'SCHOOL' && multipleSchools && (
              <section aria-label="Seleção de escola" style={{ marginTop: GRID * 4 }}>
                <h2 style={styles.sectionTitle}>Escolha a escola</h2>
                <input
                  type="search"
                  placeholder="Buscar escola…"
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  style={styles.searchInput}
                  aria-label="Buscar escola"
                />
                <div style={styles.cardGrid}>
                  {filteredSchools.map((s) => {
                    const suspended = (s.status || '').toUpperCase() === 'SUSPENDED' || (s.status || '').toUpperCase() === 'SUSPENSA'
                    const id = s.school_id
                    const selected = selectedContext === id
                    return (
                      <button
                        key={id}
                        type="button"
                        style={{
                          ...styles.contextCard,
                          ...(selected ? styles.contextCardSelected : {}),
                          ...(suspended ? styles.contextCardDisabled : {}),
                        }}
                        onClick={() => !suspended && setSelectedContext(id)}
                        disabled={suspended}
                      >
                        <div style={styles.portalCardTitle}>
                          {s.school_name || id}
                          {suspended && ' — Suspensa'}
                        </div>
                        {(s.city || s.state) && (
                          <div style={styles.portalCardDesc}>
                            {[s.city, s.state].filter(Boolean).join(' / ')}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {selectedPortal === 'FRANCHISOR' && multipleFranchisors && (
              <section aria-label="Seleção de franqueador" style={{ marginTop: GRID * 4 }}>
                <h2 style={styles.sectionTitle}>Escolha o franqueador</h2>
                <div style={styles.cardGrid}>
                  {franchisorOptions.map((f) => {
                    const id = f.franchisor_id
                    const selected = selectedContext === id
                    return (
                      <button
                        key={id}
                        type="button"
                        style={{
                          ...styles.contextCard,
                          ...(selected ? styles.contextCardSelected : {}),
                        }}
                        onClick={() => setSelectedContext(id)}
                      >
                        <div style={styles.portalCardTitle}>{f.franchisor_name || id}</div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {error && <div style={styles.errorBox} role="alert">{error}</div>}

            <div style={styles.actions}>
              <button
                type="button"
                style={{
                  ...styles.btnPrimary,
                  ...(!canContinue || submitLoading ? styles.btnDisabled : {}),
                }}
                disabled={!canContinue || submitLoading}
                onClick={handleContinue}
              >
                {submitLoading ? (
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Validando…
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
              <button type="button" style={styles.btnSecondary} onClick={handleLogout}>
                Sair
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes select-access-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
