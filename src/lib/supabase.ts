import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

// Create a simple storage key based on the Supabase URL
const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'default'
export const SUPABASE_AUTH_STORAGE_KEY = `sb-${projectRef}-auth-token`

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
