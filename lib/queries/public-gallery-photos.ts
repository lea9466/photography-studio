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

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

/**
 * Trims to `limit` BEFORE signing — signing is a real network/crypto cost per
 * path, so this must run on the raw rows/paths, not on the already-signed
 * results (that would sign up to `fetchLimit` paths just to discard most of them).
 */
function selectSubset<T>(items: T[], limit: number | undefined, random: boolean): T[] {
  if (!limit) return items
  return random ? shuffleInPlace([...items]).slice(0, limit) : items.slice(0, limit)
}

/**
 * @param options.random When true (FREE tier), the `limit` is applied as a
 * random sample of the gallery's photos instead of the first N by sort order
 * — so the public preview varies rather than always showing the same subset.
 */
export async function fetchPublicGalleryDisplayPhotos(
  admin: AdminClient,
  galleryId: string,
  options?: { limit?: number; random?: boolean }
): Promise<PublicGalleryDisplayPhoto[]> {
  const limit = options?.limit
  const random = options?.random ?? false
  // Random sampling needs the full pool before trimming to `limit`.
  const fetchLimit = random ? 1000 : limit ?? 1000

  const { data: editedPhotos } = await admin
    .from('edited_photos')
    .select('photo_id, final_url')
    .eq('gallery_id', galleryId)
    .limit(fetchLimit)

  if (!PUBLIC_ONLY_MVP && editedPhotos && editedPhotos.length > 0) {
    const photoPaths = selectSubset(
      editedPhotos.map((row) => ({ id: row.photo_id, path: row.final_url as string })),
      limit,
      random
    )
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
    .limit(fetchLimit)

  const rows = (regularPhotos ?? []) as PhotoRow[]

  if (!PUBLIC_ONLY_MVP) {
    const photoPaths = selectSubset(
      rows
        .filter((row) => Boolean(row.preview_url))
        .map((row) => ({ id: row.id, path: row.preview_url as string })),
      limit,
      random
    )
    const paths = photoPaths.map((photo) => photo.path)
    const signedUrls =
      paths.length > 0 ? await signStoragePaths('previews', paths, galleryId) : {}

    return photoPaths.map((photo) => ({
      id: photo.id,
      url: signedUrls[photo.path] ?? null,
    }))
  }

  const { data: settingsRow } = await admin
    .from('gallery_settings')
    .select('auto_apply_watermark')
    .eq('gallery_id', galleryId)
    .maybeSingle()
  const autoApplyWatermark =
    (settingsRow as { auto_apply_watermark: boolean | null } | null)?.auto_apply_watermark ?? true

  const watermarkedPaths: string[] = []
  const previewPaths: string[] = []
  const entries: Array<{
    id: string
    path: string
    bucket: 'watermarked' | 'previews'
  }> = []

  for (const row of selectSubset(rows, limit, random)) {
    const useWatermarked = autoApplyWatermark && Boolean(row.watermarked_preview_url)
    const path = useWatermarked ? row.watermarked_preview_url : row.preview_url
    if (!path) continue

    const bucket = useWatermarked ? 'watermarked' : 'previews'
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
