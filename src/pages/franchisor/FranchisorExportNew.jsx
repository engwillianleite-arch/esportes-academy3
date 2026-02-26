import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import { createFranchisorExport, getFranchisorExportTypes } from '../../api/franchisorExports'
import { getFranchisorMe, getFranchisorSchools, getFranchisorCampaigns } from '../../api/franchisorPortal'

const GRID = 8
const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

const PERIOD_OPTIONS = [
  { value: 'este_mes', label: 'Este mês' },
  { value: 'ultimos_30', label: 'Últimos 30 dias' },
  { value: 'personalizado', label: 'Personalizado (de/até)' },
]

const FORMAT_OPTIONS = [
  { value: 'CSV', label: 'CSV' },
  { value: 'PDF', label: 'PDF' },
]

function getDefaultFromTo(period, fromParam, toParam) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  let from, to
  if (period === 'este_mes') {
    from = new Date(today.getFullYear(), today.getMonth(), 1)
    to = new Date(today)
  } else if (period === 'ultimos_30') {
    to = new Date(today)
    from = new Date(today)
    from.setDate(from.getDate() - 30)
  } else {
    from = fromParam ? new Date(fromParam) : new Date(today.getFullYear(), today.getMonth(), 1)
    to = toParam ? new Date(toParam) : new Date(today)
  }
  const fmt = (d) => (d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '')
  return { from: fmt(from), to: fmt(to) }
}

