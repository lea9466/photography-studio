'use server'

import { revalidatePath } from 'next/cache'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { sanitizeFaqItems, type FaqItem } from '@/lib/faq'

export async function updateFaqItems(items: FaqItem[]) {
  const { userId, supabase } = await requireDashboardContext()

  const faq_items = sanitizeFaqItems(items)

  const { error } = await supabase
    .from('users')
    .update({ faq_items } as never)
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/faq')
  revalidatePath('/[slug]', 'page')
}
