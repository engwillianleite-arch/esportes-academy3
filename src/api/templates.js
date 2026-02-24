/**
 * Contrato backend (frontend apenas consome):
 * GET /templates — paginação + filtros (search, category, status, page, page_size)
 * GET /templates/:id — detalhe (id, name, key, category, status, content, allowed_variables[], updated_at, updated_by)
 * PATCH /templates/:id — status?, content?, name?, category?
 * GET /templates/:id/versions — paginação
 * GET /templates/:id/versions/:version_id — before_content, after_content
 * Policy: Admin-only. Auditoria obrigatória.
 */

const CATEGORIES = [
  { value: 'UI', label: 'UI (telas)' },
  { value: 'AUTH', label: 'Autenticação' },
  { value: 'NOTIFICATIONS', label: 'Notificações internas' },
  { value: 'ERROR', label: 'Mensagens de erro' },
  { value: 'SUPPORT', label: 'Suporte' },
]

const STATUS_ACTIVE = 'active'
const STATUS_INACTIVE = 'inactive'

// Mock: templates fixos (Fase 2 — apenas edição)
const MOCK_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Sucesso ao redefinir senha',
    key: 'AUTH_RESET_PASSWORD_SUCCESS',
    category: 'AUTH',
    status: STATUS_ACTIVE,
    content: 'Sua senha foi alterada com sucesso. Você já pode fazer login com a nova senha.',
    allowed_variables: ['user_name'],
    updated_at: '2025-02-24T10:00:00Z',
    updated_by: 'Admin Sistema (admin@esportesacademy.com)',
  },
  {
    id: 'tpl-2',
    name: 'Instruções de recuperação de senha',
    key: 'AUTH_RESET_PASSWORD_INSTRUCTIONS',
    category: 'AUTH',
    status: STATUS_ACTIVE,
    content: 'Olá {user_name}. Para redefinir sua senha, use o link enviado no seu e-mail.',
    allowed_variables: ['user_name', 'reset_link'],
    updated_at: '2025-02-23T14:30:00Z',
    updated_by: 'Admin Sistema (admin@esportesacademy.com)',
  },
  {
    id: 'tpl-3',
    name: 'Título da tela de login',
    key: 'AUTH_LOGIN_TITLE',
    category: 'UI',
    status: STATUS_ACTIVE,
    content: 'Entre na sua conta',
    allowed_variables: [],
    updated_at: '2025-02-22T09:00:00Z',
    updated_by: 'Admin Sistema (admin@esportesacademy.com)',
  },
  {
    id: 'tpl-4',
    name: 'Estado vazio - Central de Suporte',
    key: 'SUPPORT_EMPTY_STATE',
    category: 'SUPPORT',
    status: STATUS_ACTIVE,
    content: 'Nenhuma solicitação encontrada. Crie uma nova solicitação para começar.',
    allowed_variables: [],
    updated_at: '2025-02-21T16:00:00Z',
    updated_by: 'Admin Sistema (admin@esportesacademy.com)',
  },
  {
    id: 'tpl-5',
    name: 'Erro genérico',
    key: 'ERROR_GENERIC',
    category: 'ERROR',
    status: STATUS_ACTIVE,
    content: 'Ocorreu um erro. Tente novamente ou entre em contato com o suporte.',
    allowed_variables: [],
    updated_at: '2025-02-20T11:00:00Z',
    updated_by: 'Admin Sistema (admin@esportesacademy.com)',
  },
  {
    id: 'tpl-6',
    name: 'Notificação interna - boas-vindas',
    key: 'NOTIFICATIONS_WELCOME',
    category: 'NOTIFICATIONS',
    status: STATUS_INACTIVE,
    content: 'Bem-vindo(a), {user_name}! Sua escola {school_name} está pronta para uso.',
    allowed_variables: ['user_name', 'school_name', 'franchisor_name'],
    updated_at: '2025-02-19T08:00:00Z',
    updated_by: 'Admin Sistema (admin@esportesacademy.com)',
  },
]

// Mock: versões por template (histórico)
const MOCK_VERSIONS = {
  'tpl-1': [
    { version_id: 'v1-1', created_at: '2025-02-24T10:00:00Z', created_by: 'Admin Sistema', summary: 'Conteúdo atualizado' },
    { version_id: 'v1-2', created_at: '2025-02-20T09:00:00Z', created_by: 'Admin Sistema', summary: 'Criação inicial' },
  ],
  'tpl-2': [
    { version_id: 'v2-1', created_at: '2025-02-23T14:30:00Z', created_by: 'Admin Sistema', summary: 'Inclusão de variável reset_link' },
  ],
  'tpl-3': [
    { version_id: 'v3-1', created_at: '2025-02-22T09:00:00Z', created_by: 'Admin Sistema', summary: 'Texto do template definido' },
  ],
  'tpl-4': [
    { version_id: 'v4-1', created_at: '2025-02-21T16:00:00Z', created_by: 'Admin Sistema', summary: 'Estado vazio da central de suporte' },
  ],
  'tpl-5': [
    { version_id: 'v5-1', created_at: '2025-02-20T11:00:00Z', created_by: 'Admin Sistema', summary: 'Mensagem de erro genérico' },
  ],
  'tpl-6': [
    { version_id: 'v6-1', created_at: '2025-02-19T08:00:00Z', created_by: 'Admin Sistema', summary: 'Template inativado' },
  ],
}

