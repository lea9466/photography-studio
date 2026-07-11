import type { createAdminClient } from '@/lib/supabase/admin'
import { signStoragePaths } from '@/lib/storage'
import { PUBLIC_ONLY_MVP } from '@/lib/types/app.types'

type AdminClient = ReturnType<typeof createAdminClient>

export type PublicGalleryDisplayPhoto = {
  id: string
  url: string | null
}

type PhotoRow = {
  id: string
  preview_url: string | null
  watermarked_preview_url: string | null
}

export async function fetchPublicGalleryDisplayPhotos(
  admin: AdminClient,
  galleryId: string
): Promise<PublicGalleryDisplayPhoto[]> {
  const { data: editedPhotos } = await admin
    .from('edited_photos')
    .select('photo_id, final_url')
    .eq('gallery_id', galleryId)

  if (!PUBLIC_ONLY_MVP && editedPhotos && editedPhotos.length > 0) {
    const photoPaths = editedPhotos.map((row) => ({
      id: row.photo_id,
      path: row.final_url as string,
    }))
    const paths = photoPaths.map((photo) => photo.path)
    const signedUrls =
      paths.length > 0 ? await signStoragePaths('edited', paths, galleryId) : {}

    return photoPaths.map((photo) => ({
      id: photo.id,
      url: signedUrls[photo.path] ?? null,
    }))
  }

  const { data: regularPhotos } = await admin
    .from('photos')
    .select('id, preview_url, watermarked_preview_url')
    .eq('gallery_id', galleryId)
    .eq('is_visible_to_client', true)
    .order('sort_order', { ascending: true })

  const rows = (regularPhotos ?? []) as PhotoRow[]

  if (!PUBLIC_ONLY_MVP) {
    const photoPaths = rows
      .filter((row) => Boolean(row.preview_url))
      .map((row) => ({
        id: row.id,
        path: row.preview_url as string,
      }))
    const paths = photoPaths.map((photo) => photo.path)
    const signedUrls =
      paths.length > 0 ? await signStoragePaths('previews', paths, galleryId) : {}

    return photoPaths.map((photo) => ({
      id: photo.id,
      url: signedUrls[photo.path] ?? null,
    }))
  }

  const watermarkedPaths: string[] = []
  const previewPaths: string[] = []
  const entries: Array<{
    id: string
    path: string
    bucket: 'watermarked' | 'previews'
  }> = []

  for (const row of rows) {
    const path = row.watermarked_preview_url ?? row.preview_url
    if (!path) continue

    const bucket = row.watermarked_preview_url ? 'watermarked' : 'previews'
    entries.push({ id: row.id, path, bucket })
    if (bucket === 'watermarked') watermarkedPaths.push(path)
    else previewPaths.push(path)
  }

  const [watermarkedUrls, previewUrls] = await Promise.all([
    watermarkedPaths.length
      ? signStoragePaths('watermarked', watermarkedPaths, galleryId)
      : Promise.resolve({} as Record<string, string>),
    previewPaths.length
      ? signStoragePaths('previews', previewPaths, galleryId)
      : Promise.resolve({} as Record<string, string>),
  ])

  return entries.map((entry) => ({
    id: entry.id,
    url:
      entry.bucket === 'watermarked'
        ? watermarkedUrls[entry.path] ?? null
        : previewUrls[entry.path] ?? null,
  }))
}
