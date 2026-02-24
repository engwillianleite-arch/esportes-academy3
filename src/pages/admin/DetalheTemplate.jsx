import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import {
  getTemplate,
  updateTemplate,
  listTemplateVersions,
  getTemplateVersionDiff,
  formatTemplateDate,
  getCategoryLabel,
  validateTemplateVariables,
  STATUS_ACTIVE,
  STATUS_INACTIVE,
} from '../../api/templates'

const GRID = 8
const TAB_EDICAO = 'edicao'
const TAB_HISTORICO = 'historico'

// Valores mock para preview (sem integrações externas)
const MOCK_PREVIEW_VALUES = {
  user_name: 'Maria Silva',
  school_name: 'Escola Arena SP',
  franchisor_name: 'Rede Esportes',
  reset_link: 'https://app.exemplo.com/reset/abc123',
}

function SkeletonLine({ width = '80%' }) {
  return (
    <div
      style={{
        height: 16,
        background: 'var(--cinza-arquibancada)',
        borderRadius: 4,
        width,
        marginBottom: GRID,
      }}
    />
  )
}

function StatusBadge({ status }) {
  const isActive = status === STATUS_ACTIVE
  return (
    <span
      style={{
        display: 'inline-block',
        padding: `${GRID * 0.5}px ${GRID * 2}px`,
        borderRadius: 'var(--radius)',
        fontSize: 12,
        fontWeight: 600,
        ...(isActive
          ? { background: 'rgba(40, 167, 69, 0.15)', color: '#155724' }
          : { background: 'rgba(108, 117, 125, 0.2)', color: '#495057' }),
      }}
    >
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  )
}

