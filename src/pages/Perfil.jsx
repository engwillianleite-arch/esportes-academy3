import { Link } from 'react-router-dom'

const GRID = 8
const styles = {
  wrap: { maxWidth: 600, margin: '0 auto', padding: GRID * 4 },
  title: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)' },
  text: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  link: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
}

export default function Perfil() {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Meu perfil</h1>
      <p style={styles.text}>Tela compartilhada de perfil do usuário (MVP). Em breve: edição de nome, e-mail e senha.</p>
      <Link to="/franchisor/dashboard" style={styles.link}>← Voltar ao Dashboard Franqueador</Link>
      {' | '}
      <Link to="/admin/dashboard" style={styles.link}>Admin</Link>
    </div>
  )
}
