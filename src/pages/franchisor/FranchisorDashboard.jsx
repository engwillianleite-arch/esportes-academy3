import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorSchools,
  getFranchisorDashboardSummary,
  formatCurrency,
} from '../../api/franchisorPortal'

const GRID = 8

const IconSchool = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></svg>
)
const IconStudents = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)
const IconReceived = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
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
  tableWrap: { overflowX: 'auto', background: 'var(--branco-luz)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px solid rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: `${GRID * 2}px ${GRID * 3}px`, fontWeight: 600, color: 'var(--grafite-tecnico)', borderBottom: '2px solid var(--cinza-arquibancada)' },
  td: { padding: `${GRID * 2}px ${GRID * 3}px`, borderBottom: '1px solid #eee', color: 'var(--grafite-tecnico)' },
  linkAbrir: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  statusAtivo: { color: 'var(--verde-patrocinio)', fontWeight: 500 },
  statusSuspenso: { color: 'var(--grafite-tecnico)', opacity: 0.8 },
  statusPendente: { color: 'var(--azul-arena)', fontWeight: 500 },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  emptyText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  emptyNote: { fontSize: 13, opacity: 0.7 },
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
  resumoEscola: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 4,
  },
  resumoEscolaAcoes: { display: 'flex', gap: GRID * 2, marginTop: GRID * 2, flexWrap: 'wrap' },
  btnDetalhe: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px ${GRID * 2}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  btnPortalEscola: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px ${GRID * 2}px`,
    background: 'transparent',
    color: 'var(--azul-arena)',
    border: '1px solid var(--azul-arena)',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  verTodas: { marginTop: GRID * 2, fontSize: 14 },
  verTodasLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
}

function KpiCard({ title, value, icon: Icon, loading }) {
  return (
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

const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']
const TOP_SCHOOLS = 5

export default function FranchisorDashboard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const schoolId = searchParams.get('school_id') || null

  const [me, setMe] = useState(null)
  const [schools, setSchools] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setPermissionDenied(false)
    setLoading(true)

    Promise.all([
      getFranchisorMe(),
      getFranchisorSchools(),
      getFranchisorDashboardSummary(schoolId || undefined),
    ])
      .then(([meRes, schoolsRes, summaryRes]) => {
        if (cancelled) return
        if (!ALLOWED_ROLES.includes(meRes.user_role)) {
          setPermissionDenied(true)
          return
        }
        setMe(meRes)
        setSchools(schoolsRes.items || [])
        setSummary(summaryRes)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Erro ao carregar')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [schoolId])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=franchisor', { replace: true })
    }
  }, [permissionDenied, navigate])

  const refetch = () => {
    setError(null)
    setLoading(true)
    getFranchisorDashboardSummary(schoolId || undefined)
      .then(setSummary)
      .catch((err) => setError(err?.message || 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }

  const subtitle = schoolId
    ? 'Visão da escola selecionada'
    : 'Visão consolidada das suas escolas'

  if (permissionDenied) return null

  return (
    <FranchisorLayout>
      <header style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>{subtitle}</p>
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
              ) : (
                <>
                  <KpiCard
                    title="Escolas ativas"
                    value={summary?.schools_active_count ?? 0}
                    icon={IconSchool}
                    loading={false}
                  />
                  {summary?.students_count != null && (
                    <KpiCard
                      title="Alunos"
                      value={summary.students_count.toLocaleString('pt-BR')}
                      icon={IconStudents}
                      loading={false}
                    />
                  )}
                  {summary?.received_total != null && (
                    <KpiCard
                      title="Mensalidades recebidas (período)"
                      value={formatCurrency(summary.received_total)}
                      icon={IconReceived}
                      loading={false}
                    />
                  )}
                  {summary?.overdue_total != null && summary?.overdue_total !== 0 && (
                    <KpiCard
                      title="Em atraso"
                      value={formatCurrency(summary.overdue_total)}
                      icon={IconOverdue}
                      loading={false}
                    />
                  )}
                  {summary?.overdue_total === 0 && (
                    <KpiCard
                      title="Em atraso"
                      value={formatCurrency(0)}
                      icon={IconOverdue}
                      loading={false}
                    />
                  )}
                </>
              )}
            </div>
          </section>

          {/* Atalhos rápidos — MVP: só Ver escolas e Relatórios */}
          <section style={styles.section} aria-label="Atalhos rápidos">
            <h2 style={styles.sectionTitle}>Atalhos rápidos</h2>
            <div style={styles.atalhosGrid}>
              <Link to="/franchisor/schools" style={styles.atalhoLink} className="btn-hover">
                Ver escolas
                <IconArrowRight />
              </Link>
              <Link to="/franchisor/reports" style={styles.atalhoLink} className="btn-hover">
                Relatórios consolidados
                <IconArrowRight />
              </Link>
            </div>
          </section>

          {/* Lista rápida de escolas ou Resumo da escola */}
          <section style={styles.section} aria-label="Minhas escolas">
            {schoolId ? (
              <>
                <h2 style={styles.sectionTitle}>Resumo da escola</h2>
                <div style={styles.resumoEscola}>
                  {loading ? (
                    <div style={styles.skeleton} />
                  ) : (
                    <>
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                        Escola selecionada no switcher. Abra o detalhe ou o portal da escola (se permitido).
                      </p>
                      <div style={styles.resumoEscolaAcoes}>
                        <Link to={`/franchisor/schools/${schoolId}`} style={styles.btnDetalhe}>
                          Abrir detalhe
                        </Link>
                        <a href={`/school/dashboard?school_id=${schoolId}`} style={styles.btnPortalEscola}>
                          Abrir portal da escola
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : schools.length === 0 && !loading ? (
              <div style={styles.emptyState}>
                <h2 style={styles.emptyTitle}>Nenhuma escola vinculada</h2>
                <p style={styles.emptyText}>Nenhuma escola vinculada ao seu franqueador.</p>
                <p style={styles.emptyNote}>Entre em contato com o Admin para suporte.</p>
              </div>
            ) : (
              <>
                <h2 style={styles.sectionTitle}>Minhas escolas</h2>
                <div style={styles.tableWrap}>
                  {loading ? (
                    <div style={{ padding: GRID * 4 }}>
                      <div style={styles.skeleton} />
                      <div style={{ ...styles.skeleton, marginTop: GRID, width: '80%' }} />
                      <div style={{ ...styles.skeleton, marginTop: GRID, width: '60%' }} />
                    </div>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Nome</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Cidade / UF</th>
                          <th style={styles.th}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schools.slice(0, TOP_SCHOOLS).map((s) => (
                          <tr key={s.school_id}>
                            <td style={styles.td}>{s.school_name}</td>
                            <td style={styles.td}>
                              <span
                                style={
                                  s.status === 'ativo'
                                    ? styles.statusAtivo
                                    : s.status === 'pendente'
                                    ? styles.statusPendente
                                    : styles.statusSuspenso
                                }
                              >
                                {s.status}
                              </span>
                            </td>
                            <td style={styles.td}>
                              {[s.city, s.state].filter(Boolean).join(' / ') || '—'}
                            </td>
                            <td style={styles.td}>
                              <Link to={`/franchisor/schools/${s.school_id}`} style={styles.linkAbrir}>
                                Abrir
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {schools.length > 0 && (
                  <div style={styles.verTodas}>
                    <Link to="/franchisor/schools" style={styles.verTodasLink}>
                      Ver todas
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </FranchisorLayout>
  )
}
