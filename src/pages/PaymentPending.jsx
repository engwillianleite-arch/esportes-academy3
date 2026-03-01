import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
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

/** Chave para mock: contador de "Atualizar status" (para teste alternar paid/canceled) */
const STORAGE_KEY_PENDING_REFRESH_COUNT = 'ea_pending_refresh_count'

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
  instructions: {
    marginTop: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
    lineHeight: 1.5,
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
  message: {
    marginTop: GRID * 2,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  messageError: {
    color: 'var(--vermelho-erro, #c0392b)',
  },
}

/** Ícone relógio/aguardando */
const IconClock = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

/**
 * Aplica estado de pendente: stage = payment_pending, não liberar Portal Escola.
 * Não ativa conta/escola enquanto status ≠ paid.
 */
function applyPendingState() {
  const mockCheckout = getMockCheckoutSession()
  setMockCheckoutSession({ ...mockCheckout, status: 'pending' })

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
      stage: 'payment_pending',
      role: 'SchoolOwner',
      // Não definir portal: 'SCHOOL' — não liberar acesso ao Portal Escola
    })
  } catch {
    // Mantém cadastro no storage
  }
}

/**
 * Mock: verifica status do pagamento.
 * Default: mantém pending. Para teste: 1º clique -> ainda pending; 2º clique -> paid (redireciona).
 * Use ?mock_cancel=1 na URL para no 2º clique ir para canceled.
 */
function mockVerifyPaymentStatus(checkoutSessionId, preferCanceled) {
  const count = parseInt(sessionStorage.getItem(STORAGE_KEY_PENDING_REFRESH_COUNT) || '0', 10) + 1
  sessionStorage.setItem(STORAGE_KEY_PENDING_REFRESH_COUNT, String(count))

  if (count >= 2) {
    const nextStatus = preferCanceled ? 'canceled' : 'paid'
    setMockCheckoutSession({ checkout_session_id: checkoutSessionId, status: nextStatus })
    return { status: nextStatus }
  }
  setMockCheckoutSession({ checkout_session_id: checkoutSessionId, status: 'pending' })
  return { status: 'pending' }
}

/**
 * Retorna instrução conforme método (se disponível no mock).
 * payment_method: 'pix' | 'boleto' | 'analysis' | undefined
 */
function getInstructionByMethod(payment_method) {
  if (payment_method === 'pix') {
    return 'Confirme o PIX no seu banco e depois clique em "Atualizar status".'
  }
  if (payment_method === 'boleto') {
    return 'O boleto pode levar algum tempo para confirmar.'
  }
  if (payment_method === 'analysis') {
    return 'Seu pagamento está em análise.'
  }
  return null
}

export default function PaymentPending() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState(null) // 'still_pending' | 'error' | null
  const [checkoutSessionId, setCheckoutSessionId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState(null)

  const checkoutIdFromUrl = searchParams.get('checkout_session_id') || searchParams.get('payment_id')

  // Inicialização: garantir estado payment_pending, não ativar escola
  useEffect(() => {
    applyPendingState()
    const mock = getMockCheckoutSession()
    setCheckoutSessionId(mock?.checkout_session_id || checkoutIdFromUrl || null)
    setPaymentMethod(mock?.payment_method || null)
    setReady(true)
  }, [checkoutIdFromUrl])

  const preferCanceled = searchParams.get('mock_cancel') === '1'

  const handleRefreshStatus = useCallback(async () => {
    setRefreshing(true)
    setRefreshMessage(null)
    // Auditoria opcional: Billing_PaymentStatusRefresh
    try {
      const id = checkoutSessionId || getMockCheckoutSession()?.checkout_session_id
      const result = mockVerifyPaymentStatus(id || 'mock-session', preferCanceled)
      if (result.status === 'paid') {
        navigate('/payment/success', { replace: true })
        return
      }
      if (result.status === 'canceled') {
        navigate('/payment/canceled', { replace: true })
        return
      }
      setRefreshMessage('still_pending')
    } catch {
      setRefreshMessage('error')
    } finally {
      setRefreshing(false)
    }
  }, [checkoutSessionId, navigate, preferCanceled])

  if (!ready) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <Link to="/" style={styles.logo}>
            Esportes Academy
          </Link>
          <div style={styles.card}>
            <p style={styles.subtitle}>Carregando…</p>
          </div>
        </div>
      </div>
    )
  }

  const instruction = getInstructionByMethod(paymentMethod)

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          Esportes Academy
        </Link>

        <div style={styles.card}>
          <div style={styles.iconWrap}>
            <IconClock />
          </div>
          <h1 style={styles.title}>Pagamento pendente</h1>
          <p style={styles.subtitle}>
            Estamos aguardando a confirmação do pagamento. Você pode atualizar o status em alguns instantes.
          </p>

          {/* Resumo do plano (somente leitura) */}
          <div style={styles.block}>
            <div style={styles.blockTitle}>Resumo do plano</div>
            <p style={styles.blockValue}>{PLAN_NAME}</p>
            <p style={styles.blockValue}>{PLAN_PRICE}{PLAN_PERIOD}</p>
            <div style={styles.blockRow}>
              <span style={styles.blockValue}>Status: </span>
              <span style={{ ...styles.blockValue, opacity: 0.9, fontWeight: 600 }}>Pendente</span>
            </div>
          </div>

          {/* Instruções por método (opcional) */}
          {instruction && (
            <div style={styles.block}>
              <div style={styles.blockTitle}>Instruções</div>
              <p style={styles.instructions}>{instruction}</p>
            </div>
          )}

          {/* Mensagens após atualizar */}
          {refreshMessage === 'still_pending' && (
            <p style={styles.message}>
              Ainda não confirmado. Tente novamente em alguns instantes.
            </p>
          )}
          {refreshMessage === 'error' && (
            <p style={{ ...styles.message, ...styles.messageError }}>
              Não foi possível verificar o status. Tente novamente.
            </p>
          )}

          {/* Ações */}
          <div style={styles.actions}>
            <button
              type="button"
              style={styles.btnPrimary}
              className="btn-hover"
              onClick={handleRefreshStatus}
              disabled={refreshing}
            >
              {refreshing ? 'Verificando pagamento…' : 'Atualizar status'}
            </button>
            <Link to="/signup" style={styles.btnSecondary} className="btn-hover">
              Voltar para pagamento
            </Link>
            <Link to="/" style={styles.link}>
              Voltar para início
            </Link>
            <Link to="/login" style={styles.link}>
              Já tenho conta
            </Link>
          </div>

          {/* Aviso opcional */}
          <p style={styles.notice}>
            Se o pagamento for confirmado, você será direcionado para o acesso.
            Tente novamente em alguns minutos.
          </p>
        </div>
      </div>
    </div>
  )
}
