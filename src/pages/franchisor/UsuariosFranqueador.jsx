import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import { useDebounce } from '../../hooks/useDebounce'
import {
  getFranchisorMe,
  getFranchisorSchools,
  getFranchisorUsers,
  createFranchisorUser,
  updateFranchisorUser,
  deleteFranchisorUser,
  getFranchisorRoleLabel,
  getFranchisorScopeSummary,
  formatFranchisorLastLogin,
} from '../../api/franchisorPortal'

const GRID = 8
const DEBOUNCE_MS = 400
const PAGE_SIZES = [10, 25, 50]
const ROLES = [
  { value: 'FranchisorOwner', label: 'FranchisorOwner' },
  { value: 'FranchisorStaff', label: 'FranchisorStaff' },
]
const SCOPE_ALL = 'ALL'
const SCOPE_LIST = 'SCHOOL_LIST'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

// Multi-select de escolas com busca (mesma fonte: getFranchisorSchools)
function SchoolsMultiSelect({ schools, selectedIds, onChange, disabled, error }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  const searchLower = (search || '').toLowerCase().trim()
  const filtered = searchLower
    ? schools.filter(
        (s) =>
          (s.school_name && s.school_name.toLowerCase().includes(searchLower)) ||
          (s.city && s.city.toLowerCase().includes(searchLower)) ||
          (s.state && s.state.toLowerCase().includes(searchLower))
      )
    : schools

  const setIds = (ids) => onChange(Array.isArray(ids) ? [...ids] : [])
  const toggle = (schoolId) => {
    const set = new Set(selectedIds || [])
    if (set.has(schoolId)) set.delete(schoolId)
    else set.add(schoolId)
    setIds(Array.from(set))
  }
  const selectedCount = (selectedIds || []).length

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={{
          width: '100%',
          maxWidth: 400,
          padding: `${GRID * 2}px ${GRID * 3}px`,
          border: `1px solid ${error ? 'rgba(220, 53, 69, 0.6)' : '#E5E5E7'}`,
          borderRadius: 'var(--radius)',
          fontSize: 14,
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: 'var(--branco-luz)',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedCount === 0 ? 'Escolher as escolas' : `${selectedCount} escola(s) selecionada(s)`}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'var(--branco-luz)',
            border: '1px solid #E5E5E7',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-hover)',
            minWidth: 320,
            maxHeight: 280,
            zIndex: 50,
          }}
          role="listbox"
        >
          <div style={{ padding: GRID * 2, borderBottom: '1px solid #eee' }}>
            <input
              type="search"
              placeholder="Buscar escola..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: `${GRID}px ${GRID * 2}px`,
                border: '1px solid #E5E5E7',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: GRID }}>
            {filtered.map((s) => {
              const checked = (selectedIds || []).includes(s.school_id)
              return (
                <label
                  key={s.school_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: GRID,
                    padding: `${GRID * 1.5}px ${GRID * 2}px`,
                    cursor: 'pointer',
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(s.school_id)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ flex: 1, fontSize: 14 }}>
                    {s.school_name}
                    {(s.city || s.state) && (
                      <span style={{ fontSize: 12, opacity: 0.8, display: 'block', marginTop: 2 }}>
                        {[s.city, s.state].filter(Boolean).join(' / ')}
                      </span>
                    )}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function validateNewUser(values) {
  const err = {}
  if (!(values.name || '').trim()) err.name = 'Obrigatório'
  if (!(values.email || '').trim()) err.email = 'Obrigatório'
  else if (!EMAIL_REGEX.test(values.email.trim())) err.email = 'Email inválido'
  if (!values.role) err.role = 'Obrigatório'
  if (values.scope_type === SCOPE_LIST && (!values.scope_school_ids || values.scope_school_ids.length === 0)) {
    err.scope_school_ids = 'Selecione ao menos uma escola'
  }
  return err
}

function validateEdit(values) {
  const err = {}
  if (values.scope_type === SCOPE_LIST && (!values.scope_school_ids || values.scope_school_ids.length === 0)) {
    err.scope_school_ids = 'Selecione ao menos uma escola'
  }
  return err
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
  const [schools, setSchools] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(null)
  const [toast, setToast] = useState(null)

  const [modalNew, setModalNew] = useState(false)
  const [modalEdit, setModalEdit] = useState(null)
  const [modalRemove, setModalRemove] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [savingNew, setSavingNew] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

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

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getFranchisorSchools()
      setSchools(res.items || [])
    } catch {
      setSchools([])
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
    fetchSchools()
  }, [fetchMe, fetchSchools])

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
            {isOwner && (
              <button
                type="button"
                style={styles.btnPrimary}
                className="btn-hover"
                onClick={() => setModalNew(true)}
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
                          <button type="button" style={styles.btnPrimary} className="btn-hover" onClick={() => setModalNew(true)}>
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
                                onClick={() => { setMenuOpen(null); setModalEdit(user) }}
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

      {/* Modal Novo usuário */}
      {modalNew && (
        <ModalNovoUsuario
          schools={schools}
          onClose={() => setModalNew(false)}
          onSuccess={() => {
            setModalNew(false)
            setToast('Usuário salvo com sucesso!')
            fetchUsers()
          }}
          saving={savingNew}
          setSaving={setSavingNew}
          validate={validateNewUser}
        />
      )}

      {/* Modal Editar permissões */}
      {modalEdit && (
        <ModalEditarPermissoes
          user={modalEdit}
          schools={schools}
          onClose={() => setModalEdit(null)}
          onSuccess={() => {
            setModalEdit(null)
            setToast('Usuário salvo com sucesso!')
            fetchUsers()
          }}
          saving={savingEdit}
          setSaving={setSavingEdit}
          validate={validateEdit}
        />
      )}

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

function ModalNovoUsuario({ schools, onClose, onSuccess, saving, setSaving, validate }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'FranchisorStaff',
    scope_type: SCOPE_ALL,
    scope_school_ids: [],
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate(form)
    setErrors(err)
    if (Object.keys(err).length > 0) return
    setSaving(true)
    try {
      await createFranchisorUser({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        scope_type: form.scope_type,
        scope_school_ids: form.scope_type === SCOPE_LIST ? form.scope_school_ids : undefined,
      })
      onSuccess()
    } catch {
      setErrors({ submit: 'Não foi possível criar o usuário. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-new-title">
      <div style={styles.modal}>
        <h2 id="modal-new-title" style={styles.modalTitle}>Novo usuário</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label htmlFor="new-name" style={styles.label}>Nome *</label>
            <input
              id="new-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={{ ...styles.input, ...(errors.name ? { borderColor: '#dc3545' } : {}) }}
              placeholder="Nome completo"
              disabled={saving}
            />
            {errors.name && <div style={styles.fieldError}>{errors.name}</div>}
          </div>
          <div style={styles.field}>
            <label htmlFor="new-email" style={styles.label}>Email *</label>
            <input
              id="new-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={{ ...styles.input, ...(errors.email ? { borderColor: '#dc3545' } : {}) }}
              placeholder="email@exemplo.com"
              disabled={saving}
            />
            {errors.email && <div style={styles.fieldError}>{errors.email}</div>}
          </div>
          <div style={styles.field}>
            <label htmlFor="new-role" style={styles.label}>Role *</label>
            <select
              id="new-role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              style={styles.input}
              disabled={saving}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Escopo *</span>
            <div style={{ marginTop: GRID }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: GRID, marginBottom: GRID, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope_type_new"
                  checked={form.scope_type === SCOPE_ALL}
                  onChange={() => setForm((f) => ({ ...f, scope_type: SCOPE_ALL, scope_school_ids: [] }))}
                  disabled={saving}
                />
                Todas as escolas
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: GRID, marginBottom: GRID, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope_type_new"
                  checked={form.scope_type === SCOPE_LIST}
                  onChange={() => setForm((f) => ({ ...f, scope_type: SCOPE_LIST }))}
                  disabled={saving}
                />
                Selecionar escolas
              </label>
              {form.scope_type === SCOPE_LIST && (
                <SchoolsMultiSelect
                  schools={schools}
                  selectedIds={form.scope_school_ids}
                  onChange={(ids) => setForm((f) => ({ ...f, scope_school_ids: ids }))}
                  disabled={saving}
                  error={!!errors.scope_school_ids}
                />
              )}
              {errors.scope_school_ids && <div style={styles.fieldError}>{errors.scope_school_ids}</div>}
            </div>
          </div>
          {errors.submit && <div style={{ ...styles.fieldError, marginBottom: GRID * 2 }}>{errors.submit}</div>}
          <div style={styles.modalActions}>
            <button type="button" style={styles.btnSecondary} className="btn-hover" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" style={styles.btnPrimary} className="btn-hover" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalEditarPermissoes({ user, schools, onClose, onSuccess, saving, setSaving, validate }) {
  const [form, setForm] = useState({
    role: user.role,
    scope_type: user.scope_type === 'SCHOOL_LIST' ? SCOPE_LIST : SCOPE_ALL,
    scope_school_ids: user.scope_school_ids || [],
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate(form)
    setErrors(err)
    if (Object.keys(err).length > 0) return
    setSaving(true)
    try {
      await updateFranchisorUser(user.user_id, {
        role: form.role,
        scope_type: form.scope_type,
        scope_school_ids: form.scope_type === SCOPE_LIST ? form.scope_school_ids : undefined,
      })
      onSuccess()
    } catch {
      setErrors({ submit: 'Não foi possível salvar. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-edit-title">
      <div style={styles.modal}>
        <h2 id="modal-edit-title" style={styles.modalTitle}>Editar permissões</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Nome</label>
            <input type="text" value={user.name || ''} readOnly style={{ ...styles.input, ...styles.inputReadonly }} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="text" value={user.email || ''} readOnly style={{ ...styles.input, ...styles.inputReadonly }} />
          </div>
          <div style={styles.field}>
            <label htmlFor="edit-role" style={styles.label}>Role</label>
            <select
              id="edit-role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              style={styles.input}
              disabled={saving}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Escopo</span>
            <div style={{ marginTop: GRID }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: GRID, marginBottom: GRID, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope_type_edit"
                  checked={form.scope_type === SCOPE_ALL}
                  onChange={() => setForm((f) => ({ ...f, scope_type: SCOPE_ALL, scope_school_ids: [] }))}
                  disabled={saving}
                />
                Todas as escolas
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: GRID, marginBottom: GRID, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope_type_edit"
                  checked={form.scope_type === SCOPE_LIST}
                  onChange={() => setForm((f) => ({ ...f, scope_type: SCOPE_LIST }))}
                  disabled={saving}
                />
                Selecionar escolas
              </label>
              {form.scope_type === SCOPE_LIST && (
                <SchoolsMultiSelect
                  schools={schools}
                  selectedIds={form.scope_school_ids}
                  onChange={(ids) => setForm((f) => ({ ...f, scope_school_ids: ids }))}
                  disabled={saving}
                  error={!!errors.scope_school_ids}
                />
              )}
              {errors.scope_school_ids && <div style={styles.fieldError}>{errors.scope_school_ids}</div>}
            </div>
          </div>
          {errors.submit && <div style={{ ...styles.fieldError, marginBottom: GRID * 2 }}>{errors.submit}</div>}
          <div style={styles.modalActions}>
            <button type="button" style={styles.btnSecondary} className="btn-hover" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" style={styles.btnPrimary} className="btn-hover" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
