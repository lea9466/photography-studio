import {
  canUseImpersonation,
  getImpersonatedUserIdFromCookies,
} from '@/lib/auth/impersonation'
import { isSiteUnavailableLocked } from '@/lib/site-access/dashboard-lock'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type DashboardSupabaseClient = Awaited<ReturnType<typeof createClient>>

export type DashboardAuthContext = {
  userId: string
  supabase: DashboardSupabaseClient
  isImpersonating: boolean
  actorEmail: string | null
}

export type RequireDashboardOptions = {
  /** Allow access while the public site is admin-locked as unavailable (billing only). */
  allowWhenSiteUnavailable?: boolean
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

export async function requireDashboardContext(options?: RequireDashboardOptions) {
  const context = await getDashboardContext()
  if (!context) {
    throw new Error('יש להתחבר מחדש')
  }

  if (!options?.allowWhenSiteUnavailable && !context.isImpersonating) {
    const locked = await isSiteUnavailableLocked({
      userId: context.userId,
      supabase: context.supabase,
    })
    if (locked) {
      throw new Error('האתר אינו זמין כרגע. ניתן לגשת רק לעמוד המינוי.')
    }
  }

  return context
}
