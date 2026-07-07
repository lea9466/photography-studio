import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database.types'
import { fetchWithRetry } from '@/lib/supabase/fetch'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetchWithRetry,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll from Server Component — middleware handles refresh
          }
        },
      },
    }
  )
}
