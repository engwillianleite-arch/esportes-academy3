import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useFranchisorSidebar } from '../../contexts/FranchisorSidebarContext'
import { useDebounce } from '../../hooks/useDebounce'
import {
  getFranqueadorById,
  listFranchisorUsers,
  deleteFranchisorUser,
  getScopeSummary,
  getRoleLabel,
} from '../../api/franqueadores'
import { formatCreatedAtDateTime } from '../../api/franqueadores'

const GRID = 8
const DEBOUNCE_MS = 500
const OPCOES_POR_PAGINA = [10, 25, 50]

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
      {getRoleLabel(role)}
    </span>
  )
}

const styles = {
  cardGrande: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cabecalho: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 3,
    marginBottom: GRID * 3,
  },
  cabecalhoEsq: { flex: '1 1 300px' },
  titulo: { margin: '0 0 ' + GRID + 'px', fontSize: 22, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  subtitulo: { margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.7 },
  cabecalhoBotoes: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: GRID * 2 },
  btnPrimario: {
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(44, 110, 242, 0.3)',
    textDecoration: 'none',
    display: 'inline-block',
  },
  btnSecundario: {
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #E5E5E7',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  buscaWrap: { position: 'relative', width: 280 },
  buscaIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--grafite-tecnico)', opacity: 0.6, pointerEvents: 'none' },
  buscaInput: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 2}px ${GRID * 2}px 40px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
  },
  select: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    minWidth: 160,
    outline: 'none',
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: `${GRID * 2}px ${GRID * 3}px`, fontWeight: 600, color: 'var(--grafite-tecnico)', borderBottom: '2px solid var(--cinza-arquibancada)' },
  td: { padding: `${GRID * 2}px ${GRID * 3}px`, borderBottom: '1px solid #eee', color: 'var(--grafite-tecnico)' },
  tdVazio: { padding: GRID * 6, textAlign: 'center', verticalAlign: 'middle' },
  emptyWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: GRID * 2 },
  emptyTitulo: { margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  emptyTexto: { margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  acoesCel: { position: 'relative' },
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
    zIndex: 10,
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
    textDecoration: 'none',
  },
  dropdownItemDanger: { color: '#dc3545' },
  rodape: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginTop: GRID * 3,
    paddingTop: GRID * 3,
    borderTop: '1px solid #eee',
  },
  paginacao: { display: 'flex', alignItems: 'center', gap: GRID },
  btnPagina: {
    background: 'var(--branco-luz)',
    border: '1px solid #E5E5E7',
    padding: GRID,
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    color: 'var(--grafite-tecnico)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginaAtual: { fontSize: 14, color: 'var(--grafite-tecnico)', minWidth: 100, textAlign: 'center' },
  pageSizeLabel: { display: 'flex', alignItems: 'center', gap: GRID, fontSize: 14, color: 'var(--grafite-tecnico)' },
  selectPageSize: { padding: `${GRID}px ${GRID * 2}px`, border: '1px solid #E5E5E7', borderRadius: 'var(--radius)', fontSize: 14, outline: 'none' },
  erro: {
    padding: GRID * 4,
    textAlign: 'center',
    background: 'rgba(220, 53, 69, 0.06)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
  },
  erroTexto: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)' },
  toast: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'rgba(76, 203, 138, 0.15)',
    color: 'var(--verde-patrocinio)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
    fontWeight: 500,
  },
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
    maxWidth: 420,
    width: '100%',
    padding: GRID * 4,
  },
  modalTitulo: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  modalTexto: { margin: '0 0 ' + GRID * 4 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  modalBotoes: { display: 'flex', justifyContent: 'flex-end', gap: GRID * 2 },
  btnDanger: { background: '#dc3545', color: '#fff', border: 'none', padding: `${GRID * 2}px ${GRID * 3}px`, borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}

export default function UsuariosFranqueador() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { setFranchisorName } = useFranchisorSidebar()
  const returnTo = location.state?.returnTo || `/admin/franqueadores/${id}?tab=overview`

  const [franqueador, setFranqueador] = useState(null)
  const [loadingFranqueador, setLoadingFranqueador] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const searchFromUrl = searchParams.get('search') || ''
  const roleFromUrl = searchParams.get('role') || 'todos'
  const statusFromUrl = searchParams.get('status') || 'todos'
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSizeFromUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size') || '10', 10)) || 10)

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)
  const [roleFilter, setRoleFilter] = useState(roleFromUrl)
  const [statusFilter, setStatusFilter] = useState(statusFromUrl)
  const [page, setPage] = useState(pageFromUrl)
  const [pageSize, setPageSize] = useState(pageSizeFromUrl)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [menuAberto, setMenuAberto] = useState(null)
  const [removeModal, setRemoveModal] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [toast, setToast] = useState(location.state?.toast || null)

  const fetchFranqueador = useCallback(async () => {
    if (!id) return
    setLoadingFranqueador(true)
    try {
      const data = await getFranqueadorById(id)
      setFranqueador(data)
      setFranchisorName(data?.name ?? '')
      if (data && (data.status === 403 || data.permission_denied)) setPermissionDenied(true)
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
    } finally {
      setLoadingFranqueador(false)
    }
  }, [id, setFranchisorName])

  const fetchUsers = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await listFranchisorUsers(id, {
        search: debouncedSearch,
        role: roleFilter === 'todos' ? '' : roleFilter,
        status: statusFilter === 'todos' ? '' : statusFilter,
        page,
        page_size: pageSize,
      })
      setData(res)
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else setError('Não foi possível carregar os usuários. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [id, debouncedSearch, roleFilter, statusFilter, page, pageSize])

  useEffect(() => {
    fetchFranqueador()
  }, [fetchFranqueador])

  useEffect(() => {
    return () => setFranchisorName('')
  }, [id, setFranchisorName])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('search', debouncedSearch)
      next.set('role', roleFilter)
      next.set('status', statusFilter)
      next.set('page', String(page))
      next.set('page_size', String(pageSize))
      return next
    })
  }, [debouncedSearch, roleFilter, statusFilter, page, pageSize])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuAberto && !e.target.closest('[data-menu-wrap]')) setMenuAberto(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuAberto])

  const handleRemoverAcesso = useCallback(async () => {
    if (!removeModal || !id) return
    setRemoving(true)
    try {
      await deleteFranchisorUser(id, removeModal.user_id)
      setRemoveModal(null)
      setToast('Acesso removido com sucesso.')
      fetchUsers()
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else setError('Não foi possível remover o acesso. Tente novamente.')
    } finally {
      setRemoving(false)
    }
  }, [id, removeModal, fetchUsers])

  const limparFiltros = () => {
    setSearchInput('')
    setRoleFilter('todos')
    setStatusFilter('todos')
    setPage(1)
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const franqueadorNome = franqueador?.name || 'Franqueador'
  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Franqueadores', to: '/admin/franqueadores' },
    { label: `Franqueador: ${franqueadorNome}`, to: `/admin/franqueadores/${id}?tab=overview` },
    { label: 'Usuários' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb}>
      <div style={styles.cardGrande}>
        {/* ——— Cabeçalho ——— */}
        <div style={styles.cabecalho}>
          <div style={styles.cabecalhoEsq}>
            {loadingFranqueador ? (
              <>
                <div style={{ height: 28, width: 260, background: 'var(--cinza-arquibancada)', borderRadius: 4, marginBottom: GRID }} />
                <div style={{ height: 18, width: 180, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
              </>
            ) : (
              <>
                <h1 style={styles.titulo}>Usuários do Franqueador</h1>
                <p style={styles.subtitulo}>{franqueadorNome}</p>
              </>
            )}
          </div>
          {!loadingFranqueador && (
            <div style={styles.cabecalhoBotoes}>
              <Link to={`/admin/franqueadores/${id}/usuarios/novo`} style={styles.btnPrimario} className="btn-hover">
                Novo usuário
              </Link>
              <Link to={returnTo} style={styles.btnSecundario} className="btn-hover">
                Voltar para o franqueador
              </Link>
            </div>
          )}
        </div>

        {toast && <div style={styles.toast} role="status">{toast}</div>}

        {/* ——— Filtros ——— */}
        <div style={styles.filtros}>
          <div style={styles.buscaWrap}>
            <span style={styles.buscaIcon} aria-hidden="true"><IconSearch /></span>
            <input
              type="search"
              placeholder="Buscar por nome ou email"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
              style={styles.buscaInput}
              aria-label="Buscar por nome ou email"
              disabled={loading}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            style={styles.select}
            aria-label="Role"
            disabled={loading}
          >
            <option value="todos">Todos (Role)</option>
            <option value="FranchisorOwner">FranchisorOwner</option>
            <option value="FranchisorStaff">FranchisorStaff</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            style={styles.select}
            aria-label="Status"
            disabled={loading}
          >
            <option value="todos">Todos (Status)</option>
            <option value="ativo">Ativo</option>
            <option value="convidado">Convidado/Pendente</option>
            <option value="desativado">Desativado</option>
          </select>
          <button
            type="button"
            style={styles.btnSecundario}
            className="btn-hover"
            onClick={limparFiltros}
            disabled={loading}
          >
            Limpar filtros
          </button>
        </div>

        {/* ——— Erro ao carregar ——— */}
        {error && (
          <div style={styles.erro}>
            <p style={styles.erroTexto}>{error}</p>
            <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={fetchUsers}>
              Recarregar
            </button>
          </div>
        )}

        {/* ——— Tabela ——— */}
        {!error && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nome</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Escopo</th>
                  <th style={styles.th}>Último acesso</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 120, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                      <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 160, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                      <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 100, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                      <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 140, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                      <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 80, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                      <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 40, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                    </tr>
                  ))
                )}
                {!loading && data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} style={styles.tdVazio}>
                      <div style={styles.emptyWrap}>
                        <p style={styles.emptyTitulo}>Nenhum usuário cadastrado para este franqueador.</p>
                        <Link to={`/admin/franqueadores/${id}/usuarios/novo`} style={styles.btnPrimario} className="btn-hover">
                          Novo usuário
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && data?.data?.length > 0 && data.data.map((user) => (
                  <tr key={user.user_id}>
                    <td style={styles.td}>{user.name || '—'}</td>
                    <td style={styles.td}>{user.email || '—'}</td>
                    <td style={styles.td}><RoleBadge role={user.role} /></td>
                    <td style={styles.td}>{getScopeSummary(user)}</td>
                    <td style={styles.td}>{user.last_login_at ? formatCreatedAtDateTime(user.last_login_at) : '—'}</td>
                    <td style={styles.td}>
                      <div style={styles.acoesCel} data-menu-wrap>
                        <button
                          type="button"
                          style={styles.btnMenu}
                          onClick={() => setMenuAberto(menuAberto === user.user_id ? null : user.user_id)}
                          aria-haspopup="true"
                          aria-expanded={menuAberto === user.user_id}
                          aria-label="Ações"
                          disabled={loading}
                        >
                          <IconMore />
                        </button>
                        {menuAberto === user.user_id && (
                          <div style={styles.dropdown}>
                            <Link
                              to={`/admin/franqueadores/${id}/usuarios/${user.user_id}/editar`}
                              style={styles.dropdownItem}
                              className="btn-hover"
                              data-dropdown-item
                              onClick={() => setMenuAberto(null)}
                            >
                              Editar permissões
                            </Link>
                            <button
                              type="button"
                              style={{ ...styles.dropdownItem, ...styles.dropdownItemDanger }}
                              className="btn-hover"
                              data-dropdown-item
                              onClick={() => { setMenuAberto(null); setRemoveModal(user) }}
                            >
                              Remover acesso
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ——— Paginação ——— */}
        {!error && !loading && data?.data?.length > 0 && data.total_pages > 0 && (
          <div style={styles.rodape}>
            <div style={styles.paginacao}>
              <button
                type="button"
                style={styles.btnPagina}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                <IconChevronLeft />
              </button>
              <span style={styles.paginaAtual}>Página {page} de {data.total_pages}</span>
              <button
                type="button"
                style={styles.btnPagina}
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
                aria-label="Próxima página"
              >
                <IconChevronRight />
              </button>
            </div>
            <label style={styles.pageSizeLabel}>
              Itens por página:
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                style={styles.selectPageSize}
                disabled={loading}
              >
                {OPCOES_POR_PAGINA.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* ——— Modal Remover acesso ——— */}
        {removeModal && (
          <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-remove-title">
            <div style={styles.modal}>
              <h2 id="modal-remove-title" style={styles.modalTitulo}>Remover acesso deste usuário ao franqueador?</h2>
              <p style={styles.modalTexto}>
                Ele perderá acesso às escolas deste franqueador.
              </p>
              <div style={styles.modalBotoes}>
                <button
                  type="button"
                  style={styles.btnSecundario}
                  className="btn-hover"
                  onClick={() => setRemoveModal(null)}
                  disabled={removing}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  style={styles.btnDanger}
                  className="btn-hover"
                  onClick={handleRemoverAcesso}
                  disabled={removing}
                >
                  {removing ? 'Removendo…' : 'Remover'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
