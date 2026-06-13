import 'server-only'

import { getAdminClient } from '@/lib/supabase-admin'
import { ensureDemoContentForPhotographer } from '@/lib/photographer-demo-content'
import { THEME_DEFAULT_COLORS } from '@/lib/theme-styles'

export function normalizeSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'studio'
}

export function slugFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email
  return normalizeSlug(local)
}

export async function ensureUniqueSlug(base: string): Promise<string> {
  const sb = getAdminClient()
  if (!sb) return normalizeSlug(base)

  let slug = normalizeSlug(base)
  let suffix = 0

  while (true) {
    const { data } = await sb
      .from('photographers')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!data) return slug
    suffix += 1
    slug = `${normalizeSlug(base)}-${suffix}`
  }
}

export type CreatePhotographerTenantInput = {
  authUserId: string
  email: string
  displayName: string
  slug: string
}

export type CreatePhotographerTenantResult = {
  photographerId: string
  slug: string
  error: string | null
}

/** יוצר צלם + הגדרות אתר + שורת admin ב-users. */
export async function createPhotographerTenant(
  input: CreatePhotographerTenantInput
): Promise<CreatePhotographerTenantResult> {
  const sb = getAdminClient()
  if (!sb) {
    return { photographerId: '', slug: '', error: 'אין חיבור למערכת' }
  }

  const slug = await ensureUniqueSlug(input.slug)
  const displayName = input.displayName.trim() || 'סטודיו צילום'

  const { data: existing } = await sb
    .from('photographers')
    .select('id, slug')
    .eq('auth_user_id', input.authUserId)
    .maybeSingle()

  if (existing) {
    await ensureDemoContentForPhotographer(existing.id)
    return {
      photographerId: existing.id,
      slug: existing.slug,
      error: null,
    }
  }

  const { data: photographer, error: photographerError } = await sb
    .from('photographers')
    .insert({
      auth_user_id: input.authUserId,
      display_name: displayName,
      email: input.email.trim(),
      slug,
      subscription_status: 'trial',
    })
    .select('id, slug')
    .single()

  if (photographerError || !photographer) {
    return {
      photographerId: '',
      slug: '',
      error: photographerError?.message ?? 'שגיאה ביצירת צלם',
    }
  }

  const { data: settingsExists } = await sb
    .from('site_settings')
    .select('id')
    .eq('photographer_id', photographer.id)
    .maybeSingle()

  if (!settingsExists) {
    const defaultTheme = 'warm' as const
    const themeColors = THEME_DEFAULT_COLORS[defaultTheme]
    const { error: settingsError } = await sb.from('site_settings').insert({
      photographer_id: photographer.id,
      business_name: displayName,
      tagline: 'רגעים שנשארים לנצח',
      about_text:
        'ברוכים הבאים לאתר הסטודיו. כאן תוכלו לצפות בעבודות, לבחור חבילה וליצור קשר.',
      primary_color: themeColors.primary,
      secondary_color: themeColors.secondary,
      theme_style: defaultTheme,
      email: input.email.trim(),
    })
    if (settingsError) {
      return {
        photographerId: photographer.id,
        slug: photographer.slug,
        error: settingsError.message,
      }
    }
  }

  const { data: adminUser } = await sb
    .from('users')
    .select('id')
    .eq('auth_id', input.authUserId)
    .maybeSingle()

  if (!adminUser) {
    const { error: userError } = await sb.from('users').insert({
      auth_id: input.authUserId,
      email: input.email.trim(),
      role: 'admin',
    })
    if (userError && userError.code !== '23505') {
      return {
        photographerId: photographer.id,
        slug: photographer.slug,
        error: userError.message,
      }
    }
  } else {
    await sb
      .from('users')
      .update({ email: input.email.trim(), role: 'admin' })
      .eq('id', adminUser.id)
  }

  await ensureDemoContentForPhotographer(photographer.id)

  return {
    photographerId: photographer.id,
    slug: photographer.slug,
    error: null,
  }
}
