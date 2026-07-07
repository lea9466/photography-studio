'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function dismissReferralPopup() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('users')
    .update({ show_referral_popup: false } as never)
    .eq('id', user.id)

  revalidatePath('/dashboard', 'layout')
}
