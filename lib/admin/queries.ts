import type { AdminBroadcastRecipientFilters } from '@/lib/admin/broadcast-filters'
import { normalizeAnnouncementIcon } from '@/lib/announcements/icons'
import type { Announcement } from '@/lib/announcements/types'
import { isPaymentsCheckoutEnabled } from '@/lib/payments/flags'
import {
  hasActiveSubscriptionLike,
  resolveStudioEntitlements,
  type ActiveSubscriptionLike,
} from '@/lib/subscriptions/entitlements'
import type {
  EntitlementSource,
  EntitlementTier,
  StudioEntitlements,
  SubscriptionTierOverride,
} from '@/lib/subscriptions/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicSitePath } from '@/lib/queries/public-photographer'

export type { AdminBroadcastRecipientFilters }

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
  subscription_tier_override: SubscriptionTierOverride
  tier: EntitlementTier
  tier_source: EntitlementSource
  entitlements: StudioEntitlements
}

export type AdminBroadcastRecipient = {
  email: string
  name: string | null
}

function normalizeBroadcastFilters(
  filters?: AdminBroadcastRecipientFilters | null
): Required<AdminBroadcastRecipientFilters> {
  return {
    requireGallery: Boolean(filters?.requireGallery),
    excludeGallery: Boolean(filters?.excludeGallery),
    requirePost: Boolean(filters?.requirePost),
    requireHeroImage: Boolean(filters?.requireHeroImage),
    group: filters?.group === 'A' || filters?.group === 'B' ? filters.group : null,
  }
}

/**
 * Deterministically assigns a user to broadcast group A or B based on their id,
 * so the split stays identical across sends (needed to mail a large list across
 * multiple days without skipping or double-mailing anyone).
 */
function assignBroadcastGroup(userId: string): 'A' | 'B' {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return hash % 2 === 0 ? 'A' : 'B'
}

function userHasHeroImage(user: {
  hero_desktop_url?: string | null
  hero_mobile_url?: string | null
  hero_desktop_urls?: string[] | null
  hero_mobile_urls?: string[] | null
}): boolean {
  const desktopUrls = user.hero_desktop_urls ?? []
  const mobileUrls = user.hero_mobile_urls ?? []
  if (desktopUrls.some((path) => Boolean(path?.trim()))) return true
  if (mobileUrls.some((path) => Boolean(path?.trim()))) return true
  if (user.hero_desktop_url?.trim()) return true
  if (user.hero_mobile_url?.trim()) return true
  return false
}

async function fetchDistinctUserIds(
  table: 'galleries' | 'posts'
): Promise<Set<string>> {
  const admin = createAdminClient()
  const ids = new Set<string>()
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await admin
      .from(table)
      .select('user_id')
      .range(from, from + pageSize - 1)

    if (error) throw new Error(error.message)

    const rows = data ?? []
    for (const row of rows) {
      const userId = (row as { user_id: string | null }).user_id
      if (userId) ids.add(userId)
    }

    if (rows.length < pageSize) break
    from += pageSize
  }

  return ids
}

export async function getLatestAnnouncementForAdmin(): Promise<Announcement | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('announcements')
    .select('id, title, content, icon, is_active, cta_label, cta_href, created_at, updated_at')
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

type BroadcastUserRow = {
  id: string
  email: string | null
  name: string | null
  studio_name: string | null
  hero_desktop_url: string | null
  hero_mobile_url: string | null
  hero_desktop_urls: string[] | null
  hero_mobile_urls: string[] | null
}

