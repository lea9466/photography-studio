import imageCompression from 'browser-image-compression'
import {
  prepareClientGalleryCoverUpload,
  saveClientGalleryCover,
} from '@/lib/actions/client-gallery-cover.actions'
import {
  CLIENT_COVER_MAX_BYTES,
  CLIENT_COVER_MAX_DIMENSION,
  validateCoverSourceFile,
} from '@/lib/private-galleries/client-cover'
import { putToPresignedUrl } from '@/lib/r2/upload-client'

export type ClientCoverUploadResult = { ok: true; path: string } | { ok: false; error: string }

const COMPRESSION_OPTIONS = {
  maxSizeMB: CLIENT_COVER_MAX_BYTES / (1024 * 1024) / 2,
  maxWidthOrHeight: CLIENT_COVER_MAX_DIMENSION,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.82,
  maxIteration: 6,
}

/**
 * Compresses the picked image to a hero-sized JPEG, uploads it into the
 * gallery's gated prefix, and attaches it as the gallery's cover. Failures come
 * back as `{ ok: false, error }` so callers can show the message.
 */
export async function uploadClientGalleryCover(
  galleryId: string,
  file: File
): Promise<ClientCoverUploadResult> {
  const invalid = validateCoverSourceFile(file)
  if (invalid) return { ok: false, error: invalid }

  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS)

    const prepared = await prepareClientGalleryCoverUpload(galleryId, {
      contentType: 'image/jpeg',
      fileSize: compressed.size,
    })
    if (!prepared.ok) return prepared

    await putToPresignedUrl(prepared.uploadUrl, compressed)

    const saved = await saveClientGalleryCover(galleryId, prepared.path)
    return saved.ok ? { ok: true, path: saved.path } : saved
  } catch (error) {
    console.error('Error uploading client gallery cover:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'העלאת תמונת הכיסוי נכשלה',
    }
  }
}
