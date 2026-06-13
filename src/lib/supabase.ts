import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (UTF-8)'
  )
}

/** Browser / Server Components — anon key; כל גישה עוברת RLS בפרויקט Supabase. */
export const supabase = createClient<Database, 'public'>(
  supabaseUrl,
  supabaseAnonKey
)
