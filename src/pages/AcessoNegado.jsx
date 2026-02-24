import { Link, useSearchParams } from 'react-router-dom'

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
  titulo: {
    margin: '0 0 ' + GRID + 'px',
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
  },
  texto: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 16,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    maxWidth: 400,
  },
  btn: {
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
}

export default function AcessoNegado() {
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const isFranchisor = from === 'franchisor'
  const dashboardPath = isFranchisor ? '/franchisor/dashboard' : '/admin/dashboard'
  const dashboardLabel = isFranchisor ? 'Voltar ao Dashboard (Franqueador)' : 'Voltar ao Dashboard'

  return (
    <div style={styles.wrap}>
      <h1 style={styles.titulo}>Acesso Negado</h1>
      <p style={styles.texto}>
        Você não tem permissão para acessar este recurso.
      </p>
      <Link to={dashboardPath} style={styles.btn}>
        {dashboardLabel}
      </Link>
    </div>
  )
}
