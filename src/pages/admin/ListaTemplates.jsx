import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useDebounce } from '../../hooks/useDebounce'
import {
  listTemplates,
  formatTemplateDate,
  getCategoryLabel,
  CATEGORIES,
  STATUS_ACTIVE,
  STATUS_INACTIVE,
  updateTemplate,
} from '../../api/templates'

const GRID = 8
const OPCOES_POR_PAGINA = [10, 25, 50]
const DEBOUNCE_MS = 500

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
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
const IconMore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="6" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="18" r="1.5" />
  </svg>
)

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} style={styles.td}>
          <span
            style={{
              display: 'inline-block',
              height: 16,
              width: i === 1 ? 120 : 80,
              background: 'var(--cinza-arquibancada)',
              borderRadius: 4,
            }}
          />
        </td>
      ))}
    </tr>
  )
}

function StatusBadge({ status }) {
  const isActive = status === STATUS_ACTIVE
  return (
    <span
      style={{
        ...styles.badge,
        ...(isActive ? styles.badgeAtivo : styles.badgeInativo),
      }}
    >
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  )
}

const STATUS_OPCOES = [
  { value: '', label: 'Todos' },
  { value: STATUS_ACTIVE, label: 'Ativo' },
  { value: STATUS_INACTIVE, label: 'Inativo' },
]

