export const MAX_CLIENT_BULK_DOWNLOAD = 200

export function buildClientBulkDownloadUrl(
  albumId: string,
  imageIds: string[],
  options?: { token?: string; compressed?: boolean }
): string {
  const unique = [...new Set(imageIds.map((id) => id.trim()).filter(Boolean))]
  const params = new URLSearchParams()
  if (options?.token?.trim()) {
    params.set('token', options.token.trim())
  } else {
    params.set('album', albumId)
  }
  params.set('ids', unique.join(','))
  if (options?.compressed) params.set('quality', 'compressed')
  return `/api/album-images-download?${params}`
}
