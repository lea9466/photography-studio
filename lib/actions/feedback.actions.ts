'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordSlugRedirect } from '@/lib/referral/slug-redirect'
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
  revalidatePath('/dashboard/contact')
  return { success: true }
}

export async function updateProfile(input: {
  name?: string
  studio_name?: string
  theme_primary?: string
  about_text?: string
  about_title?: string
  about_subtitle?: string
  about_description?: string
  contact_card_title?: string
  contact_card_description?: string
  address?: string
  stat_projects?: number
  stat_clients?: number
  stat_experience_years?: number
  accent_color?: string
  selected_theme?: string
  logo_url?: string
  hero_desktop_url?: string
  hero_mobile_url?: string
  hero_desktop_urls?: string[]
  hero_mobile_urls?: string[]
  about_image_url?: string
  contact_desktop_url?: string
  contact_mobile_url?: string
  packages_desktop_url?: string
  packages_mobile_url?: string
  phone?: string
  email?: string
  slug?: string
  should_color_logo?: boolean
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('יש להתחבר מחדש')

  if (input.slug !== undefined) {
    const { data: current } = await supabase
      .from('users')
      .select('slug')
      .eq('id', user.id)
      .single()

    const oldSlug = (current as { slug: string | null } | null)?.slug?.trim()
    const newSlug = input.slug.trim()

    if (oldSlug && newSlug && oldSlug !== newSlug) {
      await recordSlugRedirect(oldSlug, newSlug)
    }
  }

  const { error } = await supabase
    .from('users')
    .update(input as never)
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/g/[id]', 'page')
  revalidatePath('/portfolio/[slug]', 'page')
  revalidatePath('/[slug]', 'page')
}
