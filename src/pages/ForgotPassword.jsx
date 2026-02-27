import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

const GRID = 8

/** Validação simples de e-mail */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value) {
  const v = (value || '').trim()
  return v.length > 0 && EMAIL_REGEX.test(v)
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
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: `${GRID * 2}px 0 ${GRID * 4}px`,
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
  inputErro: {
    borderColor: 'rgba(220, 53, 69, 0.5)',
  },
  link: {
    fontSize: 14,
    color: 'var(--azul-arena)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  linkSecondary: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    textDecoration: 'none',
    fontWeight: 500,
  },
  btn: {
    marginTop: GRID,
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
    marginTop: GRID,
    padding: GRID * 2,
    background: 'rgba(220, 53, 69, 0.08)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    color: '#b02a37',
  },
  successBox: {
    marginTop: GRID * 2,
    padding: GRID * 3,
    background: 'rgba(40, 167, 69, 0.08)',
    border: '1px solid rgba(40, 167, 69, 0.3)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: '#1e7e34',
    lineHeight: 1.45,
  },
  successActions: {
    marginTop: GRID * 3,
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
    alignItems: 'center',
  },
  erroCampo: {
    margin: `${GRID}px 0 0`,
    fontSize: 12,
    color: '#b02a37',
  },
}

/**
 * Recuperação de senha — MVP (compartilhada).
 * Rota: /forgot-password
 * Entrada: link "Esqueci minha senha" em /login.
 * Saídas: confirmação na própria tela ou /login; link no e-mail -> /reset-password?token=...
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldError, setFieldError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setFieldError(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setFieldError('Informe um e-mail válido.')
      return
    }
    if (!isValidEmail(trimmed)) {
      setFieldError('Informe um e-mail válido.')
      return
    }
    setLoading(true)
    try {
      await forgotPassword(trimmed)
      setSuccess(true)
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(err.message || 'Não foi possível enviar a solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError(null)
    setFieldError(null)
    const trimmed = email.trim()
    if (!trimmed || !isValidEmail(trimmed)) return
    setLoading(true)
    try {
      await forgotPassword(trimmed)
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(err.message || 'Não foi possível enviar a solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Recuperar senha</h1>
          <p style={styles.subtitle}>Enviaremos um link para redefinir sua senha.</p>
          <div style={styles.successBox} role="status">
            Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em alguns minutos.
          </div>
          <div style={styles.successActions}>
            <Link to="/login" style={{ ...styles.link, display: 'inline-block' }}>
              Voltar para login
            </Link>
            {resendCooldown > 0 ? (
              <span style={{ fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
                Reenviar em {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{ ...styles.linkSecondary, background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', padding: 0 }}
              >
                Reenviar
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Recuperar senha</h1>
        <p style={styles.subtitle}>Enviaremos um link para redefinir sua senha.</p>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div>
            <label style={styles.label} htmlFor="forgot-email">
              E-mail
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setFieldError(null)
                setError(null)
              }}
              style={{ ...styles.input, ...(fieldError ? styles.inputErro : {}) }}
              placeholder="seuemail@dominio.com"
              disabled={loading}
            />
            {fieldError && <p style={styles.erroCampo}>{fieldError}</p>}
          </div>
          {error && <div style={styles.errorBox} role="alert">{error}</div>}
          <button
            type="submit"
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Enviando...
              </>
            ) : (
              'Enviar link de recuperação'
            )}
          </button>
        </form>

        <p style={{ marginTop: GRID * 4, marginBottom: 0, textAlign: 'center' }}>
          <Link to="/login" style={styles.link}>
            Voltar para login
          </Link>
        </p>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
