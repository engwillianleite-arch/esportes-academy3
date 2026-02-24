import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { useFranchisorSidebar } from '../../contexts/FranchisorSidebarContext'
import {
  getFranqueadorById,
  getFranchisorUser,
  updateFranchisorUser,
  listFranchisorSchoolsForScope,
} from '../../api/franqueadores'

const GRID = 8
const ROLES = [
  { value: 'FranchisorOwner', label: 'FranchisorOwner' },
  { value: 'FranchisorStaff', label: 'FranchisorStaff' },
]
const SCOPE_ALL = 'ALL_SCHOOLS'
const SCOPE_LIST = 'SCHOOL_LIST'

const styles = {
  cardGrande: {
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
  tituloPagina: { margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--grafite-tecnico)' },
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
  erroGeral: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: 'rgba(220, 53, 69, 0.08)',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(220, 53, 69, 0.3)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  secao: { marginBottom: GRID * 4 },
  secaoTitulo: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 16, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  campo: { marginBottom: GRID * 2, maxWidth: 480 },
  label: { display: 'block', marginBottom: GRID, fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' },
  readonly: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 'var(--radius)',
    border: '1px solid #E5E5E7',
  },
  select: {
    width: '100%',
    maxWidth: 320,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
  },
  radioGrupo: { marginBottom: GRID * 2 },
  radioWrap: { display: 'flex', alignItems: 'center', gap: GRID, marginBottom: GRID, cursor: 'pointer' },
  multiSelect: {
    width: '100%',
    maxWidth: 400,
    minHeight: 120,
    padding: GRID,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    marginTop: GRID * 2,
    boxSizing: 'border-box',
  },
  botoesForm: { display: 'flex', gap: GRID * 2, marginTop: GRID * 4 },
  erroCampo: { marginTop: GRID, fontSize: 12, color: '#dc3545' },
}

function validate(form) {
  const err = {}
  if (form.scope_type === SCOPE_LIST && (!form.scope_school_ids || form.scope_school_ids.length === 0)) {
    err.scope_school_ids = 'Selecione ao menos uma escola'
  }
  return err
}

export default function EditarUsuarioFranqueador() {
  const { id, userId } = useParams()
  const navigate = useNavigate()
  const { setFranchisorName } = useFranchisorSidebar()

  const [franqueador, setFranqueador] = useState(null)
  const [user, setUser] = useState(null)
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingSchools, setLoadingSchools] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [form, setForm] = useState({ role: 'FranchisorStaff', scope_type: 'ALL_SCHOOLS', scope_school_ids: [] })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const listUrl = `/admin/franqueadores/${id}/usuarios`
  const returnTo = `/admin/franqueadores/${id}?tab=overview`

  const fetchFranqueador = useCallback(async () => {
    if (!id) return
    try {
      const data = await getFranqueadorById(id)
      setFranqueador(data)
      setFranchisorName(data?.name ?? '')
      if (data?.status === 403 || data?.permission_denied) setPermissionDenied(true)
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
    }
  }, [id, setFranchisorName])

  const fetchUser = useCallback(async () => {
    if (!id || !userId) return
    try {
      const u = await getFranchisorUser(id, userId)
      setUser(u)
      setForm({
        role: u.role || 'FranchisorStaff',
        scope_type: u.scope_type === 'SCHOOL_LIST' ? 'SCHOOL_LIST' : 'ALL_SCHOOLS',
        scope_school_ids: u.scope_school_ids || [],
      })
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else setUser(null)
    }
  }, [id, userId])

  const fetchSchools = useCallback(async () => {
    if (!id) return
    setLoadingSchools(true)
    try {
      const list = await listFranchisorSchoolsForScope(id)
      setSchools(list)
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
    } finally {
      setLoadingSchools(false)
    }
  }, [id])

  useEffect(() => {
    Promise.all([fetchFranqueador(), fetchUser()]).finally(() => setLoading(false))
  }, [fetchFranqueador, fetchUser])

  useEffect(() => {
    fetchSchools()
  }, [fetchSchools])

  useEffect(() => {
    return () => setFranchisorName('')
  }, [id, setFranchisorName])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
    setSubmitError(null)
  }

  const handleScopeSchoolChange = (e) => {
    const opts = e.target.selectedOptions
    const ids = Array.from(opts).map((o) => o.value)
    handleChange('scope_school_ids', ids)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate(form)
    setErrors(err)
    if (Object.keys(err).length > 0) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await updateFranchisorUser(id, userId, {
        role: form.role,
        scope_type: form.scope_type,
        scope_school_ids: form.scope_type === SCOPE_LIST ? form.scope_school_ids : undefined,
      })
      navigate(listUrl, { state: { toast: 'Usuário salvo com sucesso!' } })
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else setSubmitError('Não foi possível salvar. Verifique os campos e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const franqueadorNome = franqueador?.name || 'Franqueador'
  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Franqueadores', to: '/admin/franqueadores' },
    { label: `Franqueador: ${franqueadorNome}`, to: `/admin/franqueadores/${id}?tab=overview` },
    { label: 'Usuários', to: listUrl },
    { label: 'Editar permissões' },
  ]

  if (loading && !user) {
    return (
      <AdminLayout breadcrumb={breadcrumb}>
        <div style={styles.cardGrande}>
          <div style={{ height: 24, width: 280, background: 'var(--cinza-arquibancada)', borderRadius: 4 }} />
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout breadcrumb={breadcrumb}>
        <div style={styles.cardGrande}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)' }}>Usuário não encontrado.</p>
          <Link to={listUrl} style={{ ...styles.btnSecundario, marginTop: GRID * 2 }} className="btn-hover">
            Voltar para a lista
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout breadcrumb={breadcrumb}>
      <div style={styles.cardGrande}>
        <div style={styles.cabecalho}>
          <h1 style={styles.tituloPagina}>Editar permissões</h1>
          <Link to={listUrl} style={styles.btnSecundario} className="btn-hover">
            Voltar para a lista
          </Link>
        </div>

        {submitError && <div style={styles.erroGeral}>{submitError}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.secao}>
            <h2 style={styles.secaoTitulo}>Dados do usuário (somente leitura)</h2>
            <div style={styles.campo}>
              <label style={styles.label}>Nome</label>
              <div style={styles.readonly}>{user.name || '—'}</div>
            </div>
            <div style={styles.campo}>
              <label style={styles.label}>Email</label>
              <div style={styles.readonly}>{user.email || '—'}</div>
            </div>
          </div>

          <div style={styles.secao}>
            <h2 style={styles.secaoTitulo}>Permissões</h2>
            <div style={styles.campo}>
              <label style={styles.label} htmlFor="role">Role</label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => handleChange('role', e.target.value)}
                style={styles.select}
                disabled={submitting}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.secao}>
            <h2 style={styles.secaoTitulo}>Escopo</h2>
            <div style={styles.radioGrupo}>
              <label style={styles.radioWrap}>
                <input
                  type="radio"
                  name="scope_type"
                  checked={form.scope_type === SCOPE_ALL}
                  onChange={() => handleChange('scope_type', SCOPE_ALL)}
                  disabled={submitting}
                />
                <span>Todas as escolas do franqueador</span>
              </label>
              <label style={styles.radioWrap}>
                <input
                  type="radio"
                  name="scope_type"
                  checked={form.scope_type === SCOPE_LIST}
                  onChange={() => handleChange('scope_type', SCOPE_LIST)}
                  disabled={submitting}
                />
                <span>Selecionar escolas</span>
              </label>
            </div>
            {form.scope_type === SCOPE_LIST && (
              <div style={styles.campo}>
                <label style={styles.label}>Escolas</label>
                <select
                  multiple
                  value={form.scope_school_ids}
                  onChange={handleScopeSchoolChange}
                  style={styles.multiSelect}
                  disabled={submitting || loadingSchools}
                  aria-label="Selecionar escolas"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} {s.status ? `(${s.status})` : ''}</option>
                  ))}
                </select>
                {schools.length === 0 && !loadingSchools && (
                  <p style={{ marginTop: GRID, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
                    Nenhuma escola vinculada a este franqueador.
                  </p>
                )}
                {errors.scope_school_ids && <div style={styles.erroCampo}>{errors.scope_school_ids}</div>}
              </div>
            )}
          </div>

          <div style={styles.botoesForm}>
            <button type="submit" style={styles.btnPrimario} className="btn-hover" disabled={submitting}>
              {submitting ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <Link to={listUrl} style={styles.btnSecundario} className="btn-hover">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
