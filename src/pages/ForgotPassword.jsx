import { Link } from 'react-router-dom'

const GRID = 8

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
  link: {
    fontSize: 14,
    color: 'var(--azul-arena)',
    textDecoration: 'none',
    fontWeight: 500,
  },
}

/**
 * Recuperação de senha — MVP (placeholder).
 * Link "Esqueci minha senha" na tela de Login aponta para /forgot-password.
 */
export default function ForgotPassword() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Recuperar senha</h1>
        <p style={styles.subtitle}>
          Em breve você poderá redefinir sua senha por aqui. Entre em contato com o suporte se precisar de acesso agora.
        </p>
        <Link to="/login" style={styles.link}>← Voltar para o login</Link>
      </div>
    </div>
  )
}
