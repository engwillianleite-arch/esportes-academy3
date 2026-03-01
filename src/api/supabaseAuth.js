/**
 * Autenticação e dados pós-login via Supabase (Auth + profiles, franchisor_members, school_members).
 * Usado quando supabase está configurado (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).
 */
import { supabase } from '../lib/supabase'

/**
 * Busca perfil, membros franqueador e membros escola e monta o objeto de auth no formato do app.
 * @param {string} userId - auth.uid()
 * @returns {Promise<{ user: { id, name, email }, memberships: array, default_redirect: object | null } | null>}
 */
export async function buildAuthFromSupabase(userId) {
  if (!supabase || !userId) return null

  const [
    { data: profile, error: errProfile },
    { data: franchisorRows, error: errFranchisor },
    { data: schoolRows, error: errSchool },
  ] = await Promise.all([
    supabase.from('profiles').select('id, name, email, role_global').eq('id', userId).maybeSingle(),
    supabase.from('franchisor_members').select('franchisor_id, role, scope_type, scope_school_ids, franchisors(name)').eq('user_id', userId),
    supabase.from('school_members').select('school_id, role, scope_type, schools(id, name, city, state, status)').eq('user_id', userId),
  ])

  if (errProfile || errFranchisor || errSchool) return null
  const name = profile?.name ?? profile?.email ?? ''
  const email = profile?.email ?? ''
  const user = { id: userId, name, email }

  const memberships = []
  if (profile?.role_global === 'admin') {
    memberships.push({ portal: 'ADMIN', role: 'Admin', scope: { all: true } })
  }
  if (Array.isArray(franchisorRows)) {
    for (const row of franchisorRows) {
      const franchisorName = row.franchisors?.name ?? null
      memberships.push({
        portal: 'FRANCHISOR',
        role: row.role,
        franchisor_id: row.franchisor_id,
        franchisor_name: franchisorName,
        scope_school_ids: row.scope_type === 'SCHOOL_LIST' ? (row.scope_school_ids || []) : null,
      })
    }
  }
  if (Array.isArray(schoolRows)) {
    for (const row of schoolRows) {
      memberships.push({
        portal: 'SCHOOL',
        role: row.role,
        school_id: row.school_id,
        school_name: row.schools?.name ?? null,
        school_city: row.schools?.city ?? null,
        school_state: row.schools?.state ?? null,
        school_status: row.schools?.status ?? null,
      })
    }
  }

  let default_redirect = null
  if (memberships.length === 1) {
    const m = memberships[0]
    if (m.portal === 'ADMIN') default_redirect = { portal: 'ADMIN', path: '/admin/dashboard' }
    else if (m.portal === 'FRANCHISOR') default_redirect = { portal: 'FRANCHISOR', path: '/franchisor/dashboard', context: { franchisor_id: m.franchisor_id } }
    else if (m.portal === 'SCHOOL') default_redirect = { portal: 'SCHOOL', path: '/school/dashboard', context: { school_id: m.school_id, school_name: m.school_name } }
  } else if (memberships.length > 1) {
    const first = memberships[0]
    if (first.portal === 'ADMIN') default_redirect = { portal: 'ADMIN', path: '/admin/dashboard' }
    else if (first.portal === 'FRANCHISOR') default_redirect = { portal: 'FRANCHISOR', path: '/franchisor/dashboard', context: { franchisor_id: first.franchisor_id } }
    else if (first.portal === 'SCHOOL') default_redirect = { portal: 'SCHOOL', path: '/school/dashboard', context: { school_id: first.school_id, school_name: first.school_name } }
  }

  return { user, memberships, default_redirect }
}

/**
 * Login com e-mail e senha. Retorna no formato do auth.js (user, memberships, default_redirect).
 */
export async function loginWithSupabase(email, password) {
  if (!supabase) return null
  const { data, error } = await supabase.auth.signInWithPassword({
    email: (email || '').trim().toLowerCase(),
    password: password || '',
  })
  if (error) {
    const err = new Error(
      error.message === 'Invalid login credentials'
        ? 'Email ou senha inválidos.'
        : error.message || 'Erro ao entrar.'
    )
    err.code = error.message === 'Invalid login credentials' ? 'INVALID_CREDENTIALS' : 'UNKNOWN'
    throw err
  }
  if (!data?.user?.id) {
    const err = new Error('Resposta de login inválida.')
    err.code = 'NO_PORTAL_ACCESS'
    throw err
  }
  const authData = await buildAuthFromSupabase(data.user.id)
  if (!authData || !authData.memberships.length) {
    await supabase.auth.signOut()
    const err = new Error('Você não possui acesso a nenhum portal no momento.')
    err.code = 'NO_PORTAL_ACCESS'
    throw err
  }
  return authData
}

/**
 * Opções para a tela "Escolha como deseja acessar" (portals no formato esperado por SelectAccess).
 */
export async function getPostLoginOptionsFromSupabase() {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return { portals: [], default_redirect: null }

  const authData = await buildAuthFromSupabase(user.id)
  if (!authData || !authData.memberships.length) return { portals: [], default_redirect: authData?.default_redirect ?? null }

  const portals = []
  if (authData.memberships.some((m) => m.portal === 'ADMIN')) {
    portals.push({ portal: 'ADMIN', label: 'Admin', role: 'Admin' })
  }
  const franchisorMembers = authData.memberships.filter((m) => m.portal === 'FRANCHISOR')
  for (const m of franchisorMembers) {
    portals.push({
      portal: 'FRANCHISOR',
      franchisor_id: m.franchisor_id,
      franchisor_name: m.franchisor_name || m.franchisor_id,
      role: m.role,
      scope_school_ids: m.scope_school_ids || undefined,
    })
  }
  const schoolMembers = authData.memberships.filter((m) => m.portal === 'SCHOOL')
  if (schoolMembers.length > 0) {
    const schools = schoolMembers.map((m) => ({
      school_id: m.school_id,
      school_name: m.school_name || m.school_id,
      city: m.school_city ?? undefined,
      state: m.school_state ?? undefined,
      status: m.school_status ?? undefined,
    }))
    portals.push({
      portal: 'SCHOOL',
      role: schoolMembers[0].role,
      schools,
    })
  }

  return {
    portals,
    default_redirect: authData.default_redirect ?? null,
  }
}

/**
 * Valida portal/contexto e retorna redirect_to (client-side, sem backend).
 */
export async function selectAccessFromSupabase(payload) {
  if (!supabase) return null
  const { portal, context = {}, returnTo } = payload
  const portalUpper = (portal || '').toUpperCase()
  let path = '/admin/dashboard'
  if (portalUpper === 'ADMIN') path = '/admin/dashboard'
  else if (portalUpper === 'FRANCHISOR') path = '/franchisor/dashboard'
  else if (portalUpper === 'SCHOOL') path = '/school/dashboard'

  const allowedPrefixes = ['/admin/', '/franchisor/', '/school/']
  const normalizedReturn = returnTo && typeof returnTo === 'string' ? (returnTo.trim().startsWith('/') ? returnTo.trim() : `/${returnTo.trim()}`) : ''
  const safeReturn = normalizedReturn && !normalizedReturn.startsWith('http') && !normalizedReturn.startsWith('//') && allowedPrefixes.some((p) => normalizedReturn.startsWith(p))
    ? normalizedReturn
    : path

  return { redirect_to: safeReturn }
}

/**
 * Logout no Supabase.
 */
export async function logoutSupabase() {
  if (supabase) await supabase.auth.signOut()
}

/**
 * Retorna a sessão atual (para restaurar estado ao carregar a app).
 */
export async function getSessionSupabase() {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
