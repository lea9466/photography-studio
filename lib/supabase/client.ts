import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

export function createClient() {
  return createBrowserClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') return null
            try {
              return localStorage.getItem(key)
            } catch (e) {
              return null
            }
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') return
            try {
              localStorage.setItem(key, value)
            } catch (e) {
              // Ignore storage errors
            }
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') return
            try {
              localStorage.removeItem(key)
            } catch (e) {
              // Ignore storage errors
            }
          },
        },
      },
    }
  )
}
