'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getFeedbackEmail } from '@/lib/feedback-email'
import type { AdminBroadcastRecipientFilters } from '@/lib/admin/broadcast-filters'
import { deleteStudioCompletely } from '@/lib/admin/delete-studio'
import {
  fetchActiveSubscriptionByIds,
  getAdminBroadcastRecipients,
  getAdminStudios,
  getLatestAnnouncementForAdmin,
  type AdminStudioRow,
} from '@/lib/admin/queries'
import { getPublicSitePath } from '@/lib/queries/public-photographer'
import { getAdminStudioSummary } from '@/lib/admin/studio-summary'
import {
  isAnnouncementIconKey,
  normalizeAnnouncementIcon,
} from '@/lib/announcements/icons'
import type { Announcement } from '@/lib/announcements/types'
import {
  clearAdminSession,
  clearPendingAdminOtp,
  generateAdminOtpCode,
  isAdminAuthenticated,
  requireAdmin,
  setAdminSession,
  setPendingAdminOtp,
  verifyPendingAdminOtp,
} from '@/lib/admin/session'
import { sendAdminBroadcastEmail, sendAdminLoginCodeEmail } from '@/lib/email/resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { escapeIlikePattern } from '@/lib/supabase/ilike'
import {
  hasActiveSubscriptionLike,
  resolveStudioEntitlements,
} from '@/lib/subscriptions/entitlements'
import type { SubscriptionTierOverride } from '@/lib/subscriptions/types'
import { validatePrimaryImageFile } from '@/lib/media-upload-limits'
import { isR2Configured } from '@/lib/r2/config'
import { createPresignedUploadUrl } from '@/lib/r2/storage'
import { formatTestimonialImageRef } from '@/lib/testimonial-image-url'
import {
  deleteGalleryOriginalsCleanupBatch,
  scanGalleryOriginalsCleanupBatch,
} from '@/lib/admin/cleanup-gallery-originals'
import {
  generateMissingGalleryCoverCardsBatch,
  type GenerateMissingGalleryCoverCardsResult,
} from '@/lib/admin/generate-cover-cards'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type AdminActionState = {
  error?: string
  success?: string
  step?: 'email' | 'code' | 'authenticated'
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function getClientIp() {
  const headerStore = await headers()
  return (
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerStore.get('x-real-ip')?.trim() ??
    'unknown'
  )
}

type PersistentRateLimitResult = {
  allowed: boolean
  retryAfterSeconds: number
}

// Persistent rate limiting backed by the admin_rate_limit_check Postgres
// function (see supabase/migrations/20250713000001_add_admin_rate_limits.sql).
// Unlike an in-memory counter, this is enforced consistently across every
// Vercel serverless instance since Postgres is the single shared source of
// truth, and the check+increment happens atomically in one DB round trip.
async function checkPersistentRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<PersistentRateLimitResult> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .rpc('admin_rate_limit_check', {
      p_key: key,
      p_max_attempts: maxAttempts,
      p_window_seconds: windowSeconds,
    })
    .maybeSingle()

  if (error) {
    // Fail OPEN on infrastructure errors (network/DB issues) — a Supabase
    // hiccup should never be able to lock the only admin out of /manage.
    // This is a deliberate availability-over-strictness tradeoff for a
    // low-traffic, single-admin login flow. The error is still logged (not
    // silenced) so an outage or misconfiguration doesn't go unnoticed.
    console.error('[admin-rate-limit] check failed, failing open:', {
      key,
      error: error.message,
    })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  return {
    allowed: data?.allowed ?? true,
    retryAfterSeconds: data?.retry_after_seconds ?? 0,
  }
}

export async function requestAdminLoginCode(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const email = normalizeEmail(String(formData.get('email') || ''))
  if (!email) {
    return { error: 'נא להזין אימייל', step: 'email' }
  }

  if (email !== normalizeEmail(getFeedbackEmail())) {
    return {
      error: 'אימייל לא מורשה',
      step: 'email',
    }
  }

  // Rate-limit code requests themselves (not just verification) — otherwise
  // an attacker can just clear the OTP cookie and request a fresh code
  // repeatedly to keep resetting the per-code attempt counter. Persisted in
  // Postgres (not in-memory) so this is actually enforced across Vercel's
  // separate serverless instances.
  const ip = await getClientIp()
  const ipRate = await checkPersistentRateLimit(`admin-otp-request:ip:${ip}`, 5, 15 * 60)
  if (!ipRate.allowed) {
    const minutes = Math.max(1, Math.ceil(ipRate.retryAfterSeconds / 60))
    return { error: `יותר מדי בקשות לקוד. נסי שוב בעוד ${minutes} דקות.`, step: 'email' }
  }

  const emailRate = await checkPersistentRateLimit(`admin-otp-request:email:${email}`, 10, 60 * 60)
  if (!emailRate.allowed) {
    const minutes = Math.max(1, Math.ceil(emailRate.retryAfterSeconds / 60))
    return { error: `יותר מדי בקשות לקוד. נסי שוב בעוד ${minutes} דקות.`, step: 'email' }
  }

  const code = generateAdminOtpCode()
  await setPendingAdminOtp(code)
  await sendAdminLoginCodeEmail({ code })

  return {
    success: 'קוד כניסה נשלח למייל. בדקי את תיבת הדואר.',
    step: 'code',
  }
}

export async function verifyAdminLoginCode(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const code = String(formData.get('code') || '').trim()
  if (!/^\d{6}$/.test(code)) {
    return { error: 'קוד לא תקין', step: 'code' }
  }

  const valid = await verifyPendingAdminOtp(code)
  if (!valid) {
    return { error: 'קוד שגוי או שפג תוקפו', step: 'code' }
  }

  await clearPendingAdminOtp()
  await setAdminSession()
  revalidatePath('/manage')

  return { success: 'התחברת בהצלחה', step: 'authenticated' }
}

export async function adminLogout() {
  await clearAdminSession()
  await clearPendingAdminOtp()
  revalidatePath('/manage')
}

export async function fetchAdminStudios() {
  await requireAdmin()
  return getAdminStudios()
}

export type AdminEmailCheckResult = {
  exists: boolean
  studio: AdminStudioRow | null
}

export async function checkStudioEmailExists(email: string): Promise<AdminEmailCheckResult> {
  await requireAdmin()

  const normalized = normalizeEmail(email)
  if (!normalized) {
    throw new Error('נא להזין אימייל')
  }
  if (!EMAIL_REGEX.test(normalized)) {
    throw new Error('כתובת אימייל לא תקינה')
  }

  const admin = createAdminClient()
  const selectWithFlags =
    'id, email, name, studio_name, slug, created_at, trial_end_date, last_dashboard_visit_at, dashboard_visit_count, is_under_construction, is_site_unavailable, hero_video_url, subscription_tier_override'
  const selectWithoutHero =
    'id, email, name, studio_name, slug, created_at, trial_end_date, last_dashboard_visit_at, dashboard_visit_count, is_under_construction, is_site_unavailable, subscription_tier_override'
  const selectLegacy =
    'id, email, name, studio_name, slug, created_at, trial_end_date, last_dashboard_visit_at, dashboard_visit_count, subscription_tier_override'

  let { data, error } = await admin
    .from('users')
    .select(selectWithFlags)
    // Case-insensitive match (existing emails aren't guaranteed to be stored
    // lowercase), but escaped so user input can never be interpreted as an
    // ILIKE wildcard pattern (% / _).
    .ilike('email', escapeIlikePattern(normalized))
    .maybeSingle()

  if (error && error.message?.toLowerCase().includes('hero_video_url')) {
    ;({ data, error } = await admin
      .from('users')
      .select(selectWithoutHero)
      .ilike('email', escapeIlikePattern(normalized))
      .maybeSingle())
  }

  if (
    error &&
    (error.code === '42703' ||
      error.code === 'PGRST204' ||
      error.message?.toLowerCase().includes('is_under_construction') ||
      error.message?.toLowerCase().includes('is_site_unavailable'))
  ) {
    ;({ data, error } = await admin
      .from('users')
      .select(selectLegacy)
      .ilike('email', escapeIlikePattern(normalized))
      .maybeSingle())
  }

  if (error) throw new Error(error.message)
  if (!data) {
    return { exists: false, studio: null }
  }

  const row = data as {
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
    subscription_tier_override?: string | null
  }

  const override = (row.subscription_tier_override as SubscriptionTierOverride) ?? 'auto'
  const activeSubscriptions = await fetchActiveSubscriptionByIds([row.id])
  const entitlements = resolveStudioEntitlements({
    trialEndDate: row.trial_end_date,
    subscriptionTierOverride: override,
    hasActiveSubscription: hasActiveSubscriptionLike(
      activeSubscriptions.get(row.id) ?? null
    ),
  })

  return {
    exists: true,
    studio: {
      id: row.id,
      email: row.email,
      name: row.name,
      studio_name: row.studio_name,
      slug: row.slug,
      created_at: row.created_at,
      trial_end_date: row.trial_end_date,
      last_dashboard_visit_at: row.last_dashboard_visit_at,
      dashboard_visit_count: row.dashboard_visit_count ?? 0,
      is_under_construction: Boolean(row.is_under_construction),
      is_site_unavailable: Boolean(row.is_site_unavailable),
      has_hero_video: Boolean(row.hero_video_url?.trim()),
      site_path: getPublicSitePath(row.slug, row.studio_name),
      subscription_tier_override: override,
      tier: entitlements.tier,
      tier_source: entitlements.source,
      entitlements,
    },
  }
}

export async function fetchAdminStudioSummary(userId: string) {
  await requireAdmin()

  const trimmedId = userId.trim()
  if (!trimmedId) {
    throw new Error('מזהה סטודיו חסר')
  }

  return getAdminStudioSummary(trimmedId)
}

export async function deleteAdminStudio(userId: string) {
  await requireAdmin()

  await deleteStudioCompletely(userId)

  revalidatePath('/manage')
  revalidatePath('/sitemap.xml')
  return { success: true }
}

export async function updateAdminStudioSiteAccess(
  userId: string,
  patch: { is_under_construction?: boolean; is_site_unavailable?: boolean }
) {
  await requireAdmin()

  const trimmedId = userId.trim()
  if (!trimmedId) {
    throw new Error('מזהה סטודיו חסר')
  }

  const updates: {
    is_under_construction?: boolean
    is_site_unavailable?: boolean
  } = {}

  if (typeof patch.is_under_construction === 'boolean') {
    updates.is_under_construction = patch.is_under_construction
  }
  if (typeof patch.is_site_unavailable === 'boolean') {
    updates.is_site_unavailable = patch.is_site_unavailable
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('לא התקבלו שינויים לעדכון')
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .update(updates)
    .eq('id', trimmedId)
    .select('id, slug, studio_name, is_under_construction, is_site_unavailable')
    .maybeSingle()

  if (error) {
    const message = error.message?.toLowerCase() ?? ''
    if (
      error.code === '42703' ||
      error.code === 'PGRST204' ||
      message.includes('is_under_construction') ||
      message.includes('is_site_unavailable')
    ) {
      throw new Error(
        'יש להריץ את המיגרציה add_site_access_flags ב-Supabase לפני סימון מצב אתר'
      )
    }
    throw new Error(error.message)
  }
  if (!data) throw new Error('הסטודיו לא נמצא')

  const row = data as {
    id: string
    slug: string | null
    studio_name: string | null
    is_under_construction: boolean
    is_site_unavailable: boolean
  }

  const sitePath = getPublicSitePath(row.slug, row.studio_name)
  revalidatePath('/manage')
  if (sitePath) {
    revalidatePath(sitePath)
    revalidatePath(`${sitePath}/portfolio`)
    revalidatePath(`${sitePath}/blog`)
    revalidatePath(`${sitePath}/before-after`)
  }

  return {
    id: row.id,
    is_under_construction: Boolean(row.is_under_construction),
    is_site_unavailable: Boolean(row.is_site_unavailable),
  }
}

export async function getAdminAuthState() {
  return { authenticated: await isAdminAuthenticated() }
}

const SUBSCRIPTION_TIER_OVERRIDES: SubscriptionTierOverride[] = [
  'auto',
  'pro',
  'free',
]

export async function updateAdminStudioSubscriptionOverride(
  userId: string,
  override: SubscriptionTierOverride
) {
  await requireAdmin()

  const trimmedId = userId.trim()
  if (!trimmedId) {
    throw new Error('מזהה סטודיו חסר')
  }
  if (!SUBSCRIPTION_TIER_OVERRIDES.includes(override)) {
    throw new Error('ערך override לא תקין')
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .update({ subscription_tier_override: override })
    .eq('id', trimmedId)
    .select('id, slug, studio_name, trial_end_date, subscription_tier_override')
    .maybeSingle()

  if (error) {
    const message = error.message?.toLowerCase() ?? ''
    if (
      error.code === '42703' ||
      error.code === 'PGRST204' ||
      message.includes('subscription_tier_override')
    ) {
      throw new Error(
        'יש להריץ את המיגרציה add_subscription_tier_override ב-Supabase לפני עדכון הרמת מנוי'
      )
    }
    throw new Error(error.message)
  }
  if (!data) throw new Error('הסטודיו לא נמצא')

  const row = data as {
    id: string
    slug: string | null
    studio_name: string | null
    trial_end_date: string
    subscription_tier_override: SubscriptionTierOverride
  }

  revalidatePath('/manage')

  const sitePath = getPublicSitePath(row.slug, row.studio_name)
  if (sitePath) {
    revalidatePath(sitePath)
    revalidatePath(`${sitePath}/portfolio`)
    revalidatePath(`${sitePath}/blog`)
    revalidatePath(`${sitePath}/before-after`)
  }

  const activeSubscriptions = await fetchActiveSubscriptionByIds([row.id])
  const entitlements = resolveStudioEntitlements({
    trialEndDate: row.trial_end_date,
    subscriptionTierOverride: row.subscription_tier_override,
    hasActiveSubscription: hasActiveSubscriptionLike(
      activeSubscriptions.get(row.id) ?? null
    ),
  })

  return {
    id: row.id,
    subscription_tier_override: row.subscription_tier_override,
    tier: entitlements.tier,
    tier_source: entitlements.source,
    entitlements,
  }
}

export async function fetchAdminBroadcastRecipientCount(
  filters?: AdminBroadcastRecipientFilters | null
) {
  await requireAdmin()
  const recipients = await getAdminBroadcastRecipients(filters)
  return { count: recipients.length }
}

export async function prepareAdminBroadcastImageUpload(input: {
  fileName: string
  contentType: string
  fileSize: number
}) {
  await requireAdmin()

  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  if (!ALLOWED_IMAGE_TYPES.includes(input.contentType)) {
    throw new Error('סוג הקובץ לא נתמך — JPG, PNG או WebP')
  }
  validatePrimaryImageFile(input.contentType, input.fileSize)

  const extension = input.fileName.split('.').pop() || 'jpg'
  const path = `admin/broadcast_${Date.now()}.${extension}`
  const uploadUrl = await createPresignedUploadUrl('branding', path, input.contentType)

  return {
    uploadUrl,
    storageRef: formatTestimonialImageRef('branding', path),
  }
}

export async function fetchLatestAnnouncementForAdmin(): Promise<Announcement | null> {
  await requireAdmin()
  return getLatestAnnouncementForAdmin()
}

export async function publishAnnouncement(input: {
  title: string
  content: string
  icon: string
  isActive: boolean
}) {
  await requireAdmin()

  const title = input.title.trim()
  const content = input.content.trim()
  const icon = normalizeAnnouncementIcon(input.icon)
  const isActive = input.isActive

  if (!title) throw new Error('נא להזין כותרת')
  if (!content) throw new Error('נא להזין תוכן')
  if (!isAnnouncementIconKey(icon)) {
    throw new Error('סוג אייקון לא תקין')
  }

  const admin = createAdminClient()

  if (isActive) {
    const { error: deactivateError } = await admin
      .from('announcements')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('is_active', true)

    if (deactivateError) throw new Error(deactivateError.message)
  }

  const { data, error } = await admin
    .from('announcements')
    .insert({
      title,
      content,
      icon,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .select('id, title, content, icon, is_active, created_at, updated_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'פרסום ההודעה נכשל')
  }

  revalidatePath('/manage')
  revalidatePath('/dashboard')

  return data as Announcement
}

export async function sendAdminBroadcast(input: {
  subject: string
  message: string
  imageUrl?: string | null
  filters?: AdminBroadcastRecipientFilters | null
}) {
  await requireAdmin()

  const subject = input.subject.trim()
  const message = input.message.trim()
  const imageUrl = input.imageUrl?.trim() || null

  if (!subject) throw new Error('נא להזין נושא למייל')
  if (!message) throw new Error('נא להזין תוכן למייל')

  const recipients = await getAdminBroadcastRecipients(input.filters)
  if (recipients.length === 0) {
    throw new Error('אין נמענים שתואמים לסינון שנבחר')
  }

  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    try {
      await sendAdminBroadcastEmail({
        to: recipient.email,
        recipientName: recipient.name,
        subject,
        message,
        imageUrl,
      })
      sent++
    } catch (error) {
      console.error('[admin broadcast] failed for', recipient.email, error)
      failed++
    }

    if (sent + failed < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return {
    sent,
    failed,
    total: recipients.length,
  }
}

export async function scanGalleryOriginalsCleanup(offset = 0) {
  await requireAdmin()
  return scanGalleryOriginalsCleanupBatch(offset)
}

export async function deepCleanGalleryOriginals(
  targets: { id: string; source: 'gallery' | 'post' | 'cover' }[]
) {
  await requireAdmin()
  return deleteGalleryOriginalsCleanupBatch(targets)
}

export async function generateMissingGalleryCoverCards(
  offset = 0
): Promise<GenerateMissingGalleryCoverCardsResult> {
  await requireAdmin()
  return generateMissingGalleryCoverCardsBatch(offset)
}
