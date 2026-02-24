import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import {
  getSystemSettings,
  updateSystemSettings,
  TIMEZONE_OPCOES,
  CURRENCY_OPCOES,
} from '../../api/systemSettings'

const GRID = 8

const ABA_GERAL = 'geral'
const ABA_SEGURANCA = 'seguranca'
const ABA_STATUS = 'status'

const STATUS_FRANQUEADOR = [
  { valor: 'Pendente', descricao: 'Aguardando ativação' },
  { valor: 'Ativo', descricao: 'Em operação' },
  { valor: 'Suspenso', descricao: 'Acesso suspenso' },
]
const STATUS_ESCOLA = [
  { valor: 'Pendente', descricao: 'Aguardando ativação' },
  { valor: 'Ativa', descricao: 'Em operação' },
  { valor: 'Suspensa', descricao: 'Acesso suspenso' },
]

function getInitialForm() {
  return {
    default_timezone: 'America/Sao_Paulo',
    default_currency: 'BRL',
    default_days_until_due: 30,
    session_expiry_minutes: 60,
    login_attempts_before_lock: 5,
    lockout_minutes: 15,
  }
}

function validateForm(values) {
  const errors = {}
  if (values.session_expiry_minutes == null || values.session_expiry_minutes === '') {
    errors.session_expiry_minutes = 'Obrigatório'
  } else {
    const n = Number(values.session_expiry_minutes)
    if (Number.isNaN(n) || n < 1 || !Number.isInteger(n)) {
      errors.session_expiry_minutes = 'Deve ser um número inteiro positivo'
    }
  }
  if (values.login_attempts_before_lock == null || values.login_attempts_before_lock === '') {
    errors.login_attempts_before_lock = 'Obrigatório'
  } else {
    const n = Number(values.login_attempts_before_lock)
    if (Number.isNaN(n) || n < 1 || !Number.isInteger(n)) {
      errors.login_attempts_before_lock = 'Deve ser um número inteiro positivo'
    }
  }
  if (values.lockout_minutes == null || values.lockout_minutes === '') {
    errors.lockout_minutes = 'Obrigatório'
  } else {
    const n = Number(values.lockout_minutes)
    if (Number.isNaN(n) || n < 0 || !Number.isInteger(n)) {
      errors.lockout_minutes = 'Deve ser um número inteiro não negativo'
    }
  }
  if (values.default_days_until_due !== '' && values.default_days_until_due != null) {
    const n = Number(values.default_days_until_due)
    if (Number.isNaN(n) || n < 0 || !Number.isInteger(n)) {
      errors.default_days_until_due = 'Deve ser um número inteiro não negativo'
    }
  }
  return errors
}

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
    marginBottom: GRID * 3,
  },
  tituloWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  naoSalvo: {
    fontSize: 12,
    fontWeight: 600,
    color: '#856404',
    background: 'rgba(255, 193, 7, 0.2)',
    padding: `${GRID}px ${GRID * 2}px`,
    borderRadius: 'var(--radius)',
  },
  tituloPagina: {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  subtitulo: {
    margin: `${GRID}px 0 0`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
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
  },
  linkAuditoria: {
    color: 'var(--azul-arena)',
    fontSize: 14,
    textDecoration: 'none',
  },
  avisoConflito: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: 'rgba(255, 193, 7, 0.15)',
    border: '1px solid rgba(255, 193, 7, 0.4)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
  },
  sucesso: {
    padding: GRID * 2,
    marginBottom: GRID * 3,
    background: 'rgba(40, 167, 69, 0.1)',
    border: '1px solid rgba(40, 167, 69, 0.3)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
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
  tabs: {
    display: 'flex',
    gap: 0,
    borderBottom: '2px solid var(--cinza-arquibancada)',
    marginBottom: GRID * 4,
  },
  tab: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    marginBottom: -2,
    cursor: 'pointer',
    opacity: 0.85,
  },
  tabAtivo: {
    opacity: 1,
    color: 'var(--azul-arena)',
    borderBottomColor: 'var(--azul-arena)',
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
    maxWidth: 320,
  },
  label: {
    display: 'block',
    marginBottom: GRID,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
  },
  labelOpcional: { opacity: 0.75, fontWeight: 400 },
  input: {
    width: '100%',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    maxWidth: 200,
  },
  inputErro: {
    borderColor: '#dc3545',
    background: 'rgba(220, 53, 69, 0.04)',
  },
  ajuda: {
    marginTop: GRID,
    fontSize: 12,
    color: 'var(--grafite-tecnico)',
    opacity: 0.7,
  },
  erroCampo: {
    marginTop: GRID,
    fontSize: 12,
    color: '#dc3545',
  },
  select: {
    width: '100%',
    maxWidth: 280,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    outline: 'none',
  },
  tabelaStatus: {
    width: '100%',
    maxWidth: 480,
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    borderBottom: '2px solid var(--cinza-arquibancada)',
  },
  td: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderBottom: '1px solid #eee',
    color: 'var(--grafite-tecnico)',
  },
  observacaoStatus: {
    marginTop: GRID * 2,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
    fontStyle: 'italic',
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
  skeletonLine: {
    height: 40,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 2,
    maxWidth: 320,
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
    boxShadow: 'var(--shadow)',
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
}

function SkeletonForm() {
  return (
    <div style={styles.cardGrande}>
      <div style={styles.cabecalho}>
        <div>
          <div style={{ ...styles.skeletonLine, maxWidth: 280, height: 26 }} />
          <div style={{ ...styles.skeletonLine, maxWidth: 340, height: 18, marginTop: GRID }} />
        </div>
        <div style={{ display: 'flex', gap: GRID * 2 }}>
          <div style={{ ...styles.skeletonLine, width: 140, height: 40 }} />
          <div style={{ ...styles.skeletonLine, width: 100, height: 40 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: GRID * 2, marginBottom: GRID * 3 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ ...styles.skeletonLine, width: 120, height: 36 }} />
        ))}
      </div>
      <div style={styles.secao}>
        <div style={{ ...styles.skeletonLine, width: 160, height: 18, marginBottom: GRID * 2 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={styles.skeletonLine} />
        ))}
      </div>
      <div style={styles.secao}>
        <div style={{ ...styles.skeletonLine, width: 200, height: 18, marginBottom: GRID * 2 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={styles.skeletonLine} />
        ))}
      </div>
    </div>
  )
}

