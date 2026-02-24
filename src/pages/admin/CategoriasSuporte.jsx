import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useDebounce } from '../../hooks/useDebounce'
import {
  listSupportCategories,
  createSupportCategory,
  updateSupportCategory,
  toggleSupportCategoryStatus,
  formatTicketDate,
} from '../../api/support'

const GRID = 8
const OPCOES_POR_PAGINA = [10, 25, 50]
const DEBOUNCE_MS = 500

const STATUS_FILTER_OPCOES = [
  { value: 'todos', label: 'Todos' },
  { value: 'active', label: 'Ativa' },
  { value: 'inactive', label: 'Inativa' },
]

const STATUS_FORM_OPCOES = [
  { value: 'active', label: 'Ativa' },
  { value: 'inactive', label: 'Inativa' },
]

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

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const isActive = s === 'active'
  const estilo = isActive
    ? { background: 'rgba(76, 203, 138, 0.15)', color: 'var(--verde-patrocinio)' }
    : { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        ...estilo,
      }}
    >
      {isActive ? 'Ativa' : 'Inativa'}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} style={styles.td}>
          <span
            style={{
              display: 'inline-block',
              height: 16,
              width: i === 1 ? 140 : i === 2 ? 180 : 70,
              background: 'var(--cinza-arquibancada)',
              borderRadius: 4,
            }}
          />
        </td>
      ))}
    </tr>
  )
}

