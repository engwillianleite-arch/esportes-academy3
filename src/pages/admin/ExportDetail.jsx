import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getExport, getDownloadLink, formatExportDate } from '../../api/exports'

const GRID = 8

function typeLabel(value) {
  const map = {
    schools: 'Escolas',
    franchisors: 'Franqueadores',
    subscriptions: 'Assinaturas',
    finance_global: 'Financeiro (global)',
    delinquency: 'Inadimplência',
    kpis_summary: 'KPIs (resumo)',
  }
  return map[value] || value || '—'
}

function statusLabel(value) {
  const map = {
    pending: 'Em fila',
    processing: 'Processando',
    completed: 'Concluída',
    failed: 'Falhou',
    expired: 'Expirada',
  }
  return map[value] || value || '—'
}

export default function ExportDetail() {
  const { export_id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.returnTo || '/admin/exports'

  const [export_, setExport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let cancelled = false
    getExport(export_id)
      .then((data) => { if (!cancelled) setExport(data) })
      .catch((err) => {
        if (!cancelled) {
          const isForbidden = err.status === 403 || (err.message && String(err.message).toLowerCase().includes('permissão'))
          if (isForbidden) setPermissionDenied(true)
          else setError(err.message || 'Exportação não encontrada')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [export_id])

  const canDownload = export_ && export_.status === 'completed' && (!export_.expires_at || new Date(export_.expires_at) > new Date())

  const handleDownload = async () => {
    if (!export_id || !canDownload) return
    setDownloading(true)
    try {
      const { temporary_download_url } = await getDownloadLink(export_id)
      window.open(temporary_download_url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      alert(err.message || 'Não foi possível obter o link de download.')
    } finally {
      setDownloading(false)
    }
  }

  const handleVoltar = () => {
    navigate(returnTo)
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Relatórios Estratégicos', to: '/admin/reports/strategic' },
    { label: 'Exportações', to: '/admin/exports' },
    { label: export_ ? export_.id : 'Detalhes' },
  ]

  if (loading) {
    return (
      <AdminLayout breadcrumb={breadcrumb} pageTitle="Detalhes da exportação">
        <div style={styles.card}>
          <div style={styles.skeleton}>
            <span style={{ display: 'inline-block', height: 24, width: 200, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
            <span style={{ display: 'inline-block', height: 16, width: '80%', background: 'var(--cinza-arquibancada)', borderRadius: 4, marginTop: GRID * 2 }} />
            <span style={{ display: 'inline-block', height: 16, width: '60%', background: 'var(--cinza-arquibancada)', borderRadius: 4, marginTop: GRID }} />
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !export_) {
    return (
      <AdminLayout breadcrumb={breadcrumb} pageTitle="Detalhes da exportação">
        <div style={styles.card}>
          <p style={styles.erroTexto}>{error || 'Exportação não encontrada.'}</p>
          <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={handleVoltar}>
            Voltar
          </button>
        </div>
      </AdminLayout>
    )
  }

  const filtersSummary = export_.filters
    ? Object.entries(export_.filters)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') || '—'
    : (export_.filters_summary || '—')

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Detalhes da exportação">
      <div style={styles.card}>
        <div style={styles.cabecalho}>
          <h2 style={styles.titulo}>Detalhes da exportação</h2>
          <div style={styles.botoes}>
            <button
              type="button"
              style={styles.btnSecundario}
              className="btn-hover"
              onClick={handleVoltar}
            >
              Voltar
            </button>
            {canDownload && (
              <button
                type="button"
                style={styles.btnPrimario}
                className="btn-hover"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? 'Abrindo…' : 'Baixar'}
              </button>
            )}
          </div>
        </div>

        <dl style={styles.dl}>
          <div style={styles.row}>
            <dt style={styles.dt}>ID</dt>
            <dd style={styles.dd}>{export_.id}</dd>
          </div>
          <div style={styles.row}>
            <dt style={styles.dt}>Tipo</dt>
            <dd style={styles.dd}>{typeLabel(export_.type)}</dd>
          </div>
          <div style={styles.row}>
            <dt style={styles.dt}>Status</dt>
            <dd style={styles.dd}>{statusLabel(export_.status)}</dd>
          </div>
          <div style={styles.row}>
            <dt style={styles.dt}>Solicitado por</dt>
            <dd style={styles.dd}>{export_.requested_by || '—'}</dd>
          </div>
          <div style={styles.row}>
            <dt style={styles.dt}>Solicitado em</dt>
            <dd style={styles.dd}>{formatExportDate(export_.requested_at)}</dd>
          </div>
          <div style={styles.row}>
            <dt style={styles.dt}>Filtros</dt>
            <dd style={styles.dd}>{filtersSummary}</dd>
          </div>
          {export_.row_count != null && (
            <div style={styles.row}>
              <dt style={styles.dt}>Quantidade de linhas</dt>
              <dd style={styles.dd}>{export_.row_count.toLocaleString('pt-BR')}</dd>
            </div>
          )}
          {export_.expires_at && (
            <div style={styles.row}>
              <dt style={styles.dt}>Expira em</dt>
              <dd style={styles.dd}>{formatExportDate(export_.expires_at)}</dd>
            </div>
          )}
          {export_.status === 'failed' && export_.error_message && (
            <div style={styles.row}>
              <dt style={styles.dt}>Erro</dt>
              <dd style={styles.ddErro}>{export_.error_message}</dd>
            </div>
          )}
        </dl>
      </div>
    </AdminLayout>
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
  cabecalho: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 3,
    marginBottom: GRID * 4,
  },
  titulo: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  botoes: {
    display: 'flex',
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
  dl: {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 2,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
    alignItems: 'baseline',
  },
  dt: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    minWidth: 160,
  },
  dd: {
    margin: 0,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    flex: 1,
  },
  ddErro: {
    margin: 0,
    fontSize: 14,
    color: '#dc3545',
    flex: 1,
  },
  erroTexto: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
  },
}
