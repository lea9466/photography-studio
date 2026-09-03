import { createAdminClient } from '@/lib/supabase/admin'
import { getPrivateGalleryEntitlements } from '@/lib/private-galleries/loader'
import type { PrivateGalleryEntitlements } from '@/lib/private-galleries/types'

export type AdminStudioSummary = {
  /** Public-site content — the "ניהול האתר" half of the dialog. */
  showcaseGalleries: number
  publicGalleries: number
  showcaseGalleryPhotos: number
  posts: number
  postPhotos: number
  packages: number
  faqItems: number
  testimonials: number
  photoEditComparisons: number
  activePhotoEditComparisons: number
  heroImages: number
  heroDesktopImages: number
  heroMobileImages: number
  /** Private (client) gallery product — the "גלריות פרטיות ולקוחות" half. */
  clientGalleries: number
  clientGalleryPhotos: number
  clients: number
  galleryPassCreditsAvailable: number
  galleryPassCreditsConsumed: number
  galleryPassCreditsPending: number
}

export type AdminStudioDetails = {
  summary: AdminStudioSummary
  /** null when private_gallery_tiers can't be resolved — the site half still renders. */
  privateGallery: PrivateGalleryEntitlements | null
}

function asCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export async function getAdminStudioSummary(userId: string): Promise<AdminStudioSummary> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('admin_studio_summary', {
    p_user_id: userId,
  })

  if (error) throw new Error(error.message)

  const row = (data ?? {}) as Record<string, unknown>

  return {
    showcaseGalleries: asCount(row.showcaseGalleries),
    publicGalleries: asCount(row.publicGalleries),
    showcaseGalleryPhotos: asCount(row.showcaseGalleryPhotos),
    posts: asCount(row.posts),
    postPhotos: asCount(row.postPhotos),
    packages: asCount(row.packages),
    faqItems: asCount(row.faqItems),
    testimonials: asCount(row.testimonials),
    photoEditComparisons: asCount(row.photoEditComparisons),
    activePhotoEditComparisons: asCount(row.activePhotoEditComparisons),
    heroImages: asCount(row.heroImages),
    heroDesktopImages: asCount(row.heroDesktopImages),
    heroMobileImages: asCount(row.heroMobileImages),
    clientGalleries: asCount(row.clientGalleries),
    clientGalleryPhotos: asCount(row.clientGalleryPhotos),
    clients: asCount(row.clients),
    galleryPassCreditsAvailable: asCount(row.galleryPassCreditsAvailable),
    galleryPassCreditsConsumed: asCount(row.galleryPassCreditsConsumed),
    galleryPassCreditsPending: asCount(row.galleryPassCreditsPending),
  }
}

/**
 * Everything the admin studio dialog shows for one studio: the content counts
 * plus the studio's live private-gallery entitlement (tier + quota). The
 * entitlement load is best-effort — if it fails the dialog still shows the
 * counts.
 */
export async function getAdminStudioDetails(userId: string): Promise<AdminStudioDetails> {
  const [summary, privateGallery] = await Promise.all([
    getAdminStudioSummary(userId),
    getPrivateGalleryEntitlements(userId).catch((error) => {
      console.error('[admin studio details] private-gallery entitlement load failed:', error)
      return null
    }),
  ])

  return { summary, privateGallery }
}
