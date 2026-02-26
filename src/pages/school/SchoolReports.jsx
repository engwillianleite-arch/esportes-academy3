import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolDashboardSummary } from '../../api/schoolPortal'
import { useAuth } from '../../contexts/AuthContext'

const GRID = 8

/** Roles permitidas no escopo escola para relatórios (RBAC). */
/**
 * Catálogo estático de relatórios MVP (Opção 1).
 * required_permissions: roles que podem ver este relatório (qualquer uma).
 */
const REPORT_CATALOG = [
  {
    key: 'students_active',
    category: 'students',
    title: 'Alunos ativos',
    description: 'Lista e contagem de alunos ativos na escola.',
    required_permissions: ['SchoolOwner', 'SchoolStaff'],
  },
  {
    key: 'students_by_team',
    category: 'students',
    title: 'Alunos por turma',
    description: 'Distribuição de alunos por turma.',
    required_permissions: ['SchoolOwner', 'SchoolStaff', 'Coach'],
  },
  {
    key: 'attendance_by_team',
    category: 'attendance',
    title: 'Presença por turma (período)',
    description: 'Presença agregada por turma em um período.',
    required_permissions: ['SchoolOwner', 'SchoolStaff', 'Coach'],
  },
  {
    key: 'attendance_by_student',
    category: 'attendance',
    title: 'Presença por aluno (período)',
    description: 'Presença por aluno em um período (depende do histórico de presença).',
    required_permissions: ['SchoolOwner', 'SchoolStaff', 'Coach'],
  },
  {
    key: 'monthly_summary',
    category: 'finance',
    title: 'Mensalidades do mês (resumo)',
    description: 'Resumo de mensalidades do mês (previsto x recebido).',
    required_permissions: ['SchoolOwner', 'SchoolStaff', 'Finance'],
  },
  {
    key: 'delinquency',
    category: 'finance',
    title: 'Inadimplência (período/mês)',
    description: 'Inadimplência por período ou mês.',
    required_permissions: ['SchoolOwner', 'SchoolStaff', 'Finance'],
  },
]

const CATEGORY_LABELS = {
  students: 'Alunos',
  attendance: 'Presença',
  finance: 'Financeiro',
}

const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconReport = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const styles = {
  header: {
    marginBottom: GRID * 4,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: `${GRID}px 0 0`,
    fontSize: 15,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  section: {
    marginBottom: GRID * 4,
  },
  sectionTitle: {
    margin: `0 0 ${GRID * 2}px`,
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: GRID * 3,
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
  },
  cardIcon: { color: 'var(--azul-arena)', opacity: 0.9, flexShrink: 0 },
  cardTitle: { fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)', margin: 0 },
  cardDesc: { fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85, margin: 0, lineHeight: 1.4 },
  cardAction: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--azul-arena)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    marginTop: 'auto',
  },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyText: { margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 3,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 4,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 15, fontWeight: 600, color: '#991B1B' },
  errorText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#991B1B', opacity: 0.9 },
  btnReload: {
    background: '#DC2626',
    color: '#fff',
    border: 'none',
    padding: `${GRID}px ${GRID * 2}px`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  atalhosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: GRID * 2,
  },
  atalhoLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: GRID * 2,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    textDecoration: 'none',
  },
}

/** Retorna a role do usuário no portal SCHOOL (primeiro membership escola). */
function getSchoolRole(memberships) {
  if (!Array.isArray(memberships)) return null
  const school = memberships.find((m) => m.portal === 'SCHOOL' && m.school_id)
  return school?.role ?? null
}

/** Verifica se o usuário pode ver o relatório (tem alguma das permissões exigidas). */
function canViewReport(report, userRole) {
  if (!userRole || !report.required_permissions) return false
  return report.required_permissions.includes(userRole)
}

/** Agrupa relatórios por categoria, filtrando por permissão. */
function groupReportsByCategory(catalog, userRole) {
  const allowed = catalog.filter((r) => canViewReport(r, userRole))
  const byCategory = {}
  allowed.forEach((r) => {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r)
  })
  const order = ['students', 'attendance', 'finance']
  return order.map((cat) => ({ category: cat, label: CATEGORY_LABELS[cat], items: byCategory[cat] || [] })).filter((g) => g.items.length > 0)
}

