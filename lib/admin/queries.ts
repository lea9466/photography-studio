import { normalizeAnnouncementIcon } from '@/lib/announcements/icons'
import type { Announcement } from '@/lib/announcements/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicSitePath } from '@/lib/queries/public-photographer'

export type AdminStudioRow = {
  id: string
  email: string | null
  name: string | null
  studio_name: string | null
  slug: string | null
  created_at: string
  trial_end_date: string
  last_dashboard_visit_at: string | null
  dashboard_visit_count: number
  is_under_construction: boolean
  is_site_unavailable: boolean
  has_hero_video: boolean
  site_path: string | null
}

export type AdminBroadcastRecipient = {
  email: string
  name: string | null
}

export async function getLatestAnnouncementForAdmin(): Promise<Announcement | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('announcements')
    .select('id, title, content, icon, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as Announcement

  return {
    ...row,
    icon: normalizeAnnouncementIcon(row.icon),
  }
}

export async function getAdminBroadcastRecipients(): Promise<AdminBroadcastRecipient[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('email, name, studio_name')
    .not('email', 'is', null)

  if (error) throw new Error(error.message)

  const seen = new Set<string>()
  const recipients: AdminBroadcastRecipient[] = []

  for (const row of data ?? []) {
    const user = row as {
      email: string | null
      name: string | null
      studio_name: string | null
    }
    const email = user.email?.trim().toLowerCase()
    if (!email || seen.has(email)) continue

    seen.add(email)
    recipients.push({
      email,
      name: user.studio_name?.trim() || user.name?.trim() || null,
    })
  }

  return recipients
}

function isMissingSiteAccessColumnError(error: { message?: string; code?: string }) {
  if (error.code === '42703' || error.code === 'PGRST204') return true
  const message = error.message?.toLowerCase() ?? ''
  return (
    message.includes('is_under_construction') || message.includes('is_site_unavailable')
  )
}

function isMissingHeroVideoColumnError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? ''
  return message.includes('hero_video_url')
}

export async function getAdminStudios(): Promise<AdminStudioRow[]> {
  const admin = createAdminClient()
  const selectWithFlags =
    'id, email, name, studio_name, slug, created_at, trial_end_date, last_dashboard_visit_at, dashboard_visit_count, is_under_construction, is_site_unavailable, hero_video_url'
  const selectWithoutHero =
    'id, email, name, studio_name, slug, created_at, trial_end_date, last_dashboard_visit_at, dashboard_visit_count, is_under_construction, is_site_unavailable'
  const selectLegacy =
    'id, email, name, studio_name, slug, created_at, trial_end_date, last_dashboard_visit_at, dashboard_visit_count'

  const primary = await admin
    .from('users')
    .select(selectWithFlags)
    .order('created_at', { ascending: false })

  let result = primary
  if (primary.error && isMissingHeroVideoColumnError(primary.error)) {
    result = await admin
      .from('users')
      .select(selectWithoutHero)
      .order('created_at', { ascending: false })
  }
  if (result.error && isMissingSiteAccessColumnError(result.error)) {
    result = await admin
      .from('users')
      .select(selectLegacy)
      .order('created_at', { ascending: false })
  }

  if (result.error) {
    const message = result.error.message.includes('fetch failed')
      ? 'לא ניתן להתחבר ל-Supabase. בדקי חיבור לאינטרנט ונסי שוב.'
      : result.error.message
    throw new Error(message)
  }

  return (result.data ?? []).map((row) => {
    const studio = row as {
      id: string
      email: string | null
      name: string | null
      studio_name: string | null
      slug: string | null
      created_at: string
      trial_end_date: string
      last_dashboard_visit_at: string | null
      dashboard_visit_count: number
      is_under_construction?: boolean | null
      is_site_unavailable?: boolean | null
      hero_video_url?: string | null
    }

    return {
      id: studio.id,
      email: studio.email,
      name: studio.name,
      studio_name: studio.studio_name,
      slug: studio.slug,
      created_at: studio.created_at,
      trial_end_date: studio.trial_end_date,
      last_dashboard_visit_at: studio.last_dashboard_visit_at,
      dashboard_visit_count: studio.dashboard_visit_count ?? 0,
      is_under_construction: Boolean(studio.is_under_construction),
      is_site_unavailable: Boolean(studio.is_site_unavailable),
      has_hero_video: Boolean(studio.hero_video_url?.trim()),
      site_path: getPublicSitePath(studio.slug, studio.studio_name),
    }
  })
}
