import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolAnnouncementHistory } from '../../api/schoolPortal'

const GRID = 8
const PAGE_SIZE_OPTIONS = [10, 25, 50]

const styles = {
  breadcrumb: { marginBottom: GRID * 2, fontSize: 14 },
  breadcrumbLink: {
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
  },
  header: { marginBottom: GRID * 3 },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: GRID * 3,
  },
  cardLabel: { fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9, marginBottom: GRID },
  cardValue: { fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  cardSub: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.75, marginTop: 4 },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  filterLabel: { fontSize: 12, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  input: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    minWidth: 180,
  },
  select: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    minWidth: 140,
    background: 'var(--branco-luz)',
  },
  btn: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
  },
  btnPrimary: { background: 'var(--azul-arena)', color: '#fff' },
  btnSecondary: { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' },
  tableWrap: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    overflow: 'hidden',
    marginBottom: GRID * 2,
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 2}px`,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    background: 'var(--cinza-arquibancada)',
    borderBottom: '1px solid #eee',
  },
  td: { padding: `${GRID * 2}px ${GRID * 2}px`, borderBottom: '1px solid #eee', color: 'var(--grafite-tecnico)' },
  trLast: { borderBottom: 'none' },
  link: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  badgeRead: { display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: '#D1FAE5', color: '#065F46' },
  badgeUnread: { display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: '#FEF3C7', color: '#92400E' },
  pagination: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
  },
  paginationLeft: { display: 'flex', alignItems: 'center', gap: GRID * 2 },
  paginationRight: { display: 'flex', alignItems: 'center', gap: GRID },
  paginationSelect: { padding: `${GRID}px ${GRID}px`, fontSize: 14, border: '1px solid #ddd', borderRadius: 'var(--radius)', background: 'var(--branco-luz)' },
  emptyState: { textAlign: 'center', padding: GRID * 6, color: 'var(--grafite-tecnico)', opacity: 0.9, fontSize: 15 },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 3,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 15, fontWeight: 600, color: '#991B1B' },
  errorText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#991B1B', opacity: 0.9 },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
}

function formatDateTime(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return value
  }
}

function HistorySkeleton() {
  return (
    <>
      <div style={styles.breadcrumb}><div style={{ ...styles.skeleton, width: 160, height: 16 }} /></div>
      <div style={{ ...styles.skeleton, width: '60%', height: 32, marginBottom: GRID }} />
      <div style={{ ...styles.skeleton, width: '40%', height: 18, marginBottom: GRID * 4 }} />
      <div style={styles.cardsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={styles.card}>
            <div style={{ ...styles.skeleton, width: 80, height: 14, marginBottom: GRID }} />
            <div style={{ ...styles.skeleton, width: 60, height: 28 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: GRID * 2, marginBottom: GRID * 3 }}>
        <div style={{ ...styles.skeleton, width: 200, height: 36 }} />
        <div style={{ ...styles.skeleton, width: 120, height: 36 }} />
        <div style={{ ...styles.skeleton, width: 140, height: 36 }} />
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Destinatário</th>
              <th style={styles.th}>Turma(s)</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Enviado em</th>
              <th style={styles.th}>Lido em</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td style={styles.td}><div style={{ ...styles.skeleton, width: 140 }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeleton, width: 100 }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeleton, width: 60 }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeleton, width: 90 }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeleton, width: 90 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function SchoolAnnouncementHistory() {
  const { announcementId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [filters, setFilters] = useState({ q: '', status: '', team_id: '', from_date: '', to_date: '' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchHistory = useCallback(() => {
    if (!announcementId) return
    setError(null)
    setPermissionDenied(false)
    setLoading(true)
    const params = {
      page,
      page_size: pageSize,
      sort: 'unread_first',
      ...(filters.q && { q: filters.q }),
      ...(filters.status && { status: filters.status }),
      ...(filters.team_id && { team_id: filters.team_id }),
      ...(filters.from_date && { from_date: filters.from_date }),
      ...(filters.to_date && { to_date: filters.to_date }),
    }
    getSchoolAnnouncementHistory(announcementId, params)
      .then(setData)
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else setError(err?.message || 'Não foi possível carregar o histórico. Tente novamente.')
      })
      .finally(() => setLoading(false))
  }, [announcementId, page, pageSize, filters.q, filters.status, filters.team_id, filters.from_date, filters.to_date])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=school', { replace: true })
  }, [permissionDenied, navigate])

  const handleClearFilters = () => {
    setFilters({ q: '', status: '', team_id: '', from_date: '', to_date: '' })
    setPage(1)
  }

  const hasActiveFilters = filters.q || filters.status || filters.team_id || filters.from_date || filters.to_date
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 0
  const canPrev = data && data.page > 1
  const canNext = data && data.page < totalPages

  const schoolName = data?.school_name ?? ''

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <nav style={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to={`/school/announcements/${announcementId}`} style={styles.breadcrumbLink} className="btn-hover">
          ← Comunicado
        </Link>
      </nav>

      <header style={styles.header}>
        <h1 style={styles.title}>Histórico de envio e leitura</h1>
        {data?.announcement?.title && (
          <p style={styles.subtitle}>{data.announcement.title}</p>
        )}
      </header>

      {loading && <HistorySkeleton />}

      {!loading && error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon} aria-hidden>⚠</span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={fetchHistory}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!loading && data && !error && (
        <>
          <div style={styles.cardsGrid} aria-label="Resumo">
            <div style={styles.card}>
              <div style={styles.cardLabel}>Destinatários</div>
              <div style={styles.cardValue}>{data.summary.recipients_total}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Lidos</div>
              <div style={styles.cardValue}>{data.summary.read_count}</div>
              <div style={styles.cardSub}>
                {data.summary.recipients_total
                  ? `${Math.round((data.summary.read_rate || 0) * 100)}%`
                  : '0%'}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Não lidos</div>
              <div style={styles.cardValue}>{data.summary.unread_count}</div>
              <div style={styles.cardSub}>
                {data.summary.recipients_total
                  ? `${Math.round((1 - (data.summary.read_rate || 0)) * 100)}%`
                  : '0%'}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Última leitura</div>
              <div style={styles.cardValue}>{data.summary.last_read_at ? formatDateTime(data.summary.last_read_at) : '—'}</div>
            </div>
          </div>

          <div style={styles.filters}>
            <div style={styles.filterGroup}>
              <label htmlFor="history-q" style={styles.filterLabel}>Buscar destinatário</label>
              <input
                id="history-q"
                type="search"
                placeholder="Nome do aluno ou responsável"
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
                style={styles.input}
              />
            </div>
            <div style={styles.filterGroup}>
              <label htmlFor="history-status" style={styles.filterLabel}>Status</label>
              <select
                id="history-status"
                value={filters.status}
                onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1) }}
                style={styles.select}
              >
                <option value="">Todos</option>
                <option value="read">Lido</option>
                <option value="unread">Não lido</option>
              </select>
            </div>
            {data?.teams?.length > 0 && (
              <div style={styles.filterGroup}>
                <label htmlFor="history-team" style={styles.filterLabel}>Turma</label>
                <select
                  id="history-team"
                  value={filters.team_id}
                  onChange={(e) => { setFilters((f) => ({ ...f, team_id: e.target.value })); setPage(1) }}
                  style={styles.select}
                >
                  <option value="">Todas</option>
                  {data.teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={styles.filterGroup}>
              <label htmlFor="history-from" style={styles.filterLabel}>De (data)</label>
              <input
                id="history-from"
                type="date"
                value={filters.from_date}
                onChange={(e) => { setFilters((f) => ({ ...f, from_date: e.target.value })); setPage(1) }}
                style={styles.input}
              />
            </div>
            <div style={styles.filterGroup}>
              <label htmlFor="history-to" style={styles.filterLabel}>Até (data)</label>
              <input
                id="history-to"
                type="date"
                value={filters.to_date}
                onChange={(e) => { setFilters((f) => ({ ...f, to_date: e.target.value })); setPage(1) }}
                style={styles.input}
              />
            </div>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              Limpar filtros
            </button>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Destinatário</th>
                  <th style={styles.th}>Turma(s)</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Enviado em</th>
                  <th style={styles.th}>Lido em</th>
                  <th style={styles.th} aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...styles.td, ...styles.emptyState }}>
                      Nenhum destinatário encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  data.items.map((item, idx) => (
                    <tr key={idx} style={idx === data.items.length - 1 ? styles.trLast : undefined}>
                      <td style={styles.td}>{item.recipient_name || '—'}</td>
                      <td style={styles.td}>{(item.team_names || []).join(', ') || '—'}</td>
                      <td style={styles.td}>
                        <span style={item.status === 'read' ? styles.badgeRead : styles.badgeUnread}>
                          {item.status === 'read' ? 'Lido' : 'Não lido'}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDateTime(item.sent_at)}</td>
                      <td style={styles.td}>{item.status === 'read' ? formatDateTime(item.read_at) : '—'}</td>
                      <td style={styles.td}>
                        {item.student_id && (
                          <Link to={`/school/students/${item.student_id}`} style={styles.link} className="btn-hover">
                            Ver aluno
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data.items.length > 0 && (
            <div style={styles.pagination}>
              <div style={styles.paginationLeft}>
                <span style={{ fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
                  {data.total} resultado(s)
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: GRID, fontSize: 14 }}>
                  Itens por página:
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                    style={styles.paginationSelect}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={styles.paginationRight}>
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!canPrev}
                >
                  Anterior
                </button>
                <span style={{ fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                  Página {data.page} de {totalPages}
                </span>
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!canNext}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </SchoolLayout>
  )
}
