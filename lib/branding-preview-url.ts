export function extractBrandingStoragePath(pathOrUrl: string): string | null {
  const trimmed = pathOrUrl.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const match = trimmed.match(/\/branding\/([^?]+)/)
    return match?.[1] ?? null
  }

  return trimmed.replace(/^branding\//, '')
}

export function getBrandingPreviewUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl?.trim()) return null

  const trimmed = pathOrUrl.trim()
  if (trimmed.startsWith('/api/gallery-media')) return trimmed

  const storagePath = extractBrandingStoragePath(trimmed)
  if (storagePath) {
    return `/api/gallery-media?key=${encodeURIComponent(`branding/${storagePath}`)}`
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed
  }

  return `/api/gallery-media?key=${encodeURIComponent(`branding/${trimmed}`)}`
}
