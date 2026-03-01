import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useFranchisorSidebar } from '../../contexts/FranchisorSidebarContext'
import { useDebounce } from '../../hooks/useDebounce'
import {
  getFranqueadorById,
  listEscolasByFranqueador,
  formatCreatedAt,
  formatCreatedAtDateTime,
} from '../../api/franqueadores'

const GRID = 8
const DEBOUNCE_MS = 500
const OPCOES_POR_PAGINA = [10, 25, 50]

// ——— Ícones ———
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
/** Ícone para dados mocados (demonstração) — remover quando conectar backend real */
const IconMock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 2v7.31" />
    <path d="M14 9.3V2" />
    <path d="M8.5 2h7" />
    <path d="M14 9.3a6.5 6.5 0 1 1-4 0V9.3" />
  </svg>
)

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const estilo =
    s === 'ativo'
      ? { background: 'rgba(76, 203, 138, 0.15)', color: 'var(--verde-patrocinio)' }
      : s === 'pendente'
        ? { background: 'rgba(44, 110, 242, 0.15)', color: 'var(--azul-arena)' }
        : s === 'suspenso'
          ? { background: 'rgba(220, 53, 69, 0.15)', color: '#dc3545' }
          : { background: 'var(--cinza-arquibancada)', color: 'var(--grafite-tecnico)' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'capitalize',
        ...estilo,
      }}
    >
      {s || '—'}
    </span>
  )
}

function SkeletonLine({ width = '80%' }) {
  return (
    <div style={{ height: 16, background: 'var(--cinza-arquibancada)', borderRadius: 4, width, marginBottom: GRID }} />
  )
}