const MOCK_DIFF = {
  'v1-1': { before_content: 'Senha alterada. Faça login.', after_content: 'Sua senha foi alterada com sucesso. Você já pode fazer login com a nova senha.' },
  'v1-2': { before_content: '', after_content: 'Senha alterada. Faça login.' },
  'v2-1': { before_content: 'Olá. Para redefinir sua senha, use o link no e-mail.', after_content: 'Olá {user_name}. Para redefinir sua senha, use o link enviado no seu e-mail.' },
  'v3-1': { before_content: '', after_content: 'Entre na sua conta' },
  'v4-1': { before_content: '', after_content: 'Nenhuma solicitação encontrada. Crie uma nova solicitação para começar.' },
  'v5-1': { before_content: '', after_content: 'Ocorreu um erro. Tente novamente ou entre em contato com o suporte.' },
  'v6-1': { before_content: 'Bem-vindo(a), {user_name}! Sua escola {school_name} está pronta para uso.', after_content: 'Bem-vindo(a), {user_name}! Sua escola {school_name} está pronta para uso.' },
}

export { CATEGORIES, STATUS_ACTIVE, STATUS_INACTIVE }

export function getCategoryLabel(value) {
  const c = CATEGORIES.find((x) => x.value === value)
  return c ? c.label : value || '—'
}

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

export function formatTemplateDate(iso) {
  const d = parseDate(iso)
  return d
    ? d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
}

/**
 * Extrai variáveis no formato {var_name} do conteúdo
 */
export function extractVariablesFromContent(content) {
  if (!content || typeof content !== 'string') return []
  const re = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g
  const set = new Set()
  let m
  while ((m = re.exec(content)) !== null) set.add(m[1])
  return Array.from(set)
}

/**
 * Valida se todas as variáveis do conteúdo estão em allowed_variables
 */
export function validateTemplateVariables(content, allowedVariables) {
  const used = extractVariablesFromContent(content)
  const allowed = new Set(Array.isArray(allowedVariables) ? allowedVariables.map(String) : [])
  const invalid = used.filter((v) => !allowed.has(v))
  return invalid
}

/**
 * GET /templates — listagem com filtros e paginação
 */
export async function listTemplates(params = {}) {
  const { search = '', category = '', status = '', page = 1, page_size = 10 } = params

  await new Promise((r) => setTimeout(r, 400))

  let list = [...MOCK_TEMPLATES]

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    list = list.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(searchLower)) ||
        (t.key && t.key.toLowerCase().includes(searchLower))
    )
  }

  if (category && category !== '') {
    list = list.filter((t) => (t.category || '') === category)
  }

  if (status && status !== '') {
    list = list.filter((t) => (t.status || '') === status)
  }

  const total = list.length
  const start = (Number(page) - 1) * Number(page_size)
  const pageList = list.slice(start, start + Number(page_size))

  return {
    data: pageList,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

/**
 * GET /templates/:id — detalhe do template
 */
export async function getTemplate(id) {
  await new Promise((r) => setTimeout(r, 300))
  const t = MOCK_TEMPLATES.find((x) => String(x.id) === String(id))
  if (!t) {
    const err = new Error('Template não encontrado')
    err.status = 404
    throw err
  }
  return { ...t }
}

/**
 * PATCH /templates/:id — atualizar (status, content, name, category)
 */
export async function updateTemplate(id, payload) {
  await new Promise((r) => setTimeout(r, 500))
  const idx = MOCK_TEMPLATES.findIndex((x) => String(x.id) === String(id))
  if (idx === -1) {
    const err = new Error('Template não encontrado')
    err.status = 404
    throw err
  }
  if (payload.status !== undefined) MOCK_TEMPLATES[idx].status = payload.status
  if (payload.content !== undefined) MOCK_TEMPLATES[idx].content = payload.content
  if (payload.name !== undefined) MOCK_TEMPLATES[idx].name = payload.name
  if (payload.category !== undefined) MOCK_TEMPLATES[idx].category = payload.category
  MOCK_TEMPLATES[idx].updated_at = new Date().toISOString()
  MOCK_TEMPLATES[idx].updated_by = 'Admin Sistema (admin@esportesacademy.com)'
  return { ...MOCK_TEMPLATES[idx] }
}

/**
 * GET /templates/:id/versions — histórico de versões (paginação)
 */
export async function listTemplateVersions(templateId, params = {}) {
  const { page = 1, page_size = 10 } = params
  await new Promise((r) => setTimeout(r, 300))
  const items = MOCK_VERSIONS[templateId] || []
  const total = items.length
  const start = (Number(page) - 1) * Number(page_size)
  const pageList = items.slice(start, start + Number(page_size))
  return {
    data: pageList,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

/**
 * GET /templates/:id/versions/:version_id — antes/depois para diff
 */
export async function getTemplateVersionDiff(templateId, versionId) {
  await new Promise((r) => setTimeout(r, 200))
  const diff = MOCK_DIFF[versionId]
  if (!diff) {
    const err = new Error('Versão não encontrada')
    err.status = 404
    throw err
  }
  return { before_content: diff.before_content, after_content: diff.after_content }
}
