import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import {
  getSchoolById,
  getSchoolSummary,
  formatCreatedAtDateTime,
} from '../../api/franqueadores'

const GRID = 8

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const label = s === 'ativo' ? 'Ativa' : s === 'pendente' ? 'Pendente' : s === 'suspenso' ? 'Suspensa' : s || '—'
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
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        ...estilo,
      }}
    >
      {label}
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
  card: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cardTitulo: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  cabecalho: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 3,
    marginBottom: GRID * 4,
  },
  cabecalhoEsq: {
    flex: '1 1 300px',
  },
  titulo: {
    margin: '0 0 ' + GRID + 'px',
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  cabecalhoAcoes: {
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
    textDecoration: 'none',
    display: 'inline-block',
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
    textDecoration: 'none',
    display: 'inline-block',
  },
  linkTerciario: {
    color: 'var(--azul-arena)',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
  },
  linha: {
    marginBottom: GRID * 2,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  label: {
    opacity: 0.75,
    marginRight: GRID,
  },
  gridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: GRID * 3,
    marginBottom: GRID * 4,
  },
  metrica: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    marginBottom: GRID * 0.5,
  },
  metricaLabel: {
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
  },
  secaoTitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  secaoTexto: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  observacao: {
    margin: 0,
    fontSize: 12,
    color: 'var(--grafite-tecnico)',
    opacity: 0.65,
  },
  alertaErro: {
    background: 'rgba(220, 53, 69, 0.08)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    marginBottom: GRID * 3,
    color: '#721c24',
  },
  botoesErro: {
    display: 'flex',
    gap: GRID * 2,
    marginTop: GRID * 2,
  },
  vinculoItem: {
    marginBottom: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
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
}