export default function FranchisorExportNew() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const typeFromUrl = searchParams.get('type') || ''
  const fromUrl = searchParams.get('from') || ''
  const toUrl = searchParams.get('to') || ''
  const schoolIdFromUrl = searchParams.get('school_id') || ''
  const campaignIdFromUrl = searchParams.get('campaign_id') || ''
  const periodFromUrl = searchParams.get('period') || 'este_mes'

  const { from: defaultFrom, to: defaultTo } = getDefaultFromTo(periodFromUrl, fromUrl, toUrl)

  const [types, setTypes] = useState([])
  const [schools, setSchools] = useState([])
  const [campaigns, setCampaigns] = useState([])

  const [type, setType] = useState(typeFromUrl || '')
  const [format, setFormat] = useState('CSV')
  const [period, setPeriod] = useState(periodFromUrl)
  const [from, setFrom] = useState(fromUrl || defaultFrom)
  const [to, setTo] = useState(toUrl || defaultTo)
  const [schoolId, setSchoolId] = useState(schoolIdFromUrl)
  const [campaignId, setCampaignId] = useState(campaignIdFromUrl)

  useEffect(() => {
    setSchoolId(schoolIdFromUrl)
  }, [schoolIdFromUrl])

  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((me) => {
        if (!cancelled && !ALLOWED_ROLES.includes(me.user_role)) setPermissionDenied(true)
      })
      .catch(() => { if (!cancelled) setPermissionDenied(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=franchisor', { replace: true })
    }
  }, [permissionDenied, navigate])

  useEffect(() => {
    let cancelled = false
    getFranchisorExportTypes()
      .then((list) => { if (!cancelled) setTypes(list) })
      .catch(() => { if (!cancelled) setTypes([]) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    getFranchisorSchools()
      .then((res) => { if (!cancelled) setSchools(res.items || []) })
      .catch(() => { if (!cancelled) setSchools([]) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    getFranchisorCampaigns({ page: 1, page_size: 200 })
      .then((res) => { if (!cancelled) setCampaigns(res.items || []) })
      .catch(() => { if (!cancelled) setCampaigns([]) })
    return () => { cancelled = true }
  }, [])

  const selectedTypeConfig = types.find((t) => t.value === type)
  const formatOptionsForType = selectedTypeConfig?.formats?.length
    ? FORMAT_OPTIONS.filter((f) => selectedTypeConfig.formats.includes(f.value))
    : FORMAT_OPTIONS

  const { from: queryFrom, to: queryTo } = getDefaultFromTo(period, from, to)

  const needsSchool = type === 'SCHOOL_REPORT'
  const needsCampaign = type === 'CAMPAIGN_RESULTS'
  const showSchoolSelect = type === 'CONSOLIDATED_REPORT' || type === 'SCHOOL_REPORT'
  const showCampaignSelect = type === 'CAMPAIGN_RESULTS'

  const canSubmit =
    type &&
    format &&
    (queryFrom && queryTo) &&
    (!needsSchool || schoolId) &&
    (!needsCampaign || campaignId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setPermissionDenied(false)
    setToast(null)
    try {
      const payload = {
        type,
        format,
        filters: {
          from: queryFrom,
          to: queryTo,
          school_id: schoolId || undefined,
          campaign_id: campaignId || undefined,
        },
      }
      const { export_id } = await createFranchisorExport(payload)
      setToast('Exportação solicitada!')
      setTimeout(() => {
        navigate(`/franchisor/exports`, { replace: true })
      }, 1200)
    } catch (err) {
      const isForbidden = err.status === 403 || (err.message && String(err.message).toLowerCase().includes('permissão'))
      if (isForbidden) setPermissionDenied(true)
      else setToast(err.message || 'Não foi possível criar a exportação.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    const returnTo = searchParams.get('returnTo')
    navigate(returnTo || '/franchisor/exports')
  }

  if (permissionDenied) return null

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Relatórios', to: '/franchisor/reports' },
    { label: 'Exportações', to: '/franchisor/exports' },
    { label: 'Nova exportação' },
  ]

  return (
    <FranchisorLayout pageTitle="Nova exportação" breadcrumb={breadcrumb}>
      <div style={styles.card}>
        <div style={styles.cabecalho}>
          <h2 style={styles.titulo}>Nova exportação</h2>
          <div style={styles.botoes}>
            <button
              type="button"
              style={styles.btnSecundario}
              className="btn-hover"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-export-franchisor"
              style={styles.btnPrimario}
              className="btn-hover"
              disabled={loading || !canSubmit}
            >
              {loading ? 'Gerando…' : 'Gerar exportação'}
            </button>
          </div>
        </div>

        {toast && (
          <div style={toast.includes('solicitada') ? styles.toastSuccess : styles.toastError}>
            {toast}
          </div>
        )}

        <p style={styles.aviso}>
          A exportação pode levar alguns minutos. Você poderá baixar quando estiver pronta.
        </p>

        <form id="form-export-franchisor" onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.campo}>
            <label style={styles.label}>
              Tipo de exportação <span style={styles.obrigatorio}>*</span>
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                if (e.target.value !== 'SCHOOL_REPORT') setSchoolId('')
                if (e.target.value !== 'CAMPAIGN_RESULTS') setCampaignId('')
              }}
              style={styles.select}
              required
              aria-label="Tipo de exportação"
              disabled={loading}
            >
              <option value="">Selecione</option>
              {types.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>
              Formato <span style={styles.obrigatorio}>*</span>
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={styles.select}
              required
              aria-label="Formato"
              disabled={loading}
            >
              {formatOptionsForType.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Período <span style={styles.obrigatorio}>*</span></label>
            <div style={styles.row}>
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value)
                  const { from: f, to: t } = getDefaultFromTo(e.target.value, from, to)
                  setFrom(f)
                  setTo(t)
                }}
                style={styles.select}
                aria-label="Período"
                disabled={loading}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {period === 'personalizado' && (
                <>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    style={styles.inputDate}
                    disabled={loading}
                    aria-label="De"
                  />
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    style={styles.inputDate}
                    disabled={loading}
                    aria-label="Até"
                  />
                </>
              )}
            </div>
          </div>

          {showSchoolSelect && (
            <div style={styles.campo}>
              <label style={styles.label}>
                Escola {needsSchool && <span style={styles.obrigatorio}>*</span>}
              </label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                style={styles.select}
                required={needsSchool}
                aria-label="Escola"
                disabled={loading}
              >
                <option value="">Todas</option>
                {schools.map((s) => (
                  <option key={s.school_id} value={s.school_id}>{s.school_name}</option>
                ))}
              </select>
            </div>
          )}

          {showCampaignSelect && (
            <div style={styles.campo}>
              <label style={styles.label}>
                Campanha <span style={styles.obrigatorio}>*</span>
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                style={styles.select}
                required
                aria-label="Campanha"
                disabled={loading}
              >
                <option value="">Selecione</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}
        </form>
      </div>
    </FranchisorLayout>
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
    marginBottom: GRID * 3,
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
  toastSuccess: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: 'rgba(76, 203, 138, 0.15)',
    color: 'var(--verde-patrocinio)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
  },
  toastError: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: 'rgba(220, 53, 69, 0.1)',
    color: '#dc3545',
    borderRadius: 'var(--radius)',
    fontSize: 14,
  },
  aviso: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID * 3,
    maxWidth: 480,
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  obrigatorio: { color: '#dc3545' },
  select: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    minWidth: 200,
    outline: 'none',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  inputDate: {
    padding: `${GRID * 2}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
  },
}
