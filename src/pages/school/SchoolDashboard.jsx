import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolDashboardSummary, formatCurrency } from '../../api/schoolPortal'

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
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
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
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: GRID * 3,
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
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
  listCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${GRID}px 0`,
    borderBottom: '1px solid #eee',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  listItemLast: { borderBottom: 'none' },
  linkModule: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  eventRow: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px 0`,
    borderBottom: '1px solid #eee',
    fontSize: 14,
  },
  eventRowLast: { borderBottom: 'none' },
  eventDate: { fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.8 },
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
  deniedBox: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  deniedTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  verTodas: { marginTop: GRID * 2, fontSize: 14 },
  verTodasLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
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

function formatEventDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function SchoolDashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

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
            setError(err?.message || 'Não foi possível carregar o dashboard. Tente novamente.')
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
      .catch((err) => setError(err?.message || 'Não foi possível carregar o dashboard. Tente novamente.'))
      .finally(() => setLoading(false))
  }

  const schoolName = summary?.school_name ?? ''
  const hasAnyKpi =
    summary?.students_active_count != null ||
    summary?.teams_active_count != null ||
    summary?.attendances_today_count != null ||
    summary?.overdue_payments_count != null ||
    summary?.overdue_total != null
  const pending = summary?.pending_today
  const hasPending = pending && (pending.presenças_nao_registradas > 0 || pending.mensalidades_vencem_semana > 0)
  const upcomingEvents = summary?.upcoming_events || []
  const showEvents = upcomingEvents.length > 0

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Visão geral da escola</p>
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
          {/* KPIs */}
          <section style={styles.section} aria-label="Indicadores">
            <div style={styles.kpiGrid} className="admin-kpi-grid">
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
                  {summary?.students_active_count != null && (
                    <KpiCard
                      title="Alunos ativos"
                      value={summary.students_active_count.toLocaleString('pt-BR')}
                      icon={IconStudents}
                      href="/school/students"
                      loading={false}
                    />
                  )}
                  {summary?.teams_active_count != null && (
                    <KpiCard
                      title="Turmas ativas"
                      value={summary.teams_active_count.toLocaleString('pt-BR')}
                      icon={IconTeams}
                      href="/school/teams"
                      loading={false}
                    />
                  )}
                  {summary?.attendances_today_count != null && (
                    <KpiCard
                      title="Presenças hoje"
                      value={summary.attendances_today_count.toLocaleString('pt-BR')}
                      icon={IconAttendance}
                      href="/school/attendance"
                      loading={false}
                    />
                  )}
                  {(summary?.overdue_payments_count != null || summary?.overdue_total != null) && (
                    <KpiCard
                      title="Mensalidades em atraso"
                      value={
                        summary.overdue_payments_count != null && summary.overdue_total != null
                          ? `${summary.overdue_payments_count} (${formatCurrency(summary.overdue_total)})`
                          : summary.overdue_payments_count != null
                          ? String(summary.overdue_payments_count)
                          : formatCurrency(summary.overdue_total)
                      }
                      icon={IconOverdue}
                      href="/school/finance"
                      loading={false}
                    />
                  )}
                </>
              )}
            </div>
          </section>

          {/* Atalhos rápidos — MVP: Alunos, Turmas, Presença, Financeiro, Eventos */}
          <section style={styles.section} aria-label="Atalhos rápidos">
            <h2 style={styles.sectionTitle}>Atalhos rápidos</h2>
            <div style={styles.atalhosGrid}>
              <Link to="/school/reports" style={styles.atalhoLink} className="btn-hover">
                Relatórios
                <IconArrowRight />
              </Link>
              <Link to="/school/students" style={styles.atalhoLink} className="btn-hover">
                Alunos
                <IconArrowRight />
              </Link>
              <Link to="/school/teams" style={styles.atalhoLink} className="btn-hover">
                Turmas
                <IconArrowRight />
              </Link>
              <Link to="/school/coaches" style={styles.atalhoLink} className="btn-hover">
                Professores/Treinadores
                <IconArrowRight />
              </Link>
              <Link to="/school/trainings" style={styles.atalhoLink} className="btn-hover">
                Treinos
                <IconArrowRight />
              </Link>
              <Link to="/school/assessments" style={styles.atalhoLink} className="btn-hover">
                Avaliações
                <IconArrowRight />
              </Link>
              <Link to="/school/attendance" style={styles.atalhoLink} className="btn-hover">
                Presença
                <IconArrowRight />
              </Link>
              <Link to="/school/attendance/history" style={styles.atalhoLink} className="btn-hover">
                Histórico de Presenças
                <IconArrowRight />
              </Link>
              <Link to="/school/finance" style={styles.atalhoLink} className="btn-hover">
                Financeiro
                <IconArrowRight />
              </Link>
              <Link to="/school/events" style={styles.atalhoLink} className="btn-hover">
                Eventos
                <IconArrowRight />
              </Link>
              <Link to="/school/announcements" style={styles.atalhoLink} className="btn-hover">
                Comunicados / Mural
                <IconArrowRight />
              </Link>
            </div>
          </section>

          {/* Pendências do dia (opcional MVP) */}
          {!loading && hasPending && (
            <section style={styles.section} aria-label="Pendências do dia">
              <h2 style={styles.sectionTitle}>Pendências do dia</h2>
              <div style={styles.listCard}>
                {pending.presenças_nao_registradas > 0 && (
                  <div style={styles.listItem}>
                    <span>{pending.presenças_nao_registradas} presenças não registradas hoje</span>
                    <Link to="/school/attendance" style={styles.linkModule}>Registrar</Link>
                  </div>
                )}
                {pending.mensalidades_vencem_semana > 0 && (
                  <div style={{ ...styles.listItem, ...(pending.presenças_nao_registradas <= 0 ? styles.listItemLast : {}) }}>
                    <span>{pending.mensalidades_vencem_semana} mensalidades vencem esta semana</span>
                    <Link to="/school/finance" style={styles.linkModule}>Ver financeiro</Link>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Próximos eventos (opcional MVP) */}
          {!loading && showEvents && (
            <section style={styles.section} aria-label="Próximos eventos">
              <h2 style={styles.sectionTitle}>Próximos eventos</h2>
              <div style={styles.listCard}>
                {upcomingEvents.slice(0, 3).map((ev, i) => (
                  <div
                    key={ev.id}
                    style={{
                      ...styles.eventRow,
                      ...(i === Math.min(2, upcomingEvents.length - 1) ? styles.eventRowLast : {}),
                    }}
                  >
                    <span style={styles.eventDate}><IconCalendar /> {formatEventDate(ev.date)}</span>
                    <span>{ev.title}</span>
                  </div>
                ))}
                <div style={styles.verTodas}>
                  <Link to="/school/events" style={styles.verTodasLink}>
                    Ver eventos
                  </Link>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </SchoolLayout>
  )
}
