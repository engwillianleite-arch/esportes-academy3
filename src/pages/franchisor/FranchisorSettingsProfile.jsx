import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorSettingsProfile,
  patchFranchisorSettingsProfile,
} from '../../api/franchisorPortal'

const GRID = 8
const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const styles = {
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  headerLeft: { flex: '1 1 280px', minWidth: 0 },
  breadcrumb: {
    marginBottom: GRID,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  breadcrumbLink: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
    flexWrap: 'wrap',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px ${GRID * 3}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px ${GRID * 3}px`,
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  section: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: GRID * 4,
    marginBottom: GRID * 4,
  },
  sectionTitle: {
    margin: `0 0 ${GRID * 3}px`,
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  formRow: {
    marginBottom: GRID * 2,
  },
  formRowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: GRID * 2,
  },
  label: {
    display: 'block',
    marginBottom: GRID / 2,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
  },
  required: { color: '#DC2626', marginLeft: 2 },
  input: {
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    outline: 'none',
  },
  inputReadOnly: {
    background: 'var(--cinza-arquibancada)',
    opacity: 0.9,
    cursor: 'not-allowed',
  },
  textarea: {
    width: '100%',
    minHeight: 100,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
    outline: 'none',
    resize: 'vertical',
  },
  alertStaff: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 3,
    background: '#FEF3C7',
    border: '1px solid #F59E0B',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 4,
  },
  alertIcon: { color: '#B45309', flexShrink: 0 },
  alertText: { margin: 0, fontSize: 14, color: '#92400E', fontWeight: 500 },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 3,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 4,
  },
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorText: { margin: 0, fontSize: 14, color: '#991B1B' },
  skeleton: {
    height: 40,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 'var(--radius)',
  },
  logoPreview: {
    marginTop: GRID,
    maxWidth: 160,
    maxHeight: 80,
    objectFit: 'contain',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
  },
  toast: {
    position: 'fixed',
    bottom: GRID * 4,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: `${GRID * 2}px ${GRID * 4}px`,
    background: 'var(--grafite-tecnico)',
    color: '#fff',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    boxShadow: 'var(--shadow-hover)',
    zIndex: 1000,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: GRID * 4,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    padding: GRID * 4,
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  modalText: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: GRID * 2 },
}

function emptyAddress() {
  return { street: '', number: '', complement: '', city: '', state: '', zip: '' }
}

function emptyBrand() {
  return { display_name: '', logo_url: '' }
}

function formFromProfile(profile) {
  if (!profile) return null
  return {
    name: profile.name ?? '',
    legal_name: profile.legal_name ?? '',
    document_id: profile.document_id ?? '',
    website: profile.website ?? '',
    contact_email: profile.contact_email ?? '',
    contact_phone: profile.contact_phone ?? '',
    address: profile.address
      ? { ...emptyAddress(), ...profile.address }
      : emptyAddress(),
    brand: profile.brand
      ? { ...emptyBrand(), ...profile.brand }
      : emptyBrand(),
    message_to_schools: profile.message_to_schools ?? '',
  }
}

function SkeletonForm() {
  return (
    <div style={styles.section}>
      <div style={{ ...styles.skeleton, width: '40%', marginBottom: GRID * 3 }} />
      <div style={styles.skeleton} />
      <div style={{ ...styles.skeleton, marginTop: GRID * 2 }} />
      <div style={{ ...styles.skeleton, marginTop: GRID * 2, width: '70%' }} />
    </div>
  )
}

export default function FranchisorSettingsProfile() {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [initial, setInitial] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)

  const canEdit = me?.user_role === 'FranchisorOwner'

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [meRes, profileRes] = await Promise.all([
        getFranchisorMe(),
        getFranchisorSettingsProfile(),
      ])
      if (!ALLOWED_ROLES.includes(meRes.user_role)) {
        setPermissionDenied(true)
        return
      }
      setMe(meRes)
      const data = formFromProfile(profileRes)
      setInitial(data)
      setForm(data)
    } catch (e) {
      setError(e?.message || 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=franchisor', { replace: true })
    }
  }, [permissionDenied, navigate])

  const isDirty = form && initial && JSON.stringify(form) !== JSON.stringify(initial)

  const updateField = (path, value) => {
    if (!canEdit) return
    setForm((prev) => {
      const next = { ...prev }
      if (path.includes('.')) {
        const [key, subKey] = path.split('.')
        next[key] = { ...next[key], [subKey]: value }
      } else {
        next[path] = value
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!canEdit || !form || saving) return
    setError(null)
    setSaving(true)
    try {
      await patchFranchisorSettingsProfile({
        name: form.name,
        legal_name: form.legal_name || null,
        document_id: form.document_id || null,
        website: form.website || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        address: form.address,
        brand: form.brand,
        message_to_schools: form.message_to_schools || null,
      })
      setInitial({ ...form })
      setToast('Dados atualizados com sucesso!')
      setTimeout(() => setToast(null), 4000)
    } catch (e) {
      setError('Não foi possível salvar. Verifique os campos e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardModal(true)
    } else {
      setForm(initial ? { ...initial } : null)
    }
  }

  const confirmDiscard = () => {
    setForm(initial ? { ...initial } : null)
    setShowDiscardModal(false)
  }

  if (permissionDenied) return null

  return (
    <FranchisorLayout>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <nav style={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/franchisor/dashboard" style={styles.breadcrumbLink}>
              Dashboard
            </Link>
            {' / '}
            <span>Configurações</span>
            {' / '}
            <span>Dados do franqueador</span>
          </nav>
          <h1 style={styles.title}>Dados do franqueador</h1>
        </div>
        <div style={styles.headerActions}>
          {canEdit && (
            <>
              <button
                type="button"
                style={{
                  ...styles.btnPrimary,
                  ...(saving ? styles.btnDisabled : {}),
                }}
                onClick={handleSave}
                disabled={saving || !isDirty}
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button
                type="button"
                style={styles.btnSecondary}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </header>

      {!canEdit && (
        <div style={styles.alertStaff} role="alert">
          <span style={styles.alertIcon}><IconAlert /></span>
          <p style={styles.alertText}>
            Somente o proprietário do franqueador pode editar estas informações.
          </p>
        </div>
      )}

      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}><IconAlert /></span>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {loading && (
        <>
          <SkeletonForm />
          <SkeletonForm />
          <SkeletonForm />
        </>
      )}

      {!loading && form && (
        <>
          {/* Seção A — Perfil institucional */}
          <section style={styles.section} aria-labelledby="section-profile">
            <h2 id="section-profile" style={styles.sectionTitle}>
              Perfil institucional
            </h2>
            <div style={styles.formRow}>
              <label style={styles.label} htmlFor="name">
                Nome do franqueador <span style={styles.required}>*</span>
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                style={{
                  ...styles.input,
                  ...(!canEdit ? styles.inputReadOnly : {}),
                }}
                readOnly={!canEdit}
                required
              />
            </div>
            <div style={styles.formRow}>
              <label style={styles.label} htmlFor="legal_name">Razão social</label>
              <input
                id="legal_name"
                type="text"
                value={form.legal_name}
                onChange={(e) => updateField('legal_name', e.target.value)}
                style={{
                  ...styles.input,
                  ...(!canEdit ? styles.inputReadOnly : {}),
                }}
                readOnly={!canEdit}
              />
            </div>
            <div style={styles.formRow}>
              <label style={styles.label} htmlFor="document_id">CNPJ/Documento</label>
              <input
                id="document_id"
                type="text"
                value={form.document_id}
                onChange={(e) => updateField('document_id', e.target.value)}
                style={{
                  ...styles.input,
                  ...(!canEdit ? styles.inputReadOnly : {}),
                }}
                readOnly={!canEdit}
              />
            </div>
            <div style={styles.formRow}>
              <label style={styles.label} htmlFor="website">Site</label>
              <input
                id="website"
                type="text"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                style={{
                  ...styles.input,
                  ...(!canEdit ? styles.inputReadOnly : {}),
                }}
                readOnly={!canEdit}
              />
            </div>
            <div style={styles.formRowGrid}>
              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="contact_email">Email de contato</label>
                <input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => updateField('contact_email', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(!canEdit ? styles.inputReadOnly : {}),
                  }}
                  readOnly={!canEdit}
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="contact_phone">Telefone de contato</label>
                <input
                  id="contact_phone"
                  type="text"
                  value={form.contact_phone}
                  onChange={(e) => updateField('contact_phone', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(!canEdit ? styles.inputReadOnly : {}),
                  }}
                  readOnly={!canEdit}
                />
              </div>
            </div>
            <h3 style={{ margin: `${GRID * 3}px 0 ${GRID * 2}px`, fontSize: 14, fontWeight: 600, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
              Endereço
            </h3>
            <div style={styles.formRow}>
              <label style={styles.label} htmlFor="address_street">Rua</label>
              <input
                id="address_street"
                type="text"
                value={form.address.street}
                onChange={(e) => updateField('address.street', e.target.value)}
                style={{
                  ...styles.input,
                  ...(!canEdit ? styles.inputReadOnly : {}),
                }}
                readOnly={!canEdit}
              />
            </div>
            <div style={styles.formRowGrid}>
              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="address_number">Número</label>
                <input
                  id="address_number"
                  type="text"
                  value={form.address.number}
                  onChange={(e) => updateField('address.number', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(!canEdit ? styles.inputReadOnly : {}),
                  }}
                  readOnly={!canEdit}
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="address_complement">Complemento</label>
                <input
                  id="address_complement"
                  type="text"
                  value={form.address.complement}
                  onChange={(e) => updateField('address.complement', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(!canEdit ? styles.inputReadOnly : {}),
                  }}
                  readOnly={!canEdit}
                />
              </div>
            </div>
            <div style={styles.formRowGrid}>
              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="address_city">Cidade</label>
                <input
                  id="address_city"
                  type="text"
                  value={form.address.city}
                  onChange={(e) => updateField('address.city', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(!canEdit ? styles.inputReadOnly : {}),
                  }}
                  readOnly={!canEdit}
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="address_state">UF/Estado</label>
                <input
                  id="address_state"
                  type="text"
                  value={form.address.state}
                  onChange={(e) => updateField('address.state', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(!canEdit ? styles.inputReadOnly : {}),
                  }}
                  readOnly={!canEdit}
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="address_zip">CEP</label>
                <input
                  id="address_zip"
                  type="text"
                  value={form.address.zip}
                  onChange={(e) => updateField('address.zip', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(!canEdit ? styles.inputReadOnly : {}),
                  }}
                  readOnly={!canEdit}
                />
              </div>
            </div>
          </section>

          {/* Seção B — Marca */}
          <section style={styles.section} aria-labelledby="section-brand">
            <h2 id="section-brand" style={styles.sectionTitle}>
              Marca
            </h2>
            <div style={styles.formRow}>
              <label style={styles.label} htmlFor="logo_url">URL do logo</label>
              <input
                id="logo_url"
                type="text"
                value={form.brand.logo_url}
                onChange={(e) => updateField('brand.logo_url', e.target.value)}
                placeholder="https://..."
                style={{
                  ...styles.input,
                  ...(!canEdit ? styles.inputReadOnly : {}),
                }}
                readOnly={!canEdit}
              />
              {form.brand.logo_url && (
                <img
                  src={form.brand.logo_url}
                  alt="Preview do logo"
                  style={styles.logoPreview}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              )}
            </div>
            <div style={styles.formRow}>
              <label style={styles.label} htmlFor="brand_display_name">
                Nome de exibição da marca
              </label>
              <input
                id="brand_display_name"
                type="text"
                value={form.brand.display_name}
                onChange={(e) => updateField('brand.display_name', e.target.value)}
                placeholder="Ex.: nome comercial"
                style={{
                  ...styles.input,
                  ...(!canEdit ? styles.inputReadOnly : {}),
                }}
                readOnly={!canEdit}
              />
            </div>
          </section>

          {/* Seção C — Mensagem para escolas */}
          <section style={styles.section} aria-labelledby="section-message">
            <h2 id="section-message" style={styles.sectionTitle}>
              Informações para escolas
            </h2>
            <div style={styles.formRow}>
              <label style={styles.label} htmlFor="message_to_schools">
                Mensagem padrão para escolas
              </label>
              <textarea
                id="message_to_schools"
                value={form.message_to_schools}
                onChange={(e) => updateField('message_to_schools', e.target.value)}
                placeholder="Instruções gerais do franqueador (somente texto)"
                style={{
                  ...styles.textarea,
                  ...(!canEdit ? styles.inputReadOnly : {}),
                }}
                readOnly={!canEdit}
              />
            </div>
          </section>
        </>
      )}

      {toast && (
        <div style={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {showDiscardModal && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="discard-title">
          <div style={styles.modal}>
            <h2 id="discard-title" style={styles.modalTitle}>
              Descartar alterações não salvas?
            </h2>
            <p style={styles.modalText}>
              As alterações feitas no formulário serão perdidas. Deseja continuar?
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.btnSecondary}
                onClick={() => setShowDiscardModal(false)}
              >
                Manter
              </button>
              <button
                type="button"
                style={styles.btnPrimary}
                onClick={confirmDiscard}
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </FranchisorLayout>
  )
}
