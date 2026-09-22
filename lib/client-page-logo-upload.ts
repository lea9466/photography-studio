import {
  finalizeClientPageLogoUpload,
  prepareClientPageLogoUpload,
} from '@/lib/actions/client-page-design.actions'
import { compressBrandingFile } from '@/lib/branding-upload-client'
import { PRIMARY_IMAGE_ALLOWED_TYPES, PRIMARY_IMAGE_MAX_BYTES, PRIMARY_IMAGE_MAX_MB } from '@/lib/media-upload-limits'
import { putToPresignedUrl } from '@/lib/r2/upload-client'

export type ClientPageLogoUploadResult =
  | { ok: true; logoUrl: string | null }
  | { ok: false; error: string }

/** Message for a picked file that can't be a logo, or null when it's fine. */
export function validateLogoSourceFile(file: { type: string; size: number }): string | null {
  if (!(PRIMARY_IMAGE_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return 'יש לבחור לוגו בפורמט JPG, PNG, WebP או SVG'
  }
  if (file.size > PRIMARY_IMAGE_MAX_BYTES) {
    return `הקובץ גדול מדי — הגבלה של ${PRIMARY_IMAGE_MAX_MB}MB`
  }
  return null
}

/** Uploads a logo used only on client-facing gallery pages and attaches it to the studio. */
export async function uploadClientPageLogo(file: File): Promise<ClientPageLogoUploadResult> {
  const invalid = validateLogoSourceFile(file)
  if (invalid) return { ok: false, error: invalid }

  try {
    const uploadFile = await compressBrandingFile(file)
    const prepared = await prepareClientPageLogoUpload({
      fileName: uploadFile.name,
      contentType: uploadFile.type,
      fileSize: uploadFile.size,
    })
    if (!prepared.ok) return prepared

    await putToPresignedUrl(prepared.uploadUrl, uploadFile)

    const finalized = await finalizeClientPageLogoUpload(prepared.path)
    return finalized.ok ? { ok: true, logoUrl: finalized.logoUrl } : finalized
  } catch (error) {
    console.error('Error uploading client page logo:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'העלאת הלוגו נכשלה',
    }
  }
}
