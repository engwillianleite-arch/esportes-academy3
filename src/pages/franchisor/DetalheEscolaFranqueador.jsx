import { useParams, Link } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import { getFranchisorSchools } from '../../api/franchisorPortal'
import { useState, useEffect } from 'react'

const GRID = 8
const styles = {
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    marginBottom: GRID * 4,
  },
  title: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 20, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  row: { marginBottom: GRID, fontSize: 14, color: 'var(--grafite-tecnico)' },
  label: { fontWeight: 600, marginRight: GRID },
  link: { color: 'var(--azul-arena)', textDecoration: 'none', fontWeight: 500 },
  back: { display: 'inline-block', marginBottom: GRID * 3, fontSize: 14 },
}

export default function DetalheEscolaFranqueador() {
  const { school_id } = useParams()
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFranchisorSchools()
      .then((res) => {
        const found = (res.items || []).find((s) => s.school_id === school_id)
        setSchool(found || null)
      })
      .finally(() => setLoading(false))
  }, [school_id])

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Escolas', to: '/franchisor/schools' },
    { label: school?.school_name || school_id || 'Detalhe' },
  ]

  return (
    <FranchisorLayout pageTitle={school ? school.school_name : 'Detalhe da Escola'} breadcrumb={breadcrumb}>
      <Link to="/franchisor/schools" style={styles.back}>
        ← Voltar para Escolas
      </Link>
      <div style={styles.card}>
        {loading ? (
          <p>Carregando...</p>
        ) : !school ? (
          <p>Escola não encontrada.</p>
        ) : (
          <>
            <h2 style={styles.title}>{school.school_name}</h2>
            <div style={styles.row}><span style={styles.label}>Status:</span> {school.status}</div>
            {(school.city || school.state) && (
              <div style={styles.row}>
                <span style={styles.label}>Cidade / UF:</span> {[school.city, school.state].filter(Boolean).join(' / ')}
              </div>
            )}
            <p style={{ marginTop: GRID * 3, marginBottom: 0 }}>
              <a href={`/school/dashboard?school_id=${school_id}`} style={styles.link}>
                Abrir portal da escola
              </a>
            </p>
          </>
        )}
      </div>
    </FranchisorLayout>
  )
}
