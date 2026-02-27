import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { changePassword as apiChangePassword } from '../api/me'

const GRID = 8

function portalLabel(portal) {
  const p = (portal || '').toUpperCase()
  if (p === 'ADMIN') return 'Admin'
  if (p === 'FRANCHISOR') return 'Franqueador'
  if (p === 'SCHOOL') return 'Escola'
  return portal || '—'
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
  topbarLeft: { display: 'flex', alignItems: 'center', gap: GRID * 4, flexWrap: 'wrap' },
  portalBadge: { fontSize: 14, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: GRID * 2 },
  topbarLink: {
    display: 'inline-flex',
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
    display: 'inline-flex',
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
  container: { maxWidth: 560, margin: '0 auto', padding: GRID * 4, width: '100%' },
  breadcrumb: {
    marginBottom: GRID * 2,
  },
  breadcrumbLink: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    textDecoration: 'none',
    opacity: 0.9,
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
  },
  header: { marginBottom: GRID * 4 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  section: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: GRID * 4,
  },
  field: { marginBottom: GRID * 3, maxWidth: 400 },
  label: { display: 'block', marginBottom: GRID / 2, fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: {
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    paddingRight: 40,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputError: { borderColor: '#DC2626' },
  toggleVisibility: {
    position: 'absolute',
    right: GRID,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: GRID,
    color: 'var(--grafite-tecnico)',
    opacity: 0.7,
    fontSize: 12,
  },
  hint: { marginTop: GRID / 2, fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.7 },
  errorField: { marginTop: GRID / 2, fontSize: 12, color: '#DC2626' },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
    marginTop: GRID * 3,
    marginBottom: GRID * 4,
  },
  toggleLabel: { fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)', cursor: 'pointer' },
  checkbox: { width: 18, height: 18, cursor: 'pointer' },
  actions: { display: 'flex', gap: GRID * 2, flexWrap: 'wrap', marginTop: GRID * 4 },
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
  btnSecondary: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
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
}

export default function ChangePassword() {
  const navigate = useNavigate()
  const { defaultRedirect, isAuthenticated, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [logoutOtherSessions, setLogoutOtherSessions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [toast, setToast] = useState(null)
  const [toastType, setToastType] = useState('info')

  const portal = defaultRedirect?.portal
  const portalName = portalLabel(portal)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (message, type = 'info') => {
    setToast(message)
    setToastType(type)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    const cur = (currentPassword || '').trim()
    const newP = (newPassword || '').trim()
    const conf = (confirmPassword || '').trim()

    if (!cur) {
      setFormError('Informe a senha atual.')
      return
    }
    if (!newP) {
      setFormError('Informe a nova senha.')
      return
    }
    if (newP !== conf) {
      setFormError('A nova senha e a confirmação não coincidem.')
      return
    }
    if (newP === cur) {
      setFormError('A nova senha deve ser diferente da senha atual.')
      return
    }

    setSubmitting(true)
    try {
      await apiChangePassword(cur, newP, logoutOtherSessions)
      showToast('Senha alterada com sucesso.', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => navigate('/me', { replace: true }), 1500)
    } catch (err) {
      const code = err.code || (err.message && err.message.includes('atual') ? 'INVALID_CURRENT' : 'UNKNOWN')
      if (code === 'INVALID_CURRENT_PASSWORD' || code === 'INVALID_CURRENT' || (err.message && err.message.toLowerCase().includes('atual'))) {
        setFormError('Senha atual inválida.')
      } else if (code === 'PASSWORD_POLICY' || code === 'WEAK_PASSWORD' || (err.message && err.message.toLowerCase().includes('requisitos'))) {
        setFormError('A nova senha não atende aos requisitos.')
      } else {
        setFormError('Não foi possível alterar a senha. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/me')
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!isAuthenticated) return null

  return (
    <div style={styles.wrap}>
      {/* Topbar (portal atual) */}
      <header style={styles.topbar}>
        <div style={styles.topbarLeft}>
          <span style={styles.portalBadge}>{portalName}</span>
        </div>
        <div style={styles.topbarRight}>
          <Link to="/me" style={styles.topbarLink}>
            Meu perfil
          </Link>
          <button type="button" style={styles.topbarBtn} onClick={handleLogout} aria-label="Sair">
            Sair
          </button>
        </div>
      </header>

      <div style={styles.container}>
        {/* Breadcrumb */}
        <nav style={styles.breadcrumb} aria-label="Navegação">
          <Link to="/me" style={styles.breadcrumbLink}>
            ← Meu perfil
          </Link>
        </nav>

        {/* Cabeçalho */}
        <div style={styles.header}>
          <h1 style={styles.title}>Alterar senha</h1>
          <p style={styles.subtitle}>Defina uma nova senha para sua conta.</p>
        </div>

        {/* Formulário */}
        <section style={styles.section} aria-labelledby="change-password-title">
          <h2 id="change-password-title" style={{ margin: '0 0 ' + GRID * 3 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' }}>
            Nova senha
          </h2>
          <form onSubmit={handleSubmit} noValidate>
            {formError && (
              <p style={{ ...styles.errorField, marginBottom: GRID * 2 }} role="alert">
                {formError}
              </p>
            )}

            <div style={styles.field}>
              <label htmlFor="current-password" style={styles.label}>Senha atual *</label>
              <div style={styles.inputWrap}>
                <input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setFormError(null) }}
                  style={styles.input}
                  autoComplete="current-password"
                  disabled={submitting}
                  aria-required="true"
                />
                <button
                  type="button"
                  style={styles.toggleVisibility}
                  onClick={() => setShowCurrent((s) => !s)}
                  aria-label={showCurrent ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showCurrent ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div style={styles.field}>
              <label htmlFor="new-password" style={styles.label}>Nova senha *</label>
              <div style={styles.inputWrap}>
                <input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setFormError(null) }}
                  style={styles.input}
                  autoComplete="new-password"
                  disabled={submitting}
                  aria-required="true"
                />
                <button
                  type="button"
                  style={styles.toggleVisibility}
                  onClick={() => setShowNew((s) => !s)}
                  aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showNew ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <p style={styles.hint}>Mínimo de 8 caracteres (se o backend tiver regra)</p>
            </div>

            <div style={styles.field}>
              <label htmlFor="confirm-password" style={styles.label}>Confirmar nova senha *</label>
              <div style={styles.inputWrap}>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFormError(null) }}
                  style={styles.input}
                  autoComplete="new-password"
                  disabled={submitting}
                  aria-required="true"
                />
                <button
                  type="button"
                  style={styles.toggleVisibility}
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirm ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {/* Toggle opcional: Sair de outros dispositivos */}
            <div style={styles.toggleRow}>
              <input
                type="checkbox"
                id="logout-other"
                checked={logoutOtherSessions}
                onChange={(e) => setLogoutOtherSessions(e.target.checked)}
                style={styles.checkbox}
                disabled={submitting}
              />
              <label htmlFor="logout-other" style={styles.toggleLabel}>
                Sair de outros dispositivos
              </label>
            </div>

            {/* Rodapé de ações */}
            <div style={styles.actions}>
              <button
                type="submit"
                style={{ ...styles.btnPrimary, ...(submitting ? styles.btnDisabled : {}) }}
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
              <Link to="/me" style={styles.btnSecondary} onClick={(e) => { if (submitting) e.preventDefault() }}>
                Cancelar
              </Link>
            </div>
          </form>
        </section>
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