export async function getAdminBroadcastRecipients(
  filters?: AdminBroadcastRecipientFilters | null
): Promise<AdminBroadcastRecipient[]> {
  const admin = createAdminClient()
  const activeFilters = normalizeBroadcastFilters(filters)

  // Keep select fields static so Supabase client typing stays valid.
  const { data, error } = await admin
    .from('users')
    .select(
      'id, email, name, studio_name, hero_desktop_url, hero_mobile_url, hero_desktop_urls, hero_mobile_urls'
    )
    .not('email', 'is', null)
    .returns<BroadcastUserRow[]>()

  if (error) throw new Error(error.message)

  const [galleryUserIds, postUserIds] = await Promise.all([
    activeFilters.requireGallery || activeFilters.excludeGallery
      ? fetchDistinctUserIds('galleries')
      : Promise.resolve(null),
    activeFilters.requirePost ? fetchDistinctUserIds('posts') : Promise.resolve(null),
  ])

  const seen = new Set<string>()
  const recipients: AdminBroadcastRecipient[] = []

  for (const user of data ?? []) {
    if (activeFilters.requireGallery && !galleryUserIds?.has(user.id)) continue
    if (activeFilters.excludeGallery && galleryUserIds?.has(user.id)) continue
    if (postUserIds && !postUserIds.has(user.id)) continue
    if (activeFilters.requireHeroImage && !userHasHeroImage(user)) continue
    if (activeFilters.group && assignBroadcastGroup(user.id) !== activeFilters.group) continue

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

type AdminStudioQueryRow = {
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
  subscription_tier_override?: SubscriptionTierOverride | null
}

export async function fetchActiveSubscriptionByIds(
  userIds: string[]
): Promise<Map<string, ActiveSubscriptionLike>> {
  if (userIds.length === 0) return new Map()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('subscriptions')
    .select('user_id, status, current_period_end, updated_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const map = new Map<string, ActiveSubscriptionLike>()
  for (const row of data ?? []) {
    const existing = map.get(row.user_id)
    if (!existing) map.set(row.user_id, row)
  }
  return map
}

export async function getAdminStudios(): Promise<AdminStudioRow[]> {
  const admin = createAdminClient()
  const selectWithFlags =
    'id, email, name, studio_name, slug, created_at, trial_end_date, last_dashboard_visit_at, dashboard_visit_count, is_under_construction, is_site_unavailable, hero_video_url, subscription_tier_override'
  const selectWithoutHero =
    'id, email, name, studio_name, slug, created_at, trial_end_date, last_dashboard_visit_at, dashboard_visit_count, is_under_construction, is_site_unavailable, subscription_tier_override'
  const selectLegacy =
    'id, email, name, studio_name, slug, created_at, trial_end_date, last_dashboard_visit_at, dashboard_visit_count, subscription_tier_override'

  let data: AdminStudioQueryRow[] | null = null
  let error: { message: string; code?: string } | null = null

  const primary = await admin
    .from('users')
    .select(selectWithFlags)
    .order('created_at', { ascending: false })

  data = (primary.data as AdminStudioQueryRow[] | null) ?? null
  error = primary.error

  if (error && isMissingHeroVideoColumnError(error)) {
    const fallback = await admin
      .from('users')
      .select(selectWithoutHero)
      .order('created_at', { ascending: false })
    data = (fallback.data as AdminStudioQueryRow[] | null) ?? null
    error = fallback.error
  }

  if (error && isMissingSiteAccessColumnError(error)) {
    const legacy = await admin
      .from('users')
      .select(selectLegacy)
      .order('created_at', { ascending: false })
    data = (legacy.data as AdminStudioQueryRow[] | null) ?? null
    error = legacy.error
  }

  if (error) {
    const message = error.message.includes('fetch failed')
      ? 'לא ניתן להתחבר ל-Supabase. בדקי חיבור לאינטרנט ונסי שוב.'
      : error.message
    throw new Error(message)
  }

  const rows = (data ?? []) as AdminStudioQueryRow[]
  const activeSubscriptions = await fetchActiveSubscriptionByIds(
    rows.map((studio) => studio.id)
  )
  const paymentsCheckoutEnabled = isPaymentsCheckoutEnabled()

  return rows.map((studio) => {
    const entitlements = resolveStudioEntitlements({
      trialEndDate: studio.trial_end_date,
      subscriptionTierOverride:
        (studio.subscription_tier_override as SubscriptionTierOverride) ??
        'auto',
      hasActiveSubscription: hasActiveSubscriptionLike(
        activeSubscriptions.get(studio.id) ?? null
      ),
      paymentsCheckoutEnabled,
      // Admin studio-list preview doesn't select the addon column — the tier
      // badge shown here doesn't need domain-addon precision.
      hasCustomDomainAddon: false,
    })
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
      subscription_tier_override:
        (studio.subscription_tier_override as SubscriptionTierOverride) ??
        'auto',
      tier: entitlements.tier,
      tier_source: entitlements.source,
      entitlements,
    }
  })
}

export type AdminCustomDomainRow = {
  id: string
  hostname: string
  status: string
  google_site_verification_token: string | null
  studio_name: string | null
  slug: string | null
}

/**
 * Every non-deleted connected custom domain, for /manage's Search Console
 * verification section (see CustomDomainVerificationManager) — the manual
 * fallback for what full API automation couldn't reach (see
 * lib/domains/custom-domain-lookup.ts's getGoogleSiteVerificationToken).
 */
export async function getAdminCustomDomains(): Promise<AdminCustomDomainRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('custom_domains')
    .select('id, hostname, status, google_site_verification_token, users(studio_name, slug)')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  type Row = {
    id: string
    hostname: string
    status: string
    google_site_verification_token: string | null
    users: { studio_name: string | null; slug: string | null } | null
  }

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    hostname: row.hostname,
    status: row.status,
    google_site_verification_token: row.google_site_verification_token,
    studio_name: row.users?.studio_name ?? null,
    slug: row.users?.slug ?? null,
  }))
}
