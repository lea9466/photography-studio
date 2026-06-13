import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/** Server-only — עוקף RLS; לעולם לא לחשוף לדפדפן. */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return createClient<Database, 'public'>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function adminConfigError(): string {
  return 'חסר SUPABASE_SERVICE_ROLE_KEY ב-.env.local (Supabase → Settings → API → service_role).'
}
