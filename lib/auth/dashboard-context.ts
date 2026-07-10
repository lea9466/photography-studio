import {
  canUseImpersonation,
  getImpersonatedUserIdFromCookies,
} from '@/lib/auth/impersonation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type DashboardSupabaseClient = Awaited<ReturnType<typeof createClient>>

export type DashboardAuthContext = {
  userId: string
  supabase: DashboardSupabaseClient
  isImpersonating: boolean
  actorEmail: string | null
}

export async function getDashboardContext(): Promise<DashboardAuthContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const impersonatedUserId = await getImpersonatedUserIdFromCookies()
  const impersonationAllowed = await canUseImpersonation()

  if (impersonatedUserId && impersonationAllowed) {
    const adminClient = createAdminClient()
    const { data: targetUser } = await adminClient
      .from('users')
      .select('id')
      .eq('id', impersonatedUserId)
      .maybeSingle()

    if (targetUser) {
      return {
        userId: impersonatedUserId,
        supabase: adminClient as unknown as DashboardSupabaseClient,
        isImpersonating: true,
        actorEmail: user?.email ?? null,
      }
    }
  }

  if (!user) return null

  return {
    userId: user.id,
    supabase,
    isImpersonating: false,
    actorEmail: user.email ?? null,
  }
}

export async function requireDashboardContext() {
  const context = await getDashboardContext()
  if (!context) {
    throw new Error('יש להתחבר מחדש')
  }
  return context
}