function SkeletonCard() {
  return (
    <div style={styles.card}>
      <SkeletonLine width="40%" />
      <SkeletonLine />
      <SkeletonLine />
      <SkeletonLine width="60%" />
    </div>
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
  cabecalhoEsq: {
    flex: '1 1 300px',
  },
  titulo: {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  tituloRow: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
    flexWrap: 'wrap',
    marginBottom: GRID,
  },
  badgeMock: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    background: 'rgba(44, 110, 242, 0.12)',
    color: 'var(--azul-arena)',
    cursor: 'help',
  },
  subtitulo: {
    margin: 0,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.7,
  },
  cabecalhoBotoes: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
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
  tabs: {
    display: 'flex',
    gap: GRID,
    marginBottom: GRID * 3,
    borderBottom: '1px solid #eee',
  },
  tab: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: 'none',
    background: 'none',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
    textDecoration: 'none',
  },
  tabAtivo: {
    color: 'var(--azul-arena)',
    borderBottomColor: 'var(--azul-arena)',
  },
  card: {
    background: 'var(--branco-luz)',
    border: '1px solid #eee',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
  },
  cardTitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  campoLinha: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID,
    marginBottom: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  campoLabel: {
    fontWeight: 600,
    minWidth: 140,
    opacity: 0.85,
  },
  campoValor: {
    opacity: 0.95,
  },
  metricas: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 4,
  },
  metrica: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--azul-arena)',
  },
  metricaLabel: {
    fontSize: 12,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
    marginTop: GRID,
  },
  acoesRapidas: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
  },
  linkAcao: {
    color: 'var(--azul-arena)',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
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
  linhaEscolas: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  buscaWrap: {
    position: 'relative',
    width: 280,
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
  select: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    minWidth: 140,
    outline: 'none',
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
  emptyTexto: {
    margin: 0,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
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
}

export default function DetalheFranqueador() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { setFranchisorName } = useFranchisorSidebar()

  const tabFromUrl = searchParams.get('tab') || 'overview'
  const tabAtivo = tabFromUrl === 'schools' || tabFromUrl === 'escolas' ? 'schools' : 'overview'

  const [franqueador, setFranqueador] = useState(null)
  const [loadingFranqueador, setLoadingFranqueador] = useState(true)
  const [errorFranqueador, setErrorFranqueador] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [escolasData, setEscolasData] = useState(null)
  const [loadingEscolas, setLoadingEscolas] = useState(false)
  const [errorEscolas, setErrorEscolas] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'todos')
  const [page, setPage] = useState(Math.max(1, parseInt(searchParams.get('page') || '1', 10)))
  const [pageSize, setPageSize] = useState(Math.min(100, Math.max(10, parseInt(searchParams.get('page_size') || '10', 10)) || 10))
  const [menuAberto, setMenuAberto] = useState(null)
  const [toast, setToast] = useState(location.state?.toast || null)

  const fetchFranqueador = useCallback(async () => {
    if (!id) return
    setLoadingFranqueador(true)
    setErrorFranqueador(null)
    try {
      const data = await getFranqueadorById(id)
      setFranqueador(data)
      setFranchisorName(data?.name ?? '')
      if (data && (data.status === 403 || data.permission_denied)) {
        setPermissionDenied(true)
      }
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else {
        setErrorFranqueador(err.message || 'Não foi possível carregar os dados do franqueador.')
      }
    } finally {
      setLoadingFranqueador(false)
    }
  }, [id])

  useEffect(() => {
    fetchFranqueador()
  }, [fetchFranqueador])

  useEffect(() => {
    return () => setFranchisorName('')
  }, [id, setFranchisorName])

  const fetchEscolas = useCallback(async () => {
    if (!id || tabAtivo !== 'schools') return
    setLoadingEscolas(true)
    setErrorEscolas(null)
    try {
      const res = await listEscolasByFranqueador(id, {
        search: debouncedSearch,
        status: statusFilter === 'todos' ? '' : statusFilter,
        page,
        page_size: pageSize,
      })
      setEscolasData(res)
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else setErrorEscolas('Não foi possível carregar as escolas vinculadas. Tente novamente.')
    } finally {
      setLoadingEscolas(false)
    }
  }, [id, tabAtivo, debouncedSearch, statusFilter, page, pageSize])

  useEffect(() => {
    if (tabAtivo === 'schools') fetchEscolas()
  }, [fetchEscolas, tabAtivo])

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', tabAtivo)
      if (tabAtivo === 'schools') {
        next.set('status', statusFilter)
        next.set('page', String(page))
        next.set('page_size', String(pageSize))
      }
      return next
    })
  }, [tabAtivo, statusFilter, page, pageSize, setSearchParams])

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

  const urlEditar = `/admin/franqueadores/editar/${id}?tab=${tabAtivo}`
  const returnToEscolas = `/admin/franqueadores/${id}?tab=schools`
  const urlNovaEscola = `/admin/escolas/nova?franchisor_id=${id}&returnTo=${encodeURIComponent(returnToEscolas)}`
  const urlUsuarios = `/admin/franqueadores/${id}/usuarios`
  const urlStatus = `/admin/franqueadores/${id}/status`
  const statusAtual = (franqueador?.status || '').toLowerCase()
  const labelBotaoStatus =
    statusAtual === 'pendente' ? 'Aprovar' : statusAtual === 'ativo' ? 'Suspender' : statusAtual === 'suspenso' ? 'Reativar' : null
  const temStudentsCount = escolasData?.data?.some((s) => s.students_count != null)

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Franqueadores', to: '/admin/franqueadores' },
    { label: 'Detalhe' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb}>
      <div style={styles.cardGrande}>
        {/* ——— Cabeçalho ——— */}
        <div style={styles.cabecalho}>
          <div style={styles.cabecalhoEsq}>
            {loadingFranqueador ? (
              <>
                <div style={{ height: 28, width: 280, background: 'var(--cinza-arquibancada)', borderRadius: 4, marginBottom: GRID }} />
                <div style={{ height: 18, width: 120, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
              </>
            ) : errorFranqueador ? null : (
              <>
                <div style={styles.tituloRow}>
                  <h1 style={styles.titulo}>Franqueador: {franqueador?.name || '—'}</h1>
                  {franqueador?._mock && (
                    <span style={styles.badgeMock} title="Dados de demonstração (mock) — excluir ao conectar backend">
                      <IconMock />
                      <span>Demo</span>
                    </span>
                  )}
                </div>
                <p style={styles.subtitulo}>ID: {id}</p>
              </>
            )}
          </div>
          {!loadingFranqueador && !errorFranqueador && (
            <div style={styles.cabecalhoBotoes}>
              {labelBotaoStatus && (
                <Link
                  to={urlStatus}
                  state={{ returnTo: `/admin/franqueadores/${id}?tab=overview` }}
                  style={statusAtual === 'suspenso' ? { ...styles.btnPrimario, background: 'var(--verde-patrocinio)' } : styles.btnPrimario}
                  className="btn-hover"
                >
                  {labelBotaoStatus}
                </Link>
              )}
              <Link to={urlEditar} style={styles.btnPrimario} className="btn-hover">
                Editar franqueador
              </Link>
              <Link to={urlNovaEscola} style={styles.btnPrimario} className="btn-hover">
                Nova escola
              </Link>
              <Link to={urlUsuarios} state={{ returnTo: `/admin/franqueadores/${id}?tab=overview` }} style={styles.btnSecundario} className="btn-hover">
                Ver usuários
              </Link>
            </div>
          )}
        </div>

        {toast && (
          <div
            style={{
              padding: `${GRID * 2}px ${GRID * 3}px`,
              background: 'rgba(76, 203, 138, 0.15)',
              color: 'var(--verde-patrocinio)',
              borderRadius: 'var(--radius)',
              marginBottom: GRID * 3,
              fontSize: 14,
              fontWeight: 500,
            }}
            role="status"
          >
            {toast}
          </div>
        )}

        {/* ——— Abas ——— */}
        <div style={styles.tabs} role="tablist">
          <Link
            to={`/admin/franqueadores/${id}?tab=overview`}
            style={{ ...styles.tab, ...(tabAtivo === 'overview' ? styles.tabAtivo : {}) }}
            role="tab"
            aria-selected={tabAtivo === 'overview'}
          >
            Visão geral
          </Link>
          <Link
            to={`/admin/franqueadores/${id}?tab=schools`}
            style={{ ...styles.tab, ...(tabAtivo === 'schools' ? styles.tabAtivo : {}) }}
            role="tab"
            aria-selected={tabAtivo === 'schools'}
          >
            Escolas vinculadas
          </Link>
        </div>

        {/* ——— Aba Visão geral ——— */}
        {tabAtivo === 'overview' && (
          <>
            {errorFranqueador && (
              <div style={styles.erro}>
                <p style={styles.erroTexto}>{errorFranqueador}</p>
                <div style={{ display: 'flex', gap: GRID * 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={fetchFranqueador}>
                    Recarregar
                  </button>
                  <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={() => navigate('/admin/franqueadores')}>
                    Voltar para lista
                  </button>
                </div>
              </div>
            )}

            {loadingFranqueador && !errorFranqueador && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: GRID * 3 }}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            {!loadingFranqueador && !errorFranqueador && franqueador && (
              <>
                <div style={styles.card}>
                  <h3 style={styles.cardTitulo}>Dados do franqueador</h3>
                  <div style={styles.campoLinha}><span style={styles.campoLabel}>Nome (razão social)</span><span style={styles.campoValor}>{franqueador.name || '—'}</span></div>
                  <div style={styles.campoLinha}><span style={styles.campoLabel}>Nome fantasia</span><span style={styles.campoValor}>{franqueador.trade_name || '—'}</span></div>
                  <div style={styles.campoLinha}><span style={styles.campoLabel}>Nome comercial</span><span style={styles.campoValor}>{franqueador.commercial_name || '—'}</span></div>
                  <div style={styles.campoLinha}><span style={styles.campoLabel}>Responsável</span><span style={styles.campoValor}>{franqueador.owner_name || '—'}</span></div>
                  <div style={styles.campoLinha}><span style={styles.campoLabel}>Email principal</span><span style={styles.campoValor}>{franqueador.email || '—'}</span></div>
                  <div style={styles.campoLinha}><span style={styles.campoLabel}>Telefone</span><span style={styles.campoValor}>{franqueador.phone || '—'}</span></div>
                  <div style={styles.campoLinha}><span style={styles.campoLabel}>Documento</span><span style={styles.campoValor}>{(franqueador.document_type ? `${franqueador.document_type.toUpperCase()}: ` : '')}{franqueador.document || '—'}</span></div>
                  {(franqueador.address_cep || franqueador.address_street || franqueador.address_city) && (
                    <div style={styles.campoLinha}>
                      <span style={styles.campoLabel}>Endereço</span>
                      <span style={styles.campoValor}>
                        {[franqueador.address_street, franqueador.address_number, franqueador.address_complement, franqueador.address_neighborhood, franqueador.address_city, franqueador.address_state, franqueador.address_cep]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </span>
                    </div>
                  )}
                  <div style={styles.campoLinha}><span style={styles.campoLabel}>Status</span><span style={styles.campoValor}><StatusBadge status={franqueador.status} /></span></div>
                  <div style={styles.campoLinha}><span style={styles.campoLabel}>Criado em</span><span style={styles.campoValor}>{formatCreatedAtDateTime(franqueador.created_at)}</span></div>
                </div>
                <div style={styles.card}>
                  <h3 style={styles.cardTitulo}>Resumo</h3>
                  <div style={styles.metricas}>
                    <div>
                      <div style={styles.metrica}>{franqueador.schools_count ?? 0}</div>
                      <div style={styles.metricaLabel}>Total de escolas</div>
                    </div>
                    <div>
                      <div style={styles.metrica}>{franqueador.schools_active_count ?? 0}</div>
                      <div style={styles.metricaLabel}>Escolas ativas</div>
                    </div>
                    <div>
                      <div style={styles.metrica}>{franqueador.schools_pending_count ?? 0}</div>
                      <div style={styles.metricaLabel}>Escolas pendentes</div>
                    </div>
                  </div>
                </div>
                <div style={styles.card}>
                  <h3 style={styles.cardTitulo}>Ações rápidas</h3>
                  <div style={styles.acoesRapidas}>
                    <Link to={`/admin/franqueadores/${id}?tab=schools`} style={styles.linkAcao}>Gerenciar escolas</Link>
                    <Link to={urlNovaEscola} style={styles.linkAcao}>Criar nova escola</Link>
                    <Link to={urlUsuarios} state={{ returnTo: `/admin/franqueadores/${id}?tab=overview` }} style={styles.linkAcao}>Ver usuários do franqueador</Link>
                    <Link to={`/admin/subscriptions?franchisor_id=${id}`} style={styles.linkAcao}>Ver assinaturas</Link>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ——— Aba Escolas vinculadas ——— */}
        {tabAtivo === 'schools' && (
          <>
            <div style={styles.linhaEscolas}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' }}>Escolas vinculadas</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: GRID * 2 }}>
                <Link to={urlNovaEscola} style={styles.btnPrimario} className="btn-hover">Nova escola</Link>
                <div style={styles.buscaWrap}>
                  <span style={styles.buscaIcon} aria-hidden="true"><IconSearch /></span>
                  <input
                    type="search"
                    placeholder="Buscar escola por nome"
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
                    style={styles.buscaInput}
                    aria-label="Buscar escola"
                    disabled={loadingEscolas}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                  style={styles.select}
                  aria-label="Status"
                  disabled={loadingEscolas}
                >
                  <option value="todos">Todos</option>
                  <option value="ativo">Ativa</option>
                  <option value="pendente">Pendente</option>
                  <option value="suspensa">Suspensa</option>
                </select>
              </div>
            </div>

            {errorEscolas && (
              <div style={styles.erro}>
                <p style={styles.erroTexto}>{errorEscolas}</p>
                <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={fetchEscolas}>Recarregar</button>
              </div>
            )}

            {!errorEscolas && (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nome da escola</th>
                      <th style={styles.th}>Cidade/UF</th>
                      <th style={styles.th}>Status</th>
                      {temStudentsCount && <th style={styles.th}>Qtde de alunos</th>}
                      <th style={styles.th}>Criado em</th>
                      <th style={styles.th}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingEscolas && (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 120, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                          <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 80, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                          <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 60, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                          {temStudentsCount && <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 40, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>}
                          <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 80, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                          <td style={styles.td}><span style={{ display: 'inline-block', height: 16, width: 40, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} /></td>
                        </tr>
                      ))
                    )}
                    {!loadingEscolas && escolasData?.data?.length === 0 && (
                      <tr>
                        <td colSpan={temStudentsCount ? 6 : 5} style={styles.tdVazio}>
                          <div style={styles.emptyWrap}>
                            <p style={styles.emptyTitulo}>Este franqueador ainda não possui escolas vinculadas.</p>
                            <Link to={urlNovaEscola} style={styles.btnPrimario} className="btn-hover">Criar primeira escola</Link>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!loadingEscolas && escolasData?.data?.length > 0 && escolasData.data.map((esc) => (
                      <tr key={esc.id}>
                        <td style={styles.td}>{esc.name}</td>
                        <td style={styles.td}>{[esc.city, esc.state].filter(Boolean).join(' / ') || '—'}</td>
                        <td style={styles.td}><StatusBadge status={esc.status} /></td>
                        {temStudentsCount && <td style={styles.td}>{esc.students_count ?? '—'}</td>}
                        <td style={styles.td}>{formatCreatedAt(esc.created_at)}</td>
                        <td style={styles.td}>
                          <div style={styles.acoesCel} data-menu-wrap>
                            <button
                              type="button"
                              style={styles.btnMenu}
                              onClick={() => setMenuAberto(menuAberto === esc.id ? null : esc.id)}
                              aria-haspopup="true"
                              aria-expanded={menuAberto === esc.id}
                              aria-label="Ações"
                            >
                              <IconMore />
                            </button>
                            {menuAberto === esc.id && (
                              <div style={styles.dropdown}>
                                <Link
                                  to={`/admin/escolas/${esc.id}`}
                                  state={{ returnTo: `/admin/franqueadores/${id}?tab=schools` }}
                                  style={styles.dropdownItem}
                                  onClick={() => setMenuAberto(null)}
                                >
                                  Ver detalhe da escola
                                </Link>
                                {(esc.status || '').toLowerCase() === 'ativo' && (
                                  <Link
                                    to={`/admin/escolas/${esc.id}/status`}
                                    state={{ returnTo: `/admin/franqueadores/${id}?tab=schools` }}
                                    style={styles.dropdownItem}
                                    onClick={() => setMenuAberto(null)}
                                  >
                                    Suspender
                                  </Link>
                                )}
                                {(esc.status || '').toLowerCase() === 'suspenso' && (
                                  <Link
                                    to={`/admin/escolas/${esc.id}/status`}
                                    state={{ returnTo: `/admin/franqueadores/${id}?tab=schools` }}
                                    style={styles.dropdownItem}
                                    onClick={() => setMenuAberto(null)}
                                  >
                                    Reativar
                                  </Link>
                                )}
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

            {!errorEscolas && !loadingEscolas && escolasData?.data?.length > 0 && escolasData.total_pages > 0 && (
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
                  <span style={styles.paginaAtual}>Página {page} de {escolasData.total_pages}</span>
                  <button
                    type="button"
                    style={styles.btnPagina}
                    onClick={() => setPage((p) => Math.min(escolasData.total_pages, p + 1))}
                    disabled={page >= escolasData.total_pages}
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
                    disabled={loadingEscolas}
                  >
                    {OPCOES_POR_PAGINA.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
