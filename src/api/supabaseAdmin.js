/**
 * Implementação das APIs do portal Admin usando Supabase (franchisors, schools, members, status).
 * Usado quando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidos.
 */

import { supabase } from '../lib/supabase'
import { logAuditEvent } from './audit'

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function normStatus(s) {
  if (!s) return s
  const v = String(s).toLowerCase()
  return v === 'ativa' ? 'ativo' : v
}

// ——— Franqueadores ———

export async function listFranqueadoresSupabase(params = {}) {
  const { search = '', status = '', created_from = '', created_to = '', page = 1, page_size = 10 } = params
  let q = supabase.from('franchisors').select('id, name, owner_name, email, status, created_at', { count: 'exact' })

  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    q = q.or(`name.ilike.%${searchLower}%,owner_name.ilike.%${searchLower}%,email.ilike.%${searchLower}%`)
  }
  if (status && status !== 'todos') {
    q = q.eq('status', status.toLowerCase())
  }
  if (created_from) {
    const fromDate = parseDate(created_from)
    if (fromDate) q = q.gte('created_at', fromDate.toISOString())
  }
  if (created_to) {
    const toDate = parseDate(created_to)
    if (toDate) q = q.lte('created_at', toDate.toISOString())
  }

  q = q.order('created_at', { ascending: false })
  const start = (Number(page) - 1) * Number(page_size)
  q = q.range(start, start + Number(page_size) - 1)

  const { data: rows, error, count } = await q
  if (error) {
    const err = new Error(error.message || 'Erro ao listar franqueadores')
    err.status = error.code === 'PGRST116' ? 404 : 500
    throw err
  }

  const total = count ?? 0
  const withCount = await Promise.all(
    (rows || []).map(async (f) => {
      const { count: schoolCount } = await supabase.from('schools').select('id', { count: 'exact', head: true }).eq('franchisor_id', f.id)
      return { ...f, schools_count: schoolCount ?? 0 }
    })
  )

  return {
    data: withCount,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

export async function getFranqueadorByIdSupabase(id) {
  const { data: f, error } = await supabase.from('franchisors').select('*').eq('id', id).single()
  if (error || !f) {
    const err = new Error('Franqueador não encontrado')
    err.status = 404
    throw err
  }
  const { data: schools } = await supabase.from('schools').select('id, status').eq('franchisor_id', id)
  const list = schools || []
  const active = list.filter((s) => (s.status || '').toLowerCase() === 'ativo').length
  const pending = list.filter((s) => (s.status || '').toLowerCase() === 'pendente').length
  return {
    id: f.id,
    name: f.name,
    trade_name: null,
    commercial_name: null,
    owner_name: f.owner_name,
    email: f.email,
    phone: f.phone ?? null,
    document_type: null,
    document: f.document ?? null,
    status: f.status,
    notes_internal: f.notes_internal ?? null,
    created_at: f.created_at,
    address_cep: null,
    address_street: null,
    address_number: null,
    address_complement: null,
    address_neighborhood: null,
    address_city: null,
    address_state: null,
    schools_count: list.length,
    schools_active_count: active,
    schools_pending_count: pending,
  }
}

export async function createFranqueadorSupabase(payload) {
  const insert = {
    name: payload.name || '',
    owner_name: payload.owner_name || '',
    email: (payload.email || '').trim().toLowerCase(),
    phone: payload.phone || null,
    document: payload.document || null,
    status: normStatus(payload.status) || 'pendente',
    notes_internal: payload.notes_internal || null,
  }
  const { data, error } = await supabase.from('franchisors').insert(insert).select().single()
  if (error) {
    const err = new Error(error.message || 'Erro ao criar franqueador')
    err.status = 400
    throw err
  }
  await logAuditEvent('Admin_CreateFranchisor', 'franchisor', data.id, {
    franchisor_id: data.id,
    metadata_summary: `Franqueador ${data.name} cadastrado`,
  })
  return { id: data.id, ...data, schools_count: 0 }
}

export async function updateFranqueadorSupabase(id, payload) {
  const upd = {}
  if (payload.name !== undefined) upd.name = payload.name
  if (payload.owner_name !== undefined) upd.owner_name = payload.owner_name
  if (payload.email !== undefined) upd.email = payload.email.trim().toLowerCase()
  if (payload.phone !== undefined) upd.phone = payload.phone
  if (payload.document !== undefined) upd.document = payload.document
  if (payload.status !== undefined) upd.status = normStatus(payload.status)
  if (payload.notes_internal !== undefined) upd.notes_internal = payload.notes_internal
  upd.updated_at = new Date().toISOString()
  const { data, error } = await supabase.from('franchisors').update(upd).eq('id', id).select().single()
  if (error) {
    const err = new Error(error.message || 'Erro ao atualizar franqueador')
    err.status = error.code === 'PGRST116' ? 404 : 400
    throw err
  }
  await logAuditEvent('Admin_UpdateFranchisor', 'franchisor', id, {
    franchisor_id: id,
    metadata_summary: `Franqueador ${data.name} atualizado`,
  })
  return data
}

// ——— Escolas ———

export async function listEscolasByFranqueadorSupabase(franchisorId, params = {}) {
  const { search = '', status: statusFilter = '', page = 1, page_size = 10 } = params
  let q = supabase.from('schools').select('*', { count: 'exact' }).eq('franchisor_id', franchisorId)
  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    q = q.or(`name.ilike.%${searchLower}%,city.ilike.%${searchLower}%`)
  }
  if (statusFilter && statusFilter !== 'todos') {
    q = q.eq('status', statusFilter.toLowerCase())
  }
  q = q.order('created_at', { ascending: false })
  const start = (Number(page) - 1) * Number(page_size)
  const { data, error, count } = await q.range(start, start + Number(page_size) - 1)
  if (error) throw new Error(error.message || 'Erro ao listar escolas')
  return {
    data: data || [],
    total: count ?? 0,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil((count ?? 0) / Number(page_size)) || 1,
  }
}

