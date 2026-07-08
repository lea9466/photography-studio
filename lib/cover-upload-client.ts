import { compressBrandingFile } from '@/lib/branding-upload-client'
import { prepareGalleryCoverUpload } from '@/lib/actions/gallery.actions'
import { putToPresignedUrl } from '@/lib/r2/upload-client'

export async function uploadGalleryCoverFile(file: File): Promise<string> {
  const uploadFile = await compressBrandingFile(file)
  const { uploadUrl, path } = await prepareGalleryCoverUpload({
    contentType: uploadFile.type,
    fileSize: uploadFile.size,
  })

  await putToPresignedUrl(uploadUrl, uploadFile)

  return path
}
