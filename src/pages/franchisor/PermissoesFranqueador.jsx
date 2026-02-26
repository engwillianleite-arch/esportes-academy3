import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorPermissionsMatrix,
  patchFranchisorStaffPermissions,
  resetFranchisorStaffPermissions,
} from '../../api/franchisorPortal'

const GRID = 8
const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']
const ROLE_OPTIONS = [
  { value: 'FranchisorOwner', label: 'FranchisorOwner' },
  { value: 'FranchisorStaff', label: 'FranchisorStaff' },
]

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--verde-patrocinio)" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const styles = {
  section: { marginBottom: GRID * 4 },
  header: { marginBottom: GRID * 4 },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  headerActions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: GRID * 2, marginTop: GRID * 2 },
  tabs: {
    display: 'flex',
    gap: 0,
    borderBottom: '2px solid var(--cinza-arquibancada)',
    marginBottom: GRID * 4,
  },
  tab: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    marginBottom: -2,
    cursor: 'pointer',
  },
  tabActive: {
    color: 'var(--azul-arena)',
    borderBottomColor: 'var(--azul-arena)',
  },
  matrixCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 3,
    overflow: 'hidden',
  },
  moduleTitle: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    background: 'var(--cinza-arquibancada)',
    borderBottom: '1px solid #eee',
  },
  matrixRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${GRID * 1.5}px ${GRID * 3}px`,
    borderBottom: '1px solid #f0f0f0',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  matrixRowLast: { borderBottom: 'none' },
  cellLabel: { flex: 1 },
  cellStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    minWidth: 120,
    justifyContent: 'flex-end',
  },
  permitted: { color: 'var(--verde-patrocinio)', fontWeight: 500 },
  notPermitted: { color: 'var(--grafite-tecnico)', opacity: 0.5 },
  note: { fontSize: 12, opacity: 0.8, marginTop: 2 },
  linksSection: {
    marginTop: GRID * 4,
    padding: GRID * 3,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    border: '1px solid #eee',
  },
  linksTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  linksList: { display: 'flex', flexWrap: 'wrap', gap: GRID * 2 },
  link: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 3,
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
  },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
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
  btnSecondary: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  customSection: {
    marginTop: GRID * 4,
    padding: GRID * 4,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    border: '1px solid #eee',
  },
  customTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  customToggle: { display: 'flex', alignItems: 'center', gap: GRID * 2, marginBottom: GRID * 3 },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: GRID * 2, marginBottom: GRID, fontSize: 14 },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
}

function MatrixSkeleton() {
  return (
    <div style={styles.matrixCard}>
      <div style={{ ...styles.moduleTitle, ...styles.skeleton }} />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={styles.matrixRow}>
          <div style={{ ...styles.skeleton, flex: 1, maxWidth: 280 }} />
          <div style={{ ...styles.skeleton, width: 80 }} />
        </div>
      ))}
    </div>
  )
}

export default function PermissoesFranqueador() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const roleFromUrl = searchParams.get('role') || 'FranchisorOwner'
  const selectedRole = ROLE_OPTIONS.some((r) => r.value === roleFromUrl) ? roleFromUrl : 'FranchisorOwner'

  const [me, setMe] = useState(null)
  const [matrixData, setMatrixData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [toast, setToast] = useState(null)
  const [customizing, setCustomizing] = useState(false)
  const [staffDraft, setStaffDraft] = useState([])
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const isOwner = me?.user_role === 'FranchisorOwner'

  const fetchMatrix = useCallback(() => {
    setError(null)
    getFranchisorPermissionsMatrix()
      .then(setMatrixData)
      .catch((err) => setError(err?.message || 'Não foi possível carregar permissões. Tente novamente.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setPermissionDenied(false)
    getFranchisorMe()
      .then((res) => {
        if (cancelled) return
        if (!ALLOWED_ROLES.includes(res.user_role)) {
          setPermissionDenied(true)
          return
        }
        setMe(res)
        return getFranchisorPermissionsMatrix()
      })
      .then((data) => {
        if (!cancelled && data) setMatrixData(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Não foi possível carregar permissões. Tente novamente.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (matrixData && customizing) {
      const staffRole = matrixData.roles.find((r) => r.role === 'FranchisorStaff')
      setStaffDraft(staffRole ? [...staffRole.permissions] : [])
    }
  }, [matrixData, customizing])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=franchisor', { replace: true })
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const setRole = (role) => {
    const next = new URLSearchParams(searchParams)
    next.set('role', role)
    setSearchParams(next, { replace: true })
  }

  const currentPermissions = matrixData?.roles?.find((r) => r.role === selectedRole)?.permissions ?? []
  const permissionSet = new Set(currentPermissions)
  const staffCustomized = matrixData?.staff_customized ?? false
  const whitelist = matrixData?.staff_customizable_whitelist ?? []

  const handleRestoreDefault = async () => {
    if (!isOwner) return
    setRestoring(true)
    try {
      await resetFranchisorStaffPermissions()
      await getFranchisorPermissionsMatrix().then(setMatrixData)
      setToast('Permissões restauradas ao padrão.')
    } catch {
      setError('Não foi possível restaurar. Tente novamente.')
    } finally {
      setRestoring(false)
    }
  }

  const handleSaveCustom = async () => {
    if (!isOwner) return
    setSaving(true)
    try {
      await patchFranchisorStaffPermissions({ permissions: staffDraft })
      await getFranchisorPermissionsMatrix().then(setMatrixData)
      setCustomizing(false)
      setToast('Permissões atualizadas com sucesso!')
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStaffPerm = (key) => {
    if (!whitelist.includes(key)) return
    setStaffDraft((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  if (permissionDenied) return null

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Configurações' },
    { label: 'Permissões' },
  ]

  return (
    <FranchisorLayout pageTitle="Permissões e Perfis" breadcrumb={breadcrumb}>
      <section style={styles.section} aria-label="Permissões e perfis">
        <header style={styles.header}>
          <h1 style={styles.title}>Permissões e Perfis</h1>
          <p style={styles.subtitle}>O que cada role pode acessar no Portal Franqueador</p>
          <div style={styles.headerActions}>
            {isOwner && staffCustomized && !customizing && (
              <button
                type="button"
                style={styles.btnSecondary}
                onClick={handleRestoreDefault}
                disabled={restoring || loading}
              >
                Restaurar padrão
              </button>
            )}
          </div>
        </header>

        {toast && <div style={styles.toast} role="status">{toast}</div>}

        {error && (
          <div style={styles.errorBox} role="alert">
            <span style={styles.errorIcon}><IconAlert /></span>
            <div style={styles.errorContent}>
              <div style={styles.errorTitle}>Erro</div>
              <div style={styles.errorText}>{error}</div>
              <button type="button" style={styles.btnReload} onClick={() => { setError(null); fetchMatrix(); setLoading(true); }}>
                Tente novamente
              </button>
            </div>
          </div>
        )}

        {!error && (
          <>
            <nav style={styles.tabs} aria-label="Selecionar perfil">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  style={{
                    ...styles.tab,
                    ...(selectedRole === opt.value ? styles.tabActive : {}),
                  }}
                  onClick={() => setRole(opt.value)}
                  aria-pressed={selectedRole === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </nav>

            {loading ? (
              <>
                <MatrixSkeleton />
                <MatrixSkeleton />
              </>
            ) : matrixData?.modules_structure ? (
              <>
                {matrixData.modules_structure.map((mod) => (
                  <div key={mod.module} style={styles.matrixCard}>
                    <div style={styles.moduleTitle}>{mod.module}</div>
                    {mod.items.map((item, idx) => {
                      const allowed = permissionSet.has(item.key)
                      const isLast = idx === mod.items.length - 1
                      return (
                        <div
                          key={item.key}
                          style={{
                            ...styles.matrixRow,
                            ...(isLast ? styles.matrixRowLast : {}),
                          }}
                        >
                          <div style={styles.cellLabel}>
                            {item.label}
                            {item.key === 'USERS_REMOVE' && selectedRole === 'FranchisorOwner' && (
                              <div style={styles.note}>Somente Owner</div>
                            )}
                          </div>
                          <div style={styles.cellStatus}>
                            {allowed ? (
                              <>
                                <IconCheck />
                                <span style={styles.permitted}>Permitido</span>
                              </>
                            ) : (
                              <>
                                <span style={styles.notPermitted} aria-hidden="true"><IconX /></span>
                                <span style={styles.notPermitted}>Não permitido</span>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}

                {isOwner && (
                  <div style={styles.customSection}>
                    <h2 style={styles.customTitle}>Personalizar permissões do Staff (Fase 2)</h2>
                    {!customizing ? (
                      <div style={styles.customToggle}>
                        <button
                          type="button"
                          style={styles.btnSecondary}
                          onClick={() => setCustomizing(true)}
                        >
                          {staffCustomized ? 'Editar customização' : 'Personalizar permissões do Staff'}
                        </button>
                      </div>
                    ) : (
                      <>
                        <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
                          Marque as permissões adicionais que o perfil FranchisorStaff pode ter (apenas as listadas abaixo).
                        </p>
                        {whitelist.map((key) => {
                          const label = matrixData.modules_structure
                            .flatMap((m) => m.items)
                            .find((i) => i.key === key)?.label ?? key
                          return (
                            <label key={key} style={styles.checkboxRow}>
                              <input
                                type="checkbox"
                                checked={staffDraft.includes(key)}
                                onChange={() => toggleStaffPerm(key)}
                              />
                              {label}
                            </label>
                          )
                        })}
                        <div style={{ display: 'flex', gap: GRID * 2, marginTop: GRID * 3 }}>
                          <button
                            type="button"
                            style={styles.btnPrimary}
                            onClick={handleSaveCustom}
                            disabled={saving}
                          >
                            Salvar alterações
                          </button>
                          <button
                            type="button"
                            style={styles.btnSecondary}
                            onClick={() => { setCustomizing(false); }}
                            disabled={saving}
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div style={styles.linksSection}>
                  <h2 style={styles.linksTitle}>Links úteis</h2>
                  <div style={styles.linksList}>
                    <Link to="/franchisor/users" style={styles.link}>Gerenciar usuários</Link>
                    {isOwner && (
                      <Link to="/franchisor/users/new" style={styles.link}>Criar usuário</Link>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </section>
    </FranchisorLayout>
  )
}