export async function listEscolasSupabase(params = {}) {
  const { search = '', status: statusFilter = '', franchisor_id: fidFilter = '', page = 1, page_size = 10 } = params
  let q = supabase.from('schools').select('*, franchisors(name)', { count: 'exact' })
  if (fidFilter) q = q.eq('franchisor_id', fidFilter)
  const searchLower = (search || '').toLowerCase().trim()
  if (searchLower) {
    q = q.or(`name.ilike.%${searchLower}%,city.ilike.%${searchLower}%`)
  }
  if (statusFilter && statusFilter !== 'todos') {
    q = q.eq('status', statusFilter.toLowerCase())
  }
  q = q.order('created_at', { ascending: false })
  const start = (Number(page) - 1) * Number(page_size)
  const { data, error, count } = await q.range(start, start + Number(page_size) - 1)
  if (error) throw new Error(error.message || 'Erro ao listar escolas')
  const list = (data || []).map((s) => ({
    ...s,
    franchisor_name: s.franchisors?.name ?? '',
  }))
  return {
    data: list,
    total: count ?? 0,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil((count ?? 0) / Number(page_size)) || 1,
  }
}

export async function getSchoolByIdSupabase(schoolId) {
  const { data: s, error } = await supabase.from('schools').select('*, franchisors(name)').eq('id', schoolId).single()
  if (error || !s) {
    const err = new Error('Escola não encontrada')
    err.status = 404
    throw err
  }
  return {
    id: s.id,
    name: s.name,
    status: s.status,
    franchisor_id: s.franchisor_id,
    franchisor_name: s.franchisors?.name ?? '',
    responsible_name: s.responsible_name ?? null,
    email: s.email ?? null,
    phone: s.phone ?? null,
    city: s.city ?? null,
    state: s.state ?? null,
    address: s.address ?? null,
    notes_internal: s.notes_internal ?? null,
    created_at: s.created_at ?? null,
    org_id: s.org_id ?? null,
  }
}

export async function getSchoolSummarySupabase(schoolId) {
  return { students_count: null, teams_count: null, open_invoices_count: null }
}

export async function listFranchisorsForSelectSupabase() {
  const { data, error } = await supabase
    .from('franchisors')
    .select('id, name, status')
    .in('status', ['ativo', 'pendente'])
    .order('name')
  if (error) throw new Error(error.message || 'Erro ao listar franqueadores')
  return (data || []).map((f) => ({ id: f.id, name: f.name, status: f.status }))
}

