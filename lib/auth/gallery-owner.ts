import { requireDashboardContext } from '@/lib/auth/dashboard-context'

export async function assertGalleryOwner(galleryId: string) {
  const context = await requireDashboardContext()

  const { data: gallery } = await context.supabase
    .from('galleries')
    .select('id, is_public')
    .eq('id', galleryId)
    .eq('user_id', context.userId)
    .single()

  if (!gallery) throw new Error('גלריה לא נמצאה')

  return {
    supabase: context.supabase,
    user: { id: context.userId },
    gallery: gallery as { id: string; is_public: boolean },
    isImpersonating: context.isImpersonating,
  }
}

type OwnedPhotoRow = {
  id: string
  gallery_id: string
  original_url: string | null
  preview_url: string | null
  watermarked_preview_url: string | null
}

export async function assertPhotoInOwnedGallery(photoId: string) {
  const context = await requireDashboardContext()

  const { data: photo } = await context.supabase
    .from('photos')
    .select('id, gallery_id, original_url, preview_url, watermarked_preview_url')
    .eq('id', photoId)
    .single()

  const row = photo as OwnedPhotoRow | null
  if (!row) throw new Error('תמונה לא נמצאה')

  const { data: gallery } = await context.supabase
    .from('galleries')
    .select('id')
    .eq('id', row.gallery_id)
    .eq('user_id', context.userId)
    .single()

  if (!gallery) throw new Error('גלריה לא נמצאה')

  return {
    supabase: context.supabase,
    user: { id: context.userId },
    photo: row,
    isImpersonating: context.isImpersonating,
  }
}

export async function assertDownloadJobOwner(jobId: string) {
  const context = await requireDashboardContext()

  const { data: job } = await context.supabase
    .from('download_jobs')
    .select('id, file_url, status, gallery_id')
    .eq('id', jobId)
    .single()

  type JobRow = {
    id: string
    file_url: string | null
    status: string
    gallery_id: string
  }

  const row = job as JobRow | null
  if (!row) throw new Error('הורדה לא נמצאה')

  const { data: gallery } = await context.supabase
    .from('galleries')
    .select('id')
    .eq('id', row.gallery_id)
    .eq('user_id', context.userId)
    .single()

  if (!gallery) throw new Error('הורדה לא נמצאה')

  return {
    supabase: context.supabase,
    job: row,
    isImpersonating: context.isImpersonating,
  }
}
