import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorSchoolById,
  getFranchisorSchoolSummary,
  getFranchisorMe,
  formatCurrency,
} from '../../api/franchisorPortal'
import { useState, useEffect } from 'react'

const GRID = 8
const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconExternal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)
const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const styles = {
  section: { marginBottom: GRID * 4 },
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  badge: {
    display: 'inline-block',
    padding: `${GRID / 2}px ${GRID * 1.5}px`,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  statusAtivo: { background: 'rgba(76, 203, 138, 0.2)', color: 'var(--verde-patrocinio)' },
  statusPendente: { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' },
  statusSuspenso: { background: 'rgba(58, 58, 60, 0.12)', color: 'var(--grafite-tecnico)', opacity: 0.9 },
  btnGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 3}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 3}px`,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 3,
  },
  cardTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  row: { marginBottom: GRID * 1.5, fontSize: 14, color: 'var(--grafite-tecnico)' },
  label: { fontWeight: 600, marginRight: GRID, opacity: 0.9 },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: GRID * 3,
  },
  kpiCard: {
    padding: GRID * 2,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 8,
    textAlign: 'center',
  },
  kpiLabel: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.85, marginBottom: GRID },
  kpiValue: { fontSize: 22, fontWeight: 700, color: 'var(--grafite-tecnico)' },
  atalhosGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
  },
  atalhoLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    background: 'var(--branco-luz)',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    textDecoration: 'none',
    boxShadow: 'var(--shadow)',
  },
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
    marginRight: GRID * 2,
  },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  emptyTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  emptyLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const normalized = s === 'ativo' ? 'Ativa' : s === 'suspenso' ? 'Suspensa' : s === 'pendente' ? 'Pendente' : status || '—'
  const style =
    s === 'ativo'
      ? { ...styles.badge, ...styles.statusAtivo }
      : s === 'pendente'
        ? { ...styles.badge, ...styles.statusPendente }
        : { ...styles.badge, ...styles.statusSuspenso }
  return <span style={style}>{normalized}</span>
}

function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.skeleton, width: '40%', marginBottom: GRID * 2, height: 18 }} />
      <div style={{ ...styles.skeleton, width: '90%', marginBottom: GRID }} />
      <div style={{ ...styles.skeleton, width: '70%', marginBottom: GRID }} />
      <div style={{ ...styles.skeleton, width: '60%' }} />
    </div>
  )
}

export default function DetalheEscolaFranqueador() {
  const { school_id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.returnTo || '/franchisor/schools'

  const [school, setSchool] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Verificar permissão (FranchisorOwner, FranchisorStaff)
  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((me) => {
        if (!cancelled && !ALLOWED_ROLES.includes(me.user_role)) {
          setPermissionDenied(true)
        }
      })
      .catch(() => { if (!cancelled) setPermissionDenied(true) })
    return () => { cancelled = true }
  }, [])

  // Carregar escola e resumo
  useEffect(() => {
    if (permissionDenied || !school_id) return
    let cancelled = false
    setError(null)
    setLoading(true)
    Promise.all([getFranchisorSchoolById(school_id), getFranchisorSchoolSummary(school_id)])
      .then(([schoolData, summaryData]) => {
        if (!cancelled) {
          setSchool(schoolData)
          setSummary(summaryData)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os dados da escola. Tente novamente.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [school_id, permissionDenied])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=franchisor', { replace: true })
    }
  }, [permissionDenied, navigate])

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Escolas', to: '/franchisor/schools' },
    { label: school?.school_name || school_id || 'Detalhe' },
  ]

  const statusLower = (school?.status || '').toLowerCase()
  const isSuspended = statusLower === 'suspenso'
  const canOpenPortal = school?.can_access_school_portal && !isSuspended

  const hasFinanceRoute = true   // link existe; rota pode ser criada depois
  const hasReportsRoute = true  // /franchisor/reports já existe

  if (permissionDenied) return null

  return (
    <FranchisorLayout
      pageTitle={school ? school.school_name : 'Detalhe da Escola'}
      breadcrumb={breadcrumb}
    >
      {/* Erro */}
      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro</div>
            <div style={styles.errorText}>{error}</div>
            <div>
              <button type="button" style={styles.btnReload} onClick={() => window.location.reload()}>
                Recarregar
              </button>
              <Link to={returnTo} style={styles.btnSecondary}>
                Voltar
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Escola não encontrada (após carregar sem erro de rede) */}
      {!error && !loading && !school && (
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>Escola não encontrada.</h2>
          <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
            O identificador da escola pode estar incorreto ou você não tem permissão para acessá-la.
          </p>
          <Link to={returnTo} style={styles.emptyLink}>
            Voltar para escolas
          </Link>
        </div>
      )}

      {/* Conteúdo principal */}
      {!error && school && (
        <>
          {/* Cabeçalho: título, badge, botões */}
          <div style={styles.headerRow}>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>{school.school_name}</h1>
              <StatusBadge status={school.status} />
            </div>
            <div style={styles.btnGroup}>
              {canOpenPortal && (
                <Link
                  to={`/school?school_id=${school_id}`}
                  style={styles.btnPrimary}
                  className="btn-hover"
                >
                  Abrir Portal da Escola
                  <IconExternal />
                </Link>
              )}
              {isSuspended && school.can_access_school_portal && (
                <span style={{ fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
                  Escola suspensa — acesso ao portal bloqueado
                </span>
              )}
              <Link to={returnTo} style={styles.btnSecondary} className="btn-hover">
                <IconArrowLeft />
                Voltar para escolas
              </Link>
            </div>
          </div>

          {/* Card: Dados da escola */}
          <section style={styles.section} aria-label="Dados da escola">
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Dados da escola</h2>
              <div style={styles.row}>
                <span style={styles.label}>Nome:</span>
                {school.school_name}
              </div>
              {(school.city || school.state) && (
                <div style={styles.row}>
                  <span style={styles.label}>Cidade/UF:</span>
                  {[school.city, school.state].filter(Boolean).join(' / ')}
                </div>
              )}
              {school.responsible_name && (
                <div style={styles.row}>
                  <span style={styles.label}>Responsável local:</span>
                  {school.responsible_name}
                </div>
              )}
              {(school.email || school.phone) && (
                <div style={styles.row}>
                  <span style={styles.label}>Contato:</span>
                  {[school.email, school.phone].filter(Boolean).join(' · ')}
                </div>
              )}
              <div style={styles.row}>
                <span style={styles.label}>Status:</span>
                <StatusBadge status={school.status} />
              </div>
              {school.created_at && (
                <div style={styles.row}>
                  <span style={styles.label}>Criado em:</span>
                  {new Date(school.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Card: Resumo (KPIs) */}
          <section style={styles.section} aria-label="Resumo">
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Resumo</h2>
              {summary && (summary.students_count != null || summary.teams_count != null || summary.overdue_total != null) ? (
                <div style={styles.kpiGrid}>
                  {summary.students_count != null && (
                    <div style={styles.kpiCard}>
                      <div style={styles.kpiLabel}>Alunos</div>
                      <div style={styles.kpiValue}>{summary.students_count}</div>
                    </div>
                  )}
                  {summary.teams_count != null && (
                    <div style={styles.kpiCard}>
                      <div style={styles.kpiLabel}>Turmas</div>
                      <div style={styles.kpiValue}>{summary.teams_count}</div>
                    </div>
                  )}
                  {(summary.overdue_total != null && summary.overdue_total !== '') && (
                    <div style={styles.kpiCard}>
                      <div style={styles.kpiLabel}>Em atraso</div>
                      <div style={styles.kpiValue}>{formatCurrency(summary.overdue_total)}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
                  Resumo indisponível no momento.
                </p>
              )}
            </div>
          </section>

          {/* Atalhos */}
          <section style={styles.section} aria-label="Atalhos">
            <h2 style={{ margin: `0 0 ${GRID * 2}px`, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' }}>
              Atalhos
            </h2>
            <div style={styles.atalhosGrid}>
              {canOpenPortal && (
                <Link
                  to={`/school?school_id=${school_id}`}
                  style={styles.atalhoLink}
                  className="btn-hover"
                >
                  Ver no Portal da Escola
                  <IconExternal />
                </Link>
              )}
              {hasFinanceRoute && (
                <Link
                  to={`/franchisor/finance?school_id=${school_id}`}
                  style={styles.atalhoLink}
                  className="btn-hover"
                >
                  Financeiro desta escola
                </Link>
              )}
              {hasReportsRoute && (
                <Link
                  to={`/franchisor/reports?school_id=${school_id}`}
                  style={styles.atalhoLink}
                  className="btn-hover"
                >
                  Relatórios desta escola
                </Link>
              )}
              <Link to={returnTo} style={styles.atalhoLink} className="btn-hover">
                <IconArrowLeft />
                Voltar para lista de escolas
              </Link>
            </div>
          </section>
        </>
      )}

      {/* Loading: skeleton quando ainda carregando e não temos school (primeira carga) */}
      {!error && loading && !school && (
        <>
          <div style={styles.headerRow}>
            <div style={{ ...styles.skeleton, width: 280, height: 28 }} />
            <div style={{ ...styles.skeleton, width: 200, height: 36 }} />
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}
    </FranchisorLayout>
  )
}
