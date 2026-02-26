import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getFranchisorUserById,
  getFranchisorUsers,
  getFranchisorSchools,
  createFranchisorUser,
  updateFranchisorUser,
  getFranchisorRoleLabel,
} from '../../api/franchisorPortal'

const GRID = 8
const SCOPE_ALL = 'ALL'
const SCOPE_LIST = 'SCHOOL_LIST'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES = [
  { value: 'FranchisorOwner', label: 'FranchisorOwner' },
  { value: 'FranchisorStaff', label: 'FranchisorStaff' },
]
const ALLOWED_ROLES_PAGE = ['FranchisorOwner'] // MVP: somente Owner gerencia usuários

// Multi-select de escolas com busca (mesma fonte: getFranchisorSchools)
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
  const filtered = searchLower
    ? schools.filter(
        (s) =>
          (s.school_name && s.school_name.toLowerCase().includes(searchLower)) ||
          (s.city && s.city.toLowerCase().includes(searchLower)) ||
          (s.state && s.state.toLowerCase().includes(searchLower))
      )
    : schools

  const setIds = (ids) => onChange(Array.isArray(ids) ? [...ids] : [])
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
          width: '100%',
          maxWidth: 400,
          padding: `${GRID * 2}px ${GRID * 3}px`,
          border: `1px solid ${error ? 'rgba(220, 53, 69, 0.6)' : '#E5E5E7'}`,
          borderRadius: 'var(--radius)',
          fontSize: 14,
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: 'var(--branco-luz)',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedCount === 0 ? 'Escolher as escolas' : `${selectedCount} escola(s) selecionada(s)`}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'var(--branco-luz)',
            border: '1px solid #E5E5E7',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-hover)',
            minWidth: 320,
            maxHeight: 280,
            zIndex: 50,
          }}
          role="listbox"
        >
          <div style={{ padding: GRID * 2, borderBottom: '1px solid #eee' }}>
            <input
              type="search"
              placeholder="Buscar escola..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: `${GRID}px ${GRID * 2}px`,
                border: '1px solid #E5E5E7',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: GRID }}>
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
          </div>
        </div>
      )}
    </div>
  )
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
    <div style={{ maxWidth: 560 }}>
      <SkeletonLine width="50%" />
      <SkeletonLine />
      <SkeletonLine />
      <SkeletonLine width="70%" />
      <SkeletonLine />
      <SkeletonLine width="40%" />
      <SkeletonLine />
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
  avisoOwner: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  secao: { marginBottom: GRID * 4 },
  secaoTitulo: {
    margin: '0 0 ' + GRID * 2 + 'px',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  campo: { marginBottom: GRID * 2 },
  label: {
    display: 'block',
    marginBottom: GRID,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  input: {
    width: '100%',
    maxWidth: 400,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputError: { borderColor: 'rgba(220, 53, 69, 0.6)' },
  inputReadOnly: {
    background: 'var(--cinza-arquibancada)',
    cursor: 'not-allowed',
    opacity: 0.95,
  },
  textarea: {
    width: '100%',
    maxWidth: 560,
    minHeight: 80,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  erroCampo: { marginTop: GRID, fontSize: 13, color: '#dc3545' },
  apoio: {
    marginTop: GRID,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
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
  modalBotoes: { display: 'flex', gap: GRID * 2, justifyContent: 'flex-end' },
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

function validateCreate(values) {
  const err = {}
  if (!(values.name || '').trim()) err.name = 'Obrigatório'
  if (!(values.email || '').trim()) err.email = 'Obrigatório'
  else if (!EMAIL_REGEX.test(values.email.trim())) err.email = 'Email inválido'
  if (!values.role) err.role = 'Obrigatório'
  if (!values.scope_type) err.scope_type = 'Obrigatório'
  if (values.scope_type === SCOPE_LIST && (!values.scope_school_ids || values.scope_school_ids.length === 0)) {
    err.scope_school_ids = 'Selecione ao menos uma escola'
  }
  return err
}

function validateEdit(values) {
  const err = {}
  if (!values.role) err.role = 'Obrigatório'
  if (!values.scope_type) err.scope_type = 'Obrigatório'
  if (values.scope_type === SCOPE_LIST && (!values.scope_school_ids || values.scope_school_ids.length === 0)) {
    err.scope_school_ids = 'Selecione ao menos uma escola'
  }
  return err
}

function statusLabel(s) {
  const v = (s || '').toLowerCase()
  if (v === 'ativo') return 'Ativo'
  if (v === 'convidado' || v === 'pendente') return 'Convidado/Pendente'
  return s || '—'
}

export default function CriarEditarUsuarioFranqueador() {
  const { user_id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const isEdit = Boolean(user_id)
  const returnQuery = location.state?.fromListQuery || ''
  const returnToList = returnQuery ? `/franchisor/users?${returnQuery}` : '/franchisor/users'

  const [me, setMe] = useState(null)
  const [user, setUser] = useState(null)
  const [schools, setSchools] = useState([])
  const [ownersCount, setOwnersCount] = useState(null)
  const [loadingMe, setLoadingMe] = useState(true)
  const [loadingUser, setLoadingUser] = useState(isEdit)
  const [loadingSchools, setLoadingSchools] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [toast, setToast] = useState(null)
  const [modalDiscard, setModalDiscard] = useState(false)
  const [pendingCancel, setPendingCancel] = useState(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'FranchisorStaff',
    scope_type: SCOPE_ALL,
    scope_school_ids: [],
    notes: '',
  })
  const [backendError, setBackendError] = useState(null)

  const canAssignOwner = me?.user_role === 'FranchisorOwner'
  const roleOptions = ROLES.filter((r) => r.value !== 'FranchisorOwner' || canAssignOwner)
  const isLastOwner =
    isEdit &&
    user?.role === 'FranchisorOwner' &&
    ownersCount === 1
  const blockDowngradeToStaff = isLastOwner

  const errors = isEdit ? validateEdit(form) : validateCreate(form)
  const allErrors = { ...errors }
  if (blockDowngradeToStaff && form.role === 'FranchisorStaff') {
    allErrors.role = 'Não é permitido remover o último proprietário do franqueador.'
  }
  const isValid = Object.keys(allErrors).length === 0
  const canSave = !saving && isValid

  const isDirty = useCallback(() => {
    if (!isEdit || !user) return true
    const scopeType = user.scope_type === 'SCHOOL_LIST' ? SCOPE_LIST : SCOPE_ALL
    const currentIds = (user.scope_school_ids || []).slice().sort()
    const formIds = (form.scope_school_ids || []).slice().sort()
    return (
      form.role !== user.role ||
      form.scope_type !== scopeType ||
      (form.scope_type === SCOPE_LIST && (formIds.length !== currentIds.length || formIds.some((id, i) => id !== currentIds[i]))) ||
      (form.notes || '').trim() !== (user.notes || '').trim()
    )
  }, [isEdit, user, form])

  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((data) => { if (!cancelled) setMe(data); })
      .catch(() => { if (!cancelled) setPermissionDenied(true); })
      .finally(() => { if (!cancelled) setLoadingMe(false); })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    getFranchisorSchools()
      .then((res) => { if (!cancelled) setSchools(res.items || []); })
      .catch(() => { if (!cancelled) setSchools([]); })
      .finally(() => { if (!cancelled) setLoadingSchools(false); })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!isEdit || !user_id) return
    let cancelled = false
    setLoadingUser(true)
    getFranchisorUserById(user_id)
      .then((data) => {
        if (!cancelled && data) {
          setUser(data)
          setForm({
            name: data.name || '',
            email: data.email || '',
            role: data.role || 'FranchisorStaff',
            scope_type: data.scope_type === 'SCHOOL_LIST' ? SCOPE_LIST : SCOPE_ALL,
            scope_school_ids: (data.scope_school_ids || []).slice(),
            notes: (data.notes || '').trim(),
          })
        }
      })
      .catch(() => { if (!cancelled) setPermissionDenied(true); })
      .finally(() => { if (!cancelled) setLoadingUser(false); })
    return () => { cancelled = true }
  }, [isEdit, user_id])

  useEffect(() => {
    if (!ALLOWED_ROLES_PAGE.includes(me?.user_role)) return
    if (!isEdit) return
    let cancelled = false
    getFranchisorUsers({ role: 'FranchisorOwner', page: 1, page_size: 100 })
      .then((res) => {
        if (!cancelled) setOwnersCount((res.items || []).length)
      })
      .catch(() => { if (!cancelled) setOwnersCount(0); })
    return () => { cancelled = true }
  }, [me?.user_role, isEdit])

  useEffect(() => {
    if (!loadingMe && me && !ALLOWED_ROLES_PAGE.includes(me.user_role)) setPermissionDenied(true)
  }, [loadingMe, me])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=franchisor', { replace: true })
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleCancel = () => {
    if (isDirty()) {
      setPendingCancel(returnToList)
      setModalDiscard(true)
    } else {
      navigate(returnToList)
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

  const doSubmit = async (e) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setBackendError(null)
    try {
      const toastMsg = isEdit ? 'Permissões atualizadas com sucesso!' : 'Usuário criado com sucesso!'
      if (isEdit) {
        await updateFranchisorUser(user_id, {
          role: form.role,
          scope_type: form.scope_type,
          scope_school_ids: form.scope_type === SCOPE_LIST ? form.scope_school_ids : undefined,
        })
      } else {
        await createFranchisorUser({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          scope_type: form.scope_type,
          scope_school_ids: form.scope_type === SCOPE_LIST ? form.scope_school_ids : undefined,
        })
      }
      navigate(returnToList, { replace: true, state: { toast: toastMsg } })
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
        return
      }
      setBackendError(err.message || 'Não foi possível salvar. Verifique os campos e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Usuários', to: '/franchisor/users' },
    { label: isEdit ? 'Editar usuário' : 'Novo usuário' },
  ]
  const pageTitle = isEdit ? 'Editar usuário' : 'Novo usuário'

  if (permissionDenied) return null

  return (
    <FranchisorLayout pageTitle={pageTitle} breadcrumb={breadcrumb}>
      <div style={styles.card}>
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
              className="btn-hover"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </div>

        {toast && (
          <div style={styles.toast} role="status">
            {toast}
          </div>
        )}

        {backendError && (
          <div style={styles.erroGeral} role="alert">
            {backendError}
          </div>
        )}

        {(loadingUser && isEdit) ? (
          <SkeletonForm />
        ) : (
          <form onSubmit={doSubmit} noValidate>
            {/* Seção A — Identificação */}
            <section style={styles.secao} aria-labelledby="secao-identificacao">
              <h3 id="secao-identificacao" style={styles.secaoTitulo}>
                Identificação
              </h3>

              {!isEdit && (
                <>
                  <div style={styles.campo}>
                    <label htmlFor="name" style={styles.label}>
                      Nome <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      style={{
                        ...styles.input,
                        ...(allErrors.name ? styles.inputError : {}),
                      }}
                      placeholder="Nome completo"
                      disabled={saving}
                      aria-required="true"
                      aria-invalid={Boolean(allErrors.name)}
                    />
                    {allErrors.name && <div style={styles.erroCampo}>{allErrors.name}</div>}
                  </div>
                  <div style={styles.campo}>
                    <label htmlFor="email" style={styles.label}>
                      Email <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      style={{
                        ...styles.input,
                        ...(allErrors.email ? styles.inputError : {}),
                      }}
                      placeholder="email@exemplo.com"
                      disabled={saving}
                      aria-required="true"
                      aria-invalid={Boolean(allErrors.email)}
                    />
                    {allErrors.email && <div style={styles.erroCampo}>{allErrors.email}</div>}
                  </div>
                </>
              )}

              {isEdit && user && (
                <>
                  <div style={styles.campo}>
                    <label htmlFor="edit-name" style={styles.label}>
                      Nome
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      style={styles.input}
                      disabled={saving}
                    />
                  </div>
                  <div style={styles.campo}>
                    <label htmlFor="edit-email" style={styles.label}>
                      Email
                    </label>
                    <input
                      id="edit-email"
                      type="text"
                      value={form.email}
                      readOnly
                      style={{ ...styles.input, ...styles.inputReadOnly }}
                      aria-readonly="true"
                    />
                  </div>
                  <div style={styles.campo}>
                    <label style={styles.label}>Status</label>
                    <input
                      type="text"
                      readOnly
                      value={statusLabel(user.status)}
                      style={{ ...styles.input, ...styles.inputReadOnly, maxWidth: 200 }}
                    />
                  </div>
                </>
              )}
            </section>

            {/* Seção B — Role */}
            <section style={styles.secao} aria-labelledby="secao-role">
              <h3 id="secao-role" style={styles.secaoTitulo}>
                Role <span style={{ color: '#dc3545' }}>*</span>
              </h3>
              <div style={styles.campo}>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  style={{
                    ...styles.input,
                    maxWidth: 280,
                    ...(allErrors.role ? styles.inputError : {}),
                  }}
                  disabled={saving || (blockDowngradeToStaff && form.role === 'FranchisorOwner')}
                  aria-required="true"
                  aria-invalid={Boolean(allErrors.role)}
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {getFranchisorRoleLabel(r.value)}
                    </option>
                  ))}
                </select>
                {blockDowngradeToStaff && (
                  <p style={styles.avisoOwner}>
                    Não é permitido remover o último proprietário do franqueador. Mantenha pelo menos um FranchisorOwner.
                  </p>
                )}
                {allErrors.role && <div style={styles.erroCampo}>{allErrors.role}</div>}
              </div>
            </section>

            {/* Seção C — Escopo */}
            <section style={styles.secao} aria-labelledby="secao-escopo">
              <h3 id="secao-escopo" style={styles.secaoTitulo}>
                Acesso às escolas <span style={{ color: '#dc3545' }}>*</span>
              </h3>
              <div style={{ marginBottom: GRID * 2 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: GRID, cursor: 'pointer', marginBottom: GRID }}>
                  <input
                    type="radio"
                    name="scope_type"
                    checked={form.scope_type === SCOPE_ALL}
                    onChange={() => setForm((f) => ({ ...f, scope_type: SCOPE_ALL, scope_school_ids: [] }))}
                    disabled={saving}
                  />
                  Todas as escolas
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: GRID, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scope_type"
                    checked={form.scope_type === SCOPE_LIST}
                    onChange={() => setForm((f) => ({ ...f, scope_type: SCOPE_LIST }))}
                    disabled={saving}
                  />
                  Selecionar escolas
                </label>
              </div>
              {form.scope_type === SCOPE_LIST && (
                <>
                  <div style={styles.campo}>
                    <label style={styles.label}>Escolas permitidas</label>
                    <SchoolsMultiSelect
                      schools={schools}
                      selectedIds={form.scope_school_ids}
                      onChange={(ids) => setForm((f) => ({ ...f, scope_school_ids: ids }))}
                      disabled={saving}
                      error={!!allErrors.scope_school_ids}
                    />
                    {allErrors.scope_school_ids && (
                      <div style={styles.erroCampo}>{allErrors.scope_school_ids}</div>
                    )}
                  </div>
                  <p style={styles.apoio}>
                    O usuário só verá dados das escolas selecionadas.
                  </p>
                </>
              )}
            </section>

            {/* Seção D — Observações internas (opcional) */}
            <section style={styles.secao} aria-labelledby="secao-observacoes">
              <h3 id="secao-observacoes" style={styles.secaoTitulo}>
                Observações internas
              </h3>
              <div style={styles.campo}>
                <label htmlFor="notes" style={styles.label}>
                  Observações
                </label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  style={styles.textarea}
                  placeholder="Motivo ou nota interna (opcional)."
                  rows={3}
                  disabled={saving}
                />
              </div>
            </section>

            <div style={styles.rodapeForm}>
              <button
                type="submit"
                style={styles.btnPrimario}
                className="btn-hover"
                disabled={!canSave}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={handleCancel} disabled={saving}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {modalDiscard && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-discard-title">
          <div style={styles.modal}>
            <h3 id="modal-discard-title" style={styles.modalTitulo}>
              Alterações não salvas
            </h3>
            <p style={styles.modalTexto}>
              Você tem alterações não salvas. Deseja descartar?
            </p>
            <div style={styles.modalBotoes}>
              <button type="button" style={styles.btnSecundario} className="btn-hover" onClick={cancelDiscard}>
                Voltar
              </button>
              <button
                type="button"
                style={{ ...styles.btnPrimario, background: '#dc3545' }}
                className="btn-hover"
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
