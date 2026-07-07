'use server'

import JSZip from 'jszip'
import { assertGalleryOwner, assertDownloadJobOwner } from '@/lib/auth/gallery-owner'
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
  const { supabase, user } = await assertGalleryOwner(galleryId)

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

  if (type === 'preview' || type === 'original' || type === 'watermarked') {
    const { data: photos } = await admin
      .from('photos')
      .select('id, original_url, preview_url, watermarked_preview_url, is_visible_to_client')
      .eq('gallery_id', galleryId)
      .eq('is_visible_to_client', true)

    type PhotoRow = {
      id: string
      original_url: string | null
      preview_url: string | null
      watermarked_preview_url: string | null
      is_visible_to_client: boolean
    }

    for (const photo of (photos ?? []) as PhotoRow[]) {
      let path: string | null = null
      let bucket: 'originals' | 'previews' | 'watermarked' = 'previews'

      if (type === 'original') {
        path = photo.original_url
        bucket = 'originals'
      } else if (type === 'watermarked') {
        path = photo.watermarked_preview_url
        bucket = 'watermarked'
      } else {
        path = photo.preview_url
        bucket = 'previews'
      }

      if (!path) continue

      const file = await downloadMediaObject(bucket, path)
      zip.file(path.split('/').pop()!, file)
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
  const { job } = await assertDownloadJobOwner(jobId)

  if (job.status !== 'ready' || !job.file_url) {
    throw new Error('הורדה לא מוכנה')
  }

  return createPresignedDownloadUrl('zips', job.file_url)
}

export async function pollDownloadJob(jobId: string) {
  const { job } = await assertDownloadJobOwner(jobId)

  return { status: job.status, file_url: job.file_url }
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

export async function createClientDownload(galleryId: string, type: 'watermarked' | 'original') {
  const allowed = await hasGallerySession(galleryId)
  if (!allowed) throw new Error('גישה נדחתה')

  const admin = createAdminClient()
  const { data: galleryData } = await admin
    .from('galleries')
    .select('id, status, user_id, title, gallery_settings(allow_download_preview, allow_download_original)')
    .eq('id', galleryId)
    .single()

  type GalleryRow = {
    id: string
    status: string
    user_id: string
    title: string
    gallery_settings: {
      allow_download_preview: boolean
      allow_download_original: boolean
    } | { allow_download_preview: boolean; allow_download_original: boolean }[] | null
  }

  const gallery = galleryData as GalleryRow | null
  if (!gallery) throw new Error('גלריה לא נמצאה')

  const settings = Array.isArray(gallery.gallery_settings)
    ? gallery.gallery_settings[0]
    : gallery.gallery_settings

  if (type === 'watermarked' && !settings?.allow_download_preview) {
    throw new Error('הורדת תמונות עם סימן מים לא מורשית')
  }

  if (type === 'original' && !settings?.allow_download_original) {
    throw new Error('הורדת תמונות מקור לא מורשית')
  }

  const downloadType = type === 'watermarked' ? 'watermarked' : 'original'
  const fileUrl = await buildZip(galleryId, downloadType, gallery.user_id)
  const downloadUrl = await createPresignedDownloadUrl('zips', fileUrl, 3600, {
    filename: `${gallery.title}-${type}.zip`.replace(/[^\w\u0590-\u05FF.-]+/g, '_'),
  })

  return { downloadUrl }
}
