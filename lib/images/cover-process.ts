export const COVER_STORAGE_PREFIX = 'gallery_cover_v2_'

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

export function deriveCoverCardStoragePath(coverPath: string): string | null {
  const normalized = coverPath.replace(/^branding\//, '').trim()
  if (!normalized.includes(COVER_STORAGE_PREFIX)) return null
  if (normalized.includes('_card.')) return normalized

  const dot = normalized.lastIndexOf('.')
  if (dot === -1) return null

  // Card variants are always JPEG previews, regardless of the original format.
  return `${normalized.slice(0, dot)}_card.jpg`
}

/** Possible legacy original paths for a display-only _card file. */
export function deriveLegacyCoverOriginalCandidates(cardPath: string): string[] {
  const normalized = cardPath.replace(/^branding\//, '').trim()
  if (!normalized.includes(COVER_STORAGE_PREFIX) || !normalized.endsWith('_card.jpg')) {
    return []
  }

  const base = normalized.slice(0, -'_card.jpg'.length)
  return ['jpg', 'png', 'webp'].map((ext) => `${base}.${ext}`)
}

export function buildCoverStoragePath(userId: string, timestamp: number, contentType: string) {
  const ext = EXT_BY_CONTENT_TYPE[contentType] ?? 'jpg'
  return `${userId}/${COVER_STORAGE_PREFIX}${timestamp}.${ext}`
}

export function normalizeGalleryCoverStoragePath(coverImage: string): string | null {
  const trimmed = coverImage.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return null
  if (trimmed.startsWith('cover-images/')) return null
  if (trimmed.includes('_card.')) return null

  const path = trimmed.replace(/^branding\//, '')
  if (!path.includes(COVER_STORAGE_PREFIX)) return null
  if (path.toLowerCase().endsWith('.svg')) return null

  return path
}

export function isGalleryCoverCardPath(coverImage: string): boolean {
  const normalized = coverImage.replace(/^branding\//, '').trim()
  return normalized.includes(COVER_STORAGE_PREFIX) && normalized.includes('_card.')
}

export function isLegacyGalleryCoverOriginalPath(coverImage: string): boolean {
  return normalizeGalleryCoverStoragePath(coverImage) !== null
}
