import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import { useDebounce } from '../../hooks/useDebounce'
import {
  getFranchisorMe,
  getFranchisorUsers,
  deleteFranchisorUser,
  getFranchisorRoleLabel,
  getFranchisorScopeSummary,
  formatFranchisorLastLogin,
} from '../../api/franchisorPortal'

const GRID = 8
const DEBOUNCE_MS = 400
const PAGE_SIZES = [10, 25, 50]

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)
const IconMore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="6" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="18" r="1.5" />
  </svg>
)
const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
)
const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

function RoleBadge({ role }) {
  const isOwner = role === 'FranchisorOwner'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        background: isOwner ? 'rgba(44, 110, 242, 0.15)' : 'rgba(58, 58, 60, 0.1)',
        color: isOwner ? 'var(--azul-arena)' : 'var(--grafite-tecnico)',
      }}
    >
      {getFranchisorRoleLabel(role)}
    </span>
  )
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const isAtivo = s === 'ativo'
  const isConvidado = s === 'convidado' || s === 'pendente'
  const style = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    background: isAtivo ? 'rgba(76, 203, 138, 0.2)' : isConvidado ? 'rgba(44, 110, 242, 0.15)' : 'rgba(58, 58, 60, 0.12)',
    color: isAtivo ? 'var(--verde-patrocinio)' : isConvidado ? 'var(--azul-arena)' : 'var(--grafite-tecnico)',
  }
  return <span style={style}>{status === 'convidado' ? 'Convidado/Pendente' : status || '—'}</span>
}

