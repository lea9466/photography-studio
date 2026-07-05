import imageCompression from 'browser-image-compression'

/** Light compression — only for very large files; preserves quality for hero/cover/branding. */
export async function compressBrandingFile(file: File): Promise<File> {
  if (file.type === 'image/svg+xml') return file
  // Keep originals up to 8 MB at full resolution
  if (file.size <= 8 * 1024 * 1024) return file

  try {
    return await imageCompression(file, {
      maxSizeMB: 12,
      maxWidthOrHeight: 4096,
      useWebWorker: true,
      initialQuality: 0.92,
      fileType: file.type,
    })
  } catch {
    return file
  }
}
