import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
import { fetchWithRetry } from '@/lib/supabase/fetch'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  return createClient<Database, 'public'>(url, key, {
    global: {
      fetch: fetchWithRetry,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
