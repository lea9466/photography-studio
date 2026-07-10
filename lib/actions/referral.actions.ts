'use server'

import { revalidatePath } from 'next/cache'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'

export async function dismissReferralPopup() {
  const { userId, supabase } = await requireDashboardContext()

  await supabase
    .from('users')
    .update({ show_referral_popup: false } as never)
    .eq('id', userId)

  revalidatePath('/dashboard', 'layout')
}
