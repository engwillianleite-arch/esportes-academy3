import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import {
  getSchoolById,
  getSchoolUser,
  updateSchoolUser,
  SCOPE_SINGLE,
  ROLES_ESCOLA,
} from '../../api/franqueadores'

const GRID = 8

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
  botoesForm: { display: 'flex', gap: GRID * 2, marginTop: GRID * 4 },
}

const ROLE_OPTIONS = ROLES_ESCOLA.map((r) => ({ value: r, label: r }))

export default function EditarUsuarioEscola() {
  const { id: schoolId, userId } = useParams()
  const navigate = useNavigate()
  const listUrl = `/admin/escolas/${schoolId}/usuarios`

  const [school, setSchool] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [form, setForm] = useState({ role: 'SchoolStaff', scope_type: SCOPE_SINGLE })
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchSchool = useCallback(async () => {
    if (!schoolId) return
    try {
      const data = await getSchoolById(schoolId)
      setSchool(data)
      if (data?.status === 403 || data?.permission_denied) setPermissionDenied(true)
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
    }
  }, [schoolId])

  const fetchUser = useCallback(async () => {
    if (!schoolId || !userId) return
    try {
      const u = await getSchoolUser(schoolId, userId)
      setUser(u)
      setForm({
        role: u.role || 'SchoolStaff',
        scope_type: u.scope_type === 'SCHOOL_LIST' ? 'SCHOOL_LIST' : SCOPE_SINGLE,
      })
    } catch (err) {
      if (err.status === 403) setPermissionDenied(true)
      else setUser(null)
    }
  }, [schoolId, userId])

  useEffect(() => {
    Promise.all([fetchSchool(), fetchUser()]).finally(() => setLoading(false))
  }, [fetchSchool, fetchUser])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSubmitError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      await updateSchoolUser(schoolId, userId, {
        role: form.role,
        scope_type: SCOPE_SINGLE,
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

  const schoolName = school?.name || 'Escola'
  const breadcrumb = [
    { label: 'Escolas', to: '/admin/escolas' },
    { label: `Escola: ${schoolName}`, to: `/admin/escolas/${schoolId}` },
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
                {ROLE_OPTIONS.map((r) => (
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
                  checked={true}
                  readOnly
                  disabled={submitting}
                />
                <span>Somente esta escola</span>
              </label>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.8 }}>
              O usuário tem acesso apenas a esta escola.
            </p>
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
