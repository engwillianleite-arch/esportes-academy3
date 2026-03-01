import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'

// ——— Dados mockados ———
const MOCK_KPIS = {
  franqueadores: { total: 12, crescimento: 2 },
  escolas: { total: 87, pendentes: 3 },
  alunos: { total: 4326, crescimentoPct: 8 },
  receita: { valor: 1284540, crescimentoPct: 12 },
}

const MOCK_ESCOLAS_PENDENTES = [
  { id: 1, nome: 'Arena Kids São Paulo', cidade: 'São Paulo', franqueador: 'Rede Arena', franchisor_id: '1', data: '10/02/2026', status: 'Pendente' },
  { id: 2, nome: 'Escola Futuro Atleta', cidade: 'Curitiba', franqueador: 'Brasil Sports', franchisor_id: '2', data: '12/02/2026', status: 'Pendente' },
  { id: 3, nome: 'Centro Esportivo Alpha', cidade: 'Recife', franqueador: 'Rede Arena', franchisor_id: '1', data: '14/02/2026', status: 'Em análise' },
]

const MOCK_REGIOES = [
  { nome: 'Sudeste', escolas: 42 },
  { nome: 'Sul', escolas: 18 },
  { nome: 'Nordeste', escolas: 14 },
  { nome: 'Centro-Oeste', escolas: 8 },
  { nome: 'Norte', escolas: 5 },
]

const MOCK_ALERTAS = [
  { id: 1, data: '24/02/2026 09:15', usuario: 'Sistema', acao: 'Franqueador "Rede Arena" criou nova escola', tipo: 'criacao', icon: 'school' },
  { id: 2, data: '24/02/2026 08:42', usuario: 'Escola Alpha Sports', acao: 'Alterou plano financeiro', tipo: 'alteracao', icon: 'edit' },
  { id: 3, data: '23/02/2026 18:30', usuario: 'Admin', acao: 'Alterou plano da franquia Brasil Sports', tipo: 'admin', icon: 'admin' },
]

// ——— Ícones SVG inline (evitar dependência) ———
const IconFranqueador = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)
const IconEscola = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
)
const IconAlunos = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconReceita = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)
const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
)
const IconMap = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v20M16 2v20M2 8h6M2 16h6M16 8h6M16 16h6M8 8h8v8H8z"/></svg>
)

function formatReceita(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n)
}

