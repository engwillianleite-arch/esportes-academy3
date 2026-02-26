import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolAssessmentDetail } from '../../api/schoolPortal'

const GRID = 8

const TYPE_LABELS = {
  tecnica: 'Técnica',
  fisica: 'Física',
  faixa: 'Faixa/Graduação',
  outro: 'Outro',
}

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
  breadcrumb: { marginBottom: GRID * 2, fontSize: 14 },
  breadcrumbLink: {
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
  },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  typeBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    background: 'var(--cinza-arquibancada)',
    color: 'var(--grafite-tecnico)',
  },
  section: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
  },
  sectionTitle: {
    margin: `0 0 ${GRID * 2}px`,
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: GRID * 2,
  },
  field: { marginBottom: GRID * 2 },
  fieldLabel: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.7, marginBottom: 2 },
  fieldValue: { fontSize: 14, color: 'var(--grafite-tecnico)', fontWeight: 500 },
  link: {
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    background: 'var(--cinza-arquibancada)',
    borderBottom: '1px solid #eee',
  },
  td: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderBottom: '1px solid #eee',
    color: 'var(--grafite-tecnico)',
  },
  noCriteria: {
    textAlign: 'center',
    padding: GRID * 4,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
    fontSize: 14,
  },
  finalResultBlock: {
    padding: GRID * 2,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 'var(--radius)',
    marginTop: GRID,
  },
  finalSummary: { fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)', marginBottom: GRID },
  finalNotes: { fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9, whiteSpace: 'pre-wrap' },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 4,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 15, fontWeight: 600, color: '#991B1B' },
  errorText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#991B1B', opacity: 0.9 },
  notFoundBox: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  notFoundText: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 16, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  btn: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
  },
  btnPrimary: { background: 'var(--azul-arena)', color: '#fff' },
  btnSecondary: { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}

/** Formata valor do critério conforme scale_type */
function formatCriterionValue(criterion) {
  const { value, scale_type } = criterion
  if (value === null || value === undefined) return '—'
  switch (scale_type) {
    case 'score':
      return typeof value === 'number' ? value.toFixed(1).replace('.', ',') : String(value)
    case 'level':
      return String(value)
    case 'boolean':
      return value ? 'Sim' : 'Não'
    case 'text':
    default:
      return String(value)
  }
}

function DetailSkeleton() {
  return (
    <>
      <div style={styles.header}>
        <div style={{ ...styles.skeleton, width: 140, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '70%', height: 32, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: 100, height: 28 }} />
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 120, marginBottom: GRID * 2 }} />
        <div style={styles.fieldGrid}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={styles.field}>
              <div style={{ ...styles.skeleton, width: '60%', marginBottom: 4 }} />
              <div style={{ ...styles.skeleton, width: '100%' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 180, marginBottom: GRID * 2 }} />
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}><div style={{ ...styles.skeleton, width: 80 }} /></th>
                <th style={styles.th}><div style={{ ...styles.skeleton, width: 60 }} /></th>
                <th style={styles.th}><div style={{ ...styles.skeleton, width: 100 }} /></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  <td style={styles.td}><div style={{ ...styles.skeleton, width: '70%' }} /></td>
                  <td style={styles.td}><div style={{ ...styles.skeleton, width: 50 }} /></td>
                  <td style={styles.td}><div style={{ ...styles.skeleton, width: '50%' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={styles.section}>
        <div style={{ ...styles.skeleton, width: 140, marginBottom: GRID * 2 }} />
        <div style={{ ...styles.skeleton, width: '100%', height: 60 }} />
      </div>
    </>
  )
}