function ReportCard({ report }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardIcon}><IconReport /></span>
        <h3 style={styles.cardTitle}>{report.title}</h3>
      </div>
      <p style={styles.cardDesc}>{report.description}</p>
      <Link to={`/school/reports/${report.key}`} style={styles.cardAction} className="btn-hover">
        Abrir
        <IconArrowRight />
      </Link>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ ...styles.skeleton, width: 32, height: 32 }} />
        <div style={{ ...styles.skeleton, width: '70%', height: 18 }} />
      </div>
      <div style={{ ...styles.skeleton, width: '100%', height: 36 }} />
      <div style={{ ...styles.skeleton, width: 60, height: 14, marginTop: GRID }} />
    </div>
  )
}

export default function SchoolReports() {
  const navigate = useNavigate()
  const { memberships } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const schoolRole = useMemo(() => getSchoolRole(memberships), [memberships])
  const hasSchoolAccess = useMemo(() => {
    if (!Array.isArray(memberships)) return false
    return memberships.some((m) => m.portal === 'SCHOOL' && m.school_id)
  }, [memberships])

  useEffect(() => {
    let cancelled = false
    setError(null)
    setPermissionDenied(false)
    setLoading(true)

    getSchoolDashboardSummary()
      .then((data) => {
        if (cancelled) return
        setSummary(data)
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.status === 403 || err.code === 'FORBIDDEN') {
            setPermissionDenied(true)
          } else {
            setError(err?.message || 'Não foi possível carregar os relatórios. Tente novamente.')
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const refetch = () => {
    setError(null)
    setLoading(true)
    getSchoolDashboardSummary()
      .then(setSummary)
      .catch((err) => setError(err?.message || 'Não foi possível carregar os relatórios. Tente novamente.'))
      .finally(() => setLoading(false))
  }

  const schoolName = summary?.school_name ?? ''
  const groups = useMemo(() => groupReportsByCategory(REPORT_CATALOG, schoolRole), [schoolRole])
  const hasAnyReport = groups.length > 0
  const noPermission = !loading && !error && hasSchoolAccess && !hasAnyReport

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Relatórios</h1>
        <p style={styles.subtitle}>Acompanhamento operacional da escola</p>
      </header>

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button type="button" style={styles.btnReload} onClick={refetch}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!error && (
        <>
          {loading ? (
            <section style={styles.section} aria-label="Relatórios">
              <div style={styles.cardsGrid}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </section>
          ) : noPermission ? (
            <section style={styles.section}>
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Você não tem permissão para visualizar relatórios.</p>
              </div>
            </section>
          ) : (
            groups.map((group) => (
              <section key={group.category} style={styles.section} aria-label={group.label}>
                <h2 style={styles.sectionTitle}>{group.label}</h2>
                <div style={styles.cardsGrid}>
                  {group.items.map((report) => (
                    <ReportCard key={report.key} report={report} />
                  ))}
                </div>
              </section>
            ))
          )}

          {/* Exportações (Fase 2) e atalhos rápidos */}
          {!loading && !error && (
            <section style={styles.section} aria-label="Exportações e atalhos">
              <h2 style={styles.sectionTitle}>Exportações e atalhos</h2>
              <div style={styles.atalhosGrid}>
                <Link to="/school/reports/exports" style={styles.atalhoLink} className="btn-hover">
                  Exportações (CSV/PDF)
                  <IconArrowRight />
                </Link>
                <Link to="/school/students" style={styles.atalhoLink} className="btn-hover">
                  Alunos
                  <IconArrowRight />
                </Link>
                <Link to="/school/attendance" style={styles.atalhoLink} className="btn-hover">
                  Presença
                  <IconArrowRight />
                </Link>
                <Link to="/school/finance" style={styles.atalhoLink} className="btn-hover">
                  Financeiro
                  <IconArrowRight />
                </Link>
              </div>
            </section>
          )}
        </>
      )}
    </SchoolLayout>
  )
}
