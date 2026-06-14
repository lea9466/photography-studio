'use server'

import JSZip from 'jszip'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasGallerySession } from '@/lib/gallery-session'
import {
  createPresignedDownloadUrl,
  downloadMediaObject,
  uploadMediaObject,
} from '@/lib/r2/storage'
import type { DownloadJobType } from '@/lib/types/database.types'

export async function createDownloadJob(
  galleryId: string,
  type: DownloadJobType
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('יש להתחבר מחדש')

  const { data, error } = await supabase
    .from('download_jobs')
    .insert({ gallery_id: galleryId, type, status: 'processing' } as never)
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  const jobId = (data as { id: string }).id

  try {
    const fileUrl = await buildZip(galleryId, type, user.id)
    await supabase
      .from('download_jobs')
      .update({
        status: 'ready',
        file_url: fileUrl,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      } as never)
      .eq('id', jobId)

    const downloadUrl = await createPresignedDownloadUrl('zips', fileUrl, 3600, {
      filename: `${type}-${galleryId.slice(0, 8)}.zip`,
    })

    revalidatePath(`/dashboard/galleries/${galleryId}/selections`)
    return { jobId, downloadUrl }
  } catch (err) {
    await supabase
      .from('download_jobs')
      .update({ status: 'failed' } as never)
      .eq('id', jobId)
    throw err
  }
}

async function buildZip(
  galleryId: string,
  type: DownloadJobType,
  userId: string
) {
  const admin = createAdminClient()
  const zip = new JSZip()

  let fileCount = 0

  if (type === 'preview' || type === 'original') {
    const { data: selections } = await admin
      .from('photo_selections')
      .select('photo_id, selected_album, selected_edit, photos(original_url, preview_url)')
      .eq('gallery_id', galleryId)
      .or('selected_album.eq.true,selected_edit.eq.true')

    type SelectionRow = {
      photo_id: string
      selected_album: boolean
      selected_edit: boolean
      photos: {
        original_url: string | null
        preview_url: string | null
      } | { original_url: string | null; preview_url: string | null }[] | null
    }

    for (const row of (selections ?? []) as SelectionRow[]) {
      const photo = Array.isArray(row.photos) ? row.photos[0] : row.photos
      const path =
        type === 'original' ? photo?.original_url : photo?.preview_url
      const bucket = type === 'original' ? 'originals' : 'previews'
      if (!path) continue

      const file = await downloadMediaObject(bucket, path)
      const prefix = row.selected_album ? 'album' : 'edit'
      zip.file(`${prefix}/${path.split('/').pop()}`, file)
      fileCount++
    }
  }

  if (type === 'edited') {
    const { data: edited } = await admin
      .from('edited_photos')
      .select('final_url')
      .eq('gallery_id', galleryId)

    for (const row of edited ?? []) {
      const path = (row as { final_url: string | null }).final_url
      if (!path) continue
      const file = await downloadMediaObject('edited', path)
      zip.file(path.split('/').pop()!, file)
      fileCount++
    }
  }

  if (fileCount === 0) {
    throw new Error('אין קבצים להורדה')
  }

  const content = await zip.generateAsync({ type: 'uint8array' })
  const zipPath = `${userId}/${galleryId}/${type}-${Date.now()}.zip`

  await uploadMediaObject('zips', zipPath, content, 'application/zip')
  return zipPath
}

export async function getDownloadJobUrl(jobId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('download_jobs')
    .select('file_url, status')
    .eq('id', jobId)
    .single()

  const job = data as { file_url: string | null; status: string } | null
  if (!job || job.status !== 'ready' || !job.file_url) {
    throw new Error('הורדה לא מוכנה')
  }

  return createPresignedDownloadUrl('zips', job.file_url)
}

export async function pollDownloadJob(jobId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('download_jobs')
    .select('status, file_url')
    .eq('id', jobId)
    .single()

  return data as { status: string; file_url: string | null } | null
}

export async function createClientEditedDownload(galleryId: string) {
  const allowed = await hasGallerySession(galleryId)
  if (!allowed) throw new Error('גישה נדחתה')

  const admin = createAdminClient()
  const { data: galleryData } = await admin
    .from('galleries')
    .select('id, status, user_id, title')
    .eq('id', galleryId)
    .single()

  type GalleryRow = {
    id: string
    status: string
    user_id: string
    title: string
  }

  const gallery = galleryData as GalleryRow | null
  if (!gallery) throw new Error('גלריה לא נמצאה')
  if (!['delivery_ready', 'locked'].includes(gallery.status)) {
    throw new Error('ההורדה תיפתח כשהגלריה מוכנה למסירה')
  }

  const fileUrl = await buildZip(galleryId, 'edited', gallery.user_id)
  const downloadUrl = await createPresignedDownloadUrl('zips', fileUrl, 3600, {
    filename: `${gallery.title}-edited.zip`.replace(/[^\w\u0590-\u05FF.-]+/g, '_'),
  })

  return { downloadUrl }
}
