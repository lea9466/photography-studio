import imageCompression from 'browser-image-compression'
import { compressBrandingFile } from '@/lib/branding-upload-client'
import { prepareGalleryCoverUpload } from '@/lib/actions/gallery.actions'
import { COVER_CARD_COMPRESSION_OPTIONS } from '@/lib/images/cover-card'
import { putToPresignedUrl } from '@/lib/r2/upload-client'

async function compressGalleryCoverCard(file: File): Promise<Blob> {
  return imageCompression(file, COVER_CARD_COMPRESSION_OPTIONS)
}

/**
 * Display-only cover upload: stores only the 1200px _card preview in R2.
 * SVG covers still upload a single branding asset (no raster card variant).
 */
export async function uploadGalleryCoverFile(file: File): Promise<string> {
  if (file.type === 'image/svg+xml') {
    const uploadFile = await compressBrandingFile(file)
    const prepared = await prepareGalleryCoverUpload({
      contentType: uploadFile.type,
      fileSize: uploadFile.size,
    })
    await putToPresignedUrl(prepared.uploadUrl, uploadFile)
    return prepared.path
  }

  const cardBlob = await compressGalleryCoverCard(file)
  const prepared = await prepareGalleryCoverUpload({
    contentType: 'image/jpeg',
    fileSize: cardBlob.size,
    displayOnly: true,
  })

  await putToPresignedUrl(prepared.uploadUrl, cardBlob)
  return prepared.path
}
