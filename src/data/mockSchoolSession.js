/**
 * Store mock da sessão e contadores do Portal Escola (MVP).
 * Usado quando não há backend real: school_id e dados vêm daqui, nunca da query/URL.
 * Quando o backend existir, remover e usar sessão real.
 */

const STORAGE_KEY_SESSION = 'school_mock_session'
const STORAGE_KEY_COUNTS = 'school_mock_counts'
const STORAGE_KEY_ACTIVITY = 'school_mock_recent_activity'
/** Chave usada pelo Signup e pela tela de sucesso de pagamento (MVP). */
const STORAGE_KEY_CHECKOUT_SESSION = 'ea_mock_checkout_session'

/** @typedef {{ user_id: string, school_id: string, school_name: string, role: string, stage?: string, portal?: string }} MockSession */

/**
 * Retorna a sessão mock da escola (apenas leitura).
 * @returns {MockSession | null}
 */
export function getMockSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.school_id) return null
    return {
      user_id: data.user_id ?? 'u1',
      school_id: data.school_id,
      school_name: data.school_name ?? '',
      role: data.role ?? 'SchoolOwner',
      stage: data.stage ?? undefined,
      portal: data.portal ?? undefined,
    }
  } catch {
    return null
  }
}

/**
 * Define a sessão mock (ex.: após signup/pagamento sucesso).
 * @param {Partial<MockSession>} session
 */
export function setMockSession(session) {
  if (!session?.school_id) return
  const current = getMockSession() || {}
  const next = {
    user_id: session.user_id ?? current.user_id,
    school_id: session.school_id,
    school_name: session.school_name ?? current.school_name ?? '',
    role: session.role ?? current.role ?? 'SchoolOwner',
    stage: session.stage ?? current.stage,
    portal: session.portal ?? current.portal,
  }
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(next))
}

/** @typedef {{ checkout_session_id?: string, status?: string, plan_id?: string, amount?: number, payment_method?: 'pix' | 'boleto' | 'analysis' }} MockCheckoutSession */

/**
 * Retorna a sessão mock de checkout (criada no Signup, atualizada em PaymentSuccess).
 * @returns {MockCheckoutSession | null}
 */
export function getMockCheckoutSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHECKOUT_SESSION)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Atualiza a sessão mock de checkout (ex.: status = "paid" em PaymentSuccess).
 * @param {Partial<MockCheckoutSession>} partial
 */
export function setMockCheckoutSession(partial) {
  const current = getMockCheckoutSession() || {}
  const next = { ...current, ...partial }
  localStorage.setItem(STORAGE_KEY_CHECKOUT_SESSION, JSON.stringify(next))
}

/**
 * Atualiza apenas o nome da escola (ex.: após salvar em Dados da escola).
 * @param {string} schoolName
 */
export function setMockSchoolName(schoolName) {
  const current = getMockSession()
  if (!current) return
  setMockSession({ ...current, school_name: schoolName ?? '' })
}

/** @typedef {{ students_count?: number, teams_count?: number, attendances_today_count?: number, overdue_invoices_count?: number, users_count?: number, invoices_count?: number }} MockCounts */

/**
 * Retorna os contadores mock (para checklist e KPIs).
 * @returns {MockCounts}
 */
export function getMockCounts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COUNTS)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/**
 * Define os contadores mock (ex.: após criar turma/aluno ou ao carregar summary da API).
 * @param {MockCounts} counts
 */
export function setMockCounts(counts) {
  const current = getMockCounts()
  const next = { ...current, ...counts }
  localStorage.setItem(STORAGE_KEY_COUNTS, JSON.stringify(next))
}

/**
 * Atualiza um ou mais contadores (merge).
 * @param {Partial<MockCounts>} delta
 */
export function updateMockCounts(delta) {
  setMockCounts({ ...getMockCounts(), ...delta })
}

/** @typedef {{ id: string, label: string, at?: string }} MockActivityItem */

/**
 * Retorna as últimas atividades mock (top N para o dashboard).
 * @param {number} limit
 * @returns {MockActivityItem[]}
 */
export function getMockRecentActivity(limit = 5) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.slice(0, limit) : []
  } catch {
    return []
  }
}

/**
 * Adiciona um item à atividade recente (ex.: "Aluno X cadastrado").
 * @param {MockActivityItem} item
 */
export function pushMockRecentActivity(item) {
  if (!item?.id || !item?.label) return
  const list = getMockRecentActivity(50)
  list.unshift({ ...item, at: item.at ?? new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(list.slice(0, 20)))
}

/**
 * Limpa a sessão mock (ex.: logout).
 */
/**
 * Limpa a sessão mock (ex.: logout).
 * Não remove ea_mock_checkout_session para não quebrar fluxo de retorno do pagamento.
 */
export function clearMockSchoolSession() {
  localStorage.removeItem(STORAGE_KEY_SESSION)
  localStorage.removeItem(STORAGE_KEY_COUNTS)
  localStorage.removeItem(STORAGE_KEY_ACTIVITY)
}
