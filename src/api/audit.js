/**
 * Helper para registrar eventos de auditoria no Supabase (tabela audit_logs).
 * Usado pelas ações do portal Admin (criar escola, alterar status, etc.).
 */

import { supabase } from '../lib/supabase'

const USE_SUPABASE = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

/**
 * Registra um evento de auditoria.
 * @param {string} eventType - Ex: Admin_CreateSchool, Admin_ChangeFranchisorStatus
 * @param {string} entityType - Ex: school, franchisor
 * @param {string} entityId - ID da entidade (pode ser UUID string)
 * @param {object} options - metadata_summary, school_id?, franchisor_id?, metadata?, ip_address?, source_portal?
 */
export async function logAuditEvent(eventType, entityType, entityId, options = {}) {
  if (!USE_SUPABASE || !supabase) return
  const { data: { user } } = await supabase.auth.getUser()
  const profile = user?.id
    ? (await supabase.from('profiles').select('name, email').eq('id', user.id).maybeSingle()).data
    : null
  const row = {
    event_type: eventType,
    entity_type: entityType || null,
    entity_id: entityId ? String(entityId) : null,
    school_id: options.school_id || null,
    franchisor_id: options.franchisor_id || null,
    metadata_summary: options.metadata_summary || null,
    actor_user_id: user?.id ?? null,
    actor_name: profile?.name ?? user?.email ?? null,
    actor_email: profile?.email ?? user?.email ?? null,
    ip_address: options.ip_address || null,
    user_agent: options.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : null) || null,
    source_portal: options.source_portal || 'portal_admin',
    metadata: options.metadata ? (typeof options.metadata === 'object' ? options.metadata : {}) : {},
    correlation_id: options.correlation_id || null,
  }
  await supabase.from('audit_logs').insert(row)
}