export default function DetalheTemplate() {
  const { template_id: templateId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tabFromUrl = searchParams.get('tab') === TAB_HISTORICO ? TAB_HISTORICO : TAB_EDICAO

  const backQuery = searchParams.toString()
  const backUrl = backQuery ? `/admin/templates?${backQuery}` : '/admin/templates'
  const auditUrl = templateId
    ? `/admin/audit-logs?entity_type=TEMPLATE&entity_id=${templateId}`
    : '/admin/audit-logs'

  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const [tab, setTab] = useState(tabFromUrl)
  const [form, setForm] = useState({ name: '', content: '', status: STATUS_ACTIVE, category: '' })
  const [initialForm, setInitialForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const [versions, setVersions] = useState(null)
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionPage, setVersionPage] = useState(1)
  const [diffModal, setDiffModal] = useState(null)
  const [diffLoading, setDiffLoading] = useState(false)

  const [previewText, setPreviewText] = useState(null)

  useEffect(() => {
    setTab(tabFromUrl)
  }, [tabFromUrl])

  const loadTemplate = useCallback(async () => {
    if (!templateId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    setPermissionDenied(false)
    try {
      const data = await getTemplate(templateId)
      setTemplate(data)
      const initial = {
        name: data.name || '',
        content: data.content || '',
        status: data.status || STATUS_ACTIVE,
        category: data.category || '',
      }
      setForm(initial)
      setInitialForm(initial)
    } catch (e) {
      if (e.status === 403) {
        setPermissionDenied(true)
      } else if (e.status === 404) {
        setNotFound(true)
      } else {
        setError(e?.message || 'Não foi possível carregar o template.')
      }
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    loadTemplate()
  }, [loadTemplate])

  const loadVersions = useCallback(async () => {
    if (!templateId) return
    setVersionsLoading(true)
    try {
      const res = await listTemplateVersions(templateId, { page: versionPage, page_size: 10 })
      setVersions(res)
    } catch {
      setVersions({ data: [], total: 0, total_pages: 0 })
    } finally {
      setVersionsLoading(false)
    }
  }, [templateId, versionPage])

  useEffect(() => {
    if (tab === TAB_HISTORICO && templateId) loadVersions()
  }, [tab, templateId, loadVersions])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  function validate() {
    const next = {}
    if (!(form.content != null && String(form.content).trim() !== '')) {
      next.content = 'O conteúdo não pode ser vazio.'
    }
    const invalidVars = validateTemplateVariables(form.content, template?.allowed_variables || [])
    if (invalidVars.length > 0) {
      next.content = `Variável {${invalidVars[0]}} não é permitida neste template.`
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!template || !validate()) return
    setSaving(true)
    setToast(null)
    try {
      await updateTemplate(template.id, {
        content: form.content.trim(),
        name: form.name.trim() || undefined,
        status: form.status,
      })
      setToast('Template salvo com sucesso!')
      setInitialForm({ ...form })
      loadTemplate()
    } catch (e) {
      if (e.status === 403) {
        setPermissionDenied(true)
      } else {
        setToast('Não foi possível salvar. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (initialForm) setForm({ ...initialForm })
    setErrors({})
    setToast(null)
  }

  const hasChanges =
    initialForm &&
    (form.content !== initialForm.content ||
      form.name !== initialForm.name ||
      form.status !== initialForm.status)

  const handlePreview = () => {
    if (!template || !form.content) {
      setPreviewText(null)
      return
    }
    let text = form.content
    const allowed = template.allowed_variables || []
    allowed.forEach((v) => {
      const mock = MOCK_PREVIEW_VALUES[v] ?? `[${v}]`
      text = text.replace(new RegExp(`\\{${v}\\}`, 'g'), mock)
    })
    setPreviewText(text)
  }

  const openDiff = async (versionId) => {
    setDiffModal(versionId)
    setDiffLoading(true)
    try {
      const data = await getTemplateVersionDiff(templateId, versionId)
      setDiffModal({ versionId, ...data })
    } catch {
      setDiffModal(null)
    } finally {
      setDiffLoading(false)
    }
  }

  if (permissionDenied) {
    navigate('/acesso-negado', { replace: true })
    return null
  }

  const breadcrumb = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Configurações Globais', to: '/admin/settings' },
    { label: 'Templates', to: backUrl },
    { label: template ? template.name : 'Template' },
  ]

  const styles = {
    wrapper: { maxWidth: 900 },
    card: {
      background: 'var(--branco-luz)',
      borderRadius: 'var(--radius)',
      padding: GRID * 4,
      marginBottom: GRID * 3,
      boxShadow: 'var(--shadow)',
      border: '1px solid rgba(0,0,0,0.04)',
    },
    cardTitulo: {
      margin: `0 0 ${GRID * 2}px`,
      fontSize: 16,
      fontWeight: 600,
      color: 'var(--grafite-tecnico)',
    },
    cabecalho: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: GRID * 3,
      marginBottom: GRID * 4,
    },
    titulo: { margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--grafite-tecnico)' },
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
      border: '1px solid #ccc',
      padding: `${GRID * 2}px ${GRID * 3}px`,
      borderRadius: 'var(--radius)',
      fontSize: 14,
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block',
    },
    link: { color: 'var(--azul-arena)', textDecoration: 'none', fontSize: 14 },
    label: { display: 'block', marginBottom: GRID, fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' },
    input: {
      width: '100%',
      padding: `${GRID * 2}px ${GRID * 3}px`,
      border: '1px solid #E5E5E7',
      borderRadius: 'var(--radius)',
      fontSize: 14,
      outline: 'none',
    },
    inputErro: { borderColor: '#dc3545' },
    textarea: {
      width: '100%',
      minHeight: 140,
      padding: `${GRID * 2}px ${GRID * 3}px`,
      border: '1px solid #E5E5E7',
      borderRadius: 'var(--radius)',
      fontSize: 14,
      outline: 'none',
      resize: 'vertical',
      fontFamily: 'inherit',
    },
    help: { marginTop: GRID, fontSize: 12, color: 'var(--grafite-tecnico)', opacity: 0.8 },
    erroInline: { marginTop: GRID, fontSize: 13, color: '#dc3545' },
    varsList: {
      marginTop: GRID,
      fontSize: 13,
      color: 'var(--grafite-tecnico)',
      opacity: 0.9,
    },
    toast: {
      padding: GRID * 2,
      marginBottom: GRID * 2,
      background: 'rgba(40, 167, 69, 0.1)',
      color: '#155724',
      borderRadius: 'var(--radius)',
      fontSize: 14,
    },
    toastErro: {
      background: 'rgba(220, 53, 69, 0.1)',
      color: '#721c24',
    },
    erro: {
      padding: GRID * 4,
      background: 'rgba(220, 53, 69, 0.06)',
      borderRadius: 'var(--radius)',
    },
    erroTexto: { margin: `0 0 ${GRID * 2}px`, fontSize: 14, color: 'var(--grafite-tecnico)' },
    tabs: { display: 'flex', gap: GRID * 2, marginBottom: GRID * 3 },
    tab: {
      padding: `${GRID * 2}px ${GRID * 3}px`,
      border: 'none',
      background: 'none',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--grafite-tecnico)',
      cursor: 'pointer',
      borderRadius: 'var(--radius)',
      opacity: 0.85,
    },
    tabAtivo: { color: 'var(--azul-arena)', opacity: 1, background: 'rgba(44, 110, 242, 0.08)' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
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
    diffBox: {
      background: 'rgba(0,0,0,0.03)',
      border: '1px solid #E5E5E7',
      borderRadius: 'var(--radius)',
      padding: GRID * 2,
      fontSize: 13,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      maxHeight: 200,
      overflow: 'auto',
    },
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
      maxWidth: 560,
      width: '90%',
      maxHeight: '85vh',
      overflow: 'auto',
      boxShadow: 'var(--shadow)',
    },
    modalTitulo: { margin: `0 0 ${GRID * 3}px`, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
    previewBox: {
      background: 'rgba(0,0,0,0.04)',
      border: '1px solid #E5E5E7',
      borderRadius: 'var(--radius)',
      padding: GRID * 3,
      marginTop: GRID * 2,
      fontSize: 14,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    },
  }

  return (
    <AdminLayout breadcrumb={breadcrumb} pageTitle="Editar template">
      <div style={styles.wrapper}>
        {loading && (
          <>
            <div style={styles.card}>
              <SkeletonLine width="40%" />
              <SkeletonLine width="60%" />
            </div>
            <div style={styles.card}>
              <SkeletonLine width="30%" />
              <SkeletonLine width="100%" />
              <SkeletonLine width="100%" />
            </div>
          </>
        )}

        {!loading && (error || notFound) && (
          <div style={styles.card}>
            <div style={styles.erro}>
              <p style={styles.erroTexto}>
                {notFound ? 'Template não encontrado.' : error}
              </p>
              <Link to={backUrl} style={styles.btnSecundario}>
                Voltar para Templates
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && !notFound && template && (
          <>
            <div style={styles.cabecalho}>
              <div style={{ display: 'flex', alignItems: 'center', gap: GRID * 2, flexWrap: 'wrap' }}>
                <h1 style={styles.titulo}>Editar template</h1>
                <StatusBadge status={form.status} />
              </div>
              <div style={styles.cabecalhoAcoes}>
                <button
                  type="button"
                  style={styles.btnPrimario}
                  className="btn-hover"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  type="button"
                  style={styles.btnSecundario}
                  onClick={handleCancel}
                  disabled={saving || !hasChanges}
                >
                  Cancelar
                </button>
                <Link to={auditUrl} style={styles.link}>
                  Ver auditoria
                </Link>
              </div>
            </div>

            {toast && (
              <div
                style={{
                  ...styles.toast,
                  ...(toast.startsWith('Não') ? styles.toastErro : {}),
                }}
                role="status"
              >
                {toast}
              </div>
            )}

            <div style={styles.tabs}>
              <button
                type="button"
                style={{ ...styles.tab, ...(tab === TAB_EDICAO ? styles.tabAtivo : {}) }}
                onClick={() => setTab(TAB_EDICAO)}
              >
                Edição
              </button>
              <button
                type="button"
                style={{ ...styles.tab, ...(tab === TAB_HISTORICO ? styles.tabAtivo : {}) }}
                onClick={() => setTab(TAB_HISTORICO)}
              >
                Histórico de versões
              </button>
            </div>

            {tab === TAB_EDICAO && (
              <>
                <div style={styles.card}>
                  <h2 style={styles.cardTitulo}>Identificação</h2>
                  <div style={{ marginBottom: GRID * 2 }}>
                    <label htmlFor="template-name" style={styles.label}>
                      Nome
                    </label>
                    <input
                      id="template-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      style={styles.input}
                      placeholder="Nome do template"
                    />
                  </div>
                  <div style={{ marginBottom: GRID * 2 }}>
                    <label style={styles.label}>Chave</label>
                    <div style={{ ...styles.input, background: 'var(--cinza-arquibancada)', opacity: 0.9 }}>
                      {template.key}
                    </div>
                  </div>
                  <div style={{ marginBottom: GRID * 2 }}>
                    <label style={styles.label}>Categoria</label>
                    <div style={{ ...styles.input, background: 'var(--cinza-arquibancada)', opacity: 0.9 }}>
                      {getCategoryLabel(template.category)}
                    </div>
                  </div>
                  <div>
                    <label style={styles.label}>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      style={styles.input}
                    >
                      <option value={STATUS_ACTIVE}>Ativo</option>
                      <option value={STATUS_INACTIVE}>Inativo</option>
                    </select>
                  </div>
                </div>

                <div style={styles.card}>
                  <h2 style={styles.cardTitulo}>Conteúdo</h2>
                  <label htmlFor="template-content" style={styles.label}>
                    Texto do template
                  </label>
                  <textarea
                    id="template-content"
                    value={form.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    style={{
                      ...styles.textarea,
                      ...(errors.content ? styles.inputErro : {}),
                    }}
                    placeholder="Digite o texto. Use variáveis no formato {nome_variavel}."
                  />
                  <p style={styles.help}>Você pode usar variáveis do sistema.</p>
                  {(template.allowed_variables || []).length > 0 && (
                    <p style={styles.varsList}>
                      Variáveis permitidas: {(template.allowed_variables || []).map((v) => `{${v}}`).join(', ')}
                    </p>
                  )}
                  {errors.content && <p style={styles.erroInline}>{errors.content}</p>}
                </div>

                <div style={styles.card}>
                  <h2 style={styles.cardTitulo}>Pré-visualização</h2>
                  <button
                    type="button"
                    style={styles.btnSecundario}
                    onClick={handlePreview}
                    disabled={!form.content}
                  >
                    Gerar preview
                  </button>
                  {previewText !== null && (
                    <div style={styles.previewBox}>
                      {previewText || '(vazio)'}
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === TAB_HISTORICO && (
              <div style={styles.card}>
                <h2 style={styles.cardTitulo}>Histórico de versões</h2>
                {versionsLoading && (
                  <div>
                    <SkeletonLine />
                    <SkeletonLine />
                    <SkeletonLine />
                  </div>
                )}
                {!versionsLoading && versions && (
                  <>
                    {versions.data?.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 }}>
                        Nenhuma versão registrada.
                      </p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Data/hora</th>
                              <th style={styles.th}>Alterado por</th>
                              <th style={styles.th}>Resumo</th>
                              <th style={styles.th}>Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(versions.data || []).map((v) => (
                              <tr key={v.version_id}>
                                <td style={styles.td}>{formatTemplateDate(v.created_at)}</td>
                                <td style={styles.td}>{v.created_by || '—'}</td>
                                <td style={styles.td}>{v.summary || '—'}</td>
                                <td style={styles.td}>
                                  <button
                                    type="button"
                                    style={styles.link}
                                    onClick={() => openDiff(v.version_id)}
                                  >
                                    Ver diff
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {versions.total_pages > 1 && (
                      <div style={{ marginTop: GRID * 2, display: 'flex', gap: GRID }}>
                        <button
                          type="button"
                          style={styles.btnSecundario}
                          disabled={versionPage <= 1}
                          onClick={() => setVersionPage((p) => p - 1)}
                        >
                          Anterior
                        </button>
                        <span style={{ alignSelf: 'center', fontSize: 14 }}>
                          Página {versionPage} de {versions.total_pages}
                        </span>
                        <button
                          type="button"
                          style={styles.btnSecundario}
                          disabled={versionPage >= versions.total_pages}
                          onClick={() => setVersionPage((p) => p + 1)}
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {diffModal && typeof diffModal === 'object' && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true">
          <div style={styles.modal}>
            <h3 style={styles.modalTitulo}>Ver diff — versão</h3>
            {diffLoading ? (
              <SkeletonLine />
            ) : (
              <>
                <p style={styles.label}>Antes</p>
                <div style={styles.diffBox}>
                  {diffModal.before_content ?? '(vazio)'}
                </div>
                <p style={{ ...styles.label, marginTop: GRID * 3 }}>Depois</p>
                <div style={styles.diffBox}>
                  {diffModal.after_content ?? '(vazio)'}
                </div>
                <div style={{ marginTop: GRID * 3 }}>
                  <button
                    type="button"
                    style={styles.btnSecundario}
                    onClick={() => setDiffModal(null)}
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
