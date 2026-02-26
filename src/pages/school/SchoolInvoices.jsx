import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { getSchoolInvoices, formatCurrency } from '../../api/schoolPortal'

const GRID = 8

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const SORT_DEFAULT = 'due_date_asc'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'open', label: 'Em aberto' },
  { value: 'paid', label: 'Pago' },
  { value: 'overdue', label: 'Em atraso' },
  { value: 'canceled', label: 'Cancelado' },
]

const IconPrev = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
)
const IconNext = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
)
const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
)

const styles = {
  header: { marginBottom: GRID * 4 },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  filtersSection: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  monthSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
  },
  monthBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    border: '1px solid #ddd',
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    color: 'var(--grafite-tecnico)',
  },
  monthLabel: { fontSize: 15, fontWeight: 600, color: 'var(--grafite-tecnico)', minWidth: 130 },
  searchWrap: {
    flex: '1 1 260px',
    position: 'relative',
    minWidth: 200,
  },
  searchInput: {
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px ${GRID * 1.5}px ${GRID * 5}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    outline: 'none',
  },
  searchIcon: {
    position: 'absolute',
    left: GRID * 1.5,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--grafite-tecnico)',
    opacity: 0.5,
    pointerEvents: 'none',
  },
  select: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    minWidth: 160,
  },
  btn: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  btnSecondary: {
    background: 'var(--cinza-arquibancada)',
    color: 'var(--grafite-tecnico)',
  },
  tableWrap: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
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
  trClick: { cursor: 'pointer' },
  link: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  linkStudent: { color: 'var(--grafite-tecnico)', textDecoration: 'none' },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
  },
  actionsCell: { display: 'flex', flexWrap: 'wrap', gap: GRID, alignItems: 'center' },
  pagination: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginTop: GRID * 3,
    padding: `${GRID * 2}px 0`,
  },
  paginationInfo: { fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  paginationControls: { display: 'flex', alignItems: 'center', gap: GRID },
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
  emptyText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.9 },
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
  totalsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 4,
    marginBottom: GRID * 2,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  totalItem: { fontWeight: 500 },
}

function getMonthYearFromParam(monthStr) {
  const [y, m] = (monthStr || '').split('-').map(Number)
  const now = new Date()
  return { year: y || now.getFullYear(), month: m || now.getMonth() + 1 }
}

