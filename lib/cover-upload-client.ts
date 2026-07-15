import imageCompression from 'browser-image-compression'
import { compressBrandingFile } from '@/lib/branding-upload-client'
import { prepareGalleryCoverUpload } from '@/lib/actions/gallery.actions'
import {
  COVER_CARD_COMPRESSION_OPTIONS,
} from '@/lib/images/cover-card'
import { putToPresignedUrl } from '@/lib/r2/upload-client'

async function compressGalleryCoverCard(file: File): Promise<Blob> {
  return imageCompression(file, COVER_CARD_COMPRESSION_OPTIONS)
}

export async function uploadGalleryCoverFile(file: File): Promise<string> {
  const uploadFile = await compressBrandingFile(file)
  const shouldUploadCard = file.type !== 'image/svg+xml'

  let cardBlob: Blob | null = null
  if (shouldUploadCard) {
    try {
      cardBlob = await compressGalleryCoverCard(file)
    } catch {
      cardBlob = null
    }
  }

  const prepared = await prepareGalleryCoverUpload({
    contentType: uploadFile.type,
    fileSize: uploadFile.size,
    includeCard: Boolean(cardBlob),
  })

  await putToPresignedUrl(prepared.uploadUrl, uploadFile)

  if (cardBlob && 'cardUploadUrl' in prepared && prepared.cardUploadUrl) {
    await putToPresignedUrl(prepared.cardUploadUrl, cardBlob)
  }

  return prepared.path
}