export default function ListaTemplates() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const searchFromUrl = searchParams.get('search') || ''
  const categoryFromUrl = searchParams.get('category') || ''
  const statusFromUrl = searchParams.get('status') || ''
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSizeFromUrl = Math.min(100, Math.max(10, parseInt(searchParams.get('page_size') || '10', 10)) || 10)

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)

  const [category, setCategory] = useState(categoryFromUrl)
  const [status, setStatus] = useState(statusFromUrl)
  const [page, setPage] = useState(pageFromUrl)
  const [pageSize, setPageSize] = useState(pageSizeFromUrl)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [menuAberto, setMenuAberto] = useState(null)
  const [modalToggle, setModalToggle] = useState(null)
  const [submittingToggle, setSubmittingToggle] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('search', debouncedSearch)
      next.set('category', category)
      next.set('status', status)
      next.set('page', String(page))
      next.set('page_size', String(pageSize))
      return next
    })
  }, [debouncedSearch, category, status, page, pageSize, setSearchParams])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listTemplates({
        search: debouncedSearch,
        category: category || undefined,
        status: status || undefined,
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
  }, [debouncedSearch, category, status, page, pageSize])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuAberto && !e.target.closest('[data-menu-wrap]')) setMenuAberto(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [menuAberto])

  const irDetalhe = (templateId, openHistory = false) => {
    const q = searchParams.toString()
    const url = openHistory
      ? `/admin/templates/${templateId}?${q}&tab=historico`
      : `/admin/templates/${templateId}?${q}`
    navigate(url)
    setMenuAberto(null)
  }

  const confirmarToggleStatus = async () => {
    if (!modalToggle) return
    setSubmittingToggle(true)
    try {
      const newStatus = modalToggle.currentStatus === STATUS_ACTIVE ? STATUS_INACTIVE : STATUS_ACTIVE
      await updateTemplate(modalToggle.id, { status: newStatus })
      setToast(newStatus === STATUS_ACTIVE ? 'Template ativado.' : 'Template inativado.')
      setModalToggle(null)
      fetchList()
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else {
        setToast('Não foi possível alterar o status. Tente novamente.')
      }
    } finally {
      setSubmittingToggle(false)
    }
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Configurações Globais', to: '/admin/settings' },
    { label: 'Templates' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Templates do Sistema">
      <div style={styles.cardGrande}>
        <div style={styles.cabecalho}>
          <div>
            <h2 style={styles.tituloPagina}>Templates do Sistema</h2>
            <p style={styles.subtitulo}>Textos padrão usados no sistema (telas, autenticação, suporte)</p>
          </div>
          <div style={styles.buscaWrap}>
            <span style={styles.buscaIcon} aria-hidden="true">
              <IconSearch />
            </span>
            <input
              type="search"
              placeholder="Buscar por nome ou chave do template"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={styles.buscaInput}
              aria-label="Buscar templates"
              disabled={loading}
            />
          </div>
        </div>

        <div style={styles.filtros}>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            style={styles.select}
            aria-label="Canal/Tipo"
            disabled={loading}
          >
            <option value="">Todos</option>
            {CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            style={styles.select}
            aria-label="Status"
            disabled={loading}
          >
            {STATUS_OPCOES.map((opt) => (
              <option key={opt.value || 'todos'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {toast && (
          <div style={styles.toast} role="status">
            {toast}
          </div>
        )}

        {error && (
          <div style={styles.erro}>
            <p style={styles.erroTexto}>Não foi possível carregar os templates. Tente novamente.</p>
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
                    <th style={styles.th}>Chave</th>
                    <th style={styles.th}>Categoria</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Última atualização</th>
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
                          <p style={styles.emptyTitulo}>Nenhum template encontrado</p>
                          <p style={styles.emptyTexto}>Ajuste os filtros ou a busca.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    data?.data?.length > 0 &&
                    data.data.map((t) => (
                      <tr
                        key={t.id}
                        style={styles.trClickable}
                        onClick={() => irDetalhe(t.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && irDetalhe(t.id)}
                        aria-label={`Editar template ${t.name}`}
                      >
                        <td style={styles.td}>{t.name || '—'}</td>
                        <td style={styles.td}>{t.key || '—'}</td>
                        <td style={styles.td}>{getCategoryLabel(t.category)}</td>
                        <td style={styles.td}>
                          <StatusBadge status={t.status} />
                        </td>
                        <td style={styles.td}>{formatTemplateDate(t.updated_at)}</td>
                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                          <div style={styles.acoesCel} data-menu-wrap>
                            <button
                              type="button"
                              style={styles.btnMenu}
                              onClick={() => setMenuAberto(menuAberto === t.id ? null : t.id)}
                              aria-haspopup="true"
                              aria-expanded={menuAberto === t.id}
                              aria-label="Ações"
                              disabled={loading}
                            >
                              <IconMore />
                            </button>
                            {menuAberto === t.id && (
                              <div style={styles.dropdown}>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => irDetalhe(t.id)}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => {
                                    setModalToggle({
                                      id: t.id,
                                      name: t.name,
                                      currentStatus: t.status,
                                    })
                                    setMenuAberto(null)
                                  }}
                                >
                                  {t.status === STATUS_ACTIVE ? 'Inativar' : 'Ativar'}
                                </button>
                                <button
                                  type="button"
                                  data-dropdown-item
                                  style={styles.dropdownItem}
                                  onClick={() => irDetalhe(t.id, true)}
                                >
                                  Ver histórico
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
      </div>

      {modalToggle && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div style={styles.modal}>
            <h3 id="modal-title" style={styles.modalTitulo}>
              {modalToggle.currentStatus === STATUS_ACTIVE ? 'Inativar este template?' : 'Ativar este template?'}
            </h3>
            <p style={styles.modalTexto}>
              {modalToggle.currentStatus === STATUS_ACTIVE
                ? 'O template não será removido e o histórico será mantido. Você pode reativá-lo depois.'
                : 'O template voltará a estar disponível para uso no sistema.'}
            </p>
            <p style={styles.modalNome}>Template: {modalToggle.name}</p>
            <div style={styles.modalAcoes}>
              <button
                type="button"
                style={styles.btnSecundario}
                onClick={() => setModalToggle(null)}
                disabled={submittingToggle}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={styles.btnPrimario}
                className="btn-hover"
                onClick={confirmarToggleStatus}
                disabled={submittingToggle}
              >
                {submittingToggle ? 'Salvando…' : modalToggle.currentStatus === STATUS_ACTIVE ? 'Inativar' : 'Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
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
    opacity: 0.8,
  },
  buscaWrap: {
    position: 'relative',
    width: 360,
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
    minWidth: 160,
    outline: 'none',
  },
  toast: {
    padding: GRID * 2,
    marginBottom: GRID * 2,
    background: 'rgba(40, 167, 69, 0.1)',
    color: '#155724',
    borderRadius: 'var(--radius)',
    fontSize: 14,
  },
  erro: {
    padding: GRID * 4,
    textAlign: 'center',
    background: 'rgba(220, 53, 69, 0.06)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
  },
  erroTexto: {
    margin: `0 0 ${GRID * 2}px`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
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
    color: 'var(--grafite-tecnico)',
    border: '1px solid #ccc',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderRadius: 'var(--radius)',
    fontSize: 14,
    cursor: 'pointer',
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
  trClickable: {
    cursor: 'pointer',
  },
  badge: {
    display: 'inline-block',
    padding: `${GRID * 0.5}px ${GRID * 2}px`,
    borderRadius: 'var(--radius)',
    fontSize: 12,
    fontWeight: 600,
  },
  badgeAtivo: {
    background: 'rgba(40, 167, 69, 0.15)',
    color: '#155724',
  },
  badgeInativo: {
    background: 'rgba(108, 117, 125, 0.2)',
    color: '#495057',
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
    boxShadow: 'var(--shadow)',
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
  emptyTexto: {
    margin: 0,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
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
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    maxWidth: 440,
    width: '90%',
    boxShadow: 'var(--shadow)',
  },
  modalTitulo: {
    margin: `0 0 ${GRID * 2}px`,
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  modalTexto: {
    margin: `0 0 ${GRID * 2}px`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  modalNome: {
    margin: `0 0 ${GRID * 3}px`,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  modalAcoes: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: GRID * 2,
  },
}
