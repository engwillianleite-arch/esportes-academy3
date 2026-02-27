/**
 * Usuários e permissões — Portal Escola (MVP).
 * Rota: /school/settings/users
 * RBAC: SchoolOwner e SchoolStaff podem gerenciar; Coach/Finance somente leitura ou bloqueado.
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { useAuth } from '../../contexts/AuthContext'
import {
  getSchoolSettings,
  getSchoolDashboardSummary,
  getSchoolSettingsUsers,
  addSchoolSettingsUser,
  updateSchoolSettingsUser,
  removeSchoolSettingsUser,
  getSchoolTeamsForScope,
} from '../../api/schoolPortal'

const GRID = 8

const ROLES = [
  { value: 'SchoolOwner', label: 'Administrador (SchoolOwner)' },
  { value: 'SchoolStaff', label: 'Equipe (SchoolStaff)' },
  { value: 'Coach', label: 'Professor/Coach' },
  { value: 'Finance', label: 'Financeiro' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'pending', label: 'Convidado/Pendente' },
  { value: 'suspended', label: 'Suspenso' },
]

const MANAGE_ROLES = ['SchoolOwner', 'SchoolStaff']

function getSchoolRole(memberships) {
  if (!Array.isArray(memberships)) return null
  const school = memberships.find((m) => m.portal === 'SCHOOL' && m.school_id)
  return school?.role ?? null
}

function roleLabel(role) {
  return ROLES.find((r) => r.value === role)?.label ?? role
}

function statusLabel(status) {
  if (status === 'active') return 'Ativo'
  if (status === 'pending') return 'Pendente'
  if (status === 'suspended') return 'Suspenso'
  return status || '—'
}

function scopeSummary(scope, teamsMap) {
  if (!scope) return '—'
  if (scope.type === 'school') return 'Toda a escola'
  if (scope.type === 'teams' && Array.isArray(scope.team_ids) && scope.team_ids.length > 0) {
    const names = scope.team_ids.map((id) => teamsMap[id] || id).filter(Boolean)
    return names.length ? `Turmas: ${names.join(', ')}` : 'Turmas selecionadas'
  }
  return 'Turmas selecionadas'
}

const styles = {
  header: { marginBottom: GRID * 4 },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  searchInput: {
    minWidth: 260,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ccc',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
  },
  select: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ccc',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
  },
  btn: {
    padding: `${GRID}px ${GRID * 3}px`,
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 'var(--radius)',
    border: 'none',
    cursor: 'pointer',
  },
  btnPrimary: { background: 'var(--azul-arena)', color: '#fff' },
  btnSecondary: { background: 'var(--branco-luz)', color: 'var(--grafite-tecnico)', border: '1px solid #ccc' },
  btnDanger: { background: '#DC2626', color: '#fff' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  btnSmall: { padding: `${GRID / 2}px ${GRID}px`, fontSize: 13 },
  tableWrap: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
    background: '#f8f9fa',
    borderBottom: '1px solid #eee',
  },
  td: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    borderBottom: '1px solid #eee',
  },
  trLast: { borderBottom: 'none' },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
  },
  badgeOwner: { background: '#DBEAFE', color: '#1E40AF' },
  badgeStaff: { background: '#D1FAE5', color: '#065F46' },
  badgeCoach: { background: '#FEF3C7', color: '#92400E' },
  badgeFinance: { background: '#E0E7FF', color: '#3730A3' },
  tagYou: { background: '#F3F4F6', color: 'var(--grafite-tecnico)', marginLeft: GRID, fontSize: 12 },
  actions: { display: 'flex', gap: GRID, flexWrap: 'wrap' },
  link: { color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none', fontSize: 14 },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  empty: { textAlign: 'center', padding: GRID * 6, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 3,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
  },
  message: { padding: GRID * 2, borderRadius: 'var(--radius)', marginBottom: GRID * 3, fontSize: 14 },
  success: { background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' },
  error: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: GRID * 2,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    maxWidth: 480,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: 'var(--shadow)',
  },
  modalTitle: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  field: { marginBottom: GRID * 2 },
  fieldLabel: { display: 'block', marginBottom: GRID, fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' },
  input: {
    width: '100%',
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    border: '1px solid #ccc',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    boxSizing: 'border-box',
  },
  inputError: { borderColor: '#DC2626' },
  modalActions: { display: 'flex', gap: GRID * 2, justifyContent: 'flex-end', marginTop: GRID * 4, flexWrap: 'wrap' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: GRID },
  radioLabel: { display: 'flex', alignItems: 'center', gap: GRID, cursor: 'pointer', fontSize: 14 },
  multiSelect: {
    maxHeight: 160,
    overflowY: 'auto',
    border: '1px solid #ccc',
    borderRadius: 'var(--radius)',
    padding: GRID,
    marginTop: GRID,
  },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: GRID, padding: `${GRID / 2}px 0`, cursor: 'pointer', fontSize: 14 },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: GRID, marginBottom: GRID * 3, color: 'var(--azul-arena)', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
}

function TableSkeleton({ rows = 5 }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Nome</th>
            <th style={styles.th}>E-mail</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Escopo</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '70%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '80%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 60 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: '50%' }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 50 }} /></td>
              <td style={styles.td}><div style={{ ...styles.skeleton, width: 100 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function roleBadgeStyle(role) {
  if (role === 'SchoolOwner') return styles.badgeOwner
  if (role === 'SchoolStaff') return styles.badgeStaff
  if (role === 'Coach') return styles.badgeCoach
  if (role === 'Finance') return styles.badgeFinance
  return {}
}

export default function SchoolSettingsUsers() {
  const navigate = useNavigate()
  const { user, memberships } = useAuth()
  const userRole = getSchoolRole(memberships)
  const canManage = userRole && MANAGE_ROLES.includes(userRole)
  const currentUserEmail = user?.email || ''
  const currentUserId = user?.id || user?.user_id || ''

  const [schoolName, setSchoolName] = useState('')
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [teamsForScope, setTeamsForScope] = useState([])

  const [q, setQ] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [modalAdd, setModalAdd] = useState(false)
  const [modalEdit, setModalEdit] = useState(null)
  const [modalRemove, setModalRemove] = useState(null)

  const [addForm, setAddForm] = useState({ email: '', name: '', role: 'SchoolStaff', scopeType: 'school', teamIds: [] })
  const [addErrors, setAddErrors] = useState({})
  const [addSaving, setAddSaving] = useState(false)
  const [editForm, setEditForm] = useState({ role: 'SchoolStaff', scopeType: 'school', teamIds: [] })
  const [editSaving, setEditSaving] = useState(false)
  const [removeSaving, setRemoveSaving] = useState(false)

  const loadSchoolName = useCallback(async () => {
    try {
      const data = await getSchoolSettings()
      setSchoolName(data?.name ?? '')
    } catch {
      try {
        const sum = await getSchoolDashboardSummary()
        setSchoolName(sum?.school_name ?? '')
      } catch {
        setSchoolName('')
      }
    }
  }, [])

  const loadUsers = useCallback(() => {
    setError('')
    setLoading(true)
    const params = { page, page_size: pageSize }
    if (q.trim()) params.q = q.trim()
    if (filterRole) params.role = filterRole
    if (filterStatus) params.status = filterStatus
    getSchoolSettingsUsers(params)
      .then((data) => {
        setItems(data.items || [])
        setTotal(data.total ?? 0)
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else setError(err?.message || 'Não foi possível carregar os usuários. Tente novamente.')
      })
      .finally(() => setLoading(false))
  }, [page, pageSize, q, filterRole, filterStatus])

  useEffect(() => {
    loadSchoolName()
  }, [loadSchoolName])

  useEffect(() => {
    if (!canManage) {
      setPermissionDenied(true)
      return
    }
    loadUsers()
  }, [canManage, loadUsers])

  useEffect(() => {
    if (modalAdd || modalEdit) {
      getSchoolTeamsForScope().then((list) => setTeamsForScope(list || []))
    }
  }, [modalAdd, modalEdit])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=school', { replace: true })
  }, [permissionDenied, navigate])

  const hasFilters = q.trim() || filterRole || filterStatus
  const clearFilters = () => {
    setQ('')
    setFilterRole('')
    setFilterStatus('')
  }

  const openAdd = () => {
    setAddForm({ email: '', name: '', role: 'SchoolStaff', scopeType: 'school', teamIds: [] })
    setAddErrors({})
    setModalAdd(true)
  }

  const closeAdd = () => setModalAdd(false)

  const validateAdd = () => {
    const err = {}
    const email = (addForm.email || '').trim()
    if (!email) err.email = 'E-mail é obrigatório.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = 'Informe um e-mail válido.'
    if (!addForm.role) err.role = 'Selecione uma função.'
    setAddErrors(err)
    return Object.keys(err).length === 0
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!validateAdd()) return
    setAddSaving(true)
    const scope = addForm.scopeType === 'teams' && addForm.teamIds?.length
      ? { type: 'teams', team_ids: addForm.teamIds }
      : { type: 'school' }
    addSchoolSettingsUser({
      email: addForm.email.trim(),
      name: addForm.name.trim() || undefined,
      role: addForm.role,
      scope,
    })
      .then(() => {
        setSuccess('Usuário adicionado com sucesso.')
        setError('')
        closeAdd()
        loadUsers()
      })
      .catch((err) => {
        setAddErrors({ submit: err?.message || 'Não foi possível salvar. Tente novamente.' })
      })
      .finally(() => setAddSaving(false))
  }

  const openEdit = (item) => {
    setEditForm({
      role: item.role,
      scopeType: item.scope?.type === 'teams' ? 'teams' : 'school',
      teamIds: item.scope?.type === 'teams' ? [...(item.scope.team_ids || [])] : [],
    })
    setModalEdit(item)
  }

  const closeEdit = () => setModalEdit(null)

  const handleEdit = (e) => {
    e.preventDefault()
    if (!modalEdit) return
    setEditSaving(true)
    const scope = editForm.scopeType === 'teams' && editForm.teamIds?.length
      ? { type: 'teams', team_ids: editForm.teamIds }
      : { type: 'school' }
    updateSchoolSettingsUser(modalEdit.membership_id, { role: editForm.role, scope })
      .then(() => {
        setSuccess('Permissões atualizadas com sucesso.')
        setError('')
        closeEdit()
        loadUsers()
      })
      .catch((err) => {
        setError(err?.message || 'Não foi possível salvar. Tente novamente.')
      })
      .finally(() => setEditSaving(false))
  }

  const openRemove = (item) => setModalRemove(item)
  const closeRemove = () => setModalRemove(null)

  const handleRemove = () => {
    if (!modalRemove) return
    setRemoveSaving(true)
    removeSchoolSettingsUser(modalRemove.membership_id)
      .then(() => {
        setSuccess('Acesso removido.')
        setError('')
        closeRemove()
        loadUsers()
      })
      .catch((err) => {
        setError(err?.message || (err.code === 'LAST_OWNER' ? 'A escola deve ter ao menos um administrador.' : 'Não foi possível remover. Tente novamente.'))
        closeRemove()
      })
      .finally(() => setRemoveSaving(false))
  }

  const ownersCount = items.filter((u) => u.role === 'SchoolOwner').length
  const isLastOwner = (item) => item.role === 'SchoolOwner' && ownersCount <= 1
  const teamsMap = teamsForScope.reduce((acc, t) => ({ ...acc, [t.id]: t.name }), {})

  if (permissionDenied) return null

  return (
    <SchoolLayout schoolName={schoolName}>
      <Link to="/school/settings" style={styles.backLink}>
        ← Voltar para Configurações
      </Link>

      <header style={styles.header}>
        <h1 style={styles.title}>Usuários e permissões</h1>
        <p style={styles.subtitle}>Controle de acesso ao Portal Escola</p>
      </header>

      {success && (
        <div style={{ ...styles.message, ...styles.success }} role="status">
          {success}
        </div>
      )}
      {error && (
        <div style={{ ...styles.message, ...styles.error }} role="alert">
          {error}
        </div>
      )}

      <div style={styles.toolbar}>
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail"
          style={styles.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar por nome ou e-mail"
        />
        <select
          style={styles.select}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          aria-label="Filtrar por função"
        >
          <option value="">Role</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          style={styles.select}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="">Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {hasFilters && (
          <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={clearFilters}>
            Limpar filtros
          </button>
        )}
        <div style={{ flex: 1 }} />
        {canManage && (
          <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={openAdd}>
            Adicionar usuário
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>E-mail</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Escopo</th>
                <th style={styles.th}>Status</th>
                {canManage && <th style={styles.th}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} style={{ ...styles.td, ...styles.empty }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.membership_id}>
                    <td style={styles.td}>
                      {item.name || '—'}
                      {(item.email === currentUserEmail || item.user_id === currentUserId) && (
                        <span style={styles.tagYou}>Você</span>
                      )}
                    </td>
                    <td style={styles.td}>{item.email || '—'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...roleBadgeStyle(item.role) }}>
                        {roleLabel(item.role)}
                      </span>
                    </td>
                    <td style={styles.td}>{scopeSummary(item.scope, teamsMap)}</td>
                    <td style={styles.td}>{statusLabel(item.status)}</td>
                    {canManage && (
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button type="button" style={styles.link} onClick={() => openEdit(item)}>
                            Editar permissões
                          </button>
                          {!(item.email === currentUserEmail || item.user_id === currentUserId) && (
                            <button
                              type="button"
                              style={styles.link}
                              onClick={() => openRemove(item)}
                              disabled={isLastOwner(item)}
                              title={isLastOwner(item) ? 'A escola deve ter ao menos um administrador.' : 'Remover acesso'}
                            >
                              Remover acesso
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && error && (
        <div style={styles.errorBox}>
          <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={loadUsers}>
            Recarregar
          </button>
        </div>
      )}

      {/* Modal Adicionar usuário */}
      {modalAdd && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-add-title">
          <div style={styles.modal}>
            <h2 id="modal-add-title" style={styles.modalTitle}>Adicionar usuário</h2>
            <form onSubmit={handleAdd} noValidate>
              <div style={styles.field}>
                <label htmlFor="add-email" style={styles.fieldLabel}>E-mail do usuário <span style={{ color: '#DC2626' }}>*</span></label>
                <input
                  id="add-email"
                  type="email"
                  style={{ ...styles.input, ...(addErrors.email ? styles.inputError : {}) }}
                  value={addForm.email}
                  onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  aria-required="true"
                  aria-invalid={!!addErrors.email}
                />
                {addErrors.email && <p style={{ margin: `${GRID}px 0 0`, fontSize: 13, color: '#DC2626' }}>{addErrors.email}</p>}
              </div>
              <div style={styles.field}>
                <label htmlFor="add-name" style={styles.fieldLabel}>Nome</label>
                <input
                  id="add-name"
                  type="text"
                  style={styles.input}
                  value={addForm.name}
                  onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nome (opcional)"
                />
              </div>
              <div style={styles.field}>
                <label htmlFor="add-role" style={styles.fieldLabel}>Função <span style={{ color: '#DC2626' }}>*</span></label>
                <select
                  id="add-role"
                  style={styles.input}
                  value={addForm.role}
                  onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value }))}
                  required
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Escopo</span>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="add-scope"
                      checked={addForm.scopeType === 'school'}
                      onChange={() => setAddForm((p) => ({ ...p, scopeType: 'school', teamIds: [] }))}
                    />
                    Toda a escola
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="add-scope"
                      checked={addForm.scopeType === 'teams'}
                      onChange={() => setAddForm((p) => ({ ...p, scopeType: 'teams' }))}
                    />
                    Somente turmas selecionadas
                  </label>
                </div>
                {addForm.scopeType === 'teams' && (
                  <div style={styles.multiSelect}>
                    {teamsForScope.map((t) => (
                      <label key={t.id} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={addForm.teamIds.includes(t.id)}
                          onChange={(e) => {
                            setAddForm((p) => ({
                              ...p,
                              teamIds: e.target.checked ? [...p.teamIds, t.id] : p.teamIds.filter((id) => id !== t.id),
                            }))
                          }}
                        />
                        {t.name}
                      </label>
                    ))}
                    {teamsForScope.length === 0 && <span style={{ fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>Nenhuma turma disponível.</span>}
                  </div>
                )}
              </div>
              {addErrors.submit && <p style={{ margin: `0 0 ${GRID}px`, fontSize: 13, color: '#DC2626' }}>{addErrors.submit}</p>}
              <div style={styles.modalActions}>
                <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={closeAdd}>Cancelar</button>
                <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary, ...(addSaving ? styles.btnDisabled : {}) }} disabled={addSaving}>
                  {addSaving ? 'Salvando…' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar permissões */}
      {modalEdit && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-edit-title">
          <div style={styles.modal}>
            <h2 id="modal-edit-title" style={styles.modalTitle}>Editar permissões — {modalEdit.email}</h2>
            <form onSubmit={handleEdit} noValidate>
              <div style={styles.field}>
                <label htmlFor="edit-role" style={styles.fieldLabel}>Função</label>
                <select
                  id="edit-role"
                  style={styles.input}
                  value={editForm.role}
                  onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Escopo</span>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="edit-scope"
                      checked={editForm.scopeType === 'school'}
                      onChange={() => setEditForm((p) => ({ ...p, scopeType: 'school', teamIds: [] }))}
                    />
                    Toda a escola
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="edit-scope"
                      checked={editForm.scopeType === 'teams'}
                      onChange={() => setEditForm((p) => ({ ...p, scopeType: 'teams' }))}
                    />
                    Somente turmas selecionadas
                  </label>
                </div>
                {editForm.scopeType === 'teams' && (
                  <div style={styles.multiSelect}>
                    {teamsForScope.map((t) => (
                      <label key={t.id} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={editForm.teamIds.includes(t.id)}
                          onChange={(e) => {
                            setEditForm((p) => ({
                              ...p,
                              teamIds: e.target.checked ? [...p.teamIds, t.id] : p.teamIds.filter((id) => id !== t.id),
                            }))
                          }}
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={closeEdit}>Cancelar</button>
                <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary, ...(editSaving ? styles.btnDisabled : {}) }} disabled={editSaving}>
                  {editSaving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
            <div style={{ marginTop: GRID * 3, paddingTop: GRID * 3, borderTop: '1px solid #eee' }}>
              {!(modalEdit.email === currentUserEmail || modalEdit.user_id === currentUserId) && !isLastOwner(modalEdit) && (
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnDanger, ...styles.btnSmall }}
                  onClick={() => { closeEdit(); openRemove(modalEdit); }}
                >
                  Remover acesso
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar remoção */}
      {modalRemove && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-remove-title">
          <div style={styles.modal}>
            <h2 id="modal-remove-title" style={styles.modalTitle}>Remover acesso</h2>
            <p style={{ margin: '0 0 ' + GRID * 3 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)' }}>
              Remover o acesso deste usuário à escola?
            </p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{modalRemove.email}</p>
            <div style={{ ...styles.modalActions, marginTop: GRID * 3 }}>
              <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={closeRemove} disabled={removeSaving}>Cancelar</button>
              <button type="button" style={{ ...styles.btn, ...styles.btnDanger, ...(removeSaving ? styles.btnDisabled : {}) }} onClick={handleRemove} disabled={removeSaving}>
                {removeSaving ? 'Removendo…' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