export default function ConfiguracoesSistema() {
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState(ABA_GERAL)
  const [form, setForm] = useState(getInitialForm)
  const [initialForm, setInitialForm] = useState(null)
  const [etag, setEtag] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorGeral, setErrorGeral] = useState(null)
  const [sucesso, setSucesso] = useState(null)
  const [conflito, setConflito] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [modalDescartar, setModalDescartar] = useState(false)

  const errors = validateForm(form)
  const isValid = Object.keys(errors).length === 0
  const hasChanges = initialForm && JSON.stringify(form) !== JSON.stringify(initialForm)
  const canSave = !saving && isValid && hasChanges

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setErrorGeral(null)
    setConflito(false)
    try {
      const res = await getSystemSettings()
      const s = res.settings || {}
      const next = {
        default_timezone: s.default_timezone ?? 'America/Sao_Paulo',
        default_currency: s.default_currency ?? 'BRL',
        default_days_until_due: s.default_days_until_due ?? 30,
        session_expiry_minutes: s.session_expiry_minutes ?? 60,
        login_attempts_before_lock: s.login_attempts_before_lock ?? 5,
        lockout_minutes: s.lockout_minutes ?? 15,
      }
      setForm(next)
      setInitialForm(next)
      setEtag(res.etag || res.version || null)
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else {
        setErrorGeral(err.message || 'Não foi possível carregar as configurações.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setErrorGeral(null)
    setSucesso(null)
    setConflito(false)
    try {
      const res = await updateSystemSettings(form, etag)
      setInitialForm({ ...form })
      setEtag(res.etag || res.version)
      setSucesso('Configurações atualizadas com sucesso!')
      setTimeout(() => setSucesso(null), 4000)
    } catch (err) {
      if (err.status === 403) {
        setPermissionDenied(true)
      } else if (err.status === 409) {
        setConflito(true)
        setErrorGeral(err.message || 'As configurações foram atualizadas por outro admin. Recarregue para evitar sobrescrever.')
      } else {
        setErrorGeral(err.message || 'Ocorreu um erro ao salvar. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDescartar = () => {
    if (!hasChanges) return
    setModalDescartar(true)
  }

  const confirmarDescartar = () => {
    setForm({ ...initialForm })
    setErrorGeral(null)
    setSucesso(null)
    setConflito(false)
    setModalDescartar(false)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrorGeral(null)
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Configurações' },
  ]

  const auditUrl = '/admin/audit-logs?entity_type=system_settings'

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Configurações do Sistema">
      {loading ? (
        <SkeletonForm />
      ) : (
        <div style={styles.cardGrande}>
          <div style={styles.cabecalho}>
            <div style={styles.tituloWrap}>
              <div>
                <h2 style={styles.tituloPagina}>Configurações do Sistema</h2>
                <p style={styles.subtitulo}>Parâmetros globais aplicados a toda a plataforma</p>
              </div>
              {hasChanges && <span style={styles.naoSalvo}>Não salvo</span>}
            </div>
            <div style={styles.cabecalhoAcoes}>
              <button
                type="button"
                style={styles.btnPrimario}
                className="btn-hover"
                onClick={handleSave}
                disabled={!canSave}
              >
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
              <button
                type="button"
                style={styles.btnSecundario}
                onClick={handleDescartar}
                disabled={!hasChanges || saving}
              >
                Descartar
              </button>
              <Link to={auditUrl} style={styles.linkAuditoria}>
                Ver auditoria
              </Link>
            </div>
          </div>

          {conflito && (
            <div style={styles.avisoConflito} role="alert">
              As configurações foram atualizadas por outro admin. Recarregue para evitar sobrescrever.
            </div>
          )}
          {sucesso && (
            <div style={styles.sucesso} role="status">
              {sucesso}
            </div>
          )}
          {errorGeral && (
            <div style={styles.erroGeral} role="alert">
              {errorGeral}
            </div>
          )}

          <div style={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={abaAtiva === ABA_GERAL}
              style={{ ...styles.tab, ...(abaAtiva === ABA_GERAL ? styles.tabAtivo : {}) }}
              onClick={() => setAbaAtiva(ABA_GERAL)}
            >
              Geral
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={abaAtiva === ABA_SEGURANCA}
              style={{ ...styles.tab, ...(abaAtiva === ABA_SEGURANCA ? styles.tabAtivo : {}) }}
              onClick={() => setAbaAtiva(ABA_SEGURANCA)}
            >
              Acesso e segurança
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={abaAtiva === ABA_STATUS}
              style={{ ...styles.tab, ...(abaAtiva === ABA_STATUS ? styles.tabAtivo : {}) }}
              onClick={() => setAbaAtiva(ABA_STATUS)}
            >
              Padrões de status
            </button>
          </div>

          {abaAtiva === ABA_GERAL && (
            <div style={styles.secao} role="tabpanel">
              <h3 style={styles.secaoTitulo}>Geral</h3>
              <div style={styles.campo}>
                <label style={styles.label} htmlFor="default_timezone">
                  Fuso horário padrão
                </label>
                <select
                  id="default_timezone"
                  value={form.default_timezone}
                  onChange={(e) => handleChange('default_timezone', e.target.value)}
                  style={styles.select}
                  disabled={saving}
                >
                  {TIMEZONE_OPCOES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.campo}>
                <label style={styles.label} htmlFor="default_currency">
                  Moeda padrão
                </label>
                <select
                  id="default_currency"
                  value={form.default_currency}
                  onChange={(e) => handleChange('default_currency', e.target.value)}
                  style={styles.select}
                  disabled={saving}
                >
                  {CURRENCY_OPCOES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.campo}>
                <label style={styles.label} htmlFor="default_days_until_due">
                  <span style={styles.labelOpcional}>Dias padrão de vencimento (opcional)</span>
                </label>
                <input
                  id="default_days_until_due"
                  type="number"
                  min={0}
                  step={1}
                  value={form.default_days_until_due === '' ? '' : form.default_days_until_due}
                  onChange={(e) => {
                    const v = e.target.value
                    handleChange('default_days_until_due', v === '' ? '' : parseInt(v, 10))
                  }}
                  style={{
                    ...styles.input,
                    ...(errors.default_days_until_due ? styles.inputErro : {}),
                  }}
                  disabled={saving}
                />
                <p style={styles.ajuda}>Usado como sugestão para novas escolas.</p>
                {errors.default_days_until_due && (
                  <p style={styles.erroCampo}>{errors.default_days_until_due}</p>
                )}
              </div>
            </div>
          )}

          {abaAtiva === ABA_SEGURANCA && (
            <div style={styles.secao} role="tabpanel">
              <h3 style={styles.secaoTitulo}>Acesso e segurança</h3>
              <div style={styles.campo}>
                <label style={styles.label} htmlFor="session_expiry_minutes">
                  Tempo de expiração de sessão (minutos)
                </label>
                <input
                  id="session_expiry_minutes"
                  type="number"
                  min={1}
                  step={1}
                  value={form.session_expiry_minutes === '' ? '' : form.session_expiry_minutes}
                  onChange={(e) => {
                    const v = e.target.value
                    handleChange('session_expiry_minutes', v === '' ? '' : parseInt(v, 10))
                  }}
                  style={{
                    ...styles.input,
                    ...(errors.session_expiry_minutes ? styles.inputErro : {}),
                  }}
                  disabled={saving}
                />
                {errors.session_expiry_minutes && (
                  <p style={styles.erroCampo}>{errors.session_expiry_minutes}</p>
                )}
              </div>
              <div style={styles.campo}>
                <label style={styles.label} htmlFor="login_attempts_before_lock">
                  Tentativas de login antes de bloqueio
                </label>
                <input
                  id="login_attempts_before_lock"
                  type="number"
                  min={1}
                  step={1}
                  value={form.login_attempts_before_lock === '' ? '' : form.login_attempts_before_lock}
                  onChange={(e) => {
                    const v = e.target.value
                    handleChange('login_attempts_before_lock', v === '' ? '' : parseInt(v, 10))
                  }}
                  style={{
                    ...styles.input,
                    ...(errors.login_attempts_before_lock ? styles.inputErro : {}),
                  }}
                  disabled={saving}
                />
                {errors.login_attempts_before_lock && (
                  <p style={styles.erroCampo}>{errors.login_attempts_before_lock}</p>
                )}
              </div>
              <div style={styles.campo}>
                <label style={styles.label} htmlFor="lockout_minutes">
                  Tempo de bloqueio (minutos)
                </label>
                <input
                  id="lockout_minutes"
                  type="number"
                  min={0}
                  step={1}
                  value={form.lockout_minutes === '' ? '' : form.lockout_minutes}
                  onChange={(e) => {
                    const v = e.target.value
                    handleChange('lockout_minutes', v === '' ? '' : parseInt(v, 10))
                  }}
                  style={{
                    ...styles.input,
                    ...(errors.lockout_minutes ? styles.inputErro : {}),
                  }}
                  disabled={saving}
                />
                {errors.lockout_minutes && (
                  <p style={styles.erroCampo}>{errors.lockout_minutes}</p>
                )}
              </div>
            </div>
          )}

          {abaAtiva === ABA_STATUS && (
            <div style={styles.secao} role="tabpanel">
              <h3 style={styles.secaoTitulo}>Padrões de status</h3>
              <p style={styles.observacaoStatus}>
                Status são controlados por ações administrativas, não por esta tela.
              </p>
              <table style={styles.tabelaStatus}>
                <thead>
                  <tr>
                    <th style={styles.th}>Entidade</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.td}>Franqueador</td>
                    <td style={styles.td}>
                      {STATUS_FRANQUEADOR.map((s) => s.valor).join(' | ')}
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Escola</td>
                    <td style={styles.td}>
                      {STATUS_ESCOLA.map((s) => s.valor).join(' | ')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div style={styles.rodapeForm}>
            <button
              type="button"
              style={styles.btnPrimario}
              className="btn-hover"
              onClick={handleSave}
              disabled={!canSave}
            >
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <button
              type="button"
              style={styles.btnSecundario}
              onClick={handleDescartar}
              disabled={!hasChanges || saving}
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {modalDescartar && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-descartar-titulo">
          <div style={styles.modal}>
            <h3 id="modal-descartar-titulo" style={styles.modalTitulo}>
              Descartar alterações?
            </h3>
            <p style={styles.modalTexto}>
              As alterações não salvas serão perdidas. Deseja continuar?
            </p>
            <div style={styles.modalBotoes}>
              <button type="button" style={styles.btnSecundario} onClick={() => setModalDescartar(false)}>
                Cancelar
              </button>
              <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={confirmarDescartar}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
