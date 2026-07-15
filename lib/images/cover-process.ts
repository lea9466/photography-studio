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

export function buildCoverStoragePath(userId: string, timestamp: number, contentType: string) {
  const ext = EXT_BY_CONTENT_TYPE[contentType] ?? 'jpg'
  return `${userId}/${COVER_STORAGE_PREFIX}${timestamp}.${ext}`
}
