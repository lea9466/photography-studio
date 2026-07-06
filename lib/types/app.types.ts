import type { GalleryStatus, GalleryType } from '@/lib/types/database.types'

/** MVP: all galleries display and behave as public */
export const PUBLIC_ONLY_MVP = true

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

export const GALLERY_TYPE_LABELS: Record<GalleryType, string> = {
  selection: 'בחירה',
  portfolio: 'תיק עבודות',
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

/** MVP: normalize any gallery status to public for display */
export function getDisplayGalleryStatus(status: GalleryStatus): GalleryStatus {
  return PUBLIC_ONLY_MVP ? 'public' : status
}

export function getGalleryStatusLabel(status: GalleryStatus): string {
  return GALLERY_STATUS_LABELS[getDisplayGalleryStatus(status)]
}

/** Default landing page while dashboard overview is blocked in MVP */
export const MVP_DEFAULT_DASHBOARD_PATH = '/dashboard/galleries'

/** Routes blocked entirely during MVP (redirect to galleries list) */
export function isMvpBlockedDashboardRoute(pathname: string): boolean {
  if (!PUBLIC_ONLY_MVP) return false
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/clients')
}

export function resolveMvpDashboardPath(path: string): string {
  const normalized = path.startsWith('/') ? path : MVP_DEFAULT_DASHBOARD_PATH
  if (isMvpBlockedDashboardRoute(normalized)) return MVP_DEFAULT_DASHBOARD_PATH
  return normalized
}
