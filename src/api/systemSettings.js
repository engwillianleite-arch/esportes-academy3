/**
 * Contrato backend (frontend apenas consome):
 * GET /system-settings → { settings, version/etag, updated_at, updated_by? }
 * PATCH /system-settings → headers If-Match: {etag}; body: settings
 * Policy: Admin-only. Sanitização: bloquear chaves secret/token/key.
 * Auditoria: Admin_UpdateSystemSettings (entity_type=SYSTEM_SETTINGS).
 */

const STORAGE_KEY = 'admin_system_settings_mock'
const ETAG_KEY = 'admin_system_settings_etag_mock'

const DEFAULTS = {
  default_timezone: 'America/Sao_Paulo',
  default_currency: 'BRL',
  default_days_until_due: 30,
  session_expiry_minutes: 60,
  login_attempts_before_lock: 5,
  lockout_minutes: 15,
}

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const etag = localStorage.getItem(ETAG_KEY) || 'v1'
    if (raw) {
      const parsed = JSON.parse(raw)
      return { settings: { ...DEFAULTS, ...parsed }, etag }
    }
  } catch (_) {}
  return { settings: { ...DEFAULTS }, etag: 'v1' }
}

function setStored(settings) {
  const etag = `v${Date.now()}`
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  localStorage.setItem(ETAG_KEY, etag)
  return etag
}

/**
 * GET /system-settings
 * Retorno: { settings, version (etag), updated_at, updated_by? }
 */
export async function getSystemSettings() {
  await new Promise((r) => setTimeout(r, 400))
  const { settings, etag } = getStored()
  return {
    settings: { ...settings },
    version: etag,
    etag,
    updated_at: new Date().toISOString(),
    updated_by: null,
  }
}

/**
 * PATCH /system-settings
 * Headers: If-Match (opcional)
 * Body: { settings } (somente campos permitidos)
 * 409 se etag não bater (alteração concorrente)
 */
export async function updateSystemSettings(payload, currentEtag) {
  await new Promise((r) => setTimeout(r, 500))
  const { settings: current } = getStored()
  if (currentEtag && currentEtag !== getStored().etag) {
    const err = new Error('As configurações foram atualizadas por outro admin. Recarregue para evitar sobrescrever.')
    err.status = 409
    throw err
  }
  const allowed = {
    default_timezone: payload.default_timezone,
    default_currency: payload.default_currency,
    default_days_until_due: payload.default_days_until_due,
    session_expiry_minutes: payload.session_expiry_minutes,
    login_attempts_before_lock: payload.login_attempts_before_lock,
    lockout_minutes: payload.lockout_minutes,
  }
  const next = { ...current }
  Object.keys(allowed).forEach((k) => {
    if (allowed[k] !== undefined) next[k] = allowed[k]
  })
  const etag = setStored(next)
  return {
    settings: { ...next },
    version: etag,
    etag,
    updated_at: new Date().toISOString(),
    updated_by: null,
  }
}

export const TIMEZONE_OPCOES = [
  { value: 'America/Sao_Paulo', label: 'America/São Paulo (Brasília)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid' },
]

export const CURRENCY_OPCOES = [
  { value: 'BRL', label: 'BRL (Real)' },
]