export default function AdminDashboard() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [buscaPendentes, setBuscaPendentes] = useState('')
  const [filtroFranqueador, setFiltroFranqueador] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setMenuAberto(false)
    }
    if (menuAberto) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [menuAberto])

  const escolasFiltradas = MOCK_ESCOLAS_PENDENTES.filter(e => {
    const matchBusca = !buscaPendentes || e.nome.toLowerCase().includes(buscaPendentes.toLowerCase()) || e.cidade.toLowerCase().includes(buscaPendentes.toLowerCase())
    const matchFranq = !filtroFranqueador || e.franqueador === filtroFranqueador
    const matchStatus = !filtroStatus || e.status === filtroStatus
    return matchBusca && matchFranq && matchStatus
  })

  const franqueadoresUnicos = [...new Set(MOCK_ESCOLAS_PENDENTES.map(e => e.franqueador))]
  const statusUnicos = [...new Set(MOCK_ESCOLAS_PENDENTES.map(e => e.status))]

  return (
    <AdminLayout pageTitle="Painel Administrativo">
      <div style={styles.main}>
        {/* 2. KPIs */}
        <section style={styles.section} aria-label="Indicadores estratégicos">
          <div className="admin-kpi-grid" style={styles.kpiGrid}>
            <Link to="/admin/franqueadores" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={styles.card} className="btn-hover">
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitulo}>Franqueadores</span>
                  <span style={styles.cardIcon}><IconFranqueador /></span>
                </div>
                <div style={styles.kpiValor}>12</div>
                <div style={styles.kpiMeta}>
                  <span style={styles.kpiPositivo}>+2</span> este mês
                </div>
                <div style={styles.tendenciaBar}><span style={{ ...styles.tendenciaFill, width: '70%' }} /></div>
              </div>
            </Link>

            <Link to="/admin/escolas" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={styles.card} className="btn-hover">
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitulo}>Escolas Ativas</span>
                  <span style={styles.cardIcon}><IconEscola /></span>
                </div>
                <div style={styles.kpiValor}>87</div>
                <div style={styles.kpiMeta}>
                  <span style={styles.badgePendente}>3 Pendentes</span>
                </div>
                <div style={styles.tendenciaBar}><span style={{ ...styles.tendenciaFill, width: '85%' }} /></div>
              </div>
            </Link>

            <Link to="/admin/reports/strategic" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={styles.card} className="btn-hover">
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitulo}>Alunos Ativos</span>
                  <span style={styles.cardIcon}><IconAlunos /></span>
                </div>
                <div style={styles.kpiValor}>4.326</div>
                <div style={styles.kpiMeta}>
                  <span style={styles.kpiPositivo}>+8%</span> este mês
                </div>
                <div style={styles.tendenciaBar}><span style={{ ...styles.tendenciaFill, width: '60%' }} /></div>
              </div>
            </Link>

            <Link to="/admin/finance/global" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={styles.card} className="btn-hover">
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitulo}>Receita Consolidada</span>
                  <span style={styles.cardIcon}><IconReceita /></span>
                </div>
                <div style={styles.kpiValorDestaque}>{formatReceita(MOCK_KPIS.receita.valor)}</div>
                <div style={styles.kpiMeta}>
                  <span style={styles.kpiPositivo}>+12%</span> este mês
                </div>
                <div style={styles.tendenciaBar}><span style={{ ...styles.tendenciaFill, width: '90%' }} /></div>
              </div>
            </Link>
          </div>
        </section>

        {/* 3. Escolas Pendentes */}
        <section style={styles.section} aria-label="Escolas pendentes de aprovação">
          <div style={styles.cardGrande}>
            <h2 style={styles.cardGrandeTitulo}>Escolas Pendentes de Aprovação</h2>
            <div style={styles.filtros}>
              <div style={styles.buscaWrap}>
                <span style={styles.buscaIcon}><IconSearch /></span>
                <input
                  type="search"
                  placeholder="Buscar por nome ou cidade..."
                  value={buscaPendentes}
                  onChange={e => setBuscaPendentes(e.target.value)}
                  style={styles.buscaInput}
                />
              </div>
              <select
                value={filtroFranqueador}
                onChange={e => setFiltroFranqueador(e.target.value)}
                style={styles.select}
                aria-label="Filtrar por franqueador"
              >
                <option value="">Todos os franqueadores</option>
                {franqueadoresUnicos.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                style={styles.select}
                aria-label="Filtrar por status"
              >
                <option value="">Todos os status</option>
                {statusUnicos.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome da Escola</th>
                    <th style={styles.th}>Cidade</th>
                    <th style={styles.th}>Franqueador</th>
                    <th style={styles.th}>Data de Solicitação</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {escolasFiltradas.map(esc => (
                    <tr key={esc.id}>
                      <td style={styles.td}>{esc.nome}</td>
                      <td style={styles.td}>{esc.cidade}</td>
                      <td style={styles.td}>
                        {esc.franchisor_id ? (
                          <Link to={`/admin/franqueadores/${esc.franchisor_id}`} style={styles.linkFranqueador}>
                            {esc.franqueador}
                          </Link>
                        ) : (
                          esc.franqueador
                        )}
                      </td>
                      <td style={styles.td}>{esc.data}</td>
                      <td style={styles.td}>
                        <span style={esc.status === 'Em análise' ? styles.statusAnalise : styles.statusPendente}>
                          {esc.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.acoes}>
                          <button style={styles.btnAprovar} className="btn-hover">Aprovar</button>
                          <button style={styles.btnRejeitar} className="btn-hover">Rejeitar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. Mapa / Distribuição + 5. Alertas (lado a lado em desktop) */}
        <div className="admin-grid-2" style={styles.grid2Col}>
          <section style={styles.section} aria-label="Distribuição geográfica">
            <div style={styles.cardGrande}>
              <h2 style={styles.cardGrandeTitulo}>
                <span style={{ marginRight: 8, verticalAlign: 'middle' }}><IconMap /></span>
                Distribuição por Região
              </h2>
              <div className="admin-mapa-layout" style={styles.mapaLayout}>
                <div style={styles.mapaPlaceholder}>
                  <span style={styles.mapaPlaceholderText}>Mapa (mock)</span>
                  <span style={styles.mapaPlaceholderSub}>Distribuição por estado</span>
                </div>
                <ul style={styles.regiaoLista}>
                  {MOCK_REGIOES.map(r => (
                    <li key={r.nome} style={styles.regiaoItem}>
                      <span style={styles.regiaoNome}>{r.nome}</span>
                      <span style={styles.regiaoNum}>{r.escolas} escolas</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section style={styles.section} aria-label="Alertas e auditoria">
            <div style={styles.cardGrande}>
              <h2 style={styles.cardGrandeTitulo}>Alertas e Auditoria Recente</h2>
              <ul style={styles.alertasLista}>
                {MOCK_ALERTAS.map(a => (
                  <li key={a.id} style={styles.alertaItem}>
                    <div style={styles.alertaIconWrap}>
                      <span style={styles.alertaIcon}>{a.icon === 'school' ? '🏫' : a.icon === 'edit' ? '✏️' : '⚙️'}</span>
                    </div>
                    <div style={styles.alertaConteudo}>
                      <div style={styles.alertaData}>{a.data}</div>
                      <div style={styles.alertaAcao}>{a.acao}</div>
                      <div style={styles.alertaUsuario}>{a.usuario}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}

const GRID = 8
const styles = {
  layout: {
    minHeight: '100vh',
    background: 'var(--cinza-arquibancada)',
  },
  header: {
    background: 'var(--branco-luz)',
    boxShadow: 'var(--shadow)',
    padding: `${GRID * 3}px ${GRID * 4}px`,
  },
  headerContent: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    maxWidth: 1400,
    margin: '0 auto',
  },
  titulo: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  subtitulo: {
    margin: '4px 0 0',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  headerAcoes: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
    flexWrap: 'wrap',
  },
  buscaGlobal: {
    padding: `${GRID}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    width: 200,
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
  avatarWrap: { position: 'relative' },
  avatarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--azul-arena)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 600,
  },
  avatarChevron: { color: 'var(--grafite-tecnico)', display: 'flex' },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    border: '1px solid #E5E5E7',
    minWidth: 140,
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
  main: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: GRID * 4,
  },
  section: { marginBottom: GRID * 4 },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: GRID * 3,
  },
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: GRID * 2,
  },
  cardTitulo: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  cardIcon: {
    color: 'var(--azul-arena)',
    opacity: 0.9,
  },
  kpiValor: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  kpiValorDestaque: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  kpiMeta: {
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
    marginTop: 4,
  },
  kpiPositivo: { color: 'var(--verde-patrocinio)', fontWeight: 600 },
  badgePendente: {
    display: 'inline-block',
    background: 'var(--azul-arena)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  tendenciaBar: {
    height: 4,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 2,
    marginTop: GRID * 2,
    overflow: 'hidden',
  },
  tendenciaFill: {
    display: 'block',
    height: '100%',
    background: 'var(--verde-patrocinio)',
    borderRadius: 2,
  },
  cardGrande: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cardGrandeTitulo: {
    margin: '0 0 ' + (GRID * 3) + 'px',
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  buscaWrap: {
    position: 'relative',
    flex: '1 1 240px',
  },
  buscaIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--grafite-tecnico)',
    opacity: 0.6,
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
    minWidth: 180,
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
  linkFranqueador: {
    color: 'var(--azul-arena)',
    fontWeight: 500,
    textDecoration: 'none',
  },
  statusPendente: {
    color: 'var(--azul-arena)',
    fontWeight: 500,
  },
  statusAnalise: {
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  acoes: { display: 'flex', gap: GRID },
  btnAprovar: {
    background: 'var(--verde-patrocinio)',
    color: '#fff',
    border: 'none',
    padding: `${GRID}px ${GRID * 2}px`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnRejeitar: {
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #ccc',
    padding: `${GRID}px ${GRID * 2}px`,
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: GRID * 4,
  },
  mapaLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 200px',
    gap: GRID * 4,
    alignItems: 'start',
  },
  mapaPlaceholder: {
    aspectRatio: '16/10',
    background: 'var(--cinza-arquibancada)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--grafite-tecnico)',
    opacity: 0.7,
  },
  mapaPlaceholderText: { fontSize: 16, fontWeight: 600 },
  mapaPlaceholderSub: { fontSize: 13, marginTop: 4 },
  regiaoLista: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  regiaoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${GRID * 2}px 0`,
    borderBottom: '1px solid #eee',
    fontSize: 14,
  },
  regiaoNome: { fontWeight: 500 },
  regiaoNum: { color: 'var(--azul-arena)', fontWeight: 600 },
  alertasLista: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  alertaItem: {
    display: 'flex',
    gap: GRID * 2,
    padding: `${GRID * 2}px 0`,
    borderBottom: '1px solid #eee',
  },
  alertaIconWrap: { flexShrink: 0 },
  alertaIcon: { fontSize: 20 },
  alertaConteudo: { flex: 1, minWidth: 0 },
  alertaData: { fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.7 },
  alertaAcao: { fontSize: 14, fontWeight: 500, marginTop: 2 },
  alertaUsuario: { fontSize: 12, opacity: 0.8, marginTop: 2 },
}
