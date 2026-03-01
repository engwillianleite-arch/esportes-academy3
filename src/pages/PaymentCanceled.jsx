import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  getMockCheckoutSession,
  setMockCheckoutSession,
  setMockSession,
} from '../data/mockSchoolSession'

const GRID = 8
const STORAGE_KEY_SIGNUP = 'ea_signup_mock'

const PLAN_NAME = 'Plano Escola'
const PLAN_PRICE = 'R$ 147,00'
const PLAN_PERIOD = ' / mês'

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
    background: 'rgba(220, 140, 40, 0.14)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  notice: {
    marginTop: GRID * 3,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.75,
    lineHeight: 1.45,
  },
}

/** Ícone de alerta (referência) */
const IconAlert = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

/**
 * Ao entrar em /payment/canceled (mock):
 * - setMockCheckoutSession({ status: 'canceled' })
 * - Se existir ea_signup_mock com user/school, setMockSession com stage = 'payment_failed' (não liberar Portal Escola)
 */
function applyCanceledState() {
  const mockCheckout = getMockCheckoutSession()
  setMockCheckoutSession({ ...mockCheckout, status: 'canceled' })

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SIGNUP)
    if (!raw) return
    const payload = JSON.parse(raw)
    const user = payload?.user
    const school = payload?.school
    if (!user?.id || !school?.id) return
    setMockSession({
      user_id: user.id,
      school_id: school.id,
      school_name: school.name ?? '',
      stage: 'payment_failed',
      role: 'SchoolOwner',
      // Não definir portal: 'SCHOOL' — não liberar acesso ao Portal Escola
    })
  } catch {
    // Mantém cadastro no storage; usuário não perde dados
  }
}

export default function PaymentCanceled() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'

  useEffect(() => {
    setStatus('loading')
    try {
      // Opcional: usar checkout_session_id / payment_id da URL quando integrar backend
      const _checkoutSessionId = searchParams.get('checkout_session_id') || searchParams.get('payment_id')
      applyCanceledState()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }, [searchParams])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          Esportes Academy
        </Link>

        {status === 'loading' && (
          <div style={styles.card}>
            <p style={styles.subtitle}>Verificando status…</p>
          </div>
        )}

        {status === 'success' && (
          <div style={styles.card}>
            <div style={styles.iconWrap}>
              <IconAlert />
            </div>
            <h1 style={styles.title}>Pagamento não concluído</h1>
            <p style={styles.subtitle}>
              Seu pagamento foi cancelado ou não foi finalizado. Você pode tentar novamente.
            </p>

            <div style={styles.block}>
              <div style={styles.blockTitle}>Resumo do plano</div>
              <p style={styles.blockValue}>{PLAN_NAME}</p>
              <p style={styles.blockValue}>{PLAN_PRICE}{PLAN_PERIOD}</p>
              <div style={styles.blockRow}>
                <span style={styles.blockValue}>Status: </span>
                <span style={{ ...styles.blockValue, opacity: 0.85 }}>Não ativado</span>
              </div>
            </div>

            <div style={styles.block}>
              <div style={styles.blockTitle}>O que fazer agora</div>
              <p style={styles.blockValue}>
                • Tente novamente o pagamento.
              </p>
              <p style={{ ...styles.blockValue, marginTop: GRID }}>
                • Verifique seus dados e tente outra forma de pagamento.
              </p>
            </div>

            <div style={styles.actions}>
              <Link to="/signup" style={styles.btnPrimary} className="btn-hover">
                Tentar pagamento novamente
              </Link>
              <Link to="/" style={styles.btnSecondary} className="btn-hover">
                Voltar para início
              </Link>
              <Link to="/login" style={styles.link}>
                Já tenho conta
              </Link>
            </div>

            <p style={styles.notice}>
              Se você já pagou e caiu aqui por engano, tente <Link to="/login" style={styles.link}>fazer login</Link>.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={styles.card}>
            <h1 style={styles.title}>Não foi possível validar o retorno do pagamento.</h1>
            <p style={styles.subtitle}>
              Você pode voltar ao início ou tentar o pagamento novamente.
            </p>
            <div style={styles.actions}>
              <Link to="/" style={styles.btnSecondary} className="btn-hover">
                Voltar para início
              </Link>
              <Link to="/signup" style={styles.btnPrimary} className="btn-hover">
                Tentar novamente
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
