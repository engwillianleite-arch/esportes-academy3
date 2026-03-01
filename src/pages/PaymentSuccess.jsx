import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  setMockSession,
  getMockCheckoutSession,
  setMockCheckoutSession,
} from '../data/mockSchoolSession'

const GRID = 8
const STORAGE_KEY_SIGNUP = 'ea_signup_mock'

const PLAN_NAME = 'Plano Escola'
const PLAN_PRICE = 'R$ 147,00'
const PLAN_PERIOD = '/ mês'

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--cinza-arquibancada)',
    color: 'var(--grafite-tecnico)',
    padding: `${GRID * 4}px ${GRID * 2}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    maxWidth: 440,
    width: '100%',
    margin: '0 auto',
    textAlign: 'center',
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    padding: GRID * 5,
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 4,
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
  iconWrap: {
    width: 56,
    height: 56,
    margin: '0 auto ' + GRID * 3 + 'px',
    borderRadius: '50%',
    background: 'rgba(0,180,120,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapError: {
    background: 'rgba(200,80,80,0.12)',
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--grafite-tecnico)',
  },
  subtitle: {
    margin: `${GRID * 2}px 0 ${GRID * 4}px`,
    fontSize: 15,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    lineHeight: 1.5,
  },
  block: {
    textAlign: 'left',
    padding: GRID * 3,
    background: 'rgba(0,0,0,0.03)',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(0,0,0,0.06)',
    marginBottom: GRID * 3,
  },
  blockTitle: {
    margin: `0 0 ${GRID}px`,
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  blockValue: {
    margin: 0,
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  blockRow: {
    marginTop: GRID,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
    marginTop: GRID * 4,
  },
  btnPrimary: {
    padding: `${GRID * 2}px ${GRID * 3}`,
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--branco-luz)',
    background: 'var(--azul-arena)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    boxSizing: 'border-box',
  },
  btnSecondary: {
    padding: `${GRID * 2}px ${GRID * 3}`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: '1px solid rgba(58,58,60,0.25)',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    boxSizing: 'border-box',
  },
  link: {
    fontSize: 14,
    color: 'var(--azul-arena)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  fallback: {
    marginTop: GRID * 3,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.75,
  },
}

const IconCheck = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--verde-patrocinio)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconError = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

/**
 * Valida pagamento no mock: não confiar só em query string.
 * Exige checkout_session no storage (criado no Signup) e, se vier checkout_session_id na URL, deve bater.
 * Atualiza mockCheckoutSession.status = "paid" e mockSession com stage = "active", portal = "SCHOOL".
 */
function validateAndActivatePayment(searchParams, setAuth) {
  const checkoutSessionIdFromUrl = searchParams.get('checkout_session_id') || searchParams.get('payment_id')

  const mockCheckout = getMockCheckoutSession()
  if (!mockCheckout?.checkout_session_id) {
    return { ok: false }
  }
  if (checkoutSessionIdFromUrl && mockCheckout.checkout_session_id !== checkoutSessionIdFromUrl) {
    return { ok: false }
  }

  let payload
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SIGNUP)
    if (!raw) return { ok: false }
    payload = JSON.parse(raw)
  } catch {
    return { ok: false }
  }

  const user = payload?.user
  const school = payload?.school
  if (!user?.id || !school?.id) return { ok: false }

  setMockCheckoutSession({ status: 'paid' })
  setMockSession({
    user_id: user.id,
    school_id: school.id,
    school_name: school.name ?? '',
    role: 'SchoolOwner',
    stage: 'active',
    portal: 'SCHOOL',
  })

  setAuth({
    user: { id: user.id, name: user.name, email: user.email },
    memberships: [],
    default_redirect: {
      portal: 'SCHOOL',
      context: { school_id: school.id },
    },
  })

  return {
    ok: true,
    user: { name: user.name, email: user.email },
    schoolName: school.name ?? '',
  }
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuth()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [payload, setPayload] = useState(null) // { user: { name, email }, schoolName } on success
  const [confirmedAt] = useState(() => new Date().toISOString())

  useEffect(() => {
    setStatus('loading')
    const result = validateAndActivatePayment(searchParams, setAuth)
    if (result.ok) {
      setPayload({ user: result.user, schoolName: result.schoolName })
      setStatus('success')
    } else {
      setStatus('error')
    }
  }, [searchParams, setAuth])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          Esportes Academy
        </Link>

        {status === 'loading' && (
          <div style={styles.card}>
            <p style={styles.subtitle}>Validando pagamento…</p>
          </div>
        )}

        {status === 'success' && (
          <div style={styles.card}>
            <div style={styles.iconWrap}>
              <IconCheck />
            </div>
            <h1 style={styles.title}>Pagamento confirmado!</h1>
            <p style={styles.subtitle}>
              Seu acesso foi liberado. Vamos configurar sua escola.
            </p>

            <div style={styles.block}>
              <div style={styles.blockTitle}>Plano</div>
              <p style={styles.blockValue}>{PLAN_NAME}</p>
              <p style={styles.blockValue}>{PLAN_PRICE}{PLAN_PERIOD}</p>
              <div style={styles.blockRow}>
                <span style={styles.blockValue}>Status: </span>
                <span style={{ ...styles.blockValue, color: 'var(--verde-patrocinio)', fontWeight: 600 }}>Ativo</span>
              </div>
              <div style={styles.blockRow}>
                <span style={{ ...styles.blockValue, fontSize: 13, opacity: 0.8 }}>Confirmado em {new Date(confirmedAt).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div style={styles.block}>
              <div style={styles.blockTitle}>Escola</div>
              <p style={styles.blockValue}>{payload?.schoolName || '—'}</p>
              <div style={styles.blockRow}>
                <span style={styles.blockValue}>{payload?.user?.name || '—'}</span>
                <span style={{ ...styles.blockValue, fontSize: 13, opacity: 0.85 }}> ({payload?.user?.email || '—'})</span>
              </div>
            </div>

            <div style={styles.actions}>
              <Link to="/school/setup" style={styles.btnPrimary} className="btn-hover">
                Configurar escola
              </Link>
              <Link to="/school/dashboard" style={styles.btnSecondary} className="btn-hover">
                Ir para o Dashboard
              </Link>
              <Link to="/" style={styles.btnSecondary} className="btn-hover">
                Voltar para início
              </Link>
            </div>

            <p style={styles.fallback}>
              Se o botão não funcionar, <Link to="/login" style={styles.link}>faça login novamente</Link>.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={styles.card}>
            <div style={{ ...styles.iconWrap, ...styles.iconWrapError }}>
              <IconError />
            </div>
            <h1 style={styles.title}>Não foi possível confirmar o pagamento.</h1>
            <p style={styles.subtitle}>
              Verifique o link de retorno ou tente novamente.
            </p>
            <div style={styles.actions}>
              <button
                type="button"
                style={styles.btnPrimary}
                className="btn-hover"
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </button>
              <Link to="/" style={styles.btnSecondary} className="btn-hover">
                Voltar
              </Link>
              <Link to="/payment/canceled" style={styles.link}>
                Ver página de pagamento cancelado
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
