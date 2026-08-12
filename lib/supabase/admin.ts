import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
import { fetchWithRetry } from '@/lib/supabase/fetch'

export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const url = typeof rawUrl === 'string' ? rawUrl.trim() : ''
  const key = typeof rawKey === 'string' ? rawKey.trim() : ''

  const urlPresent = url.length > 0
  const keyPresent = key.length > 0

  // Temporary safe logging for tracing admin client env issues.
  // Report presence booleans to avoid confusion between 'missing' and 'present'.
  if (!urlPresent || !keyPresent) {
    console.error('[payments-trace][supabase-admin] env-presence', {
      step: 'createAdminClient',
      present: {
        NEXT_PUBLIC_SUPABASE_URL: urlPresent,
        SUPABASE_SERVICE_ROLE_KEY: keyPresent,
      },
    })

    if (!urlPresent && !keyPresent) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin operations')
    }
    if (!urlPresent) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for admin operations')
    }
    // key missing
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
