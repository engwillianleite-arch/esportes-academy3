import { Link, useSearchParams } from 'react-router-dom'
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

export default function FranchisorFinance() {
  const [searchParams] = useSearchParams()
  const schoolId = searchParams.get('school_id')

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Escolas', to: '/franchisor/schools' },
    { label: 'Financeiro' },
  ]

  return (
    <FranchisorLayout
      pageTitle={schoolId ? 'Financeiro da escola' : 'Financeiro'}
      breadcrumb={breadcrumb}
    >
      <div style={styles.card}>
        <h2 style={styles.title}>Financeiro consolidado</h2>
        <p style={styles.text}>
          {schoolId
            ? 'O financeiro por escola será implementado em breve.'
            : 'Esta seção será implementada em breve.'}
        </p>
        <Link to="/franchisor/dashboard" style={styles.link}>Voltar ao Dashboard</Link>
      </div>
    </FranchisorLayout>
  )
}
