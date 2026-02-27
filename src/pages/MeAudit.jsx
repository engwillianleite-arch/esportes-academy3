import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMeAudit } from '../api/meAudit'

const GRID = 8

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const IconLogOut = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
)
const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
)

function portalLabel(portal) {
  const p = (portal || '').toUpperCase()
  if (p === 'ADMIN') return 'Admin'
  if (p === 'FRANCHISOR') return 'Franqueador'
  if (p === 'SCHOOL') return 'Escola'
  return portal || 'Portal'
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'cadastros', label: 'Cadastros (alunos/turmas)' },
  { value: 'presenca', label: 'Presença' },
  { value: 'avaliacoes', label: 'Avaliações' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'comunicacao', label: 'Comunicação' },
  { value: 'configuracoes', label: 'Configurações' },
]

const styles = {
  wrap: {
    minHeight: '100vh',
    background: 'var(--cinza-arquibancada)',
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    background: 'var(--branco-luz)',
    boxShadow: 'var(--shadow)',
    padding: `${GRID * 2}px ${GRID * 4}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: GRID * 2,
  },
  topbarLeft: { fontSize: 14, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: GRID * 2 },
  topbarLink: {
    display: 'flex', alignItems: 'center', gap: GRID,
    padding: `${GRID}px ${GRID * 2}px`, fontSize: 14, fontWeight: 500,
    color: 'var(--grafite-tecnico)', textDecoration: 'none', borderRadius: 'var(--radius)',
  },
  topbarLinkActive: { color: 'var(--azul-arena)', fontWeight: 600 },
  topbarBtn: {
    display: 'flex', alignItems: 'center', gap: GRID,
    padding: `${GRID}px ${GRID * 2}px`, fontSize: 14, fontWeight: 500,
    color: 'var(--grafite-tecnico)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius)',
  },
  container: {
    flex: 1, maxWidth: 720, margin: '0 auto', padding: GRID * 4, width: '100%',
  },
  btnBack: {
    marginBottom: GRID * 3, padding: `${GRID}px ${GRID * 2}px`, fontSize: 14, fontWeight: 500,
    color: 'var(--grafite-tecnico)', background: 'none', border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: GRID,
  },
  header: { marginBottom: GRID * 4 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  filters: {
    background: 'var(--branco-luz)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)', padding: GRID * 3, marginBottom: GRID * 4,
  },
  filtersRow: { display: 'flex', flexWrap: 'wrap', gap: GRID * 2, alignItems: 'flex-end', marginBottom: GRID * 2 },
  filtersRowLast: { marginBottom: 0 },
  field: { minWidth: 0 },
  label: { display: 'block', marginBottom: GRID / 2, fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  input: {
    width: '100%', minWidth: 140, padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7', borderRadius: 'var(--radius)', fontSize: 14, color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)', outline: 'none',
  },
  select: {
    minWidth: 180, padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7', borderRadius: 'var(--radius)', fontSize: 14, color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)', outline: 'none', cursor: 'pointer',
  },
  filterActions: { display: 'flex', flexWrap: 'wrap', gap: GRID * 2, marginTop: GRID * 2 },
  btnPrimary: {
    padding: `${GRID * 2}px ${GRID * 3}px`, background: 'var(--azul-arena)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnSecondary: {
    padding: `${GRID * 2}px ${GRID * 3}px`, background: 'transparent', color: 'var(--grafite-tecnico)',
    border: '1px solid #E5E5E7', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: GRID * 2 },
  card: {
    background: 'var(--branco-luz)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)', padding: GRID * 3,
  },
  cardRow: { marginBottom: GRID / 2 },
  cardRowLast: { marginBottom: 0 },
  cardMeta: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.65 },
  cardAction: { marginTop: GRID * 2 },
  cardLink: {
    display: 'inline-flex', alignItems: 'center', gap: GRID, fontSize: 14, fontWeight: 500,
    color: 'var(--azul-arena)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  },
  loadMore: {
    marginTop: GRID * 3, width: '100%', padding: GRID * 2, fontSize: 14, fontWeight: 500,
    color: 'var(--grafite-tecnico)', background: 'var(--branco-luz)', border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)', cursor: 'pointer',
  },
  empty: {
    textAlign: 'center', padding: GRID * 6, background: 'var(--branco-luz)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
  },
  emptyTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  emptyText: { margin: `${GRID}px 0 0`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 },
  error: {
    textAlign: 'center', padding: GRID * 6, background: 'var(--branco-luz)', borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)', border: '1px solid rgba(220,38,38,0.2)',
  },
  errorTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: '#DC2626' },
  errorText: { margin: `${GRID}px 0 ${GRID * 3}px`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  skeleton: {
    height: 80,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%', borderRadius: 'var(--radius)',
  },
}

function SkeletonList() {
  return (
    <div style={styles.list}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={styles.skeleton} />
      ))}
    </div>
  )
}

function toYYYYMMDD(d) {
  if (!d) return ''
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function defaultFromDate() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return toYYYYMMDD(d)
}

function defaultToDate() {
  return toYYYYMMDD(new Date())
}

export default function MeAudit() {
  const navigate = useNavigate()
  const { defaultRedirect, isAuthenticated, logout } = useAuth()
  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const [fromDate, setFromDate] = useState(defaultFromDate())
  const [toDate, setToDate] = useState(defaultToDate())
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ from_date: defaultFromDate(), to_date: defaultToDate() })

  const portal = defaultRedirect?.portal || ''
  const portalName = portalLabel(portal)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
  }, [isAuthenticated, navigate])

  const fetchList = useCallback(
    async (cursor = null, append = false) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)
      try {
        const res = await getMeAudit({
          from_date: appliedFilters.from_date || undefined,
          to_date: appliedFilters.to_date || undefined,
          category: appliedFilters.category || undefined,
          q: appliedFilters.q?.trim() || undefined,
          page_size: 20,
          ...(cursor ? { cursor } : {}),
        })
        if (append) {
          setItems((prev) => [...prev, ...(res.items || [])])
        } else {
          setItems(res.items || [])
        }
        setNextCursor(res.next_cursor || null)
      } catch (e) {
        if (e.code === 'FORBIDDEN' || e.status === 403) {
          setError('Acesso Negado.')
        } else {
          setError(e.message || 'Não foi possível carregar suas ações. Tente novamente.')
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [appliedFilters]
  )

  useEffect(() => {
    if (!isAuthenticated) return
    fetchList()
  }, [isAuthenticated, fetchList])

  const handleApplyFilters = () => {
    setAppliedFilters({
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      category: category || undefined,
      q: q?.trim() || undefined,
    })
  }

  const handleClearFilters = () => {
    const from = defaultFromDate()
    const to = defaultToDate()
    setFromDate(from)
    setToDate(to)
    setCategory('')
    setQ('')
    setAppliedFilters({ from_date: from, to_date: to })
  }

  const setQuickRange = (days) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    setFromDate(toYYYYMMDD(from))
    setToDate(toYYYYMMDD(to))
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleView = (targetUrl) => {
    if (targetUrl) navigate(targetUrl)
  }

  const isEmpty = !loading && !loadingMore && items.length === 0

  if (!isAuthenticated) return null

  return (
    <div style={styles.wrap}>
      <header style={styles.topbar} role="banner">
        <span style={styles.topbarLeft}>Portal {portalName}</span>
        <div style={styles.topbarRight}>
          <Link to="/me" style={styles.topbarLink} aria-label="Meu perfil">
            <IconUser />
            Meu perfil
          </Link>
          <span style={{ ...styles.topbarLink, ...styles.topbarLinkActive }} aria-current="page">
            <IconHistory />
            Minhas ações
          </span>
          <button type="button" style={styles.topbarBtn} aria-label="Sair" onClick={handleLogout}>
            <IconLogOut />
            Sair
          </button>
        </div>
      </header>

      <div style={styles.container}>
        <Link to="/me" style={styles.btnBack}>
          ← Meu perfil
        </Link>

        <div style={styles.header}>
          <h1 style={styles.title}>Minhas ações</h1>
          <p style={styles.subtitle}>Histórico de atividades na plataforma</p>
        </div>

        <section style={styles.filters} aria-label="Filtros">
          <div style={styles.filtersRow}>
            <div style={styles.field}>
              <label htmlFor="audit-from" style={styles.label}>De</label>
              <input
                id="audit-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label htmlFor="audit-to" style={styles.label}>Até</label>
              <input
                id="audit-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={{ ...styles.field, display: 'flex', gap: GRID, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" style={styles.btnSecondary} onClick={() => setQuickRange(7)}>
                Últimos 7 dias
              </button>
              <button type="button" style={styles.btnSecondary} onClick={() => setQuickRange(30)}>
                Últimos 30 dias
              </button>
            </div>
          </div>
          <div style={styles.filtersRow}>
            <div style={styles.field}>
              <label htmlFor="audit-category" style={styles.label}>Tipo de ação</label>
              <select
                id="audit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={styles.select}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ ...styles.field, flex: 1, minWidth: 200 }}>
              <label htmlFor="audit-q" style={styles.label}>Buscar por termo</label>
              <input
                id="audit-q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ex.: mensalidade, aluno"
                style={styles.input}
              />
            </div>
          </div>
          <div style={{ ...styles.filterActions, ...styles.filtersRowLast }}>
            <button type="button" style={styles.btnPrimary} onClick={handleApplyFilters}>
              Aplicar
            </button>
            <button type="button" style={styles.btnSecondary} onClick={handleClearFilters}>
              Limpar
            </button>
          </div>
        </section>

        {loading && !loadingMore && <SkeletonList />}

        {error && (
          <div style={styles.error}>
            <h2 style={styles.errorTitle}>{error === 'Acesso Negado.' ? 'Acesso Negado' : 'Erro'}</h2>
            <p style={styles.errorText}>{error}</p>
            {error !== 'Acesso Negado.' && (
              <button type="button" style={styles.btnPrimary} onClick={() => fetchList()}>
                Recarregar
              </button>
            )}
            {error === 'Acesso Negado.' && (
              <Link to="/me" style={styles.btnPrimary}>Ir para Meu perfil</Link>
            )}
          </div>
        )}

        {!loading && !error && isEmpty && (
          <div style={styles.empty}>
            <h2 style={styles.emptyTitle}>Nenhuma ação encontrada</h2>
            <p style={styles.emptyText}>Nenhuma ação encontrada para o período selecionado.</p>
          </div>
        )}

        {!loading && !error && !isEmpty && (
          <div style={styles.list} role="list">
            {items.map((item) => (
              <article key={item.id} style={styles.card} role="listitem">
                <div style={styles.cardRow}>
                  <span style={styles.cardMeta}>{formatDateTime(item.created_at)}</span>
                </div>
                <div style={styles.cardRow}>
                  <strong>{item.action_label || item.action_key || '—'}</strong>
                </div>
                {item.entity_label && (
                  <div style={styles.cardRow}>
                    Entidade: {item.entity_label}
                  </div>
                )}
                {item.context?.school_name && (
                  <div style={styles.cardRow}>
                    Escola: {item.context.school_name}
                  </div>
                )}
                {item.target_url && (
                  <div style={styles.cardAction}>
                    <button
                      type="button"
                      style={styles.cardLink}
                      onClick={() => handleView(item.target_url)}
                    >
                      Ver
                      <IconChevronRight />
                    </button>
                  </div>
                )}
              </article>
            ))}
            {nextCursor && (
              <button
                type="button"
                style={styles.loadMore}
                disabled={loadingMore}
                onClick={() => fetchList(nextCursor, true)}
              >
                {loadingMore ? 'Carregando…' : 'Carregar mais'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
