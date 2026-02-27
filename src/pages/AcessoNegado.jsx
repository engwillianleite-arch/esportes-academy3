import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getRedirectPath } from '../api/auth'

const GRID = 8
const styles = {
  wrap: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: GRID * 4,
  },
  icon: {
    width: 56,
    height: 56,
    marginBottom: GRID * 2,
    color: 'var(--grafite-tecnico, #333)',
    opacity: 0.7,
  },
  titulo: {
    margin: '0 0 ' + GRID + 'px',
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--grafite-tecnico, #333)',
  },
  texto: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 16,
    color: 'var(--grafite-tecnico, #333)',
    opacity: 0.85,
    maxWidth: 400,
  },
  acoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: GRID * 3,
  },
  btnPrimario: {
    background: 'var(--azul-arena, #1a5f7a)',
    color: '#fff',
    border: 'none',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius, 8px)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  btnSecundario: {
    background: 'transparent',
    color: 'var(--grafite-tecnico, #333)',
    border: '1px solid var(--grafite-tecnico, #333)',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius, 8px)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  link: {
    color: 'var(--azul-arena, #1a5f7a)',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
  },
  contexto: {
    margin: 0,
    fontSize: 13,
    color: 'var(--grafite-tecnico, #333)',
    opacity: 0.7,
    maxWidth: 360,
  },
}

/** Ícone de cadeado (SVG inline para não depender de assets). */
function LockIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ ...styles.icon, ...props.style }}
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export default function AcessoNegado() {
  const navigate = useNavigate()
  const { defaultRedirect } = useAuth()

  // Dashboard do portal atual; se não houver portal definido, fallback para /me
  const dashboardPath =
    defaultRedirect?.portal ? getRedirectPath(defaultRedirect) : '/me'

  const handleVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(dashboardPath)
    }
  }

  return (
    <div style={styles.wrap}>
      <LockIcon />
      <h1 style={styles.titulo}>Acesso negado</h1>
      <p style={styles.texto}>
        Você não tem permissão para acessar esta página.
      </p>

      <div style={styles.acoes}>
        <Link to={dashboardPath} style={styles.btnPrimario}>
          Ir para início
        </Link>
        <button type="button" style={styles.btnSecundario} onClick={handleVoltar}>
          Voltar
        </button>
        <Link to="/me" style={styles.link}>
          Meu perfil
        </Link>
        <Link to="/help" style={styles.link}>
          Central de ajuda
        </Link>
      </div>

      <p style={styles.contexto}>
        Se você acredita que isso é um erro, fale com o administrador da sua
        conta.
      </p>
    </div>
  )
}
