import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { getMe, patchMe } from '../api/me'

const GRID = 8

const styles = {
  wrap: {
    minHeight: '100vh',
    background: 'var(--cinza-arquibancada)',
    padding: GRID * 4,
  },
  container: {
    maxWidth: 720,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID * 3,
    marginBottom: GRID * 4,
  },
  headerLeft: { minWidth: 0 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
    flexWrap: 'wrap',
  },
  btnPrimary: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
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
  sectionTitle: { margin: `0 0 ${GRID * 3}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  field: { marginBottom: GRID * 2, maxWidth: 400 },
  label: { display: 'block', marginBottom: GRID / 2, fontSize: 13, fontWeight: 500, color: 'var(--grafite-tecnico)', opacity: 0.9 },
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
  inputReadOnly: { background: 'var(--cinza-arquibancada)', opacity: 0.9, cursor: 'not-allowed' },
  hint: { marginTop: GRID / 2, fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.7 },
  errorField: { marginTop: GRID / 2, fontSize: 12, color: '#DC2626' },
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
    zIndex: 1001,
  },
  toastSuccess: { background: 'var(--verde-patrocinio)' },
  toastError: { background: '#DC2626' },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: GRID * 4,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    maxWidth: 400,
    width: '100%',
    boxShadow: 'var(--shadow)',
  },
  modalTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  modalText: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  modalActions: { display: 'flex', gap: GRID * 2, justifyContent: 'flex-end' },
  cardList: { display: 'flex', flexDirection: 'column', gap: GRID * 2 },
  membershipCard: {
    padding: GRID * 2,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    background: 'var(--cinza-arquibancada)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  membershipRow: { marginBottom: GRID / 2 },
  membershipLabel: { fontWeight: 600, marginRight: GRID },
  skeleton: {
    height: 40,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 'var(--radius)',
  },
}

function getDashboardPath(defaultRedirect) {
  if (!defaultRedirect || !defaultRedirect.portal) return '/admin/dashboard'
  const p = (defaultRedirect.portal || '').toUpperCase()
  if (p === 'ADMIN') return defaultRedirect.path || '/admin/dashboard'
  if (p === 'FRANCHISOR') return defaultRedirect.path || '/franchisor/dashboard'
  if (p === 'SCHOOL') {
    const path = defaultRedirect.path || '/school/dashboard'
    const schoolId = defaultRedirect.context?.school_id
    if (schoolId) return `${path}?school_id=${encodeURIComponent(schoolId)}`
    return path
  }
  return '/admin/dashboard'
}

function portalLabel(portal) {
  const p = (portal || '').toUpperCase()
  if (p === 'ADMIN') return 'Admin'
  if (p === 'FRANCHISOR') return 'Franqueador'
  if (p === 'SCHOOL') return 'Escola'
  return portal || '—'
}

function scopeLabel(m) {
  if (!m) return '—'
  const type = (m.scope_type || '').toUpperCase()
  if (type === 'ALL_SCHOOLS' || m.scope_type === 'ALL') return 'Todas as escolas'
  const n = m.scope_school_count ?? (Array.isArray(m.scope_school_ids) ? m.scope_school_ids.length : 0)
  return n ? `${n} escola(s)` : '—'
}

function SkeletonProfile() {
  return (
    <div style={styles.wrap}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div style={{ ...styles.skeleton, width: 200, height: 28 }} />
            <div style={{ ...styles.skeleton, width: 280, height: 16, marginTop: GRID * 2 }} />
          </div>
          <div style={{ display: 'flex', gap: GRID * 2 }}>
            <div style={{ ...styles.skeleton, width: 140, height: 40 }} />
            <div style={{ ...styles.skeleton, width: 80, height: 40 }} />
          </div>
        </div>
        <div style={styles.section}>
          <div style={{ ...styles.skeleton, width: 160, height: 20, marginBottom: GRID * 3 }} />
          <div style={{ ...styles.skeleton, maxWidth: 400, height: 44, marginBottom: GRID * 2 }} />
          <div style={{ ...styles.skeleton, maxWidth: 400, height: 44, marginBottom: GRID * 2 }} />
          <div style={{ ...styles.skeleton, maxWidth: 400, height: 44 }} />
        </div>
        <div style={styles.section}>
          <div style={{ ...styles.skeleton, width: 180, height: 20, marginBottom: GRID * 3 }} />
          <div style={{ ...styles.skeleton, maxWidth: 280, height: 44, marginBottom: GRID * 2 }} />
          <div style={{ ...styles.skeleton, maxWidth: 280, height: 44 }} />
        </div>
        <div style={styles.section}>
          <div style={{ ...styles.skeleton, width: 140, height: 20, marginBottom: GRID * 3 }} />
          <div style={{ ...styles.skeleton, width: '100%', height: 80 }} />
          <div style={{ ...styles.skeleton, width: '100%', height: 80 }} />
        </div>
      </div>
    </div>
  )
}

export default function MeuPerfil() {
  const navigate = useNavigate()
  const { defaultRedirect, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [toastType, setToastType] = useState('info') // 'success' | 'error' | 'info'
  const [modalDiscard, setModalDiscard] = useState(false)

  // Form dados pessoais
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [initialData, setInitialData] = useState({ name: '', phone: '' })

  const dashboardPath = getDashboardPath(defaultRedirect)
  const hasChanges = profile && (name !== initialData.name || phone !== initialData.phone)

  const showToast = useCallback((message, type = 'info') => {
    setToast(message)
    setToastType(type)
  }, [])

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMe()
      setProfile(data)
      const n = (data.name ?? '').trim()
      const p = (data.phone ?? '').trim()
      setName(n)
      setPhone(p)
      setInitialData({ name: n, phone: p })
    } catch (e) {
      showToast(e.message || 'Não foi possível carregar seu perfil.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => {
      setToast(null)
    }, 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleSaveProfile = async () => {
    if (!hasChanges || saving) return
    setSaving(true)
    try {
      await patchMe({ name: name.trim(), phone: phone.trim() || undefined })
      setInitialData({ name: name.trim(), phone: phone.trim() })
      showToast('Perfil atualizado com sucesso!', 'success')
    } catch (e) {
      showToast(e.message || 'Não foi possível atualizar. Tente novamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const goBack = () => {
    if (hasChanges) {
      setModalDiscard(true)
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(dashboardPath)
    }
  }

  const confirmDiscard = () => {
    setModalDiscard(false)
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(dashboardPath)
    }
  }

  if (!isAuthenticated) return null
  if (loading) return <SkeletonProfile />

  const memberships = profile?.memberships ?? []

  return (
    <div style={styles.wrap}>
      <div style={styles.container}>
        {/* Cabeçalho */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>Meu perfil</h1>
            <p style={styles.subtitle}>Atualize seus dados e sua senha</p>
          </div>
          <div style={styles.headerActions}>
            <button
              type="button"
              style={{ ...styles.btnPrimary, ...(saving || !hasChanges ? styles.btnDisabled : {}) }}
              disabled={saving || !hasChanges}
              onClick={handleSaveProfile}
            >
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <button type="button" style={styles.btnSecondary} onClick={goBack}>
              Voltar
            </button>
          </div>
        </header>

        {/* Seção A — Dados pessoais */}
        <section style={styles.section} aria-labelledby="sec-dados-titulo">
          <h2 id="sec-dados-titulo" style={styles.sectionTitle}>Dados pessoais</h2>
          <div style={styles.field}>
            <label htmlFor="me-name" style={styles.label}>Nome *</label>
            <input
              id="me-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="Seu nome"
              aria-required="true"
            />
          </div>
          <div style={styles.field}>
            <label htmlFor="me-email" style={styles.label}>Email</label>
            <input
              id="me-email"
              type="email"
              value={profile?.email ?? ''}
              readOnly
              style={{ ...styles.input, ...styles.inputReadOnly }}
              aria-readonly="true"
            />
            <p style={styles.hint}>Para alterar email, contate o suporte.</p>
          </div>
          <div style={styles.field}>
            <label htmlFor="me-phone" style={styles.label}>Telefone</label>
            <input
              id="me-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              placeholder="(00) 00000-0000"
            />
          </div>
        </section>

        {/* Seção B — Segurança */}
        <section style={styles.section} aria-labelledby="sec-senha-titulo">
          <h2 id="sec-senha-titulo" style={styles.sectionTitle}>Alterar senha</h2>
          <p style={styles.hint}>Para alterar sua senha, use a tela dedicada com validação de senha atual.</p>
          <Link
            to="/me/change-password"
            style={{ ...styles.btnSecondary, display: 'inline-flex', marginTop: GRID * 2 }}
          >
            Alterar senha
          </Link>
        </section>

        {/* Seção — Minhas ações (auditoria pessoal) */}
        <section style={styles.section} aria-labelledby="sec-audit-titulo">
          <h2 id="sec-audit-titulo" style={styles.sectionTitle}>Minhas ações</h2>
          <p style={styles.hint}>Histórico das suas atividades na plataforma (cadastros, pagamentos, presença, etc.).</p>
          <Link
            to="/me/audit"
            style={{ ...styles.btnSecondary, display: 'inline-flex', marginTop: GRID * 2 }}
          >
            Ver minhas ações
          </Link>
        </section>

        {/* Seção — Ajuda */}
        <section style={styles.section} aria-labelledby="sec-ajuda-titulo">
          <h2 id="sec-ajuda-titulo" style={styles.sectionTitle}>Ajuda</h2>
          <p style={styles.hint}>Perguntas frequentes e orientações de uso do sistema.</p>
          <Link
            to="/help"
            style={{ ...styles.btnSecondary, display: 'inline-flex', marginTop: GRID * 2 }}
          >
            Central de Ajuda
          </Link>
        </section>

        {/* Seção C — Meus acessos */}
        <section style={styles.section} aria-labelledby="sec-acessos-titulo">
          <h2 id="sec-acessos-titulo" style={styles.sectionTitle}>Meus acessos</h2>
          <p style={styles.hint}>Permissões são gerenciadas pela administração do sistema.</p>
          <div style={styles.cardList}>
            {memberships.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
                Nenhum vínculo encontrado.
              </p>
            ) : (
              memberships.map((m, i) => (
                <div key={i} style={styles.membershipCard}>
                  <div style={styles.membershipRow}>
                    <span style={styles.membershipLabel}>Portal:</span>
                    {portalLabel(m.portal)}
                  </div>
                  <div style={styles.membershipRow}>
                    <span style={styles.membershipLabel}>Função:</span>
                    {m.role || '—'}
                  </div>
                  {m.franchisor_id && (
                    <div style={styles.membershipRow}>
                      <span style={styles.membershipLabel}>Franqueador:</span>
                      {m.franchisor_name || m.franchisor_id}
                    </div>
                  )}
                  {m.school_id && (
                    <div style={styles.membershipRow}>
                      <span style={styles.membershipLabel}>Escola:</span>
                      {m.school_name || m.school_id}
                    </div>
                  )}
                  {(m.portal || '').toUpperCase() === 'FRANCHISOR' && (
                    <div style={styles.membershipRow}>
                      <span style={styles.membershipLabel}>Escopo:</span>
                      {scopeLabel(m)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          style={{
            ...styles.toast,
            ...(toastType === 'success' ? styles.toastSuccess : {}),
            ...(toastType === 'error' ? styles.toastError : {}),
          }}
        >
          {toast}
        </div>
      )}

      {/* Modal alterações não salvas */}
      {modalDiscard && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-descartar-titulo">
          <div style={styles.modal}>
            <h3 id="modal-descartar-titulo" style={styles.modalTitle}>Alterações não salvas</h3>
            <p style={styles.modalText}>Você tem alterações não salvas. Deseja descartar?</p>
            <div style={styles.modalActions}>
              <button type="button" style={styles.btnSecondary} onClick={() => setModalDiscard(false)}>
                Cancelar
              </button>
              <button type="button" style={styles.btnPrimary} onClick={confirmDiscard}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
