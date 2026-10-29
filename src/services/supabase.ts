import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when env vars are present. The app shows a friendly screen instead of a white page when false. */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Placeholder values keep the module import safe; nothing calls the network when not configured.
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'missing-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
)
