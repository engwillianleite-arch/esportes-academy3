import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { createExport, getExportTypes } from '../../api/exports'
import { listFranqueadores, listEscolas } from '../../api/franqueadores'

const GRID = 8

const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_30', label: 'Últimos 30 dias' },
  { value: 'custom', label: 'Personalizado' },
]

function getDefaultFromTo(period, fromParam, toParam) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  let from, to
  if (period === 'this_month') {
    from = new Date(today.getFullYear(), today.getMonth(), 1)
    to = new Date(today)
  } else if (period === 'last_30') {
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

export default function ExportNew() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const typeFromUrl = searchParams.get('type') || ''
  const fromUrl = searchParams.get('from') || ''
  const toUrl = searchParams.get('to') || ''
  const franchisorIdFromUrl = searchParams.get('franchisor_id') || ''
  const schoolIdFromUrl = searchParams.get('school_id') || ''
  const periodFromUrl = searchParams.get('period') || 'this_month'

  const { from: defaultFrom, to: defaultTo } = getDefaultFromTo(periodFromUrl, fromUrl, toUrl)

  const [types, setTypes] = useState([])
  const [type, setType] = useState(typeFromUrl || '')
  const [period, setPeriod] = useState(periodFromUrl)
  const [from, setFrom] = useState(fromUrl || defaultFrom)
  const [to, setTo] = useState(toUrl || defaultTo)
  const [franchisorId, setFranchisorId] = useState(franchisorIdFromUrl)
  const [schoolId, setSchoolId] = useState(schoolIdFromUrl)
  const [statusFilter, setStatusFilter] = useState('')

  const [franqueadores, setFranqueadores] = useState([])
  const [escolas, setEscolas] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    let cancelled = false
    getExportTypes()
      .then((list) => { if (!cancelled) setTypes(list) })
      .catch(() => { if (!cancelled) setTypes([]) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    listFranqueadores({ page: 1, page_size: 500 })
      .then((res) => { if (!cancelled) setFranqueadores(res.data || []) })
      .catch(() => { if (!cancelled) setFranqueadores([]) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const params = { page: 1, page_size: 500 }
    if (franchisorId) params.franchisor_id = franchisorId
    listEscolas(params)
      .then((res) => { if (!cancelled) setEscolas(res.data || []) })
      .catch(() => { if (!cancelled) setEscolas([]) })
    return () => { cancelled = true }
  }, [franchisorId])

  useEffect(() => {
    if (franchisorId && schoolId) {
      const pertence = escolas.some((e) => String(e.id) === String(schoolId))
      if (!pertence) setSchoolId('')
    }
  }, [franchisorId, schoolId, escolas])

  const { from: queryFrom, to: queryTo } = getDefaultFromTo(period, from, to)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!type) return
    setLoading(true)
    setPermissionDenied(false)
    try {
      const payload = {
        type,
        filters: {
          from: queryFrom,
          to: queryTo,
          franchisor_id: franchisorId || undefined,
          school_id: schoolId || undefined,
          status: statusFilter || undefined,
        },
      }
      const { export_id } = await createExport(payload)
      setToast('Exportação solicitada! Acompanhe o status na lista.')
      setTimeout(() => {
        navigate(`/admin/exports?highlight=${export_id}`, { replace: true })
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
    navigate('/admin/exports')
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Relatórios Estratégicos', to: '/admin/reports/strategic' },
    { label: 'Exportações', to: '/admin/exports' },
    { label: 'Nova exportação' },
  ]

  const typeOptions = types.length ? types : [
    { value: 'schools', label: 'Escolas' },
    { value: 'franchisors', label: 'Franqueadores' },
    { value: 'subscriptions', label: 'Assinaturas' },
    { value: 'finance_global', label: 'Financeiro (global)' },
    { value: 'delinquency', label: 'Inadimplência' },
    { value: 'kpis_summary', label: 'KPIs (resumo)' },
  ]

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Nova exportação">
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
              form="form-export"
              style={styles.btnPrimario}
              className="btn-hover"
              disabled={loading || !type}
            >
              {loading ? 'Gerando…' : 'Gerar exportação'}
            </button>
          </div>
        </div>

        {toast && (
          <div style={styles.toast}>
            {toast}
          </div>
        )}

        <p style={styles.aviso}>
          A exportação pode levar alguns minutos. Você poderá baixar quando estiver pronta.
        </p>

        <form id="form-export" onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.campo}>
            <label style={styles.label}>
              Tipo de exportação <span style={styles.obrigatorio}>*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={styles.select}
              required
              aria-label="Tipo de exportação"
              disabled={loading}
            >
              <option value="">Selecione</option>
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Período</label>
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
              {period === 'custom' && (
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

          <div style={styles.campo}>
            <label style={styles.label}>Franqueador</label>
            <select
              value={franchisorId}
              onChange={(e) => { setFranchisorId(e.target.value); setSchoolId('') }}
              style={styles.select}
              aria-label="Franqueador"
              disabled={loading}
            >
              <option value="">Todos</option>
              {franqueadores.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Escola</label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              style={styles.select}
              aria-label="Escola"
              disabled={loading}
            >
              <option value="">Todas</option>
              {escolas.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {(type === 'schools' || type === 'subscriptions') && (
            <div style={styles.campo}>
              <label style={styles.label}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.select}
                aria-label="Status"
                disabled={loading}
              >
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="pendente">Pendente</option>
                <option value="suspenso">Suspenso</option>
              </select>
            </div>
          )}
        </form>
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
  toast: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: 'rgba(76, 203, 138, 0.15)',
    color: 'var(--verde-patrocinio)',
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
