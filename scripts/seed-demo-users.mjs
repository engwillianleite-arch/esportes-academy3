/**
 * Cria as 3 contas demo no Supabase (Admin, Franqueador, Franqueado) e configura os acessos.
 * Execute: node scripts/seed-demo-users.mjs (com SUPABASE_SERVICE_ROLE_KEY no .env)
 * Ou: npm run seed:demo
 */
import { createClient } from '@supabase/supabase-js'

try {
  await import('dotenv/config')
} catch {
  // dotenv opcional; use .env ou export das variáveis
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Defina SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no .env')
  console.error('A service_role key está em: Dashboard → Settings → API → service_role')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_ACCOUNTS = [
  { email: 'admin@demo.com', password: 'demo123', name: 'Admin Demo' },
  { email: 'franqueador@demo.com', password: 'demo123', name: 'Franqueador Demo' },
  { email: 'franqueado@demo.com', password: 'demo123', name: 'Franqueado Demo' },
]

async function main() {
  const userIds = {}

  for (const { email, password, name } of DEMO_ACCOUNTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })
    if (error) {
      if (error.message?.includes('already been registered')) {
        console.log(`Usuário já existe: ${email}. Obtendo id...`)
        const { data: list } = await supabase.auth.admin.listUsers()
        const u = list?.users?.find((x) => x.email === email)
        if (u) userIds[email] = u.id
      } else {
        console.error(`Erro ao criar ${email}:`, error.message)
        process.exit(1)
      }
    } else {
      userIds[email] = data.user.id
      console.log(`Criado: ${email} (${data.user.id})`)
    }
  }

  // Admin: role_global = 'admin'
  const { error: errProfile } = await supabase
    .from('profiles')
    .update({ role_global: 'admin', name: 'Admin Demo' })
    .eq('email', 'admin@demo.com')
  if (errProfile) console.error('Erro ao atualizar perfil admin:', errProfile)
  else console.log('Perfil admin configurado (role_global = admin).')

  // Franqueador: franchisor + franchisor_members
  const franchisorUserId = userIds['franqueador@demo.com']
  if (franchisorUserId) {
    const { data: existingFranchisor } = await supabase
      .from('franchisors')
      .select('id')
      .eq('email', 'franqueador@demo.com')
      .maybeSingle()

    let franchisorId = existingFranchisor?.id
    if (!franchisorId) {
      const { data: newFranchisor, error: errF } = await supabase
        .from('franchisors')
        .insert({
          name: 'Rede Demo Franqueador',
          owner_name: 'Franqueador Demo',
          email: 'franqueador@demo.com',
          status: 'ativo',
        })
        .select('id')
        .single()
      if (errF) {
        console.error('Erro ao criar franqueador:', errF)
      } else {
        franchisorId = newFranchisor.id
        console.log('Franqueador criado:', franchisorId)
      }
    }

    if (franchisorId) {
      await supabase.from('franchisor_members').upsert(
        {
          user_id: franchisorUserId,
          franchisor_id: franchisorId,
          role: 'FranchisorOwner',
          scope_type: 'ALL_SCHOOLS',
          status: 'ativo',
        },
        { onConflict: 'user_id,franchisor_id' }
      )
      console.log('Vínculo franqueador configurado.')
    }
  }

  // Franqueado: escola (do franqueador) + school_members
  const franqueadoUserId = userIds['franqueado@demo.com']
  if (franqueadoUserId) {
    const { data: franchisor } = await supabase
      .from('franchisors')
      .select('id')
      .eq('email', 'franqueador@demo.com')
      .maybeSingle()

    if (franchisor?.id) {
      const { data: existingSchool } = await supabase
        .from('schools')
        .select('id')
        .eq('email', 'franqueado@demo.com')
        .maybeSingle()

      let schoolId = existingSchool?.id
      if (!schoolId) {
        const { data: newSchool, error: errS } = await supabase
          .from('schools')
          .insert({
            franchisor_id: franchisor.id,
            name: 'Escola Demo Franqueado',
            responsible_name: 'Franqueado Demo',
            email: 'franqueado@demo.com',
            status: 'ativo',
          })
          .select('id')
          .single()
        if (errS) {
          console.error('Erro ao criar escola:', errS)
        } else {
          schoolId = newSchool.id
          console.log('Escola criada:', schoolId)
        }
      }

      if (schoolId) {
        await supabase.from('school_members').upsert(
          {
            user_id: franqueadoUserId,
            school_id: schoolId,
            role: 'SchoolOwner',
            scope_type: 'SINGLE_SCHOOL',
            status: 'ativo',
          },
          { onConflict: 'user_id,school_id' }
        )
        console.log('Vínculo franqueado (escola) configurado.')
      }
    }
  }

  console.log('\nConcluído. Contas demo:')
  console.log('  Admin:       admin@demo.com / demo123')
  console.log('  Franqueador: franqueador@demo.com / demo123')
  console.log('  Franqueado:  franqueado@demo.com / demo123')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
