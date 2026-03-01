import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { useAuth } from '../../contexts/AuthContext'
import { getSchoolDashboardSummary, formatCurrency } from '../../api/schoolPortal'
import {
  getMockSession,
  getMockCounts,
  getMockRecentActivity,
} from '../../data/mockSchoolSession'

const GRID = 8

const IconStudents = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)
const IconTeams = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)
const IconAttendance = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
)
const IconOverdue = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
)
const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
)
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
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
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  planCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 4,
  },
  planRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
    alignItems: 'baseline',
    marginBottom: GRID,
  },
  planLabel: { fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.8 },
  planValue: { fontSize: 18, fontWeight: 700, color: 'var(--grafite-tecnico)' },
  planStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${GRID / 2}px ${GRID}px`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: 'var(--azul-arena)',
    color: '#fff',
  },
  planHint: { margin: 0, marginTop: GRID, fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.75 },
  checklistList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
    padding: `${GRID * 1.5}px 0`,
    borderBottom: '1px solid #eee',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  checklistItemLast: { borderBottom: 'none' },
  checklistLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  checklistIconDone: { color: 'var(--azul-arena)', flexShrink: 0 },
  checklistIconPending: { color: 'var(--cinza-arquibancada)', opacity: 0.6, flexShrink: 0 },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: GRID * 3,
  },
  cardLink: {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: GRID * 2,
  },
  cardTitulo: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  cardIcon: { color: 'var(--azul-arena)', opacity: 0.9 },
  kpiValor: { fontSize: 26, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  skeleton: {
    height: 28,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
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
  activityList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  activityItem: {
    padding: `${GRID}px 0`,
    borderBottom: '1px solid #eee',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  activityItemLast: { borderBottom: 'none' },
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
}

function KpiCard({ title, value, icon: Icon, href, loading }) {
  const content = (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitulo}>{title}</span>
        {Icon && <span style={styles.cardIcon}><Icon /></span>}
      </div>
      {loading ? (
        <div style={{ ...styles.skeleton, width: '60%' }} />
      ) : (
        <div style={styles.kpiValor}>{value}</div>
      )}
    </div>
  )
  if (href && !loading) {
    return <Link to={href} style={styles.cardLink} className="btn-hover">{content}</Link>
  }
  return content
}

function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ ...styles.skeleton, width: 100, height: 14 }} />
      </div>
      <div style={{ ...styles.skeleton, width: '70%', height: 32, marginTop: GRID }} />
    </div>
  )
}

const CHECKLIST_ITEMS = [
  { label: 'Preencher dados da escola', to: '/school/settings', key: 'school_data' },
  { label: 'Adicionar usuários da equipe', to: '/school/settings/users', key: 'users' },
  { label: 'Criar primeira turma', to: '/school/teams/new', key: 'teams' },
  { label: 'Cadastrar primeiro aluno', to: '/school/students/new', key: 'students' },
  { label: 'Registrar presença', to: '/school/attendance', key: 'attendance' },
]

const ATALHOS_MVP = [
  { label: 'Alunos', to: '/school/students' },
  { label: 'Turmas', to: '/school/teams' },
  { label: 'Presença', to: '/school/attendance' },
  { label: 'Financeiro', to: '/school/finance' },
  { label: 'Eventos', to: '/school/events' },
]

export default function SchoolDashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const { user } = useAuth()
  const mockSession = getMockSession()
  const mockCounts = getMockCounts()
  const recentActivity = getMockRecentActivity(3)

  const hasAccess = mockSession != null || user != null

  // Segurança: school_id só da sessão (mock) ou do contexto autenticado, nunca da query/URL. Sem sessão -> redirect.
  useEffect(() => {
    if (hasAccess) return
    navigate('/login', { replace: true })
  }, [hasAccess, navigate])

  useEffect(() => {
    if (!hasAccess) return
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
            setError(err?.message || 'Não foi possível carregar o dashboard. Tente novamente.')
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [hasAccess])

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
      .catch((err) => setError(err?.message || 'Não foi possível carregar o dashboard. Tente novamente.'))
      .finally(() => setLoading(false))
  }

  // Nome da escola: somente do estado da sessão (mock), não da URL.
  const schoolName = mockSession?.school_name ?? summary?.school_name ?? ''

  const studentsCount = summary?.students_active_count ?? mockCounts.students_count ?? 0
  const teamsCount = summary?.teams_active_count ?? mockCounts.teams_count ?? 0
  const attendancesToday = summary?.attendances_today_count ?? mockCounts.attendances_today_count ?? 0
  const overdueCount = summary?.overdue_payments_count ?? mockCounts.overdue_invoices_count ?? 0
  const overdueTotal = summary?.overdue_total
  const usersCount = mockCounts.users_count ?? 0

  const checklistDone = {
    school_data: !!(mockSession?.school_name?.trim?.() ?? summary?.school_name?.trim?.()),
    users: usersCount > 1,
    teams: teamsCount > 0,
    students: studentsCount > 0,
    attendance: attendancesToday > 0,
  }

  const hasAnyKpi = studentsCount > 0 || teamsCount > 0 || attendancesToday > 0 || overdueCount > 0 || (overdueTotal != null && Number(overdueTotal) > 0)

  if (!hasAccess) return null
  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Bem-vindo(a)! Vamos configurar sua escola.</p>
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
          {/* Card Plano ativo (mock) */}
          <section style={styles.section} aria-label="Plano ativo">
            <div style={styles.planCard}>
              <div style={styles.planRow}>
                <span style={styles.planLabel}>Plano</span>
                <span style={styles.planValue}>Plano Escola</span>
              </div>
              <div style={styles.planRow}>
                <span style={styles.planLabel}>Valor</span>
                <span style={styles.planValue}>R$ 147,00 / mês</span>
              </div>
              <div style={styles.planRow}>
                <span style={styles.planLabel}>Status</span>
                <span style={styles.planStatus}>Ativo</span>
              </div>
              <p style={styles.planHint}>Pagamento confirmado. Acesso liberado.</p>
            </div>
          </section>

          {/* Checklist "Comece por aqui" */}
          <section style={styles.section} aria-label="Comece por aqui">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: GRID * 2, marginBottom: GRID * 2 }}>
              <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Comece por aqui</h2>
              <Link
                to="/school/setup"
                style={{
                  padding: `${GRID}px ${GRID * 2}px`,
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--azul-arena)',
                  background: 'rgba(0,180,120,0.1)',
                  border: '1px solid rgba(0,180,120,0.3)',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                }}
                className="btn-hover"
              >
                Começar configurações
              </Link>
            </div>
            <div style={styles.card}>
              <ul style={styles.checklistList}>
                {CHECKLIST_ITEMS.map((item, i) => {
                  const done = checklistDone[item.key]
                  return (
                    <li
                      key={item.key}
                      style={{
                        ...styles.checklistItem,
                        ...(i === CHECKLIST_ITEMS.length - 1 ? styles.checklistItemLast : {}),
                      }}
                    >
                      {done ? (
                        <span style={styles.checklistIconDone} aria-hidden><IconCheck /></span>
                      ) : (
                        <span style={styles.checklistIconPending} aria-hidden><IconCircle /></span>
                      )}
                      <Link to={item.to} style={styles.checklistLink} className="btn-hover">
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>

          {/* KPIs (mockados) */}
          <section style={styles.section} aria-label="Indicadores">
            <h2 style={styles.sectionTitle}>Indicadores</h2>
            <div style={styles.kpiGrid}>
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : !hasAnyKpi ? (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>Sem dados para exibir ainda.</p>
                </div>
              ) : (
                <>
                  <KpiCard
                    title="Alunos"
                    value={String(studentsCount)}
                    icon={IconStudents}
                    href="/school/students"
                    loading={false}
                  />
                  <KpiCard
                    title="Turmas"
                    value={String(teamsCount)}
                    icon={IconTeams}
                    href="/school/teams"
                    loading={false}
                  />
                  <KpiCard
                    title="Presenças hoje"
                    value={String(attendancesToday)}
                    icon={IconAttendance}
                    href="/school/attendance"
                    loading={false}
                  />
                  <KpiCard
                    title="Mensalidades em atraso"
                    value={
                      overdueTotal != null
                        ? `${overdueCount} (${formatCurrency(overdueTotal)})`
                        : String(overdueCount)
                    }
                    icon={IconOverdue}
                    href="/school/finance"
                    loading={false}
                  />
                </>
              )}
            </div>
          </section>

          {/* Atalhos rápidos — apenas módulos MVP */}
          <section style={styles.section} aria-label="Atalhos rápidos">
            <h2 style={styles.sectionTitle}>Atalhos rápidos</h2>
            <div style={styles.atalhosGrid}>
              {ATALHOS_MVP.map((a) => (
                <Link key={a.to} to={a.to} style={styles.atalhoLink} className="btn-hover">
                  {a.label}
                  <IconArrowRight />
                </Link>
              ))}
            </div>
          </section>

          {/* Atividade recente (opcional — mock) */}
          {recentActivity.length > 0 && (
            <section style={styles.section} aria-label="Atividade recente">
              <h2 style={styles.sectionTitle}>Atividade recente</h2>
              <div style={styles.card}>
                <ul style={styles.activityList}>
                  {recentActivity.map((item, i) => (
                    <li
                      key={item.id}
                      style={{
                        ...styles.activityItem,
                        ...(i === recentActivity.length - 1 ? styles.activityItemLast : {}),
                      }}
                    >
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </SchoolLayout>
  )
}
