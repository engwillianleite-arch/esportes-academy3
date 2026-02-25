import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorSchools,
  getFranchisorCampaignById,
  createFranchisorCampaign,
  updateFranchisorCampaign,
} from '../../api/franchisorPortal'

const GRID = 8

const TARGET_TYPE_ALL = 'ALL'
const TARGET_TYPE_SCHOOL_LIST = 'SCHOOL_LIST'

const STATUS_OPTIONS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'ativa', label: 'Ativa' },
  { value: 'encerrada', label: 'Encerrada' },
]

function getInitialForm() {
  return {
    title: '',
    description: '',
    content: '',
    start_date: '',
    end_date: '',
    target_type: TARGET_TYPE_ALL,
    target_school_ids: [],
    status: 'rascunho',
  }
}

function validateForm(values) {
  const errors = {}
  if (!(values.title || '').trim()) errors.title = 'Obrigatório'
  if (!(values.content || '').trim()) errors.content = 'Obrigatório'
  if (!(values.start_date || '').trim()) errors.start_date = 'Obrigatório'
  if (!values.target_type) errors.target_type = 'Obrigatório'
  if (values.target_type === TARGET_TYPE_SCHOOL_LIST) {
    if (!Array.isArray(values.target_school_ids) || values.target_school_ids.length === 0) {
      errors.target_school_ids = 'Selecione pelo menos uma escola'
    }
  }
  if (!(values.status || '').trim()) errors.status = 'Obrigatório'
  const start = values.start_date ? new Date(values.start_date).getTime() : 0
  const end = values.end_date ? new Date(values.end_date + 'T23:59:59.999Z').getTime() : 0
  if (values.end_date && start && end && end < start) {
    errors.end_date = 'Data de término não pode ser anterior ao início'
  }
  return errors
}

function SkeletonLine({ width = '80%' }) {
  return (
    <div
      style={{
        height: 40,
        background: 'var(--cinza-arquibancada)',
        borderRadius: 8,
        width,
        marginBottom: GRID * 2,
      }}
    />
  )
}

function SkeletonForm() {
  return (
    <div style={{ maxWidth: 640 }}>
      <SkeletonLine width="50%" />
      <SkeletonLine />
      <SkeletonLine />
      <SkeletonLine width="90%" />
      <SkeletonLine width="70%" />
      <SkeletonLine width="40%" />
      <SkeletonLine width="60%" />
      <SkeletonLine width="30%" />
    </div>
  )
}

