import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Marks a studio as "private galleries only": the first-entry site-setup modal
 * is cleared and won't reopen. Used by the modal's skip button and by
 * galleries-only signups (register / auth callback with next=private-galleries).
 */
export async function markGalleriesOnlyOnboarding(userId: string): Promise<boolean> {
  const admin = createAdminClient()

  const { error } = await admin
    .from('users')
    .update({ show_welcome_popup: false, site_onboarding_skipped: true } as never)
    .eq('id', userId)

  if (!error) return true

  // site_onboarding_skipped migration not applied yet — still clear the flag.
  const fallback = await admin
    .from('users')
    .update({ show_welcome_popup: false } as never)
    .eq('id', userId)
  return !fallback.error
}
