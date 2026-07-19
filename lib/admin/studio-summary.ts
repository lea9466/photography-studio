import { createAdminClient } from '@/lib/supabase/admin'

export type AdminStudioSummary = {
  galleries: number
  publicGalleries: number
  photos: number
  clients: number
  packages: number
  posts: number
  postPhotos: number
  faqItems: number
  testimonials: number
  photoEditComparisons: number
  activePhotoEditComparisons: number
  heroImages: number
  heroDesktopImages: number
  heroMobileImages: number
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
    galleries: asCount(row.galleries),
    publicGalleries: asCount(row.publicGalleries),
    photos: asCount(row.photos),
    clients: asCount(row.clients),
    packages: asCount(row.packages),
    posts: asCount(row.posts),
    postPhotos: asCount(row.postPhotos),
    faqItems: asCount(row.faqItems),
    testimonials: asCount(row.testimonials),
    photoEditComparisons: asCount(row.photoEditComparisons),
    activePhotoEditComparisons: asCount(row.activePhotoEditComparisons),
    heroImages: asCount(row.heroImages),
    heroDesktopImages: asCount(row.heroDesktopImages),
    heroMobileImages: asCount(row.heroMobileImages),
  }
}