export async function createSchoolSupabase(payload) {
  const franchisorId = payload.franchisor_id
  const { data: fr } = await supabase.from('franchisors').select('name').eq('id', franchisorId).single()
  const insert = {
    franchisor_id: franchisorId,
    name: payload.name || '',
    responsible_name: payload.responsible_name || null,
    email: payload.email || null,
    phone: payload.phone || null,
    city: payload.city || null,
    state: payload.state || null,
    address: payload.address || null,
    status: normStatus(payload.status) || 'pendente',
    notes_internal: payload.notes_internal || null,
  }
  const { data, error } = await supabase.from('schools').insert(insert).select().single()
  if (error) {
    const err = new Error(error.message || 'Erro ao criar escola')
    err.status = 400
    throw err
  }
  await logAuditEvent('Admin_CreateSchool', 'school', data.id, {
    school_id: data.id,
    franchisor_id: data.franchisor_id,
    metadata_summary: `Nova escola ${data.name}`,
  })
  return {
    id: data.id,
    name: data.name,
    franchisor_id: data.franchisor_id,
    franchisor_name: fr?.name ?? '',
    status: data.status,
    responsible_name: data.responsible_name,
    email: data.email,
    phone: data.phone,
    city: data.city,
    state: data.state,
    address: data.address,
    notes_internal: data.notes_internal,
    created_at: data.created_at,
  }
}

export async function updateSchoolSupabase(schoolId, payload) {
  const upd = {}
  if (payload.name !== undefined) upd.name = payload.name
  if (payload.responsible_name !== undefined) upd.responsible_name = payload.responsible_name
  if (payload.email !== undefined) upd.email = payload.email
  if (payload.phone !== undefined) upd.phone = payload.phone
  if (payload.city !== undefined) upd.city = payload.city
  if (payload.state !== undefined) upd.state = payload.state
  if (payload.address !== undefined) upd.address = payload.address
  if (payload.status !== undefined) upd.status = normStatus(payload.status)
  if (payload.notes_internal !== undefined) upd.notes_internal = payload.notes_internal
  upd.updated_at = new Date().toISOString()
  const { data, error } = await supabase.from('schools').update(upd).eq('id', schoolId).select().single()
  if (error) {
    const err = new Error(error.message || 'Erro ao atualizar escola')
    err.status = error.code === 'PGRST116' ? 404 : 400
    throw err
  }
  await logAuditEvent('Admin_UpdateSchool', 'school', data.id, {
    school_id: data.id,
    franchisor_id: data.franchisor_id,
    metadata_summary: `Escola ${data.name} atualizada`,
  })
  const { data: fr } = await supabase.from('franchisors').select('name').eq('id', data.franchisor_id).single()
  return {
    id: data.id,
    name: data.name,
    franchisor_id: data.franchisor_id,
    franchisor_name: fr?.name ?? '',
    status: data.status,
    responsible_name: data.responsible_name,
    email: data.email,
    phone: data.phone,
    city: data.city,
    state: data.state,
    address: data.address,
    notes_internal: data.notes_internal,
    created_at: data.created_at,
  }
}

// ——— Usuários Franqueador (franchisor_members + profiles) ———

