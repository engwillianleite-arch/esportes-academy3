import { Link, useLocation } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'

const GRID = 8

const labels = {
  students: 'Alunos',
  teams: 'Turmas',
  attendance: 'Presença',
  finance: 'Financeiro',
  events: 'Eventos',
}

export default function SchoolPlaceholder() {
  const location = useLocation()
  const segment = (location.pathname.match(/\/school\/([^/]+)/) || [])[1] || ''
  const pageTitle = labels[segment] || 'Módulo'

  return (
    <SchoolLayout schoolName="" pageTitle={pageTitle}>
      <div style={{
        textAlign: 'center',
        padding: GRID * 6,
        background: 'var(--branco-luz)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
      }}>
        <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 16, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
          Esta tela está em construção.
        </p>
        <Link to="/school/dashboard" style={{ color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' }}>
          Voltar ao Dashboard
        </Link>
      </div>
    </SchoolLayout>
  )
}
