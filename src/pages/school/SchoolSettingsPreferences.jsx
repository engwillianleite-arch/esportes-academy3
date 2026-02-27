/**
 * Preferências (parâmetros operacionais) — Fase 2 — Configurações da Escola.
 * Rota: /school/settings/preferences
 * RBAC: SchoolOwner (edição); opcional SchoolStaff (parcial); Coach/Finance leitura.
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import { useAuth } from '../../contexts/AuthContext'
import { getSchoolSettings, getSchoolPreferences, updateSchoolPreferences } from '../../api/schoolPortal'

const GRID = 8

const EDIT_ROLES = ['SchoolOwner', 'SchoolStaff']
const READ_ONLY_ROLES = ['Coach', 'Finance']

function getSchoolRole(memberships) {
  if (!Array.isArray(memberships)) return null
  const school = memberships.find((m) => m.portal === 'SCHOOL' && m.school_id)
  return school?.role ?? null
}

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' },
]
const DATE_FORMATS = [
  { value: 'dd/mm/yyyy', label: 'dd/mm/aaaa' },
  { value: 'yyyy-mm-dd', label: 'aaaa-mm-dd' },
]
const WEEK_START = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'sunday', label: 'Domingo' },
]
const ATTENDANCE_DEFAULT = [
  { value: 'neutral', label: 'Neutro (não marcado)' },
  { value: 'present', label: 'Presente por padrão' },
  { value: 'absent', label: 'Ausente por padrão' },
]
const ASSESSMENT_SCALE = [
  { value: 'score', label: 'Nota (0–10)' },
  { value: 'level', label: 'Nível (Iniciante/Intermediário/Avançado)' },
  { value: 'boolean', label: 'Sim/Não' },
]

const styles = {
  header: { marginBottom: GRID * 4 },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--grafite-tecnico)', letterSpacing: '-0.02em' },
  subtitle: { margin: `${GRID}px 0 0`, fontSize: 15, color: 'var(--grafite-tecnico)', opacity: 0.85 },
  section: {
    marginBottom: GRID * 4,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 3,
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  sectionTitle: { margin: `0 0 ${GRID * 3}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  field: { marginBottom: GRID * 3 },
  fieldLabel: { display: 'block', marginBottom: GRID, fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' },
  select: {
    width: '100%',
    maxWidth: 320,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 15,
    border: '1px solid #ccc',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
    background: 'var(--branco-luz)',
  },
  input: {
    width: 80,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 15,
    border: '1px solid #ccc',
    borderRadius: 'var(--radius)',
    color: 'var(--grafite-tecnico)',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: GRID * 2,
    marginBottom: GRID * 2,
  },
  toggleLabel: { fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
  },
  toggleOn: { background: 'var(--azul-arena)' },
  toggleOff: { background: '#ccc' },
  toggleThumb: {
    position: 'absolute',
    top: 2,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s',
  },
  linkBlock: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--azul-arena)',
    textDecoration: 'none',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 2,
    marginTop: GRID * 4,
    flexWrap: 'wrap',
  },
  btn: {
    padding: `${GRID}px ${GRID * 3}px`,
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 'var(--radius)',
    border: 'none',
    cursor: 'pointer',
  },
  btnPrimary: { background: 'var(--azul-arena)', color: '#fff' },
  btnSecondary: { background: 'var(--branco-luz)', color: 'var(--grafite-tecnico)', border: '1px solid #ccc' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  skeleton: {
    height: 40,
    maxWidth: 320,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  message: {
    padding: GRID * 2,
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 3,
    fontSize: 14,
  },
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
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    padding: GRID * 4,
    maxWidth: 400,
    width: '90%',
    boxShadow: 'var(--shadow)',
  },
  modalTitle: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 18, fontWeight: 600 },
  modalText: { margin: '0 0 ' + GRID * 3 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)' },
  modalActions: { display: 'flex', gap: GRID * 2, justifyContent: 'flex-end' },
}

function Toggle({ checked, onChange, disabled, id, 'aria-label': ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      style={{
        ...styles.toggle,
        ...(checked ? styles.toggleOn : styles.toggleOff),
        ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
      }}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <span style={{ ...styles.toggleThumb, left: checked ? 22 : 2 }} />
    </button>
  )
}

function FormSkeleton() {
  return (
    <div style={styles.section}>
      <div style={{ ...styles.skeleton, width: '35%', marginBottom: GRID * 3 }} />
      <div style={styles.field}>
        <div style={{ ...styles.skeleton, width: 100, marginBottom: GRID }} />
        <div style={styles.skeleton} />
      </div>
      <div style={styles.field}>
        <div style={{ ...styles.skeleton, width: 120, marginBottom: GRID }} />
        <div style={{ ...styles.skeleton, height: 24 }} />
      </div>
    </div>
  )
}

function getInitialPreferences() {
  return {
    timezone: 'America/Sao_Paulo',
    date_format: 'dd/mm/yyyy',
    week_start: 'monday',
    allow_team_without_schedule: true,
    require_training_time: false,
    default_training_duration_minutes: 60,
    attendance_default_marking: 'neutral',
    allow_edit_attendance_after_save: true,
    attendance_edit_window_days: 7,
    assessments_require_criteria: true,
    assessments_default_scale: 'score',
    allow_edit_assessment_after_save: true,
    announcements_allow_segmentation: true,
    announcements_allow_drafts: true,
  }
}

export default function SchoolSettingsPreferences() {
  const navigate = useNavigate()
  const { memberships } = useAuth()
  const userRole = getSchoolRole(memberships)
  const canEdit = userRole && EDIT_ROLES.includes(userRole)
  const canView = canEdit || (userRole && READ_ONLY_ROLES.includes(userRole))

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [showExitModal, setShowExitModal] = useState(false)

  const [initial, setInitial] = useState(null)
  const [form, setForm] = useState(getInitialPreferences)

  const load = useCallback(() => {
    setError('')
    setSuccess('')
    setLoading(true)
    Promise.all([getSchoolSettings().catch(() => ({ name: '' })), getSchoolPreferences()])
      .then(([settings, prefs]) => {
        setSchoolName(settings?.name ?? '')
        const data = { ...getInitialPreferences(), ...prefs }
        setForm(data)
        setInitial(data)
      })
      .catch((err) => {
        if (err.status === 403 || err.code === 'FORBIDDEN') setPermissionDenied(true)
        else setError(err?.message || 'Não foi possível carregar as preferências. Tente novamente.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=school', { replace: true })
  }, [permissionDenied, navigate])

  const isDirty = initial && Object.keys(form).some((k) => form[k] !== initial[k])

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const buildPayload = () => ({
    timezone: form.timezone,
    date_format: form.date_format,
    week_start: form.week_start,
    allow_team_without_schedule: !!form.allow_team_without_schedule,
    require_training_time: !!form.require_training_time,
    default_training_duration_minutes: form.default_training_duration_minutes == null ? undefined : Number(form.default_training_duration_minutes),
    attendance_default_marking: form.attendance_default_marking,
    allow_edit_attendance_after_save: !!form.allow_edit_attendance_after_save,
    attendance_edit_window_days: form.attendance_edit_window_days == null ? undefined : Number(form.attendance_edit_window_days),
    assessments_require_criteria: !!form.assessments_require_criteria,
    assessments_default_scale: form.assessments_default_scale,
    allow_edit_assessment_after_save: !!form.allow_edit_assessment_after_save,
    announcements_allow_segmentation: !!form.announcements_allow_segmentation,
    announcements_allow_drafts: !!form.announcements_allow_drafts,
  })

  const handleSave = (e) => {
    e.preventDefault()
    if (!canEdit) return
    setSuccess('')
    setError('')
    setSaving(true)
    updateSchoolPreferences(buildPayload())
      .then((data) => {
        setSuccess('Preferências salvas com sucesso.')
        setError('')
        setForm({ ...getInitialPreferences(), ...data })
        setInitial({ ...getInitialPreferences(), ...data })
      })
      .catch((err) => {
        setError(err?.message || 'Não foi possível salvar as preferências. Tente novamente.')
        setSuccess('')
      })
      .finally(() => setSaving(false))
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowExitModal(true)
    } else {
      navigate('/school/settings')
    }
  }

  const handleExitConfirm = () => {
    setShowExitModal(false)
    navigate('/school/settings')
  }

  const handleExitCancel = () => setShowExitModal(false)

  if (permissionDenied) return null
  if (!canView) {
    navigate('/acesso-negado?from=school', { replace: true })
    return null
  }

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Preferências</h1>
        <p style={styles.subtitle}>Parâmetros operacionais da escola</p>
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

      {loading ? (
        <>
          <FormSkeleton />
          <FormSkeleton />
          <FormSkeleton />
        </>
      ) : (
        <form onSubmit={handleSave} noValidate>
          {/* Operação geral */}
          <section style={styles.section} aria-label="Operação geral">
            <h2 style={styles.sectionTitle}>Operação geral</h2>
            <div style={styles.field}>
              <label htmlFor="pref-timezone" style={styles.fieldLabel}>Fuso horário</label>
              <select
                id="pref-timezone"
                style={styles.select}
                value={form.timezone || ''}
                onChange={(e) => updateField('timezone', e.target.value)}
                disabled={!canEdit}
              >
                {TIMEZONES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label htmlFor="pref-date_format" style={styles.fieldLabel}>Formato de data</label>
              <select
                id="pref-date_format"
                style={styles.select}
                value={form.date_format || 'dd/mm/yyyy'}
                onChange={(e) => updateField('date_format', e.target.value)}
                disabled={!canEdit}
              >
                {DATE_FORMATS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label htmlFor="pref-week_start" style={styles.fieldLabel}>Primeiro dia da semana</label>
              <select
                id="pref-week_start"
                style={styles.select}
                value={form.week_start || 'monday'}
                onChange={(e) => updateField('week_start', e.target.value)}
                disabled={!canEdit}
              >
                {WEEK_START.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Turmas e treinos */}
          <section style={styles.section} aria-label="Turmas e treinos">
            <h2 style={styles.sectionTitle}>Turmas e treinos</h2>
            <div style={styles.toggleRow}>
              <label htmlFor="pref-allow_team_without_schedule" style={styles.toggleLabel}>
                Permitir turma sem agenda definida
              </label>
              <Toggle
                id="pref-allow_team_without_schedule"
                checked={!!form.allow_team_without_schedule}
                onChange={(v) => updateField('allow_team_without_schedule', v)}
                disabled={!canEdit}
                aria-label="Permitir turma sem agenda definida"
              />
            </div>
            <div style={styles.toggleRow}>
              <label htmlFor="pref-require_training_time" style={styles.toggleLabel}>
                Exigir horário (início/fim) ao criar treino
              </label>
              <Toggle
                id="pref-require_training_time"
                checked={!!form.require_training_time}
                onChange={(v) => updateField('require_training_time', v)}
                disabled={!canEdit}
                aria-label="Exigir horário ao criar treino"
              />
            </div>
            <div style={styles.field}>
              <label htmlFor="pref-default_training_duration_minutes" style={styles.fieldLabel}>
                Duração padrão do treino (min)
              </label>
              <input
                id="pref-default_training_duration_minutes"
                type="number"
                min={15}
                max={240}
                step={15}
                style={styles.input}
                value={form.default_training_duration_minutes ?? ''}
                onChange={(e) => updateField('default_training_duration_minutes', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                disabled={!canEdit}
              />
            </div>
          </section>

          {/* Presença */}
          <section style={styles.section} aria-label="Presença">
            <h2 style={styles.sectionTitle}>Presença</h2>
            <div style={styles.field}>
              <label htmlFor="pref-attendance_default_marking" style={styles.fieldLabel}>
                Marcação padrão na chamada
              </label>
              <select
                id="pref-attendance_default_marking"
                style={styles.select}
                value={form.attendance_default_marking || 'neutral'}
                onChange={(e) => updateField('attendance_default_marking', e.target.value)}
                disabled={!canEdit}
              >
                {ATTENDANCE_DEFAULT.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.toggleRow}>
              <label htmlFor="pref-allow_edit_attendance_after_save" style={styles.toggleLabel}>
                Permitir editar chamada após salvar
              </label>
              <Toggle
                id="pref-allow_edit_attendance_after_save"
                checked={!!form.allow_edit_attendance_after_save}
                onChange={(v) => updateField('allow_edit_attendance_after_save', v)}
                disabled={!canEdit}
                aria-label="Permitir editar chamada após salvar"
              />
            </div>
            <div style={styles.field}>
              <label htmlFor="pref-attendance_edit_window_days" style={styles.fieldLabel}>
                Janela de edição (dias)
              </label>
              <input
                id="pref-attendance_edit_window_days"
                type="number"
                min={0}
                max={365}
                style={styles.input}
                value={form.attendance_edit_window_days ?? ''}
                onChange={(e) => updateField('attendance_edit_window_days', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                disabled={!canEdit}
              />
            </div>
          </section>

          {/* Avaliações */}
          <section style={styles.section} aria-label="Avaliações">
            <h2 style={styles.sectionTitle}>Avaliações</h2>
            <div style={styles.toggleRow}>
              <label htmlFor="pref-assessments_require_criteria" style={styles.toggleLabel}>
                Exigir ao menos 1 critério ao registrar avaliação
              </label>
              <Toggle
                id="pref-assessments_require_criteria"
                checked={!!form.assessments_require_criteria}
                onChange={(v) => updateField('assessments_require_criteria', v)}
                disabled={!canEdit}
                aria-label="Exigir ao menos 1 critério na avaliação"
              />
            </div>
            <div style={styles.field}>
              <label htmlFor="pref-assessments_default_scale" style={styles.fieldLabel}>
                Escala padrão
              </label>
              <select
                id="pref-assessments_default_scale"
                style={styles.select}
                value={form.assessments_default_scale || 'score'}
                onChange={(e) => updateField('assessments_default_scale', e.target.value)}
                disabled={!canEdit}
              >
                {ASSESSMENT_SCALE.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.toggleRow}>
              <label htmlFor="pref-allow_edit_assessment_after_save" style={styles.toggleLabel}>
                Permitir editar avaliação após salvar
              </label>
              <Toggle
                id="pref-allow_edit_assessment_after_save"
                checked={!!form.allow_edit_assessment_after_save}
                onChange={(v) => updateField('allow_edit_assessment_after_save', v)}
                disabled={!canEdit}
                aria-label="Permitir editar avaliação após salvar"
              />
            </div>
          </section>

          {/* Comunicação */}
          <section style={styles.section} aria-label="Comunicação">
            <h2 style={styles.sectionTitle}>Comunicação</h2>
            <div style={styles.toggleRow}>
              <label htmlFor="pref-announcements_allow_segmentation" style={styles.toggleLabel}>
                Permitir comunicados segmentados (turmas/alunos)
              </label>
              <Toggle
                id="pref-announcements_allow_segmentation"
                checked={!!form.announcements_allow_segmentation}
                onChange={(v) => updateField('announcements_allow_segmentation', v)}
                disabled={!canEdit}
                aria-label="Permitir comunicados segmentados"
              />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
              Se desligado, comunicados serão sempre para &quot;Todos&quot;.
            </p>
            <div style={{ ...styles.toggleRow, marginTop: GRID * 2 }}>
              <label htmlFor="pref-announcements_allow_drafts" style={styles.toggleLabel}>
                Salvar comunicado como rascunho
              </label>
              <Toggle
                id="pref-announcements_allow_drafts"
                checked={!!form.announcements_allow_drafts}
                onChange={(v) => updateField('announcements_allow_drafts', v)}
                disabled={!canEdit}
                aria-label="Salvar comunicado como rascunho"
              />
            </div>
          </section>

          {/* Financeiro (atalho) */}
          <section style={styles.section} aria-label="Financeiro">
            <h2 style={styles.sectionTitle}>Financeiro</h2>
            <p style={{ margin: `0 0 ${GRID * 2}px`, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
              Configurações de mensalidade e regras de cobrança.
            </p>
            <Link to="/school/finance/settings" style={styles.linkBlock}>
              Configurações de mensalidade →
            </Link>
          </section>

          {/* Rodapé de ações */}
          <div style={styles.footer}>
            {canEdit && (
              <button
                type="submit"
                style={{ ...styles.btn, ...styles.btnPrimary, ...(saving ? styles.btnDisabled : {}) }}
                disabled={saving}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            )}
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleCancel}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Modal: alterações não salvas */}
      {showExitModal && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="exit-modal-title">
          <div style={styles.modal}>
            <h2 id="exit-modal-title" style={styles.modalTitle}>
              Alterações não salvas
            </h2>
            <p style={styles.modalText}>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </p>
            <div style={styles.modalActions}>
              <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handleExitCancel}>
                Continuar
              </button>
              <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleExitConfirm}>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolLayout>
  )
}