function toMonthParam(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function formatMonthLabel(year, month) {
  return `${MONTHS_PT[month - 1] || ''}/${year}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatCompetence(competenceMonth) {
  if (!competenceMonth) return '—'
  const [y, m] = competenceMonth.split('-')
  return `${MONTHS_PT[Number(m) - 1] || m}/${y}`
}

function statusLabel(s) {
  const map = { open: 'Em aberto', paid: 'Pago', overdue: 'Em atraso', canceled: 'Cancelado' }
  return map[s] || s
}

function statusBadgeStyle(s) {
  const base = styles.statusBadge
  if (s === 'paid') return { ...base, background: '#D1FAE5', color: '#065F46' }
  if (s === 'overdue') return { ...base, background: '#FEE2E2', color: '#991B1B' }
  if (s === 'canceled') return { ...base, background: '#F3F4F6', color: '#6B7280' }
  return { ...base, background: '#FEF3C7', color: '#92400E' }
}

// MVP: exibir "Registrar pagamento" quando status !== paid; backend pode retornar can_register_payment.
const CAN_REGISTER_PAYMENT = true

function TableSkeleton({ rows = 5 }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Aluno</th>
            <th style={styles.th}>Competência</th>
            <th style={styles.th}>Vencimento</th>
            <th style={styles.th}>Valor</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Pago em</th>
            <th style={styles.th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '60%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 80 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 90 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 70 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 72 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 80 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 100 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SchoolInvoices() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const now = new Date()
  const defaultMonth = toMonthParam(now.getFullYear(), now.getMonth() + 1)

  const monthParam = searchParams.get('month') || defaultMonth
  const statusParam = searchParams.get('status') || ''
  const qParam = searchParams.get('q') || ''

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [q, setQ] = useState(qParam)
  const [status, setStatus] = useState(statusParam)
  const [month, setMonth] = useState(monthParam)

  const hasFilters = q || status || month !== defaultMonth

  const syncParamsToUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    if (month !== defaultMonth) next.set('month', month)
    else next.delete('month')
    if (status) next.set('status', status)
    else next.delete('status')
    if (q) next.set('q', q)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }, [month, status, q, defaultMonth, searchParams, setSearchParams])

  useEffect(() => {
    syncParamsToUrl()
  }, [])

  const fetchInvoices = useCallback(() => {
    setError(null)
    setLoading(true)
    const params = {
      month,
      page,
      page_size: pageSize,
      sort: SORT_DEFAULT,
      ...(status && { status }),
      ...(q && { q }),
    }
    getSchoolInvoices(params)
      .then(setData)
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setPermissionDenied(true)
        } else {
          setError(err?.message || 'Não foi possível carregar as mensalidades. Tente novamente.')
        }
      })
      .finally(() => setLoading(false))
  }, [month, status, q, page, pageSize])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const { year, month: monthNum } = getMonthYearFromParam(month)
  const prevMonth = monthNum === 1 ? { year: year - 1, month: 12 } : { year, month: monthNum - 1 }
  const nextMonth = monthNum === 12 ? { year: year + 1, month: 1 } : { year, month: monthNum + 1 }
  const prevParam = toMonthParam(prevMonth.year, prevMonth.month)
  const nextParam = toMonthParam(nextMonth.year, nextMonth.month)

  const handleMonthPrev = () => {
    setMonth(prevParam)
    setPage(1)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('month', prevParam)
      return next
    }, { replace: true })
  }
  const handleMonthNext = () => {
    setMonth(nextParam)
    setPage(1)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('month', nextParam)
      return next
    }, { replace: true })
  }

  const handleApplyFilters = (e) => {
    e?.preventDefault?.()
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (month !== defaultMonth) next.set('month', month)
      else next.delete('month')
      if (status) next.set('status', status)
      else next.delete('status')
      if (q) next.set('q', q)
      else next.delete('q')
      next.delete('page')
      return next
    }, { replace: true })
    setPage(1)
  }

  const handleClearFilters = () => {
    setQ('')
    setStatus('')
    setMonth(defaultMonth)
    setPage(1)
    setSearchParams({}, { replace: true })
  }

  const schoolName = data?.school_name ?? ''
  const items = data?.items ?? []
  const aggregates = data?.aggregates
  const totalItems = data?.total ?? 0
  const totalPages = data?.page_size ? Math.ceil(totalItems / data.page_size) : 0
  const canPrev = data?.page > 1
  const canNext = data?.page < totalPages

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Mensalidades</h1>
        <p style={styles.subtitle}>Cobranças e status de pagamento</p>
      </header>

      {/* Filtros */}
      <form onSubmit={handleApplyFilters} style={styles.filtersSection} aria-label="Filtros">
        <div style={styles.monthSelector} aria-label="Competência">
          <button type="button" style={styles.monthBtn} onClick={handleMonthPrev} aria-label="Mês anterior">
            <IconPrev />
          </button>
          <span style={styles.monthLabel}>{formatMonthLabel(year, monthNum)}</span>
          <button type="button" style={styles.monthBtn} onClick={handleMonthNext} aria-label="Próximo mês">
            <IconNext />
          </button>
        </div>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon} aria-hidden><IconSearch /></span>
          <input
            type="search"
            style={styles.searchInput}
            placeholder="Buscar por aluno, documento, código"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={handleApplyFilters}
            aria-label="Buscar"
          />
        </div>
        <select
          style={styles.select}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          aria-label="Status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button type="submit" style={{ ...styles.btn, background: 'var(--azul-arena)', color: '#fff' }}>
          Filtrar
        </button>
        {hasFilters && (
          <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handleClearFilters}>
            Limpar filtros
          </button>
        )}
      </form>

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <div style={styles.errorContent}>
            <div style={styles.errorTitle}>Erro ao carregar</div>
            <div style={styles.errorText}>{error}</div>
            <button type="button" style={styles.btnReload} onClick={fetchInvoices}>
              Recarregar
            </button>
          </div>
        </div>
      )}

      {!error && aggregates && (aggregates.total_amount != null || aggregates.open_amount != null || aggregates.overdue_amount != null) && (
        <div style={styles.totalsRow}>
          {aggregates.total_amount != null && (
            <span style={styles.totalItem}>Total listado: {formatCurrency(aggregates.total_amount)}</span>
          )}
          {aggregates.open_amount != null && (
            <span>Em aberto: {formatCurrency(aggregates.open_amount)}</span>
          )}
          {aggregates.overdue_amount != null && (
            <span>Em atraso: {formatCurrency(aggregates.overdue_amount)}</span>
          )}
        </div>
      )}

      {!error && (
        <>
          {loading ? (
            <TableSkeleton rows={10} />
          ) : items.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>
                Nenhuma mensalidade encontrada para os filtros selecionados.
              </p>
              <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handleClearFilters}>
                Limpar filtros
              </button>
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Aluno</th>
                    <th style={styles.th}>Competência</th>
                    <th style={styles.th}>Vencimento</th>
                    <th style={styles.th}>Valor</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Pago em</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((inv) => (
                    <tr
                      key={inv.id}
                      style={styles.trClick}
                      className="btn-hover"
                      onClick={() => navigate(`/school/finance/invoices/${inv.id}`)}
                    >
                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        <Link to={`/school/students/${inv.student_id}`} style={styles.linkStudent}>
                          {inv.student_name}
                        </Link>
                      </td>
                      <td style={styles.td}>{formatCompetence(inv.competence_month)}</td>
                      <td style={styles.td}>{formatDate(inv.due_date)}</td>
                      <td style={styles.td}>{formatCurrency(inv.amount)}</td>
                      <td style={styles.td}>
                        <span style={statusBadgeStyle(inv.status)}>{statusLabel(inv.status)}</span>
                      </td>
                      <td style={styles.td}>
                        {inv.status === 'paid' && inv.paid_at ? formatDate(inv.paid_at) : '—'}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
                          <Link to={`/school/finance/invoices/${inv.id}`} style={styles.link}>
                            Ver
                          </Link>
                          {inv.status !== 'paid' && inv.status !== 'canceled' && CAN_REGISTER_PAYMENT && (
                            <Link
                              to={`/school/finance/payments/new?invoiceId=${encodeURIComponent(inv.id)}`}
                              style={styles.link}
                            >
                              Registrar pagamento
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div style={styles.pagination}>
              <div style={styles.paginationInfo}>
                Mostrando {(data.page - 1) * data.page_size + 1}–{Math.min(data.page * data.page_size, data.total)} de {data.total}
                {' · '}
                Itens por página:
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    style={{
                      marginLeft: GRID,
                      padding: '2px 8px',
                      fontSize: 13,
                      border: data.page_size === size ? '1px solid var(--azul-arena)' : '1px solid #ddd',
                      background: data.page_size === size ? 'rgba(44, 110, 242, 0.08)' : 'transparent',
                      borderRadius: 4,
                      cursor: 'pointer',
                      color: 'var(--grafite-tecnico)',
                    }}
                    onClick={() => { setPageSize(size); setPage(1); }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div style={styles.paginationControls}>
                <button
                  type="button"
                  style={{ ...styles.monthBtn, opacity: canPrev ? 1 : 0.5, cursor: canPrev ? 'pointer' : 'not-allowed' }}
                  onClick={() => canPrev && setPage((p) => p - 1)}
                  disabled={!canPrev}
                  aria-label="Página anterior"
                >
                  <IconPrev />
                </button>
                <span style={styles.paginationInfo}>
                  Página {data.page} {totalPages > 0 ? `de ${totalPages}` : ''}
                </span>
                <button
                  type="button"
                  style={{ ...styles.monthBtn, opacity: canNext ? 1 : 0.5, cursor: canNext ? 'pointer' : 'not-allowed' }}
                  onClick={() => canNext && setPage((p) => p + 1)}
                  disabled={!canNext}
                  aria-label="Próxima página"
                >
                  <IconNext />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </SchoolLayout>
  )
}
