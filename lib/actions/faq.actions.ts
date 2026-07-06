'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sanitizeFaqItems, type FaqItem } from '@/lib/faq'

export async function updateFaqItems(items: FaqItem[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const faq_items = sanitizeFaqItems(items)

  const { error } = await supabase
    .from('users')
    .update({ faq_items } as never)
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/faq')
  revalidatePath('/[slug]', 'page')
}
