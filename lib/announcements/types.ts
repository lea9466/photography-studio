export type Announcement = {
  id: string
  title: string
  content: string
  icon: string
  is_active: boolean
  /** Optional CTA rendered as a button in the banner. Both null → plain banner. */
  cta_label: string | null
  cta_href: string | null
  created_at: string
  updated_at: string
}

export const ANNOUNCEMENT_DISMISS_STORAGE_PREFIX = 'gallery-studio-dismissed-announcement-'

export function getAnnouncementDismissStorageKey(id: string) {
  return `${ANNOUNCEMENT_DISMISS_STORAGE_PREFIX}${id}`
}

export function isAnnouncementDismissed(id: string) {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(getAnnouncementDismissStorageKey(id)) === '1'
}

export function dismissAnnouncement(id: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getAnnouncementDismissStorageKey(id), '1')
}
