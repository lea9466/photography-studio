import { createAdminClient } from '@/lib/supabase/admin'

export async function recordDashboardLogin(userId: string) {
  if (!userId) return

  try {
    const admin = createAdminClient()
    const { error } = await admin.rpc('record_dashboard_login', {
      p_user_id: userId,
    })

    if (error) {
      console.error('[recordDashboardLogin] failed', error.message)
    }
  } catch (error) {
    console.error('[recordDashboardLogin] failed', error)
  }
}
