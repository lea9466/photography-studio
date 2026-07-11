import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

export async function recordDashboardVisit(userId: string) {
  if (!userId) return

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  try {
    const admin = createClient<Database, 'public'>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await admin.rpc('record_dashboard_visit', {
      p_user_id: userId,
    })

    if (error) {
      console.error('[recordDashboardVisit] failed', error.message)
    }
  } catch (error) {
    console.error('[recordDashboardVisit] failed', error)
  }
}
