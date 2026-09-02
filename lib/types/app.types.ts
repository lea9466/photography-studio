import type { GalleryStatus, GalleryType, GalleryLayoutMode } from '@/lib/types/database.types'
import { galleryKind } from '@/lib/gallery-kind'

/** MVP: showcase galleries display and behave as public on the public site. */
export const PUBLIC_ONLY_MVP = true

/**
 * The private client-gallery workspace — private galleries, the clients CRM,
 * and the dashboard overview — is open to every account. Was gated behind
 * `PUBLIC_ONLY_MVP` + the `MVP_BYPASS_USER_ID` allowlist while the flow was in
 * preview; `PUBLIC_ONLY_MVP` itself still governs how the *public showcase
 * site* renders and is deliberately left on. Set back to `false` to re-gate.
 */
export const CLIENT_GALLERIES_ENABLED = true

/** Client-gallery download permissions (full-res / watermarked, per the photographer's choice). */
export const DOWNLOAD_PERMISSIONS_ENABLED = true

/**
 * Temporary bypass for testing the private-gallery/client workflow before it
 * opens to everyone — same pattern as PAYMENTS_SMOKE_TEST_USER_ID and
 * PHOTO_LIMIT_TEST_USER_ID. `MVP_BYPASS_USER_ID` holds one user id, or several
 * separated by commas. Turning it off later needs no code change, just clear
 * MVP_BYPASS_USER_ID from the environment. Server call sites compute
 * `PUBLIC_ONLY_MVP && !isMvpBypassUser(userId)` themselves — this only flags
 * the listed user ids, it doesn't touch the site-wide default.
 */
export function isMvpBypassUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  return (process.env.MVP_BYPASS_USER_ID ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId)
}

/**
 * Status persisted in DB during MVP when `public` is not yet in galleries_status_check.
 * UI still shows "ציבורי" via getDisplayGalleryStatus().
 * After migration 20250707000002, switch to 'public'.
 */
export const MVP_GALLERY_DB_STATUS = 'draft' as GalleryStatus

export const GALLERY_STATUS_LABELS: Record<GalleryStatus, string> = {
  draft: 'טיוטה',
  public: 'ציבורי',
  selection: 'בחירה',
  editing: 'עיבוד',
  delivery_ready: 'מוכן למסירה',
  locked: 'ארכיב',
}

/**
 * The workflow a private client gallery moves through, in order. "public" is
 * deliberately absent — a client gallery is a separate product and can never
 * be made public (see galleryKind). This is the list the status picker offers.
 */
export const CLIENT_GALLERY_STATUSES: GalleryStatus[] = [
  'draft',
  'selection',
  'editing',
  'delivery_ready',
  'locked',
]

export const GALLERY_TYPE_LABELS: Record<GalleryType, string> = {
  selection: 'בחירה',
  portfolio: 'תיק עבודות',
}

export const GALLERY_LAYOUT_MODE_LABELS: Record<GalleryLayoutMode, string> = {
  separated: 'מצב מופרד',
  portfolio: 'מצב תיק עבודות',
}

export type GalleryListItem = {
  id: string
  title: string
  status: GalleryStatus
  gallery_type: GalleryType
  created_at: string
  client_name: string | null
  photo_count: number
}

export type GalleryStatusFilter = GalleryStatus | 'all'

/**
 * MVP: normalize a showcase gallery's status to "public" for display.
 *
 * A client (private) gallery is a separate product and can never be public
 * (see galleryKind) — it always shows its real workflow status. `gallery_type`
 * must be passed to tell the two apart; legacy client rows whose type predates
 * the kind split still resolve to `client` here, and a stray stored `public`
 * status on such a row is shown as a plain draft rather than "ציבורי".
 */
export function getDisplayGalleryStatus(
  status: GalleryStatus,
  galleryType?: string | null
): GalleryStatus {
  if (galleryKind({ gallery_type: galleryType }) === 'client') {
    return status === 'public' ? MVP_GALLERY_DB_STATUS : status
  }
  return PUBLIC_ONLY_MVP ? 'public' : status
}

/** Max public galleries per photographer account */
export const MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER = 4

/** Per-account gallery limits keyed by normalized account email */
const PUBLIC_GALLERY_LIMIT_OVERRIDES: Record<string, number> = {
  'lea0556769466@gmail.com': 6,
}

export function normalizePhotographerEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? ''
}

export function getMaxPublicGalleriesForPhotographer(
  email: string | null | undefined
): number {
  const normalized = normalizePhotographerEmail(email)
  return PUBLIC_GALLERY_LIMIT_OVERRIDES[normalized] ?? MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER
}

/** Max photos across all public galleries per photographer account */
export const MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER = 160

export function getRemainingPublicGalleryPhotoSlots(currentCount: number): number {
  return Math.max(0, MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER - currentCount)
}

export function buildPublicGalleryPhotoLimitError(
  currentCount: number,
  adding: number
): string {
  const remaining = getRemainingPublicGalleryPhotoSlots(currentCount)
  if (remaining === 0) {
    return `הגעת למקסימום ${MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER} תמונות בכל הגלריות`
  }
  if (currentCount + adding > MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER) {
    return `ניתן להעלות עוד ${remaining} תמונות בלבד (מקסימום ${MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER} לכל הגלריות)`
  }
  return ''
}

export function buildPublicGalleryCountLimitError(
  currentCount: number,
  maxGalleries: number = MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER
): string | null {
  if (currentCount >= maxGalleries) {
    return `ניתן ליצור עד ${maxGalleries} גלריות`
  }
  return null
}

export function getGalleryStatusLabel(
  status: GalleryStatus,
  galleryType?: string | null
): string {
  return GALLERY_STATUS_LABELS[getDisplayGalleryStatus(status, galleryType)]
}

/** Default landing page while dashboard overview is blocked in MVP */
export const MVP_DEFAULT_DASHBOARD_PATH = '/dashboard/galleries'

/** First-time studio setup — slug, theme, branding */
export const ONBOARDING_SETTINGS_PATH = '/dashboard/settings'

/**
 * Routes that used to be blocked during MVP (dashboard overview + clients CRM).
 * Now that the client-gallery workspace is open to everyone
 * (`CLIENT_GALLERIES_ENABLED`) nothing is blocked; kept as a seam so the
 * workspace can be re-gated from one place.
 */
export function isMvpBlockedDashboardRoute(
  pathname: string,
  userId?: string | null
): boolean {
  if (CLIENT_GALLERIES_ENABLED) return false
  if (!PUBLIC_ONLY_MVP) return false
  if (isMvpBypassUser(userId)) return false
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/clients')
}

export function resolveMvpDashboardPath(path: string, userId?: string | null): string {
  const normalized = path.startsWith('/') ? path : MVP_DEFAULT_DASHBOARD_PATH
  if (isMvpBlockedDashboardRoute(normalized, userId)) return MVP_DEFAULT_DASHBOARD_PATH
  return normalized
}