const styles = {
  section: { marginBottom: GRID * 4 },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 3,
    marginBottom: GRID * 4,
  },
  headerTitle: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  headerActions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: GRID * 2 },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(44, 110, 242, 0.3)',
  },
  btnSecondary: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  searchWrap: { position: 'relative', width: 280 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--grafite-tecnico)', opacity: 0.6 },
  searchInput: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 2}px ${GRID * 2}px 40px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    background: 'var(--branco-luz)',
  },
  select: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    minWidth: 160,
    outline: 'none',
    background: 'var(--branco-luz)',
  },
  tableWrap: {
    overflowX: 'auto',
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: `${GRID * 2}px ${GRID * 3}px`, fontWeight: 600, color: 'var(--grafite-tecnico)', borderBottom: '2px solid var(--cinza-arquibancada)' },
  td: { padding: `${GRID * 2}px ${GRID * 3}px`, borderBottom: '1px solid #eee', color: 'var(--grafite-tecnico)' },
  tdEmpty: { padding: GRID * 6, textAlign: 'center', verticalAlign: 'middle' },
  actionsCell: { position: 'relative', width: 56 },
  btnMenu: {
    background: 'none',
    border: 'none',
    padding: GRID,
    cursor: 'pointer',
    color: 'var(--grafite-tecnico)',
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: 4,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    border: '1px solid #E5E5E7',
    minWidth: 180,
    zIndex: 20,
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: 'none',
    background: 'none',
    textAlign: 'left',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
  },
  dropdownItemDanger: { color: '#dc3545' },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginTop: GRID * 3,
    paddingTop: GRID * 3,
    borderTop: '1px solid #eee',
  },
  pagination: { display: 'flex', alignItems: 'center', gap: GRID },
  btnPage: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 36,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
  },
  pageInfo: { fontSize: 14, color: 'var(--grafite-tecnico)', minWidth: 120, textAlign: 'center' },
  emptyWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: GRID * 2 },
  emptyTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
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
  toast: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'rgba(76, 203, 138, 0.15)',
    color: 'var(--verde-patrocinio)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
    fontWeight: 500,
  },
  skeleton: {
    height: 18,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  // Modals
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: GRID * 4,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    maxWidth: 480,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: GRID * 4,
  },
  modalTitle: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  modalText: { margin: '0 0 ' + GRID * 4 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  field: { marginBottom: GRID * 3 },
  label: { display: 'block', marginBottom: GRID, fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' },
  input: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputReadonly: { background: 'var(--cinza-arquibancada)', opacity: 0.9 },
  fieldError: { marginTop: GRID, fontSize: 12, color: '#dc3545' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: GRID * 2, marginTop: GRID * 4 },
  btnDanger: { background: '#dc3545', color: '#fff', border: 'none', padding: `${GRID * 2}px ${GRID * 3}px`, borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}

export default function UsuariosFranqueador() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const searchFromUrl = searchParams.get('search') || ''
  const roleFromUrl = searchParams.get('role') || 'todos'
  const scopeTypeFromUrl = searchParams.get('scope_type') || 'todos'
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
  const pageSizeFromUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size'), 10) || 10))

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)
  const [roleFilter, setRoleFilter] = useState(roleFromUrl)
  const [scopeTypeFilter, setScopeTypeFilter] = useState(scopeTypeFromUrl)
  const [page, setPage] = useState(pageFromUrl)
  const [pageSize, setPageSize] = useState(pageSizeFromUrl)

  const [me, setMe] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(null)
  const [toast, setToast] = useState(null)

  const [modalRemove, setModalRemove] = useState(null)
  const [removing, setRemoving] = useState(false)

  const isOwner = me?.user_role === 'FranchisorOwner'

  const fetchMe = useCallback(async () => {
    try {
      const res = await getFranchisorMe()
      setMe(res)
      if (!ALLOWED_ROLES.includes(res.user_role)) setPermissionDenied(true)
    } catch {
      setPermissionDenied(true)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getFranchisorUsers({
        search: debouncedSearch,
        role: roleFilter === 'todos' ? '' : roleFilter,
        scope_type: scopeTypeFilter === 'todos' ? '' : scopeTypeFilter,
        page,
        page_size: pageSize,
      })
      setData(res)
    } catch {
      setError('Não foi possível carregar os usuários. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, roleFilter, scopeTypeFilter, page, pageSize])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=franchisor', { replace: true })
  }, [permissionDenied, navigate])

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('search', debouncedSearch)
      next.set('role', roleFilter)
      next.set('scope_type', scopeTypeFilter)
      next.set('page', String(page))
      next.set('page_size', String(pageSize))
      return next
    })
  }, [debouncedSearch, roleFilter, scopeTypeFilter, page, pageSize])

  useEffect(() => {
    const incomingToast = location.state?.toast
    if (incomingToast) {
      setToast(incomingToast)
      fetchUsers()
      navigate(location.pathname + (location.search || ''), { replace: true, state: {} })
    }
  }, [location.state?.toast, location.pathname, location.search, navigate, fetchUsers])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuOpen && !e.target.closest('[data-menu-wrap]')) setMenuOpen(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  const clearFilters = () => {
    setSearchInput('')
    setRoleFilter('todos')
    setScopeTypeFilter('todos')
    setPage(1)
  }

  const handleRemoveAccess = useCallback(async () => {
    if (!modalRemove) return
    const ownersCount = (data?.items || []).filter((u) => u.role === 'FranchisorOwner').length
    if (modalRemove.role === 'FranchisorOwner' && ownersCount <= 1) {
      setToast('Você não pode remover o último proprietário do franqueador.')
      return
    }
    setRemoving(true)
    try {
      await deleteFranchisorUser(modalRemove.user_id)
      setModalRemove(null)
      setToast('Acesso removido com sucesso.')
      fetchUsers()
    } catch {
      setError('Não foi possível remover o acesso. Tente novamente.')
    } finally {
      setRemoving(false)
    }
  }, [modalRemove, data?.items, fetchUsers])

  if (permissionDenied) return null

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Usuários' },
  ]

  const items = data?.items || []
  const totalPages = data?.total_pages ?? 1
  const total = data?.total ?? 0

  return (
    <FranchisorLayout pageTitle="Usuários" breadcrumb={breadcrumb}>
      <section style={styles.section} aria-label="Lista de usuários">
        {/* Cabeçalho */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Usuários</h1>
          <div style={styles.headerActions}>
            <Link
              to="/franchisor/permissions"
              style={styles.btnSecondary}
              className="btn-hover"
            >
              Ver matriz de permissões
            </Link>
            {isOwner && (
              <button
                type="button"
                style={styles.btnPrimary}
                className="btn-hover"
                onClick={() =>
                  navigate('/franchisor/users/new', {
                    state: { fromListQuery: searchParams.toString() },
                  })
                }
                disabled={loading}
              >
                Novo usuário
              </button>
            )}
          </div>
        </div>

        {toast && <div style={styles.toast} role="status">{toast}</div>}

        {/* Filtros */}
        <div style={styles.filtersRow}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon} aria-hidden="true"><IconSearch /></span>
            <input
              type="search"
              placeholder="Buscar por nome ou email"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
              style={styles.searchInput}
              aria-label="Buscar por nome ou email"
              disabled={loading}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            style={styles.select}
            aria-label="Filtrar por role"
            disabled={loading}
          >
            <option value="todos">Todos (Role)</option>
            <option value="FranchisorOwner">FranchisorOwner</option>
            <option value="FranchisorStaff">FranchisorStaff</option>
          </select>
          <select
            value={scopeTypeFilter}
            onChange={(e) => { setScopeTypeFilter(e.target.value); setPage(1) }}
            style={styles.select}
            aria-label="Acesso às escolas"
            disabled={loading}
          >
            <option value="todos">Todos</option>
            <option value="all">Todas as escolas</option>
            <option value="school_list">Escolas selecionadas</option>
          </select>
          <button type="button" style={styles.btnSecondary} className="btn-hover" onClick={clearFilters} disabled={loading}>
            Limpar filtros
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div style={styles.errorBox} role="alert">
            <span style={styles.errorIcon}><IconAlert /></span>
            <div style={styles.errorContent}>
              <div style={styles.errorTitle}>Erro</div>
              <div style={styles.errorText}>{error}</div>
              <button type="button" style={styles.btnReload} onClick={fetchUsers}>
                Recarregar
              </button>
            </div>
          </div>
        )}

        {/* Tabela */}
        {!error && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nome</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Escopo</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Último acesso</th>
                  {isOwner && <th style={styles.th}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td style={styles.td}><span style={{ ...styles.skeleton, width: '70%' }} /></td>
                      <td style={styles.td}><span style={{ ...styles.skeleton, width: '60%' }} /></td>
                      <td style={styles.td}><span style={{ ...styles.skeleton, width: 100 }} /></td>
                      <td style={styles.td}><span style={{ ...styles.skeleton, width: 100 }} /></td>
                      <td style={styles.td}><span style={{ ...styles.skeleton, width: 80 }} /></td>
                      <td style={styles.td}><span style={{ ...styles.skeleton, width: 90 }} /></td>
                      {isOwner && <td style={styles.td}><span style={{ ...styles.skeleton, width: 40 }} /></td>}
                    </tr>
                  ))
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={isOwner ? 7 : 6} style={styles.tdEmpty}>
                      <div style={styles.emptyWrap}>
                        <p style={styles.emptyTitle}>Nenhum usuário encontrado.</p>
                        {isOwner && (
                          <button
                            type="button"
                            style={styles.btnPrimary}
                            className="btn-hover"
                            onClick={() => navigate('/franchisor/users/new', { state: { fromListQuery: searchParams.toString() } })}
                          >
                            Novo usuário
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && items.length > 0 && items.map((user) => (
                  <tr key={user.user_id}>
                    <td style={styles.td}>{user.name || '—'}</td>
                    <td style={styles.td}>{user.email || '—'}</td>
                    <td style={styles.td}><RoleBadge role={user.role} /></td>
                    <td style={styles.td}>{getFranchisorScopeSummary(user)}</td>
                    <td style={styles.td}><StatusBadge status={user.status} /></td>
                    <td style={styles.td}>{formatFranchisorLastLogin(user.last_login_at)}</td>
                    {isOwner && (
                      <td style={styles.td}>
                        <div style={styles.actionsCell} data-menu-wrap>
                          <button
                            type="button"
                            style={styles.btnMenu}
                            onClick={() => setMenuOpen(menuOpen === user.user_id ? null : user.user_id)}
                            aria-haspopup="true"
                            aria-expanded={menuOpen === user.user_id}
                            aria-label="Ações"
                          >
                            <IconMore />
                          </button>
                          {menuOpen === user.user_id && (
                            <div style={styles.dropdown}>
                              <button
                                type="button"
                                style={styles.dropdownItem}
                                className="btn-hover"
                                onClick={() => {
                                  setMenuOpen(null)
                                  navigate(`/franchisor/users/${user.user_id}/edit`, {
                                    state: { fromListQuery: searchParams.toString() },
                                  })
                                }}
                              >
                                Editar permissões
                              </button>
                              <button
                                type="button"
                                style={{ ...styles.dropdownItem, ...styles.dropdownItemDanger }}
                                className="btn-hover"
                                onClick={() => { setMenuOpen(null); setModalRemove(user) }}
                              >
                                Remover acesso
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!error && !loading && items.length > 0 && totalPages > 0 && (
          <div style={styles.footer}>
            <div style={styles.pagination}>
              <button
                type="button"
                style={styles.btnPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                <IconChevronLeft />
              </button>
              <span style={styles.pageInfo}>Página {page} de {totalPages}</span>
              <button
                type="button"
                style={styles.btnPage}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Próxima página"
              >
                <IconChevronRight />
              </button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: GRID, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
              Itens por página
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                style={{ ...styles.select, minWidth: 70 }}
                disabled={loading}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>

      {/* Modal Remover acesso */}
      {modalRemove && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-remove-title">
          <div style={styles.modal}>
            <h2 id="modal-remove-title" style={styles.modalTitle}>
              Remover acesso deste usuário ao franqueador?
            </h2>
            <p style={styles.modalText}>
              Ele perderá acesso ao Portal Franqueador e às escolas permitidas.
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.btnSecondary}
                className="btn-hover"
                onClick={() => setModalRemove(null)}
                disabled={removing}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={styles.btnDanger}
                className="btn-hover"
                onClick={handleRemoveAccess}
                disabled={removing}
              >
                {removing ? 'Removendo…' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FranchisorLayout>
  )
}
