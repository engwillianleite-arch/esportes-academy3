import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorSchools,
  getFranchisorReportSchoolDetail,
  formatCurrency,
} from '../../api/franchisorPortal'

const GRID = 8
const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

const PERIOD_OPTIONS = [
  { value: 'este_mes', label: 'Este mês' },
  { value: 'ultimos_30', label: 'Últimos 30 dias' },
  { value: 'personalizado', label: 'Personalizado' },
]

function getPeriodBounds(period, fromStr, toStr) {
  const now = new Date()
  const to = toStr ? new Date(toStr) : new Date(now)
  let from
  if (period === 'este_mes') {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (period === 'ultimos_30') {
    from = new Date(now)
    from.setDate(from.getDate() - 30)
  } else {
    from = fromStr ? new Date(fromStr) : new Date(now)
    from.setDate(from.getDate() - 30)
  }
  const fromValid = isNaN(from.getTime()) ? new Date(now.getFullYear(), now.getMonth(), 1) : from
  const toValid = isNaN(to.getTime()) ? now : to
  return {
    from: fromValid.toISOString().slice(0, 10),
    to: toValid.toISOString().slice(0, 10),
  }
}

const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  headerActions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  btnGroup: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: GRID * 2 },
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
  section: { marginBottom: GRID * 4 },
  filtersCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 4,
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: GRID * 2,
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: GRID, minWidth: 160 },
  filterLabel: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  select: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    minWidth: 180,
  },
  input: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    minWidth: 140,
  },
  btnApply: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'var(--azul-arena)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: GRID * 3,
    marginBottom: GRID * 2,
  },
  kpiCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  kpiLabel: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9, marginBottom: GRID },
  kpiValue: { fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  sectionTitle: { margin: `0 0 ${GRID * 2}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  sectionNote: { margin: `0 0 ${GRID * 2}px`, fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.8 },
  skeleton: {
    height: 28,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  tableWrap: {
    overflowX: 'auto',
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    borderBottom: '2px solid var(--cinza-arquibancada)',
  },
  td: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderBottom: '1px solid #eee',
    color: 'var(--grafite-tecnico)',
  },
  linkAction: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
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
  deniedText: { margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  warningBanner: {
    padding: GRID * 2,
    background: 'rgba(44, 110, 242, 0.08)',
    border: '1px solid rgba(44, 110, 242, 0.2)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  actionLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
    marginTop: GRID * 3,
  },
}

function SkeletonCards() {
  return (
    <div style={styles.kpiGrid}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={styles.kpiCard}>
          <div style={{ ...styles.skeleton, width: '60%', marginBottom: GRID }} />
          <div style={{ ...styles.skeleton, width: '80%', height: 32 }} />
        </div>
      ))}
    </div>
  )
}

function SkeletonTable({ rows = 4, cols = 3 }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} style={styles.th}><div style={{ ...styles.skeleton, width: '70%' }} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, i) => (
                <td key={i} style={styles.td}><div style={{ ...styles.skeleton, width: i === 0 ? '80%' : '50%' }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatDateBr(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function FranchisorReportDetail() {
  const { school_id: schoolId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const fromParam = searchParams.get('from') || ''
  const toParam = searchParams.get('to') || ''
  const returnToParam = searchParams.get('returnTo') || ''

  // Default: últimos 30 dias se from/to ausentes
  const defaultBounds = useMemo(() => getPeriodBounds('ultimos_30', '', ''), [])
  const hasValidParams = fromParam && toParam
  const { from, to } = useMemo(() => {
    if (hasValidParams) return getPeriodBounds('personalizado', fromParam, toParam)
    return defaultBounds
  }, [hasValidParams, fromParam, toParam, defaultBounds])

  // Sincronizar URL com default quando faltar parâmetro
  useEffect(() => {
    if (!fromParam || !toParam) {
      const next = new URLSearchParams(searchParams)
      next.set('from', from)
      next.set('to', to)
      setSearchParams(next, { replace: true })
    }
  }, [])

  const [schools, setSchools] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [period, setPeriod] = useState(hasValidParams ? 'personalizado' : 'ultimos_30')
  const [fromInput, setFromInput] = useState(fromParam || from)
  const [toInput, setToInput] = useState(toParam || to)

  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((me) => {
        if (!cancelled && !ALLOWED_ROLES.includes(me.user_role)) setPermissionDenied(true)
      })
      .catch(() => { if (!cancelled) setPermissionDenied(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=franchisor', { replace: true })
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (permissionDenied) return
    let cancelled = false
    getFranchisorSchools()
      .then((res) => { if (!cancelled) setSchools(res.items || []) })
      .catch(() => { if (!cancelled) setSchools([]) })
    return () => { cancelled = true }
  }, [permissionDenied])

  useEffect(() => {
    if (permissionDenied || !schoolId) return
    let cancelled = false
    setError(null)
    setLoading(true)
    getFranchisorReportSchoolDetail(schoolId, { from, to })
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err) => {
        if (!cancelled) {
          const is403 = err?.status === 403 || err?.message?.toLowerCase().includes('permissão')
          if (is403) setPermissionDenied(true)
          else setError(err?.message || 'Não foi possível carregar o relatório. Tente novamente.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [permissionDenied, schoolId, from, to])

  const applyFilters = () => {
    const bounds = period === 'personalizado'
      ? getPeriodBounds('personalizado', fromInput, toInput)
      : getPeriodBounds(period, '', '')
    const next = new URLSearchParams(searchParams)
    next.set('from', bounds.from)
    next.set('to', bounds.to)
    if (returnToParam) next.set('returnTo', returnToParam)
    setSearchParams(next, { replace: true })
  }

  const backUrl = returnToParam || `/franchisor/reports?from=${from}&to=${to}`
  const schoolName = data?.school_name || schools.find((s) => s.school_id === schoolId)?.school_name || schoolId || 'Escola'

  const breadcrumb = [
    { label: 'Relatórios', to: `/franchisor/reports?from=${from}&to=${to}` },
    { label: schoolName },
  ]

  const hasSummary = data?.summary && Object.values(data.summary).some((v) => v != null)
  const hasAttendance = data?.attendance_breakdown != null
  const hasFinance = data?.finance_breakdown != null
  const hasTeams = data?.teams_breakdown != null
  const isEmpty = !loading && !error && data && !hasSummary && !hasAttendance && !hasFinance && !hasTeams

  if (permissionDenied) return null

  return (
    <FranchisorLayout
      pageTitle="Relatório da escola"
      breadcrumb={breadcrumb}
    >
      {!fromParam && !toParam && (
        <div style={styles.warningBanner} role="status">
          Período não informado. Exibindo últimos 30 dias por padrão.
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>Relatório da escola</h1>
        <p style={styles.subtitle}>{schoolName} • {formatDateBr(from)} a {formatDateBr(to)}</p>
      </div>

      <div style={styles.headerActions}>
        <div style={styles.btnGroup}>
          <Link to={backUrl} style={styles.btnSecondary} className="btn-hover">
            <IconArrowLeft />
            Voltar
          </Link>
          <Link to={`/franchisor/schools/${schoolId}`} style={styles.btnPrimary} className="btn-hover">
            Abrir escola
          </Link>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <p style={styles.errorText}>{error}</p>
            <button type="button" style={styles.btnReload} onClick={() => window.location.reload()}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!error && (
        <>
          {/* Filtros do detalhe */}
          <section style={styles.section} aria-label="Filtros do período">
            <div style={styles.filtersCard}>
              <div style={styles.filtersRow}>
                <div style={styles.filterGroup}>
                  <span style={styles.filterLabel}>Período</span>
                  <select
                    style={styles.select}
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    aria-label="Período"
                  >
                    {PERIOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {period === 'personalizado' && (
                  <>
                    <div style={styles.filterGroup}>
                      <span style={styles.filterLabel}>De</span>
                      <input
                        type="date"
                        style={styles.input}
                        value={fromInput}
                        onChange={(e) => setFromInput(e.target.value)}
                        aria-label="Data inicial"
                      />
                    </div>
                    <div style={styles.filterGroup}>
                      <span style={styles.filterLabel}>Até</span>
                      <input
                        type="date"
                        style={styles.input}
                        value={toInput}
                        onChange={(e) => setToInput(e.target.value)}
                        aria-label="Data final"
                      />
                    </div>
                  </>
                )}
                <div style={{ ...styles.filterGroup, flexDirection: 'row', alignItems: 'flex-end' }}>
                  <button type="button" style={styles.btnApply} onClick={applyFilters}>
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Seção A — Visão geral (sempre; cards só se existir no backend) */}
          <section style={styles.section} aria-label="Visão geral">
            <h2 style={styles.sectionTitle}>Visão geral</h2>
            <p style={styles.sectionNote}>Dados consolidados para o período selecionado.</p>
            {loading ? (
              <SkeletonCards />
            ) : hasSummary ? (
              <div style={styles.kpiGrid}>
                {data.summary.students_count != null && (
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>Alunos</div>
                    <div style={styles.kpiValue}>{data.summary.students_count}</div>
                  </div>
                )}
                {data.summary.teams_count != null && (
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>Turmas</div>
                    <div style={styles.kpiValue}>{data.summary.teams_count}</div>
                  </div>
                )}
                {data.summary.attendances_count != null && (
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>Presenças</div>
                    <div style={styles.kpiValue}>{data.summary.attendances_count}</div>
                  </div>
                )}
                {data.summary.received_total != null && (
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>Recebido</div>
                    <div style={styles.kpiValue}>{formatCurrency(data.summary.received_total)}</div>
                  </div>
                )}
                {data.summary.overdue_total != null && (
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>Em atraso</div>
                    <div style={styles.kpiValue}>{formatCurrency(data.summary.overdue_total)}</div>
                  </div>
                )}
              </div>
            ) : !isEmpty && (
              <p style={styles.emptyText}>Nenhum indicador disponível para o período.</p>
            )}
          </section>

          {/* Seção B — Detalhes de presença (se existir) */}
          {hasAttendance && (
            <section style={styles.section} aria-label="Detalhes de presença">
              <h2 style={styles.sectionTitle}>Detalhes de presença</h2>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Indicador</th>
                      <th style={styles.th}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attendance_breakdown.presencas_registradas != null && (
                      <tr>
                        <td style={styles.td}>Presenças registradas</td>
                        <td style={styles.td}>{data.attendance_breakdown.presencas_registradas}</td>
                      </tr>
                    )}
                    {data.attendance_breakdown.faltas_registradas != null && (
                      <tr>
                        <td style={styles.td}>Faltas registradas</td>
                        <td style={styles.td}>{data.attendance_breakdown.faltas_registradas}</td>
                      </tr>
                    )}
                    {data.attendance_breakdown.percentual_presenca != null && (
                      <tr>
                        <td style={styles.td}>% presença</td>
                        <td style={styles.td}>{data.attendance_breakdown.percentual_presenca}%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Seção C — Detalhes financeiro (se existir) */}
          {hasFinance && (
            <section style={styles.section} aria-label="Detalhes financeiro">
              <h2 style={styles.sectionTitle}>Detalhes financeiro</h2>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Indicador</th>
                      <th style={styles.th}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.finance_breakdown.received_total != null && (
                      <tr>
                        <td style={styles.td}>Recebido total</td>
                        <td style={styles.td}>{formatCurrency(data.finance_breakdown.received_total)}</td>
                      </tr>
                    )}
                    {data.finance_breakdown.em_aberto != null && (
                      <tr>
                        <td style={styles.td}>Em aberto</td>
                        <td style={styles.td}>{formatCurrency(data.finance_breakdown.em_aberto)}</td>
                      </tr>
                    )}
                    {data.finance_breakdown.em_atraso != null && (
                      <tr>
                        <td style={styles.td}>Em atraso</td>
                        <td style={styles.td}>{formatCurrency(data.finance_breakdown.em_atraso)}</td>
                      </tr>
                    )}
                    {data.finance_breakdown.maior_atraso_dias != null && (
                      <tr>
                        <td style={styles.td}>Maior atraso (dias)</td>
                        <td style={styles.td}>{data.finance_breakdown.maior_atraso_dias}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Seção D — Turmas (se existir) */}
          {hasTeams && (
            <section style={styles.section} aria-label="Turmas">
              <h2 style={styles.sectionTitle}>Turmas</h2>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Indicador</th>
                      <th style={styles.th}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teams_breakdown.qtde_turmas != null && (
                      <tr>
                        <td style={styles.td}>Quantidade de turmas</td>
                        <td style={styles.td}>{data.teams_breakdown.qtde_turmas}</td>
                      </tr>
                    )}
                    {data.teams_breakdown.turmas_ativas != null && (
                      <tr>
                        <td style={styles.td}>Turmas ativas</td>
                        <td style={styles.td}>{data.teams_breakdown.turmas_ativas}</td>
                      </tr>
                    )}
                    {data.teams_breakdown.capacidade_media != null && (
                      <tr>
                        <td style={styles.td}>Capacidade média</td>
                        <td style={styles.td}>{data.teams_breakdown.capacidade_media}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {isEmpty && (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>Nenhum dado encontrado para este período.</p>
            </div>
          )}

          {/* Links de ação */}
          <section style={styles.section} aria-label="Navegação">
            <div style={styles.actionLinks}>
              <Link to={`/franchisor/schools/${schoolId}`} style={styles.linkAction}>
                Ver detalhes da escola
              </Link>
              <Link to={backUrl} style={styles.linkAction}>
                Voltar para consolidado
              </Link>
            </div>
          </section>
        </>
      )}
    </FranchisorLayout>
  )
}