export default function SchoolAssessmentDetail() {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const fetchAssessment = useCallback(() => {
    if (!assessmentId) return
    setError(null)
    setNotFound(false)
    setPermissionDenied(false)
    setLoading(true)
    getSchoolAssessmentDetail(assessmentId)
      .then(setAssessment)
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setNotFound(true)
        } else {
          setError(err?.message || 'Não foi possível carregar a avaliação. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [assessmentId])

  useEffect(() => {
    fetchAssessment()
  }, [fetchAssessment])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  if (permissionDenied) return null

  if (notFound) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.notFoundBox}>
          <p style={styles.notFoundText}>Avaliação não encontrada ou você não tem acesso.</p>
          <Link
            to="/school/assessments"
            style={{ ...styles.btn, ...styles.btnPrimary }}
            className="btn-hover"
          >
            Voltar para Avaliações
          </Link>
        </div>
      </SchoolLayout>
    )
  }

  if (error && !assessment) {
    return (
      <SchoolLayout schoolName="">
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={() => fetchAssessment()}
              className="btn-hover"
            >
              Recarregar
            </button>
          </div>
        </div>
      </SchoolLayout>
    )
  }

  const schoolName = assessment?.school_name ?? ''

  return (
    <SchoolLayout schoolName={schoolName}>
      {loading && !assessment && <DetailSkeleton />}

      {!loading && assessment && (
        <>
          <header style={styles.header}>
            <nav style={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to="/school/assessments" style={styles.breadcrumbLink} className="btn-hover">
                ← Avaliações
              </Link>
            </nav>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>
                {assessment.title || (assessment.type ? TYPE_LABELS[assessment.type] || assessment.type : 'Avaliação')}
                {' — '}
                {formatDate(assessment.date)}
              </h1>
              {assessment.type && (
                <span style={styles.typeBadge}>
                  {TYPE_LABELS[assessment.type] || assessment.type}
                </span>
              )}
            </div>
          </header>

          {/* Seção Contexto */}
          <section style={styles.section} aria-labelledby="context-title">
            <h2 id="context-title" style={styles.sectionTitle}>Contexto</h2>
            <div style={styles.fieldGrid}>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Aluno</div>
                <div style={styles.fieldValue}>
                  <Link
                    to={`/school/students/${assessment.student_id}`}
                    style={styles.link}
                    className="btn-hover"
                  >
                    {assessment.student_name || '—'}
                  </Link>
                </div>
              </div>
              {assessment.team_id && (
                <div style={styles.field}>
                  <div style={styles.fieldLabel}>Turma</div>
                  <div style={styles.fieldValue}>
                    <Link
                      to={`/school/teams/${assessment.team_id}`}
                      style={styles.link}
                      className="btn-hover"
                    >
                      {assessment.team_name || '—'}
                    </Link>
                  </div>
                </div>
              )}
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Data da avaliação</div>
                <div style={styles.fieldValue}>{formatDate(assessment.date)}</div>
              </div>
              {assessment.evaluator && (
                <div style={styles.field}>
                  <div style={styles.fieldLabel}>Avaliador</div>
                  <div style={styles.fieldValue}>{assessment.evaluator.name}</div>
                </div>
              )}
              {(assessment.type || assessment.title) && (
                <div style={styles.field}>
                  <div style={styles.fieldLabel}>Tipo / Título</div>
                  <div style={styles.fieldValue}>
                    {assessment.title || (assessment.type ? TYPE_LABELS[assessment.type] || assessment.type : '—')}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Seção Critérios e resultados */}
          <section style={styles.section} aria-labelledby="criteria-title">
            <h2 id="criteria-title" style={styles.sectionTitle}>Critérios e resultados</h2>
            {!assessment.criteria_results || assessment.criteria_results.length === 0 ? (
              <p style={styles.noCriteria}>Sem critérios detalhados nesta avaliação.</p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Critério</th>
                      <th style={styles.th}>Resultado</th>
                      <th style={styles.th}>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.criteria_results.map((c, i) => (
                      <tr key={c.criterion_id || i}>
                        <td style={styles.td}>{c.criterion_name || '—'}</td>
                        <td style={styles.td}>{formatCriterionValue(c)}</td>
                        <td style={styles.td}>{c.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Seção Resultado final */}
          {assessment.final_result && (
            <section style={styles.section} aria-labelledby="final-title">
              <h2 id="final-title" style={styles.sectionTitle}>Resultado final</h2>
              <div style={styles.finalResultBlock}>
                {(assessment.final_result.summary != null && assessment.final_result.summary !== '') && (
                  <div style={styles.finalSummary}>
                    {assessment.final_result.summary}
                    {assessment.final_result.score != null && (
                      <span style={{ marginLeft: GRID, opacity: 0.9 }}>
                        (Nota: {Number(assessment.final_result.score).toFixed(1).replace('.', ',')})
                      </span>
                    )}
                    {assessment.final_result.level && (
                      <span style={{ marginLeft: GRID, opacity: 0.9 }}>— {assessment.final_result.level}</span>
                    )}
                  </div>
                )}
                {assessment.final_result.notes && (
                  <div style={styles.finalNotes}>{assessment.final_result.notes}</div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </SchoolLayout>
  )
}
