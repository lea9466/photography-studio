import type { createClient } from '@/lib/supabase/server'

export const DASHBOARD_SUBSCRIPTION_PATH = '/dashboard/subscription'

type DashboardClient = Awaited<ReturnType<typeof createClient>>

function isMissingColumnError(error: { message?: string; code?: string } | null) {
  if (!error) return false
  if (error.code === '42703' || error.code === 'PGRST204') return true
  const message = error.message?.toLowerCase() ?? ''
  return message.includes('is_site_unavailable')
}

export function isDashboardSubscriptionPath(pathname: string) {
  return (
    pathname === DASHBOARD_SUBSCRIPTION_PATH ||
    pathname.startsWith(`${DASHBOARD_SUBSCRIPTION_PATH}/`)
  )
}

export async function isSiteUnavailableLocked(input: {
  userId: string
  supabase: DashboardClient
}): Promise<boolean> {
  const { data, error } = await input.supabase
    .from('users')
    .select('is_site_unavailable')
    .eq('id', input.userId)
    .maybeSingle()

  if (error) {
    if (isMissingColumnError(error)) return false
    console.error('[dashboard-lock] failed to read is_site_unavailable:', error.message)
    return false
  }

  return Boolean((data as { is_site_unavailable?: boolean | null } | null)?.is_site_unavailable)
}
