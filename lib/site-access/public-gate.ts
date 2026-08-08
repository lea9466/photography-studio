import { cache } from 'react'
import { getDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'

export type PublicSiteGateMode = 'under_construction' | 'unavailable'

export type PublicSiteGate = {
  mode: PublicSiteGateMode
  studioName: string | null
  siteLanguage: SiteLanguage
  ownerUserId: string
}

type AccessFlagsRow = {
  id: string
  studio_name: string | null
  name: string | null
  site_language: string | null
  is_under_construction: boolean | null
  is_site_unavailable: boolean | null
}

const ACCESS_FLAG_FIELDS =
  'id, studio_name, name, site_language, is_under_construction, is_site_unavailable'

function isMissingColumnError(error: { message?: string; code?: string }) {
  if (error.code === '42703' || error.code === 'PGRST204') return true
  const message = error.message?.toLowerCase() ?? ''
  return (
    message.includes('is_under_construction') ||
    message.includes('is_site_unavailable')
  )
}

function toGate(row: AccessFlagsRow | null | undefined): PublicSiteGate | null {
  if (!row?.id) return null

  const studioName = row.studio_name?.trim() || row.name?.trim() || null
  const siteLanguage = resolveSiteLanguage(row.site_language)

  if (row.is_under_construction) {
    return {
      mode: 'under_construction',
      studioName,
      siteLanguage,
      ownerUserId: row.id,
    }
  }

  if (row.is_site_unavailable) {
    return {
      mode: 'unavailable',
      studioName,
      siteLanguage,
      ownerUserId: row.id,
    }
  }

  return null
}

/** Owners (and impersonating admins) can preview the real site while it is under construction. */
export async function applyOwnerPreviewBypass(
  gate: PublicSiteGate | null
): Promise<PublicSiteGate | null> {
  if (!gate || gate.mode !== 'under_construction') return gate

  const context = await getDashboardContext()
  if (context?.userId === gate.ownerUserId) {
    return null
  }

  return gate
}

async function fetchAccessFlagsByUserId(userId: string): Promise<PublicSiteGate | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select(ACCESS_FLAG_FIELDS)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingColumnError(error)) {
      console.warn('[site-access] access flag columns missing — apply migration add_site_access_flags')
      return null
    }
    console.error('[site-access] user lookup failed:', error.message)
    return null
  }

  return toGate(data as AccessFlagsRow | null)
}

export const resolvePublicSiteGateByUserId = cache(async (userId: string) => {
  const trimmed = userId.trim()
  if (!trimmed) return null
  return fetchAccessFlagsByUserId(trimmed)
})

export const resolvePublicSiteGateBySlug = cache(async (decodedSlug: string) => {
  const normalizedSlug = decodedSlug.trim()
  if (!normalizedSlug) return null

  const admin = createAdminClient()

  const bySlug = await admin
    .from('users')
    .select(ACCESS_FLAG_FIELDS)
    .eq('slug', normalizedSlug)
    .maybeSingle()

  if (bySlug.error) {
    if (isMissingColumnError(bySlug.error)) {
      console.warn('[site-access] access flag columns missing — apply migration add_site_access_flags')
      return null
    }
    console.error('[site-access] slug lookup failed:', bySlug.error.message)
    return null
  }

  if (bySlug.data) {
    return toGate(bySlug.data as AccessFlagsRow)
  }

  const byStudioName = await admin
    .from('users')
    .select(ACCESS_FLAG_FIELDS)
    .eq('studio_name', normalizedSlug)
    .limit(1)
    .returns<AccessFlagsRow[]>()

  if (byStudioName.error) {
    if (isMissingColumnError(byStudioName.error)) return null
    console.error('[site-access] studio_name lookup failed:', byStudioName.error.message)
    return null
  }

  return toGate(byStudioName.data?.[0] ?? null)
})

export const resolvePublicSiteGateByGalleryId = cache(async (galleryId: string) => {
  const trimmed = galleryId.trim()
  if (!trimmed) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('galleries')
    .select('user_id')
    .eq('id', trimmed)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('[site-access] gallery lookup failed:', error.message)
    return null
  }

  const row = data as { user_id: string }
  return resolvePublicSiteGateByUserId(row.user_id)
})
