import {
  deleteR2ByUrls,
  deleteR2GalleryFolder,
  uploadCoverToR2,
} from '@/lib/r2-storage'
import { resolvePhotographerIdForAlbum } from '@/lib/photographer-scope'
import { getR2GalleryUploadStatus } from '@/lib/r2-status'
import { isR2PublicUrl } from '@/lib/r2-public'
import {
  isAlbumOwnedCoverUrl,
  isLegacyCloudinaryUrl,
  isSupabaseStorageUrl,
} from '@/lib/storage-urls'
import {
  deleteSupabaseStorageByUrls,
  supabaseStorageConfigError,
  supabaseStorageConfigured,
  uploadSiteFileToSupabase,
} from '@/lib/supabase-storage'

export { isAlbumOwnedCoverUrl } from '@/lib/storage-urls'

const MAX_MB = 50
const MAX_BYTES = MAX_MB * 1024 * 1024

export function siteStorageConfigured(): boolean {
  return supabaseStorageConfigured()
}

export function siteStorageConfigError(): string {
  return supabaseStorageConfigError()
}

export function coverStorageConfigured(): boolean {
  return getR2GalleryUploadStatus().ready
}

export function coverStorageConfigError(): string {
  const status = getR2GalleryUploadStatus()
  return status.ready ? '' : status.message
}

export async function uploadSiteFile(
  file: File,
  prefix: string
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  if (!file.size) return { url: null, path: null, error: 'קובץ ריק' }
  if (file.size > MAX_BYTES) {
    return { url: null, path: null, error: `הקובץ גדול מדי (מקסימום ${MAX_MB}MB)` }
  }
  return uploadSiteFileToSupabase(file, prefix)
}

export async function uploadAlbumCover(
  albumId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  if (!coverStorageConfigured()) {
    return { url: null, error: coverStorageConfigError() }
  }
  if (!file.size) return { url: null, error: 'קובץ ריק' }
  if (file.size > MAX_BYTES) {
    return { url: null, error: `הקובץ גדול מדי (מקסימום ${MAX_MB}MB)` }
  }

  const { photographerId, error: scopeError } =
    await resolvePhotographerIdForAlbum(albumId)
  if (scopeError || !photographerId) {
    return { url: null, error: scopeError ?? 'גלריה לא נמצאה' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { url, error } = await uploadCoverToR2(
    albumId,
    photographerId,
    file.name,
    buffer,
    file.type || 'application/octet-stream'
  )
  if (error || !url) {
    return { url: null, error: error ?? 'שגיאה בהעלאת תמונת השער' }
  }
  return { url, error: null }
}

export async function removeStoragePaths(urls: string[]): Promise<void> {
  const supabaseUrls = urls.filter(isSupabaseStorageUrl)
  const r2Urls = urls.filter(isR2PublicUrl)
  const legacyCloudinary = urls.filter(isLegacyCloudinaryUrl)

  await deleteSupabaseStorageByUrls(supabaseUrls)
  await deleteR2ByUrls(r2Urls)

  if (legacyCloudinary.length > 0) {
    console.warn(
      '[storage] נותרו קישורי Cloudinary ישנים — מחקי ידנית ב-Cloudinary או העלו מחדש:',
      legacyCloudinary.length
    )
  }
}

export async function removeAlbumStorageFolder(
  albumId: string,
  photographerId: string
): Promise<void> {
  await deleteR2GalleryFolder(albumId, photographerId)
}

/** @deprecated — העלאת גלריה מתבצעת מהדפדפן ל-R2 */
export async function uploadAlbumImageWithThumbnail(
  _albumId: string,
  _file: File,
  _clientThumb?: File
): Promise<{ url: string | null; thumbnailUrl: string | null; error: string | null }> {
  return {
    url: null,
    thumbnailUrl: null,
    error: 'העלאת תמונות גלריה מתבצעת מהדפדפן ל-Cloudflare R2 — השתמשי בטופס בעריכת הגלריה',
  }
}
