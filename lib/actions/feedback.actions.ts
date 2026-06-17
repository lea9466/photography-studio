'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendFeedbackEmail } from '@/lib/email/resend'
import type { FeedbackType } from '@/lib/types/database.types'

export async function submitFeedback(input: {
  type: FeedbackType
  name: string
  email: string
  message: string
  studio?: string
}) {
  const admin = createAdminClient()

  const { error } = await admin.from('feedback').insert({
    type: input.type,
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    studio: input.studio?.trim() || null,
  } as never)

  if (error) throw new Error(error.message)

  await sendFeedbackEmail(input)
  revalidatePath('/')
  return { success: true }
}

export async function updateProfile(input: {
  name?: string
  studio_name?: string
  theme_primary?: string
  about_text?: string
  stat_projects?: number
  stat_clients?: number
  stat_experience_years?: number
  accent_color?: string
  selected_theme?: string
  logo_url?: string
  hero_desktop_url?: string
  hero_mobile_url?: string
  about_image_url?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('יש להתחבר מחדש')

  const { error } = await supabase
    .from('users')
    .update(input as never)
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/g/[id]', 'page')
  revalidatePath('/portfolio/[slug]', 'page')
}
