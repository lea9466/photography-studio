import { createClient } from '@/lib/supabase/server'

export async function assertGalleryOwner(galleryId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, is_public')
    .eq('id', galleryId)
    .eq('user_id', user.id)
    .single()

  if (!gallery) throw new Error('גלריה לא נמצאה')

  return {
    supabase,
    user,
    gallery: gallery as { id: string; is_public: boolean },
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const { data: photo } = await supabase
    .from('photos')
    .select('id, gallery_id, original_url, preview_url, watermarked_preview_url')
    .eq('id', photoId)
    .single()

  const row = photo as OwnedPhotoRow | null
  if (!row) throw new Error('תמונה לא נמצאה')

  const { data: gallery } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', row.gallery_id)
    .eq('user_id', user.id)
    .single()

  if (!gallery) throw new Error('גלריה לא נמצאה')

  return { supabase, user, photo: row }
}

export async function assertDownloadJobOwner(jobId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const { data: job } = await supabase
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

  const { data: gallery } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', row.gallery_id)
    .eq('user_id', user.id)
    .single()

  if (!gallery) throw new Error('הורדה לא נמצאה')

  return { supabase, job: row }
}