export default function CategoriasSuporte() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const searchFromUrl = searchParams.get('search') || ''
  const statusFromUrl = searchParams.get('status') || 'todos'
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSizeFromUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size') || '10', 10)) || 10)

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)

  const [statusFilter, setStatusFilter] = useState(statusFromUrl)
  const [page, setPage] = useState(pageFromUrl)
  const [pageSize, setPageSize] = useState(pageSizeFromUrl)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [menuAberto, setMenuAberto] = useState(null)

  const [modalNovo, setModalNovo] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [modalToggle, setModalToggle] = useState(null)
  const [toast, setToast] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)

  const returnTo = searchParams.get('returnTo')
  const backUrl = returnTo || '/admin/support'

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('search', debouncedSearch)
      next.set('status', statusFilter)
      next.set('page', String(page))
      next.set('page_size', String(pageSize))
      return next
    })
  }, [debouncedSearch, statusFilter, page, pageSize, setSearchParams])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listSupportCategories({
        search: debouncedSearch,
        status: statusFilter === 'todos' ? '' : statusFilter,
        page,
        page_size: pageSize,
      })
      setData(res)
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(err.message || 'Erro ao carregar')
      }
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, page, pageSize])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuAberto && !e.target.closest('[data-menu-wrap]')) setMenuAberto(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuAberto])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const limparFiltros = () => {
    setSearchInput('')
    setStatusFilter('todos')
    setPage(1)
    setPageSize(10)
  }

  const temFiltros = searchInput || statusFilter !== 'todos'

  const voltar = () => {
    navigate(backUrl, { replace: true })
  }

  const handleCreate = async (form) => {
    setSaveError(null)
    setSaving(true)
    try {
      await createSupportCategory({
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        status: form.status || 'active',
        sort_order: form.sort_order !== '' && form.sort_order != null ? Number(form.sort_order) : undefined,
      })
      setModalNovo(false)
      setToast('Categoria salva com sucesso!')
      fetchList()
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else {
        setSaveError('Não foi possível salvar. Verifique os campos e tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id, form) => {
    setSaveError(null)
    setSaving(true)
    try {
      await updateSupportCategory(id, {
        name: form.name?.trim(),
        description: form.description?.trim(),
        status: form.status,
        sort_order: form.sort_order !== '' && form.sort_order != null ? Number(form.sort_order) : undefined,
      })
      setModalEditar(null)
      setToast('Categoria salva com sucesso!')
      fetchList()
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else {
        setSaveError('Não foi possível salvar. Verifique os campos e tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggleConfirm = async () => {
    const item = modalToggle
    if (!item) return
    setToggling(true)
    setSaveError(null)
    try {
      await toggleSupportCategoryStatus(item.id)
      setModalToggle(null)
      setToast('Categoria salva com sucesso!')
      fetchList()
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else {
        setSaveError('Não foi possível alterar o status.')
      }
    } finally {
      setToggling(false)
    }
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Suporte', to: '/admin/support' },
    { label: 'Categorias de Suporte' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Categorias de Suporte">
      {toast && (
        <div style={styles.toast} role="status">
          {toast}
        </div>
      )}

      <div style={styles.cardGrande}>
        <div style={styles.cabecalho}>
          <div>
            <h2 style={styles.tituloPagina}>Categorias de Suporte</h2>
            <p style={styles.subtitulo}>
              Gerencie os motivos disponíveis para abertura e classificação de tickets
            </p>
          </div>
          <div style={styles.cabecalhoAcoes}>
            <div style={styles.buscaWrap}>
              <span style={styles.buscaIcon} aria-hidden="true">
                <IconSearch />
              </span>
              <input
                type="search"
                placeholder="Buscar por nome da categoria"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={styles.buscaInput}
                aria-label="Buscar categorias"
                disabled={loading}
              />
            </div>
            <button
              type="button"
              style={styles.btnPrimario}
              className="btn-hover"
              onClick={() => {
                setModalNovo(true)
                setSaveError(null)
              }}
              disabled={loading}
            >
              Nova categoria
            </button>
          </div>
        </div>

        <div style={styles.filtros}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            style={styles.select}
            aria-label="Status"
            disabled={loading}
          >
            {STATUS_FILTER_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={limparFiltros}
            style={styles.btnLimpar}
            disabled={loading || !temFiltros}
          >
            Limpar filtros
          </button>
        </div>

        {error && (
          <div style={styles.erro} role="alert">
            <p style={styles.erroTexto}>Não foi possível carregar as categorias. Tente novamente.</p>
            <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={fetchList}>
              Recarregar
            </button>
          </div>
        )}

        {!error && (
          <>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Descrição</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Ordem</th>
                    <th style={styles.th}>Criado em</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </>
                  )}
                  {!loading && data?.data?.length === 0 && (
                    <tr>
                      <td colSpan={6} style={styles.tdVazio}>
                        <div style={styles.emptyWrap}>
                          <p style={styles.emptyTitulo}>Nenhuma categoria encontrada</p>
                          <button
                            type="button"
                            style={styles.btnPrimario}
                            className="btn-hover"
                            onClick={() => setModalNovo(true)}
                          >
                            Nova categoria
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    data?.data?.length > 0 &&
                    data.data.map((cat) => (
                      <tr key={cat.id}>
                        <td style={styles.td}>{cat.name || '—'}</td>
                        <td style={styles.td}>
                          {cat.description
                            ? cat.description.length > 60
                              ? cat.description.slice(0, 60) + '…'
                              : cat.description
                            : '—'}
                        </td>
                        <td style={styles.td}>
                          <StatusBadge status={cat.status} />
                        </td>
                        <td style={styles.td}>{cat.sort_order != null ? cat.sort_order : '—'}</td>
                        <td style={styles.td}>{formatTicketDate(cat.created_at)}</td>
                        <td style={styles.td}>
                          <div style={styles.acoesCel} data-menu-wrap>
                            <button
                              type="button"
                              style={styles.btnMenu}
                              onClick={() => setMenuAberto(menuAberto === cat.id ? null : cat.id)}
                              aria-haspopup="true"
                              aria-expanded={menuAberto === cat.id}
                              aria-label="Ações"
                              disabled={loading}
                            >
                              <IconMore />
                            </button>
                            {menuAberto === cat.id && (
                              <div style={styles.dropdown}>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => {
                                    setModalEditar(cat)
                                    setMenuAberto(null)
                                    setSaveError(null)
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => {
                                    setModalToggle(cat)
                                    setMenuAberto(null)
                                    setSaveError(null)
                                  }}
                                >
                                  {(cat.status || '').toLowerCase() === 'active' ? 'Inativar' : 'Ativar'}
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

            {!loading && data?.data?.length > 0 && data.total_pages > 0 && (
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
                  <span style={styles.paginaAtual}>
                    Página {page} de {data.total_pages}
                  </span>
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
                <div style={styles.pageSizeWrap}>
                  <label style={styles.pageSizeLabel}>
                    Itens por página:
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1)
                      }}
                      style={styles.selectPageSize}
                      disabled={loading}
                    >
                      {OPCOES_POR_PAGINA.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}
          </>
        )}

        <div style={styles.voltarWrap}>
          <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={voltar}>
            Voltar
          </button>
        </div>
      </div>

      {/* Modal Nova categoria */}
      {modalNovo && (
        <ModalFormCategoria
          titulo="Nova categoria"
          botaoPrincipal="Salvar"
          initial={{ name: '', description: '', status: 'active', sort_order: '' }}
          onClose={() => {
            setModalNovo(false)
            setSaveError(null)
          }}
          onSubmit={handleCreate}
          saving={saving}
          saveError={saveError}
        />
      )}

      {/* Modal Editar categoria */}
      {modalEditar && (
        <ModalFormCategoria
          titulo="Editar categoria"
          botaoPrincipal="Salvar alterações"
          initial={{
            name: modalEditar.name || '',
            description: modalEditar.description || '',
            status: (modalEditar.status || 'active').toLowerCase(),
            sort_order: modalEditar.sort_order != null ? String(modalEditar.sort_order) : '',
          }}
          onClose={() => {
            setModalEditar(null)
            setSaveError(null)
          }}
          onSubmit={(form) => handleUpdate(modalEditar.id, form)}
          saving={saving}
          saveError={saveError}
        />
      )}

      {/* Modal confirmar Ativar/Inativar */}
      {modalToggle && (
        <ModalConfirmToggle
          item={modalToggle}
          onClose={() => {
            setModalToggle(null)
            setSaveError(null)
          }}
          onConfirm={handleToggleConfirm}
          toggling={toggling}
          saveError={saveError}
        />
      )}
    </AdminLayout>
  )
}

function ModalFormCategoria({ titulo, botaoPrincipal, initial, onClose, onSubmit, saving, saveError }) {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [status, setStatus] = useState(initial.status)
  const [sortOrder, setSortOrder] = useState(initial.sort_order)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim(), status, sort_order: sortOrder })
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <h3 id="modal-title" style={styles.modalTitulo}>
          {titulo}
        </h3>
        {saveError && (
          <div style={styles.alertaErro} role="alert">
            {saveError}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label style={styles.modalLabel}>
            Nome <span style={styles.obrigatorio}>*</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.modalInput}
              required
              disabled={saving}
              aria-required="true"
            />
          </label>
          <label style={styles.modalLabel}>
            Descrição
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.modalTextarea}
              rows={3}
              disabled={saving}
            />
          </label>
          <label style={styles.modalLabel}>
            Status <span style={styles.obrigatorio}>*</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={styles.modalSelect}
              required
              disabled={saving}
            >
              {STATUS_FORM_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.modalLabel}>
            Ordem
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={styles.modalInput}
              disabled={saving}
              placeholder="Opcional"
            />
          </label>
          <div style={styles.modalAcoes}>
            <button type="submit" style={styles.btnPrimario} className="btn-hover" disabled={saving || !name.trim()}>
              {saving ? 'Salvando…' : botaoPrincipal}
            </button>
            <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalConfirmToggle({ item, onClose, onConfirm, toggling, saveError }) {
  const isActive = (item?.status || '').toLowerCase() === 'active'
  const texto = isActive
    ? 'Inativar esta categoria? Ela não aparecerá mais para novos tickets, mas permanece no histórico.'
    : 'Ativar esta categoria?'

  return (
    <div style={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title" style={styles.modalTitulo}>
          {isActive ? 'Inativar categoria' : 'Ativar categoria'}
        </h3>
        {saveError && (
          <div style={styles.alertaErro} role="alert">
            {saveError}
          </div>
        )}
        <p style={styles.modalTexto}>{texto}</p>
        <div style={styles.modalAcoes}>
          <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={onConfirm} disabled={toggling}>
            {toggling ? 'Processando…' : 'Confirmar'}
          </button>
          <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={onClose} disabled={toggling}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  toast: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'rgba(76, 203, 138, 0.15)',
    color: 'var(--verde-patrocinio)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
    fontWeight: 500,
  },
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
  tituloPagina: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  subtitulo: {
    margin: `${GRID}px 0 0`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  cabecalhoAcoes: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  buscaWrap: {
    position: 'relative',
    width: 320,
  },
  buscaIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--grafite-tecnico)',
    opacity: 0.6,
    pointerEvents: 'none',
  },
  buscaInput: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 2}px ${GRID * 2}px 40px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
  },
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
  },
  btnSecundario: {
    background: 'transparent',
    color: 'var(--azul-arena)',
    border: '1px solid var(--azul-arena)',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  select: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    minWidth: 140,
    outline: 'none',
  },
  btnLimpar: {
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #ccc',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    cursor: 'pointer',
  },
  erro: {
    padding: GRID * 4,
    textAlign: 'center',
    background: 'rgba(220, 53, 69, 0.06)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
  },
  erroTexto: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  tableWrap: { overflowX: 'auto' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
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
  tdVazio: {
    padding: GRID * 6,
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  emptyWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: GRID * 2,
  },
  emptyTitulo: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
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
    minWidth: 160,
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
  paginacao: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
  },
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
  paginaAtual: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    minWidth: 100,
    textAlign: 'center',
  },
  pageSizeWrap: {},
  pageSizeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  selectPageSize: {
    padding: `${GRID}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
  },
  voltarWrap: {
    marginTop: GRID * 3,
    paddingTop: GRID * 3,
    borderTop: '1px solid #eee',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: GRID * 2,
  },
  modalBox: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    maxWidth: 440,
    width: '100%',
    boxShadow: 'var(--shadow-hover)',
  },
  modalTitulo: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  modalTexto: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    lineHeight: 1.5,
  },
  modalLabel: {
    display: 'block',
    marginBottom: GRID * 2,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  obrigatorio: { color: '#c00' },
  modalInput: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    marginTop: GRID,
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalTextarea: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    marginTop: GRID,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalSelect: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    marginTop: GRID,
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalAcoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
    marginTop: GRID * 3,
  },
  alertaErro: {
    background: 'rgba(220, 53, 69, 0.08)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    borderRadius: 'var(--radius)',
    padding: GRID * 2,
    marginBottom: GRID * 2,
    color: '#721c24',
    fontSize: 14,
  },
}
