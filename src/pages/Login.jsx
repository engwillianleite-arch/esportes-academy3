import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { login as apiLogin, getRedirectPath } from '../api/auth'

const GRID = 8

/** Prefixos permitidos para returnTo (evitar open redirect) */
const ALLOWED_RETURN_PREFIXES = ['/admin/', '/franchisor/', '/school/']

function isReturnToAllowed(returnTo) {
  if (!returnTo || typeof returnTo !== 'string') return false
  // Bloquear open redirect: não aceitar URLs absolutas externas
  const trimmed = returnTo.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) return false
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return ALLOWED_RETURN_PREFIXES.some((prefix) => normalized.startsWith(prefix))
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
    maxWidth: 400,
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 3,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    marginBottom: GRID,
  },
  input: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 2}`,
    fontSize: 15,
    border: '1px solid rgba(58,58,60,0.2)',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: GRID,
  },
  checkboxWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    cursor: 'pointer',
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: 'var(--azul-arena)',
  },
  checkboxLabel: {
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  link: {
    fontSize: 13,
    color: 'var(--azul-arena)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  linkHover: {
    textDecoration: 'underline',
  },
  btn: {
    marginTop: GRID * 2,
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
  btnDisabled: {
    opacity: 0.7,
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
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || ''
  const { setAuth } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Preencha email e senha.')
      return
    }
    setLoading(true)
    try {
      const data = await apiLogin(trimmedEmail, password)
      setAuth(data)
      if (data.default_redirect) {
        const targetPath = isReturnToAllowed(returnTo)
          ? (returnTo.startsWith('/') ? returnTo : `/${returnTo}`)
          : getRedirectPath(data.default_redirect)
        navigate(targetPath, { replace: true })
      } else {
        const query = returnTo && isReturnToAllowed(returnTo)
          ? `?returnTo=${encodeURIComponent(returnTo.startsWith('/') ? returnTo : `/${returnTo}`)}`
          : ''
        navigate(`/select-access${query}`, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Email ou senha inválidos.')
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Esportes Academy</div>
        <h1 style={styles.title}>Entrar</h1>
        <p style={styles.subtitle}>Acesse sua conta</p>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div>
            <label style={styles.label} htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>
          <div>
            <label style={styles.label} htmlFor="login-password">
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          <div style={styles.row}>
            <label style={styles.checkboxWrap}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={styles.checkbox}
                disabled={loading}
              />
              <span style={styles.checkboxLabel}>Manter conectado</span>
            </label>
            <Link
              to="/forgot-password"
              style={styles.link}
              className="login-link-forgot"
            >
              Esqueci minha senha
            </Link>
          </div>
          {error && <div style={styles.errorBox} role="alert">{error}</div>}
          <button
            type="submit"
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            disabled={loading}
            className="btn-hover"
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-link-forgot:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}
