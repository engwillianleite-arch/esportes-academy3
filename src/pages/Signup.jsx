import { useState, useCallback, useEffect } from 'react'
import { Link, useBlocker } from 'react-router-dom'

const GRID = 8

/** URL do checkout Asaas (mock: substituir por URL real quando integrar) */
const MOCK_ASAAS_CHECKOUT_URL = 'https://www.asaas.com/'
const MIN_PASSWORD_LENGTH = 8

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value) {
  return EMAIL_REGEX.test((value || '').trim())
}

/** Formulário tem dados digitados (para confirmação de saída) */
function hasFormData(values) {
  return [
    values.fullName,
    values.email,
    values.password,
    values.confirmPassword,
    values.schoolName,
    values.city,
    values.state,
  ].some((v) => (v || '').trim() !== '')
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--cinza-arquibancada)',
    color: 'var(--grafite-tecnico)',
    padding: `${GRID * 4}px ${GRID * 2}px`,
  },
  container: {
    maxWidth: 480,
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: GRID * 5,
  },
  logo: {
    display: 'block',
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--azul-arena)',
    letterSpacing: '-0.02em',
    textDecoration: 'none',
    marginBottom: GRID * 4,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--grafite-tecnico)',
  },
  subtitle: {
    margin: `${GRID}px 0 0`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    padding: GRID * 5,
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 4,
  },
  planSummary: {
    padding: GRID * 3,
    background: 'rgba(0,0,0,0.03)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 4,
    border: '1px solid rgba(0,0,0,0.06)',
  },
  planName: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  planPrice: {
    margin: `${GRID}px 0`,
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--azul-arena)',
  },
  planNote: {
    margin: 0,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 3,
  },
  field: {},
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    marginBottom: GRID,
  },
  labelOptional: {
    opacity: 0.75,
    fontWeight: 400,
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
  inputError: {
    borderColor: 'rgba(220, 53, 69, 0.6)',
  },
  sectionTitle: {
    margin: `0 0 ${GRID * 2}px`,
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  errorBox: {
    padding: GRID * 2,
    background: 'rgba(220, 53, 69, 0.08)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    color: '#b02a37',
    marginBottom: GRID * 2,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
    marginTop: GRID * 4,
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
  btnPrimaryDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
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
    textDecoration: 'none',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  linkRow: {
    textAlign: 'center',
    marginTop: GRID * 2,
  },
  link: {
    fontSize: 14,
    color: 'var(--azul-arena)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: GRID * 2,
  },
  modalBox: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    padding: GRID * 4,
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  modalText: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  modalActions: {
    display: 'flex',
    gap: GRID * 2,
    justifyContent: 'flex-end',
  },
}

const STORAGE_KEY_SIGNUP = 'ea_signup_mock'
const STORAGE_KEY_CHECKOUT_SESSION = 'ea_mock_checkout_session'
const AUDIT_SIGNUP = 'Public_Signup'
const AUDIT_CHECKOUT_START = 'Public_CheckoutStart'

function loadAudit(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveAudit(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...value, timestamp: new Date().toISOString() }))
  } catch (_) {}
}

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [unsavedModal, setUnsavedModal] = useState(false)
  const [pendingProceed, setPendingProceed] = useState(null)

  const validate = useCallback(() => {
    const err = {}
    const trim = (v) => (v || '').trim()

    if (!trim(fullName)) err.fullName = 'Informe seu nome.'
    if (!trim(email)) err.email = 'Informe um e-mail válido.'
    else if (!isValidEmail(email)) err.email = 'Informe um e-mail válido.'
    if (!password) err.password = `Informe uma senha com no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
    else if (password.length < MIN_PASSWORD_LENGTH) err.password = `Informe uma senha com no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
    if (password !== confirmPassword) err.confirmPassword = 'As senhas não conferem.'
    if (!trim(schoolName)) err.schoolName = 'Informe o nome da escola.'

    setFieldErrors(err)
    return Object.keys(err).length === 0
  }, [fullName, email, password, confirmPassword, schoolName])

  const trim = (v) => (v || '').trim()
  const isFormValid =
    trim(fullName) &&
    trim(email) &&
    isValidEmail(email) &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirmPassword &&
    trim(schoolName)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!validate()) {
      setError('Preencha os campos obrigatórios e corrija os erros.')
      return
    }

    setLoading(true)
    saveAudit(AUDIT_CHECKOUT_START, {})

    try {
      const user_id = `usr_mock_${Date.now()}`
      const school_id = `sch_mock_${Date.now()}`
      const checkout_session_id = `checkout_mock_${Date.now()}`

      const mockUser = {
        id: user_id,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
      }
      const mockSchool = {
        id: school_id,
        name: schoolName.trim(),
        city: (city || '').trim() || null,
        state: (state || '').trim() || null,
      }
      const mockCheckoutSession = {
        checkout_session_id,
        plan_id: 'plan_147',
        amount: 14700,
      }
      const mockSessionPrePayment = {
        user_id,
        school_id,
        school_name: schoolName.trim(),
        stage: 'pre_payment',
      }

      const payload = {
        user: mockUser,
        school: mockSchool,
        mockSession: mockSessionPrePayment,
        billing: {
          return_url_success: `${window.location.origin}/payment/success`,
          return_url_canceled: `${window.location.origin}/payment/canceled`,
        },
      }

      localStorage.setItem(STORAGE_KEY_SIGNUP, JSON.stringify(payload))
      localStorage.setItem(STORAGE_KEY_CHECKOUT_SESSION, JSON.stringify(mockCheckoutSession))

      await new Promise((r) => setTimeout(r, 800))

      window.location.href = MOCK_ASAAS_CHECKOUT_URL
    } catch (_) {
      setLoading(false)
      setError('Não foi possível iniciar o pagamento. Tente novamente.')
    }
  }

  const isDirty = hasFormData({
    fullName,
    email,
    password,
    confirmPassword,
    schoolName,
    city,
    state,
  })
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !loading && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setUnsavedModal(true)
      setPendingProceed(() => () => {
        if (blocker.proceed) blocker.proceed()
        setUnsavedModal(false)
        setPendingProceed(null)
      })
    }
  }, [blocker.state, blocker.proceed])

  const stayOnPage = useCallback(() => {
    if (blocker.reset) blocker.reset()
    setUnsavedModal(false)
    setPendingProceed(null)
  }, [blocker.reset])

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (isDirty && !loading) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty, loading])

  if (typeof window !== 'undefined' && !loadAudit(AUDIT_SIGNUP)) {
    saveAudit(AUDIT_SIGNUP, {})
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Link to="/" style={styles.logo}>
            Esportes Academy
          </Link>
          <h1 style={styles.title}>Criar conta</h1>
          <p style={styles.subtitle}>
            Você será direcionado para o pagamento em seguida.
          </p>
        </header>

        <div style={styles.card}>
          <div style={styles.planSummary}>
            <p style={styles.planName}>Plano Escola</p>
            <div style={styles.planPrice}>R$ 147,00 / mês</div>
            <p style={styles.planNote}>Acesso liberado após pagamento.</p>
          </div>

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.sectionTitle}>Seus dados</div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="signup-fullName">
                Nome completo *
              </label>
              <input
                id="signup-fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ ...styles.input, ...(fieldErrors.fullName ? styles.inputError : {}) }}
                placeholder="Seu nome completo"
                disabled={loading}
              />
              {fieldErrors.fullName && (
                <div style={styles.errorBox} role="alert">{fieldErrors.fullName}</div>
              )}
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="signup-email">
                E-mail *
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : {}) }}
                placeholder="seu@email.com"
                disabled={loading}
              />
              {fieldErrors.email && (
                <div style={styles.errorBox} role="alert">{fieldErrors.email}</div>
              )}
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="signup-password">
                Senha *
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, ...(fieldErrors.password ? styles.inputError : {}) }}
                placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                disabled={loading}
              />
              {fieldErrors.password && (
                <div style={styles.errorBox} role="alert">{fieldErrors.password}</div>
              )}
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="signup-confirmPassword">
                Confirmar senha *
              </label>
              <input
                id="signup-confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ ...styles.input, ...(fieldErrors.confirmPassword ? styles.inputError : {}) }}
                placeholder="Repita a senha"
                disabled={loading}
              />
              {fieldErrors.confirmPassword && (
                <div style={styles.errorBox} role="alert">{fieldErrors.confirmPassword}</div>
              )}
            </div>

            <div style={styles.sectionTitle}>Dados iniciais da escola</div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="signup-schoolName">
                Nome da escola *
              </label>
              <input
                id="signup-schoolName"
                type="text"
                autoComplete="organization"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                style={{ ...styles.input, ...(fieldErrors.schoolName ? styles.inputError : {}) }}
                placeholder="Nome da sua escola"
                disabled={loading}
              />
              {fieldErrors.schoolName && (
                <div style={styles.errorBox} role="alert">{fieldErrors.schoolName}</div>
              )}
            </div>
            <div style={styles.field}>
              <label style={{ ...styles.label, ...styles.labelOptional }} htmlFor="signup-city">
                Cidade
              </label>
              <input
                id="signup-city"
                type="text"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={styles.input}
                placeholder="Cidade"
                disabled={loading}
              />
            </div>
            <div style={styles.field}>
              <label style={{ ...styles.label, ...styles.labelOptional }} htmlFor="signup-state">
                Estado
              </label>
              <input
                id="signup-state"
                type="text"
                autoComplete="address-level1"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={styles.input}
                placeholder="UF"
                maxLength={2}
                disabled={loading}
              />
            </div>

            {error && (
              <div style={styles.errorBox} role="alert">
                {error}
              </div>
            )}

            <div style={styles.actions}>
              <button
                type="submit"
                style={{
                  ...styles.btnPrimary,
                  ...(loading || !isFormValid ? styles.btnPrimaryDisabled : {}),
                }}
                disabled={loading || !isFormValid}
                className="btn-hover"
              >
                {loading ? (
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
                    Redirecionando…
                  </>
                ) : (
                  'Continuar para pagamento'
                )}
              </button>
              <Link
                to="/"
                style={styles.btnSecondary}
                className="btn-hover"
              >
                Voltar
              </Link>
            </div>
          </form>
        </div>

        <p style={styles.linkRow}>
          <Link to="/login" style={styles.link}>
            Já tenho conta
          </Link>
        </p>
      </div>

      {unsavedModal && (
        <div
          style={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-unsaved-title"
          onClick={(e) => e.target === e.currentTarget && stayOnPage()}
        >
          <div style={styles.modalBox}>
            <h2 id="signup-unsaved-title" style={styles.modalTitle}>
              Deseja sair?
            </h2>
            <p style={styles.modalText}>
              Você tem dados não salvos. Deseja sair?
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.btnSecondary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={stayOnPage}
                className="btn-hover"
              >
                Continuar
              </button>
              <button
                type="button"
                style={{ ...styles.btnPrimary, width: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => pendingProceed?.()}
                className="btn-hover"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        a[style*="azul-arena"]:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}