export async function listFranchisorUsersSupabase(franchisorId, params = {}) {
  const { search = '', role: roleFilter = '', status: statusFilter = '', page = 1, page_size = 10 } = params
  let q = supabase
    .from('franchisor_members')
    .select('id, user_id, franchisor_id, role, scope_type, scope_school_ids, status, last_login_at, profiles(name, email)', { count: 'exact' })
    .eq('franchisor_id', franchisorId)
  if (roleFilter && roleFilter !== 'todos') q = q.eq('role', roleFilter)
  if (statusFilter && statusFilter !== 'todos') q = q.eq('status', statusFilter.toLowerCase())
  q = q.order('created_at', { ascending: false })
  const start = (Number(page) - 1) * Number(page_size)
  const { data, error, count } = await q.range(start, start + Number(page_size) - 1)
  if (error) throw new Error(error.message || 'Erro ao listar usuários')
  const { data: schools } = await supabase.from('schools').select('id').eq('franchisor_id', franchisorId)
  const totalSchools = (schools || []).length
  const list = (data || []).map((row) => {
    const scopeSchoolIds = row.scope_school_ids || []
    const scopeCount = row.scope_type === 'ALL_SCHOOLS' ? totalSchools : scopeSchoolIds.length
    return {
      user_id: row.user_id,
      name: row.profiles?.name ?? '',
      email: row.profiles?.email ?? '',
      role: row.role,
      scope_type: row.scope_type,
      scope_school_ids: row.scope_school_ids,
      scope_school_count: scopeCount,
      status: row.status,
      last_login_at: row.last_login_at,
    }
  })
  const searchLower = (search || '').toLowerCase().trim()
  let filtered = list
  if (searchLower) {
    filtered = list.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
    )
  }
  const total = searchLower ? filtered.length : (count ?? 0)
  const pageList = searchLower ? filtered : list
  return {
    data: pageList,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

export async function listFranchisorSchoolsForScopeSupabase(franchisorId) {
  const res = await listEscolasByFranqueadorSupabase(franchisorId, { page: 1, page_size: 500 })
  return res.data || []
}

export async function createFranchisorUserSupabase(franchisorId, payload) {
  const email = (payload.email || '').trim().toLowerCase()
  const { data: profile } = await supabase.from('profiles').select('id, name, email').eq('email', email).maybeSingle()
  if (!profile) {
    const err = new Error('Nenhum usuário encontrado com este e-mail. O usuário precisa se cadastrar na plataforma primeiro.')
    err.status = 400
    throw err
  }
  const scopeType = payload.scope_type === 'SCHOOL_LIST' ? 'SCHOOL_LIST' : 'ALL_SCHOOLS'
  const scopeSchoolIds = scopeType === 'SCHOOL_LIST' ? (payload.scope_school_ids || []) : null
  const { data, error } = await supabase
    .from('franchisor_members')
    .insert({
      user_id: profile.id,
      franchisor_id: franchisorId,
      role: payload.role === 'FranchisorOwner' ? 'FranchisorOwner' : 'FranchisorStaff',
      scope_type: scopeType,
      scope_school_ids: scopeSchoolIds,
      status: 'convidado',
    })
    .select()
    .single()
  if (error) {
    const err = new Error(error.message || 'Erro ao adicionar usuário')
    err.status = 400
    throw err
  }
  const { data: schools } = await supabase.from('schools').select('id').eq('franchisor_id', franchisorId)
  const totalSchools = (schools || []).length
  const scopeCount = scopeType === 'ALL_SCHOOLS' ? totalSchools : (scopeSchoolIds?.length || 0)
  return {
    user_id: data.user_id,
    name: profile.name ?? profile.email ?? '',
    email: profile.email ?? '',
    role: data.role,
    scope_type: data.scope_type,
    scope_school_ids: data.scope_school_ids,
    scope_school_count: scopeCount,
    status: data.status,
    last_login_at: null,
  }
}

export async function getFranchisorUserSupabase(franchisorId, userId) {
  const { data, error } = await supabase
    .from('franchisor_members')
    .select('*, profiles(name, email)')
    .eq('franchisor_id', franchisorId)
    .eq('user_id', userId)
    .single()
  if (error || !data) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  const { data: schools } = await supabase.from('schools').select('id').eq('franchisor_id', franchisorId)
  const totalSchools = (schools || []).length
  const scopeCount = data.scope_type === 'ALL_SCHOOLS' ? totalSchools : (data.scope_school_ids?.length || 0)
  return {
    user_id: data.user_id,
    name: data.profiles?.name ?? '',
    email: data.profiles?.email ?? '',
    role: data.role,
    scope_type: data.scope_type,
    scope_school_ids: data.scope_school_ids,
    scope_school_count: scopeCount,
    status: data.status,
    last_login_at: data.last_login_at,
  }
}

export async function updateFranchisorUserSupabase(franchisorId, userId, payload) {
  const scopeType = payload.scope_type === 'SCHOOL_LIST' ? 'SCHOOL_LIST' : 'ALL_SCHOOLS'
  const scopeSchoolIds = scopeType === 'SCHOOL_LIST' ? (payload.scope_school_ids || []) : null
  const upd = {
    role: payload.role === 'FranchisorOwner' ? 'FranchisorOwner' : 'FranchisorStaff',
    scope_type: scopeType,
    scope_school_ids: scopeSchoolIds,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('franchisor_members')
    .update(upd)
    .eq('franchisor_id', franchisorId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) {
    const err = new Error(error.message || 'Erro ao atualizar usuário')
    err.status = error.code === 'PGRST116' ? 404 : 400
    throw err
  }
  const { data: schools } = await supabase.from('schools').select('id').eq('franchisor_id', franchisorId)
  const totalSchools = (schools || []).length
  const scopeCount = data.scope_type === 'ALL_SCHOOLS' ? totalSchools : (data.scope_school_ids?.length || 0)
  const { data: profile } = await supabase.from('profiles').select('name, email').eq('id', data.user_id).single()
  return {
    user_id: data.user_id,
    name: profile?.name ?? '',
    email: profile?.email ?? '',
    role: data.role,
    scope_type: data.scope_type,
    scope_school_ids: data.scope_school_ids,
    scope_school_count: scopeCount,
    status: data.status,
    last_login_at: data.last_login_at,
  }
}

export async function deleteFranchisorUserSupabase(franchisorId, userId) {
  const { error } = await supabase.from('franchisor_members').delete().eq('franchisor_id', franchisorId).eq('user_id', userId)
  if (error) {
    const err = new Error(error.message || 'Erro ao remover usuário')
    err.status = 404
    throw err
  }
  return { ok: true }
}

// ——— Status Franqueador ———

export async function getFranchisorStatusSupabase(franchisorId) {
  const { data: f, error } = await supabase.from('franchisors').select('status').eq('id', franchisorId).single()
  if (error || !f) {
    const err = new Error('Franqueador não encontrado')
    err.status = 404
    throw err
  }
  const { data: history } = await supabase
    .from('franchisor_status_history')
    .select('changed_at, from_status, to_status, reason_category, reason_details, actor_id')
    .eq('franchisor_id', franchisorId)
    .order('changed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  let lastChangedBy = null
  if (history?.actor_id) {
    const { data: actor } = await supabase.from('profiles').select('name, email').eq('id', history.actor_id).maybeSingle()
    if (actor) lastChangedBy = { name: actor.name, email: actor.email }
  }
  return {
    current_status: (f.status || 'pendente').toLowerCase(),
    last_changed_at: history?.changed_at ?? null,
    last_changed_by: lastChangedBy,
    last_reason_category: history?.reason_category ?? null,
    last_reason_details: history?.reason_details ?? null,
  }
}

export async function getFranchisorStatusHistorySupabase(franchisorId, params = {}) {
  const { page = 1, page_size = 10 } = params
  const { data: f } = await supabase.from('franchisors').select('id').eq('id', franchisorId).single()
  if (!f) {
    const err = new Error('Franqueador não encontrado')
    err.status = 404
    throw err
  }
  const start = (Number(page) - 1) * Number(page_size)
  const { data: rows, error, count } = await supabase
    .from('franchisor_status_history')
    .select('id, changed_at, from_status, to_status, reason_category, reason_details, actor_id', { count: 'exact' })
    .eq('franchisor_id', franchisorId)
    .order('changed_at', { ascending: false })
    .range(start, start + Number(page_size) - 1)
  if (error) throw new Error(error.message || 'Erro ao listar histórico')
  const total = count ?? 0
  const items = await Promise.all(
    (rows || []).map(async (h) => {
      let actor_name = null
      let actor_email = null
      if (h.actor_id) {
        const { data: actor } = await supabase.from('profiles').select('name, email').eq('id', h.actor_id).maybeSingle()
        if (actor) {
          actor_name = actor.name
          actor_email = actor.email
        }
      }
      return {
        changed_at: h.changed_at,
        from_status: h.from_status,
        to_status: h.to_status,
        actor_name,
        actor_email,
        reason_category: h.reason_category,
        reason_details: h.reason_details,
      }
    })
  )
  return {
    items,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

export async function postFranchisorStatusTransitionSupabase(franchisorId, payload) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: current, error: errGet } = await supabase.from('franchisors').select('status').eq('id', franchisorId).single()
  if (errGet || !current) {
    const err = new Error('Franqueador não encontrado')
    err.status = 404
    throw err
  }
  const currentStatus = (current.status || 'pendente').toLowerCase()
  const action = payload.action
  let toStatus = null
  if (action === 'APPROVE' && currentStatus === 'pendente') toStatus = 'ativo'
  if (action === 'SUSPEND' && currentStatus === 'ativo') toStatus = 'suspenso'
  if (action === 'REACTIVATE' && currentStatus === 'suspenso') toStatus = 'ativo'
  if (!toStatus) {
    const err = new Error('Transição inválida de status.')
    err.status = 400
    throw err
  }
  await supabase.from('franchisor_status_history').insert({
    franchisor_id: franchisorId,
    from_status: currentStatus,
    to_status: toStatus,
    actor_id: user?.id ?? null,
    reason_category: payload.reason_category || null,
    reason_details: payload.reason_details || null,
  })
  const { data: updated, error } = await supabase.from('franchisors').update({ status: toStatus, updated_at: new Date().toISOString() }).eq('id', franchisorId).select().single()
  if (error) throw new Error(error.message || 'Erro ao atualizar status')
  await logAuditEvent('Admin_ChangeFranchisorStatus', 'franchisor', franchisorId, {
    franchisor_id: franchisorId,
    metadata_summary: `Status alterado para ${toStatus}`,
    metadata: { from_status: currentStatus, to_status: toStatus },
  })
  let profile = null
  if (user?.id) {
    const { data: p } = await supabase.from('profiles').select('name, email').eq('id', user.id).maybeSingle()
    profile = p
  }
  return {
    current_status: toStatus,
    last_changed_at: new Date().toISOString(),
    last_changed_by: profile ? { name: profile.name, email: profile.email } : null,
    last_reason_category: payload.reason_category || null,
    last_reason_details: payload.reason_details || null,
  }
}

// ——— Status Escola ———

export async function getSchoolStatusSupabase(schoolId) {
  const { data: s, error } = await supabase.from('schools').select('status').eq('id', schoolId).single()
  if (error || !s) {
    const err = new Error('Escola não encontrada')
    err.status = 404
    throw err
  }
  const { data: history } = await supabase
    .from('school_status_history')
    .select('changed_at, actor_id, reason_category, reason_details')
    .eq('school_id', schoolId)
    .order('changed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  let lastChangedBy = null
  if (history?.actor_id) {
    const { data: actor } = await supabase.from('profiles').select('name, email').eq('id', history.actor_id).maybeSingle()
    if (actor) lastChangedBy = { name: actor.name, email: actor.email }
  }
  return {
    current_status: (s.status || 'pendente').toLowerCase(),
    last_changed_at: history?.changed_at ?? null,
    last_changed_by: lastChangedBy,
    last_reason_category: history?.reason_category ?? null,
    last_reason_details: history?.reason_details ?? null,
  }
}

export async function getSchoolStatusHistorySupabase(schoolId, params = {}) {
  const { page = 1, page_size = 10 } = params
  const { data: s } = await supabase.from('schools').select('id').eq('id', schoolId).single()
  if (!s) {
    const err = new Error('Escola não encontrada')
    err.status = 404
    throw err
  }
  const start = (Number(page) - 1) * Number(page_size)
  const { data: rows, error, count } = await supabase
    .from('school_status_history')
    .select('*', { count: 'exact' })
    .eq('school_id', schoolId)
    .order('changed_at', { ascending: false })
    .range(start, start + Number(page_size) - 1)
  if (error) throw new Error(error.message || 'Erro ao listar histórico')
  const total = count ?? 0
  const items = await Promise.all(
    (rows || []).map(async (h) => {
      let actor_name = null
      let actor_email = null
      if (h.actor_id) {
        const { data: actor } = await supabase.from('profiles').select('name, email').eq('id', h.actor_id).maybeSingle()
        if (actor) {
          actor_name = actor.name
          actor_email = actor.email
        }
      }
      return {
        changed_at: h.changed_at,
        from_status: h.from_status,
        to_status: h.to_status,
        actor_name,
        actor_email,
        reason_category: h.reason_category,
        reason_details: h.reason_details,
      }
    })
  )
  return {
    items,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

export async function postSchoolStatusTransitionSupabase(schoolId, payload) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: current, error: errGet } = await supabase.from('schools').select('status').eq('id', schoolId).single()
  if (errGet || !current) {
    const err = new Error('Escola não encontrada')
    err.status = 404
    throw err
  }
  const currentStatus = (current.status || 'ativo').toLowerCase()
  const action = payload.action
  let toStatus = null
  if (action === 'SUSPEND' && currentStatus === 'ativo') toStatus = 'suspenso'
  if (action === 'REACTIVATE' && currentStatus === 'suspenso') toStatus = 'ativo'
  if (!toStatus) {
    const err = new Error('A escola não está no status esperado. Atualize a página.')
    err.status = 400
    throw err
  }
  await supabase.from('school_status_history').insert({
    school_id: schoolId,
    from_status: currentStatus,
    to_status: toStatus,
    actor_id: user?.id ?? null,
    reason_category: payload.reason_category || null,
    reason_details: payload.reason_details || null,
  })
  const { error } = await supabase.from('schools').update({ status: toStatus, updated_at: new Date().toISOString() }).eq('id', schoolId)
  if (error) throw new Error(error.message || 'Erro ao atualizar status')
  const { data: school } = await supabase.from('schools').select('franchisor_id').eq('id', schoolId).single()
  await logAuditEvent('Admin_ChangeSchoolStatus', 'school', schoolId, {
    school_id: schoolId,
    franchisor_id: school?.franchisor_id ?? null,
    metadata_summary: `Status da escola alterado para ${toStatus}`,
    metadata: { from_status: currentStatus, to_status: toStatus },
  })
  let profile = null
  if (user?.id) {
    const { data: p } = await supabase.from('profiles').select('name, email').eq('id', user.id).maybeSingle()
    profile = p
  }
  return {
    current_status: toStatus,
    last_changed_at: new Date().toISOString(),
    last_changed_by: profile ? { name: profile.name, email: profile.email } : null,
    last_reason_category: payload.reason_category || null,
    last_reason_details: payload.reason_details || null,
  }
}

// ——— Usuários Escola (school_members) ———

export async function listSchoolUsersSupabase(schoolId, params = {}) {
  const { search = '', role: roleFilter = '', status: statusFilter = '', page = 1, page_size = 10 } = params
  let q = supabase
    .from('school_members')
    .select('id, user_id, school_id, role, scope_type, scope_school_ids, status, last_login_at, profiles(name, email)', { count: 'exact' })
    .eq('school_id', schoolId)
  if (roleFilter && roleFilter !== 'todos') q = q.eq('role', roleFilter)
  if (statusFilter && statusFilter !== 'todos') q = q.eq('status', statusFilter.toLowerCase())
  q = q.order('created_at', { ascending: false })
  const start = (Number(page) - 1) * Number(page_size)
  const { data, error, count } = await q.range(start, start + Number(page_size) - 1)
  if (error) throw new Error(error.message || 'Erro ao listar usuários')
  const list = (data || []).map((row) => ({
    user_id: row.user_id,
    name: row.profiles?.name ?? '',
    email: row.profiles?.email ?? '',
    role: row.role,
    scope_type: row.scope_type,
    scope_school_ids: row.scope_school_ids || [],
    scope_school_count: (row.scope_school_ids || []).length,
    status: row.status,
    last_login_at: row.last_login_at,
  }))
  const searchLower = (search || '').toLowerCase().trim()
  let filtered = list
  if (searchLower) {
    filtered = list.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
    )
  }
  const total = searchLower ? filtered.length : (count ?? 0)
  const pageList = searchLower ? filtered : list
  return {
    data: pageList,
    total,
    page: Number(page),
    page_size: Number(page_size),
    total_pages: Math.ceil(total / Number(page_size)) || 1,
  }
}

export async function createSchoolUserSupabase(schoolId, payload) {
  const email = (payload.email || '').trim().toLowerCase()
  const { data: profile } = await supabase.from('profiles').select('id, name, email').eq('email', email).maybeSingle()
  if (!profile) {
    const err = new Error('Nenhum usuário encontrado com este e-mail. O usuário precisa se cadastrar na plataforma primeiro.')
    err.status = 400
    throw err
  }
  const scopeType = payload.scope_type === 'SCHOOL_LIST' ? 'SCHOOL_LIST' : 'SINGLE_SCHOOL'
  const scopeSchoolIds = scopeType === 'SINGLE_SCHOOL' ? [schoolId] : (payload.scope_school_ids || []).filter(Boolean)
  if (scopeType === 'SINGLE_SCHOOL' && !scopeSchoolIds.includes(schoolId)) scopeSchoolIds.push(schoolId)
  const { data, error } = await supabase
    .from('school_members')
    .insert({
      user_id: profile.id,
      school_id: schoolId,
      role: ['SchoolOwner', 'SchoolStaff', 'Coach', 'Finance'].includes(payload.role) ? payload.role : 'SchoolStaff',
      scope_type: scopeType,
      scope_school_ids: scopeSchoolIds,
      status: 'convidado',
    })
    .select()
    .single()
  if (error) {
    const err = new Error(error.message || 'Erro ao adicionar usuário')
    err.status = 400
    throw err
  }
  return {
    user_id: data.user_id,
    name: profile.name ?? profile.email ?? '',
    email: profile.email ?? '',
    role: data.role,
    scope_type: data.scope_type,
    scope_school_ids: data.scope_school_ids,
    scope_school_count: (data.scope_school_ids || []).length,
    status: data.status,
    last_login_at: null,
  }
}

export async function getSchoolUserSupabase(schoolId, userId) {
  const { data, error } = await supabase
    .from('school_members')
    .select('*, profiles(name, email)')
    .eq('school_id', schoolId)
    .eq('user_id', userId)
    .single()
  if (error || !data) {
    const err = new Error('Usuário não encontrado')
    err.status = 404
    throw err
  }
  return {
    user_id: data.user_id,
    name: data.profiles?.name ?? '',
    email: data.profiles?.email ?? '',
    role: data.role,
    scope_type: data.scope_type,
    scope_school_ids: data.scope_school_ids || [],
    scope_school_count: (data.scope_school_ids || []).length,
    status: data.status,
    last_login_at: data.last_login_at,
  }
}

export async function updateSchoolUserSupabase(schoolId, userId, payload) {
  const scopeType = payload.scope_type === 'SCHOOL_LIST' ? 'SCHOOL_LIST' : 'SINGLE_SCHOOL'
  let scopeSchoolIds = scopeType === 'SCHOOL_LIST' ? (payload.scope_school_ids || []) : [schoolId]
  if (!scopeSchoolIds.includes(schoolId)) scopeSchoolIds = [schoolId, ...scopeSchoolIds]
  const upd = {
    role: ['SchoolOwner', 'SchoolStaff', 'Coach', 'Finance'].includes(payload.role) ? payload.role : undefined,
    scope_type: scopeType,
    scope_school_ids: scopeSchoolIds,
    updated_at: new Date().toISOString(),
  }
  if (upd.role === undefined) delete upd.role
  const { data, error } = await supabase
    .from('school_members')
    .update(upd)
    .eq('school_id', schoolId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) {
    const err = new Error(error.message || 'Erro ao atualizar usuário')
    err.status = error.code === 'PGRST116' ? 404 : 400
    throw err
  }
  const { data: profile } = await supabase.from('profiles').select('name, email').eq('id', data.user_id).single()
  return {
    user_id: data.user_id,
    name: profile?.name ?? '',
    email: profile?.email ?? '',
    role: data.role,
    scope_type: data.scope_type,
    scope_school_ids: data.scope_school_ids,
    scope_school_count: (data.scope_school_ids || []).length,
    status: data.status,
    last_login_at: data.last_login_at,
  }
}

export async function deleteSchoolUserSupabase(schoolId, userId) {
  const { error } = await supabase.from('school_members').delete().eq('school_id', schoolId).eq('user_id', userId)
  if (error) {
    const err = new Error(error.message || 'Erro ao remover usuário')
    err.status = 404
    throw err
  }
  return { ok: true }
}
