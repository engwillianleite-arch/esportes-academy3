/**
 * Cliente Supabase para o frontend.
 * Use as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos em .env para conectar ao banco.'
  )
}

/** Cliente Supabase (anon key). RLS no backend controla o que cada usuário pode ver/editar. */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export default supabase
