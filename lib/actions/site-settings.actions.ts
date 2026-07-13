'use server'

import { revalidatePath } from 'next/cache'
import { getDashboardContext, requireDashboardContext } from '@/lib/auth/dashboard-context'
import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'

function isMissingSiteLanguageColumn(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? ''
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    message.includes('site_language')
  )
}

async function revalidatePublicSitePaths(
  supabase: Awaited<ReturnType<typeof requireDashboardContext>>['supabase'],
  userId: string
) {
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')

  const { data: profile } = await supabase
    .from('users')
    .select('slug, studio_name')
    .eq('id', userId)
    .single()

  const slug = (profile as { slug: string | null; studio_name: string | null } | null)?.slug
  if (slug?.trim()) {
    revalidatePath(`/${slug.trim()}`)
    revalidatePath(`/${slug.trim()}/portfolio`)
    revalidatePath(`/${slug.trim()}/blog`)
  }

  const { data: publicGalleries } = await supabase
    .from('galleries')
    .select('id')
    .eq('user_id', userId)
    .eq('is_public', true)

  for (const gallery of publicGalleries ?? []) {
    revalidatePath(`/public-gallery/${(gallery as { id: string }).id}`)
  }
}

export async function fetchSiteLanguage(): Promise<SiteLanguage> {
  const context = await getDashboardContext()
  if (!context) return 'he'

  const { userId, supabase } = context
  const { data, error } = await supabase
    .from('users')
    .select('site_language')
    .eq('id', userId)
    .single()

  if (error) {
    if (isMissingSiteLanguageColumn(error)) return 'he'
    throw new Error(error.message)
  }

  return resolveSiteLanguage(
    (data as { site_language: string | null } | null)?.site_language
  )
}

export async function updateSiteLanguage(language: SiteLanguage) {
  if (language !== 'he' && language !== 'en') {
    throw new Error('שפה לא נתמכת')
  }

  const { userId, supabase } = await requireDashboardContext()

  const { error } = await supabase
    .from('users')
    .update({ site_language: language } as never)
    .eq('id', userId)

  if (error) {
    if (isMissingSiteLanguageColumn(error)) {
      throw new Error('יש להריץ את מיגרציית site_language ב-Supabase')
    }
    throw new Error(error.message)
  }

  await revalidatePublicSitePaths(supabase, userId)

  return { success: true }
}