// Multi-select de escolas com busca
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
  const filtered =
    searchLower ?
      schools.filter(
        (s) =>
          (s.school_name && s.school_name.toLowerCase().includes(searchLower)) ||
          (s.city && s.city.toLowerCase().includes(searchLower)) ||
          (s.state && s.state.toLowerCase().includes(searchLower))
      )
    : schools

  const setIds = (ids) => {
    const next = Array.isArray(ids) ? [...ids] : []
    onChange(next)
  }

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
          ...styles.input,
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          borderColor: error ? 'rgba(220, 53, 69, 0.6)' : undefined,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedCount === 0 ? 'Selecionar escolas' : `${selectedCount} escola(s) selecionada(s)`}
      </button>
      {open && (
        <div style={styles.dropdown} role="listbox">
          <div style={{ position: 'relative', padding: GRID * 2, borderBottom: '1px solid #eee' }}>
            <input
              type="search"
              placeholder="Buscar escola..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...styles.input, paddingLeft: 36 }}
              aria-label="Buscar escola"
            />
            <span
              style={{
                position: 'absolute',
                left: GRID * 2 + 8,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.6,
              }}
            >
              <IconSearch />
            </span>
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: GRID }}>
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
            {filtered.length === 0 && (
              <div style={{ padding: GRID * 2, fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.7 }}>
                Nenhuma escola encontrada
              </div>
            )}
          </div>
        </div>
      )}
      {error && <div style={styles.erroCampo}>{error}</div>}
    </div>
  )
}

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 3,
    marginBottom: GRID * 4,
  },
  tituloPagina: {
    margin: 0,
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
    boxShadow: '0 2px 4px rgba(44, 110, 242, 0.3)',
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
  erroGeral: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: 'rgba(220, 53, 69, 0.08)',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  secao: {
    marginBottom: GRID * 4,
  },
  secaoTitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  campo: {
    marginBottom: GRID * 2,
  },
  label: {
    display: 'block',
    marginBottom: GRID,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  ajuda: {
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.75,
    marginTop: GRID,
  },
  input: {
    width: '100%',
    maxWidth: 560,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: 'rgba(220, 53, 69, 0.6)',
  },
  textarea: {
    width: '100%',
    maxWidth: 560,
    minHeight: 100,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: GRID,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
    cursor: 'pointer',
    fontSize: 14,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    border: '1px solid #E5E5E7',
    minWidth: 320,
    maxWidth: 420,
    zIndex: 100,
  },
  erroCampo: {
    marginTop: GRID,
    fontSize: 13,
    color: '#dc3545',
  },
  rodapeForm: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginTop: GRID * 4,
    paddingTop: GRID * 3,
    borderTop: '1px solid #eee',
  },
  overlay: {
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
    maxWidth: 400,
    width: '90%',
    boxShadow: 'var(--shadow-hover)',
  },
  modalTitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  modalTexto: {
    margin: '0 0 ' + GRID * 3 + 'px',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  modalBotoes: {
    display: 'flex',
    gap: GRID * 2,
    justifyContent: 'flex-end',
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
  toastError: {
    background: 'rgba(220, 53, 69, 0.1)',
    color: '#dc3545',
  },
}

const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

export default function CriarEditarCampanhaFranqueador() {
  const { campaign_id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isNew = !campaign_id || campaign_id === 'new'

  const [me, setMe] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [schools, setSchools] = useState([])
  const [loadingMe, setLoadingMe] = useState(true)
  const [loadingCampaign, setLoadingCampaign] = useState(!isNew)
  const [loadingSchools, setLoadingSchools] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [toast, setToast] = useState(null)
  const [toastError, setToastError] = useState(false)
  const [modalDiscard, setModalDiscard] = useState(false)
  const [pendingCancel, setPendingCancel] = useState(null)

  const [form, setForm] = useState(getInitialForm)
  const [backendErrors, setBackendErrors] = useState({})

  const cancelToNew = `/franchisor/campaigns?${searchParams.toString()}`
  const cancelToEdit = (location.state?.returnTo) || `/franchisor/campaigns/${campaign_id}`

  const isDirty = useCallback(() => {
    if (isNew) {
      return (
        (form.title || '').trim() !== '' ||
        (form.description || '').trim() !== '' ||
        (form.content || '').trim() !== '' ||
        (form.start_date || '').trim() !== '' ||
        (form.end_date || '').trim() !== '' ||
        form.target_type !== TARGET_TYPE_ALL ||
        (form.target_school_ids || []).length > 0 ||
        (form.status || '') !== 'rascunho'
      )
    }
    if (!campaign) return true
    return (
      (form.title || '').trim() !== (campaign.title || '').trim() ||
      (form.description || '').trim() !== (campaign.description || '').trim() ||
      (form.content || '').trim() !== (campaign.content || '').trim() ||
      (form.start_date || '').trim() !== (campaign.start_date || '').trim() ||
      (form.end_date || '').trim() !== (campaign.end_date || '').trim() ||
      form.target_type !== (campaign.target_type || TARGET_TYPE_ALL) ||
      JSON.stringify([...(form.target_school_ids || [])].sort()) !==
        JSON.stringify([...(campaign.target_school_ids || [])].sort()) ||
      (form.status || '').trim() !== (campaign.status || '').trim()
    )
  }, [isNew, campaign, form])

  const errors = validateForm(form)
  const isValid = Object.keys(errors).length === 0
  const canSave = !saving && isValid

  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((data) => {
        if (!cancelled) setMe(data)
      })
      .catch(() => {
        if (!cancelled) setPermissionDenied(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingMe(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getFranchisorSchools()
      .then((res) => {
        if (!cancelled) setSchools(res.items || [])
      })
      .catch(() => {
        if (!cancelled) setSchools([])
      })
      .finally(() => {
        if (!cancelled) setLoadingSchools(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isNew || !campaign_id) return
    let cancelled = false
    setLoadingCampaign(true)
    getFranchisorCampaignById(campaign_id)
      .then((data) => {
        if (!cancelled) {
          if (!data) {
            setPermissionDenied(true)
            return
          }
          setCampaign(data)
          setForm({
            title: data.title || '',
            description: data.description || '',
            content: data.content || '',
            start_date: data.start_date || '',
            end_date: data.end_date || '',
            target_type: data.target_type || TARGET_TYPE_ALL,
            target_school_ids: data.target_school_ids ? [...data.target_school_ids] : [],
            status: data.status || 'rascunho',
          })
        }
      })
      .catch(() => {
        if (!cancelled) setPermissionDenied(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingCampaign(false)
      })
    return () => {
      cancelled = true
    }
  }, [isNew, campaign_id])

  useEffect(() => {
    if (!loadingMe && me && !ALLOWED_ROLES.includes(me.user_role)) {
      setPermissionDenied(true)
    }
  }, [loadingMe, me])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=franchisor', { replace: true })
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => {
        setToast(null)
        setToastError(false)
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setBackendErrors((prev) => ({ ...prev, [field]: undefined, _general: undefined }))
  }

  const doSubmit = async (e) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setBackendErrors({})
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        content: form.content.trim(),
        start_date: form.start_date.trim(),
        end_date: form.end_date.trim() || null,
        status: form.status.trim(),
        target_type: form.target_type,
        target_school_ids:
          form.target_type === TARGET_TYPE_SCHOOL_LIST && Array.isArray(form.target_school_ids)
            ? form.target_school_ids
            : undefined,
      }
      if (isNew) {
        const created = await createFranchisorCampaign(payload)
        setToast('Campanha salva com sucesso!')
        navigate(`/franchisor/campaigns/${created.id}`, { replace: true })
      } else {
        await updateFranchisorCampaign(campaign_id, payload)
        setToast('Campanha salva com sucesso!')
        navigate(`/franchisor/campaigns/${campaign_id}`, { replace: true })
      }
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
        return
      }
      const msg = err.message || 'Não foi possível salvar. Verifique os campos e tente novamente.'
      setToast(msg)
      setToastError(true)
      setBackendErrors((prev) => ({ ...prev, _general: msg }))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (isDirty()) {
      setPendingCancel(isNew ? cancelToNew : cancelToEdit)
      setModalDiscard(true)
    } else {
      navigate(isNew ? cancelToNew : cancelToEdit)
    }
  }

  const confirmDiscard = () => {
    setModalDiscard(false)
    if (pendingCancel) {
      navigate(pendingCancel)
      setPendingCancel(null)
    }
  }

  const cancelDiscard = () => {
    setModalDiscard(false)
    setPendingCancel(null)
  }

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Campanhas', to: '/franchisor/campaigns' },
    { label: isNew ? 'Nova campanha' : 'Editar campanha' },
  ]

  const pageTitle = isNew ? 'Nova campanha' : (campaign ? `Editar campanha: ${campaign.title}` : 'Editar campanha')

  if (permissionDenied) return null

  if (!isNew && loadingCampaign) {
    return (
      <FranchisorLayout pageTitle="Editar campanha" breadcrumb={breadcrumb}>
        <div style={styles.card}>
          <SkeletonForm />
        </div>
      </FranchisorLayout>
    )
  }

  return (
    <FranchisorLayout pageTitle={pageTitle} breadcrumb={breadcrumb}>
      <div style={styles.card}>
        {toast && (
          <div style={{ ...styles.toast, ...(toastError ? styles.toastError : {}) }} role="status">
            {toast}
          </div>
        )}
        {backendErrors._general && (
          <div style={styles.erroGeral} role="alert">
            {backendErrors._general}
          </div>
        )}

        <div style={styles.cabecalho}>
          <h2 style={styles.tituloPagina}>{pageTitle}</h2>
          <div style={styles.cabecalhoAcoes}>
            <button
              type="button"
              style={styles.btnPrimario}
              className="btn-hover"
              disabled={!canSave}
              onClick={doSubmit}
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              type="button"
              style={styles.btnSecundario}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </div>

        <form onSubmit={doSubmit} noValidate>
          {/* Seção A — Identificação */}
          <section style={styles.secao} aria-labelledby="sec-identificacao">
            <h3 id="sec-identificacao" style={styles.secaoTitulo}>
              Identificação
            </h3>
            <div style={styles.campo}>
              <label htmlFor="campaign-title" style={styles.label}>
                Nome da campanha <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                id="campaign-title"
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
                placeholder="Ex.: Campanha de volta às aulas"
                disabled={saving}
                maxLength={200}
              />
              {errors.title && <div style={styles.erroCampo}>{errors.title}</div>}
            </div>
            <div style={styles.campo}>
              <label htmlFor="campaign-description" style={styles.label}>
                Descrição
              </label>
              <textarea
                id="campaign-description"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                style={{ ...styles.textarea, minHeight: 80 }}
                placeholder="Objetivo e instruções gerais para as escolas."
                disabled={saving}
              />
              <p style={styles.ajuda}>Objetivo e instruções gerais para as escolas.</p>
            </div>
          </section>

          {/* Seção B — Conteúdo */}
          <section style={styles.secao} aria-labelledby="sec-conteudo">
            <h3 id="sec-conteudo" style={styles.secaoTitulo}>
              Conteúdo (MVP)
            </h3>
            <div style={styles.campo}>
              <label htmlFor="campaign-content" style={styles.label}>
                Mensagem/Conteúdo <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <textarea
                id="campaign-content"
                value={form.content}
                onChange={(e) => handleChange('content', e.target.value)}
                style={{ ...styles.textarea, ...(errors.content ? styles.inputError : {}) }}
                placeholder="Texto que as escolas visualizarão no portal."
                disabled={saving}
              />
              <p style={styles.ajuda}>Texto que as escolas visualizarão no portal. Recomendação: texto puro (sem HTML).</p>
              {errors.content && <div style={styles.erroCampo}>{errors.content}</div>}
            </div>
          </section>

          {/* Seção C — Período */}
          <section style={styles.secao} aria-labelledby="sec-periodo">
            <h3 id="sec-periodo" style={styles.secaoTitulo}>
              Período
            </h3>
            <div style={{ ...styles.campo, display: 'flex', gap: GRID * 3, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label htmlFor="campaign-start" style={styles.label}>
                  Data de início <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  id="campaign-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  style={{ ...styles.input, maxWidth: 220, ...(errors.start_date ? styles.inputError : {}) }}
                  disabled={saving}
                />
                {errors.start_date && <div style={styles.erroCampo}>{errors.start_date}</div>}
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label htmlFor="campaign-end" style={styles.label}>
                  Data de término
                </label>
                <input
                  id="campaign-end"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  style={{ ...styles.input, maxWidth: 220, ...(errors.end_date ? styles.inputError : {}) }}
                  disabled={saving}
                />
                <p style={styles.ajuda}>Se vazio, campanha fica sem término definido.</p>
                {errors.end_date && <div style={styles.erroCampo}>{errors.end_date}</div>}
              </div>
            </div>
          </section>

          {/* Seção D — Segmentação */}
          <section style={styles.secao} aria-labelledby="sec-segmentacao">
            <h3 id="sec-segmentacao" style={styles.secaoTitulo}>
              Segmentação
            </h3>
            <div style={styles.campo}>
              <span style={styles.label}>Aplicar para <span style={{ color: '#dc3545' }}>*</span></span>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="target_type"
                    checked={form.target_type === TARGET_TYPE_ALL}
                    onChange={() => handleChange('target_type', TARGET_TYPE_ALL)}
                    disabled={saving}
                  />
                  Todas as escolas
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="target_type"
                    checked={form.target_type === TARGET_TYPE_SCHOOL_LIST}
                    onChange={() => handleChange('target_type', TARGET_TYPE_SCHOOL_LIST)}
                    disabled={saving}
                  />
                  Escolas selecionadas
                </label>
              </div>
            </div>
            {form.target_type === TARGET_TYPE_SCHOOL_LIST && (
              <div style={styles.campo}>
                <label style={styles.label}>Selecionar escolas</label>
                <SchoolsMultiSelect
                  schools={schools}
                  selectedIds={form.target_school_ids}
                  onChange={(ids) => handleChange('target_school_ids', ids)}
                  disabled={saving || loadingSchools}
                  error={errors.target_school_ids}
                />
                <p style={styles.ajuda}>
                  {(form.target_school_ids || []).length} escola(s) selecionada(s).
                </p>
              </div>
            )}
          </section>

          {/* Seção E — Status */}
          <section style={styles.secao} aria-labelledby="sec-status">
            <h3 id="sec-status" style={styles.secaoTitulo}>
              Status
            </h3>
            <div style={styles.campo}>
              <label htmlFor="campaign-status" style={styles.label}>
                Status <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                id="campaign-status"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                style={{ ...styles.input, maxWidth: 220, ...(errors.status ? styles.inputError : {}) }}
                disabled={saving}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Rodapé */}
          <div style={styles.rodapeForm}>
            <button
              type="submit"
              style={styles.btnPrimario}
              className="btn-hover"
              disabled={!canSave}
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              type="button"
              style={styles.btnSecundario}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Modal descartar alterações */}
      {modalDiscard && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-discard-title">
          <div style={styles.modal}>
            <h2 id="modal-discard-title" style={styles.modalTitulo}>
              Descartar alterações?
            </h2>
            <p style={styles.modalTexto}>
              Você tem alterações não salvas. Deseja descartar?
            </p>
            <div style={styles.modalBotoes}>
              <button type="button" style={styles.btnSecundario} onClick={cancelDiscard}>
                Voltar
              </button>
              <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={confirmDiscard}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </FranchisorLayout>
  )
}