export default function DetalheEscola() {
  const { id: schoolId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = location.state?.returnTo || '/admin/escolas'

  const [school, setSchool] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [toast, setToast] = useState(location.state?.toast || null)

  const load = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const [schoolData, summaryData] = await Promise.all([
        getSchoolById(schoolId),
        getSchoolSummary(schoolId),
      ])
      setSchool(schoolData)
      setSummary(summaryData)
    } catch (e) {
      if (e.status === 403) {
        setPermissionDenied(true)
      } else {
        setError(e?.message || 'Não foi possível carregar os dados da escola.')
      }
    } finally {
      setLoading(false)
    }
  }, [schoolId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado', { replace: true })
    }
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleVoltar = () => {
    navigate(returnTo)
  }

  const breadcrumb = [
    { label: 'Escolas', to: returnTo },
    { label: 'Detalhe' },
  ]

  const urlEditar = `/admin/escolas/editar/${schoolId}`
  const stateEditar = { returnTo: `/admin/escolas/${schoolId}` }
  const urlFranqueador = school?.franchisor_id
    ? `/admin/franqueadores/${school.franchisor_id}?tab=overview`
    : '#'
  const urlPortalEscola = `/school?school_id=${schoolId}`
  const urlStatus = `/admin/escolas/${schoolId}/status`
  const stateStatus = { returnTo: `/admin/escolas/${schoolId}` }
  const statusLower = (school?.status || '').toLowerCase()
  const podeSuspender = statusLower === 'ativo'
  const podeReativar = statusLower === 'suspenso'
  const escolaSuspensa = statusLower === 'suspenso'

  if (permissionDenied) return null

  return (
    <AdminLayout breadcrumb={breadcrumb}>
      {toast && <div style={styles.toast} role="status">{toast}</div>}
      {error && (
        <div style={styles.alertaErro} role="alert">
          <strong>Não foi possível carregar os dados da escola.</strong>
          <div style={styles.botoesErro}>
            <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={load}>
              Recarregar
            </button>
            <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={handleVoltar}>
              Voltar
            </button>
          </div>
        </div>
      )}

      {!error && loading && (
        <>
          <div style={styles.cabecalho}>
            <div style={styles.cabecalhoEsq}>
              <div style={{ height: 28, background: 'var(--cinza-arquibancada)', borderRadius: 4, width: 280, marginBottom: GRID }} />
              <div style={{ height: 24, background: 'var(--cinza-arquibancada)', borderRadius: 4, width: 120 }} />
            </div>
            <div style={{ display: 'flex', gap: GRID * 2 }}>
              <div style={{ height: 40, width: 160, background: 'var(--cinza-arquibancada)', borderRadius: 8 }} />
              <div style={{ height: 40, width: 120, background: 'var(--cinza-arquibancada)', borderRadius: 8 }} />
            </div>
          </div>
          <div style={styles.gridCards}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </>
      )}

      {!error && !loading && school && (
        <>
          {/* 1) Cabeçalho */}
          <div style={styles.cabecalho}>
            <div style={styles.cabecalhoEsq}>
              <h2 style={styles.titulo}>Escola: {school.name}</h2>
              <StatusBadge status={school.status} />
            </div>
            <div style={styles.cabecalhoAcoes}>
              <Link to={urlPortalEscola} style={styles.btnPrimario} className="btn-hover">
                Abrir portal da escola
              </Link>
              {escolaSuspensa && (
                <span style={{ fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>Escola suspensa</span>
              )}
              {podeSuspender && (
                <Link to={urlStatus} state={stateStatus} style={{ ...styles.btnSecundario, borderColor: '#dc3545', color: '#dc3545' }} className="btn-hover">
                  Suspender
                </Link>
              )}
              {podeReativar && (
                <Link to={urlStatus} state={stateStatus} style={styles.btnSecundario} className="btn-hover">
                  Reativar
                </Link>
              )}
              <Link to={urlEditar} state={stateEditar} style={styles.btnSecundario} className="btn-hover">
                Editar escola
              </Link>
              <Link to={urlFranqueador} style={styles.linkTerciario} className="btn-hover">
                Abrir franqueador
              </Link>
              <Link to={`/admin/subscriptions?school_id=${schoolId}`} style={styles.linkTerciario} className="btn-hover">
                Ver assinaturas
              </Link>
            </div>
          </div>

          {/* 2) Cards principais */}
          <div style={styles.gridCards}>
            {/* Card A — Dados da escola */}
            <div style={styles.card}>
              <h3 style={styles.cardTitulo}>Dados da escola</h3>
              <div style={styles.linha}><span style={styles.label}>Nome:</span>{school.name}</div>
              <div style={styles.linha}>
                <span style={styles.label}>Franqueador:</span>
                {school.franchisor_name}
                {school.franchisor_id && (
                  <>
                    {' · '}
                    <Link to={urlFranqueador} style={styles.linkTerciario}>Abrir franqueador</Link>
                  </>
                )}
              </div>
              {(school.city || school.state) && (
                <div style={styles.linha}>
                  <span style={styles.label}>Cidade/UF:</span>
                  {[school.city, school.state].filter(Boolean).join(' / ')}
                </div>
              )}
              {school.address && <div style={styles.linha}><span style={styles.label}>Endereço:</span>{school.address}</div>}
              {(school.email || school.phone) && (
                <div style={styles.linha}>
                  <span style={styles.label}>Contato:</span>
                  {[school.email, school.phone].filter(Boolean).join(' · ')}
                </div>
              )}
              <div style={styles.linha}><span style={styles.label}>Status:</span><StatusBadge status={school.status} /></div>
              <div style={styles.linha}><span style={styles.label}>Criado em:</span>{formatCreatedAtDateTime(school.created_at)}</div>
            </div>

            {/* Card B — Resumo operacional */}
            <div style={styles.card}>
              <h3 style={styles.cardTitulo}>Resumo operacional</h3>
              {summary && (summary.students_count != null || summary.teams_count != null || summary.open_invoices_count != null) ? (
                <>
                  {summary.students_count != null && (
                    <div style={{ marginBottom: GRID * 2 }}>
                      <div style={styles.metrica}>{summary.students_count}</div>
                      <div style={styles.metricaLabel}>Total de alunos</div>
                    </div>
                  )}
                  {summary.teams_count != null && (
                    <div style={{ marginBottom: GRID * 2 }}>
                      <div style={styles.metrica}>{summary.teams_count}</div>
                      <div style={styles.metricaLabel}>Total de turmas</div>
                    </div>
                  )}
                  {summary.open_invoices_count != null && (
                    <div>
                      <div style={styles.metrica}>{summary.open_invoices_count}</div>
                      <div style={styles.metricaLabel}>Mensalidades em aberto</div>
                    </div>
                  )}
                </>
              ) : (
                <p style={styles.secaoTexto}>Resumo indisponível no momento.</p>
              )}
            </div>

            {/* Card C — Ações rápidas */}
            <div style={styles.card}>
              <h3 style={styles.cardTitulo}>Ações rápidas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: GRID * 2 }}>
                <Link to={`/admin/escolas/${schoolId}/usuarios`} state={{ returnTo: `/admin/escolas/${schoolId}` }} style={styles.linkTerciario}>Usuários da escola</Link>
                <Link to={urlStatus} state={stateStatus} style={styles.linkTerciario}>
                  {podeSuspender ? 'Suspender escola' : podeReativar ? 'Reativar escola' : 'Status da escola'}
                </Link>
                <Link to={urlPortalEscola} style={styles.linkTerciario}>Ver no Portal Escola{escolaSuspensa ? ' (escola suspensa)' : ''}</Link>
                <Link to={urlEditar} style={styles.linkTerciario}>Editar cadastro da escola</Link>
                <Link to={urlFranqueador} style={styles.linkTerciario}>Ver franqueador</Link>
              </div>
            </div>
          </div>

          {/* 3) Acesso rápido ao contexto */}
          <div style={{ ...styles.card, marginBottom: GRID * 3 }}>
            <h3 style={styles.secaoTitulo}>Acesso rápido ao contexto</h3>
            <p style={styles.secaoTexto}>
              Você está visualizando como Admin. Acesse a operação da escola no portal específico.
            </p>
            <Link to={urlPortalEscola} style={styles.btnPrimario} className="btn-hover">
              Abrir portal da escola
            </Link>
            {escolaSuspensa && <p style={{ ...styles.observacao, color: '#dc3545', marginTop: GRID }}>Escola suspensa — usuários da escola não têm acesso ao Portal Escola.</p>}
            <p style={styles.observacao}>O acesso é controlado por permissões no backend.</p>
          </div>

          {/* 4) Informações de vínculo */}
          <div style={styles.card}>
            <h3 style={styles.secaoTitulo}>Informações de vínculo</h3>
            <div style={styles.vinculoItem}><span style={styles.label}>franchisor_id:</span> {school.franchisor_id}</div>
            <div style={styles.vinculoItem}><span style={styles.label}>Franqueador:</span> {school.franchisor_name}</div>
            <div style={styles.vinculoItem}><span style={styles.label}>school_id:</span> {school.id}</div>
            {school.org_id != null && (
              <div style={styles.vinculoItem}><span style={styles.label}>org_id:</span> {school.org_id}</div>
            )}
          </div>
        </>
      )}

      {!error && !loading && !school && !permissionDenied && (
        <div style={styles.alertaErro} role="alert">
          <strong>Escola não encontrada.</strong>
          <div style={styles.botoesErro}>
            <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={handleVoltar}>
              Voltar
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
