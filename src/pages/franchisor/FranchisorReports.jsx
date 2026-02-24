import { Link } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'

const GRID = 8
const styles = {
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    textAlign: 'center',
  },
  title: { margin: '0 0 ' + GRID + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  text: { margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  link: { display: 'inline-block', marginTop: GRID * 2, color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
}

export default function FranchisorReports() {
  return (
    <FranchisorLayout pageTitle="Relatórios" breadcrumb={[{ label: 'Dashboard', to: '/franchisor/dashboard' }, { label: 'Relatórios' }]}>
      <div style={styles.card}>
        <h2 style={styles.title}>Relatórios consolidados</h2>
        <p style={styles.text}>Esta seção será implementada em breve.</p>
        <Link to="/franchisor/dashboard" style={styles.link}>Voltar ao Dashboard</Link>
      </div>
    </FranchisorLayout>
  )
}
