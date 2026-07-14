export function extractBrandingStoragePath(pathOrUrl: string): string | null {
  const trimmed = pathOrUrl.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const match = trimmed.match(/\/branding\/([^?]+)/)
    return match?.[1] ?? null
  }

  return trimmed.replace(/^branding\//, '')
}

/**
 * Guards branding-image fields (hero/about/contact/packages/logo urls in
 * branding.actions.ts + feedback.actions.ts) against one user pointing at
 * ANOTHER user's already-uploaded branding asset.
 *
 * Deliberately NOT a blanket "must start with userId/" check: the dashboard
 * (BrandingEditForm.tsx) has a genuine, long-standing feature letting a
 * photographer paste an arbitrary external image URL (placeholder
 * "https://...") for hero/about images, not just their own uploads — that
 * must keep working unchanged. So:
 *   - A bare internal path (whatever finalizeBrandingUpload/
 *     prepareBrandingUpload hand back, e.g. "{userId}/hero_desktop_1_...jpg")
 *     must always be owned by the caller.
 *   - A URL that happens to embed a "/branding/{path}" segment (i.e. it
 *     points at this app's own branding storage/CDN, possibly under
 *     someone else's id) is resolved to that embedded path and the SAME
 *     ownership check applies.
 *   - A genuine external URL with no "/branding/" segment (e.g. an
 *     unsplash.com link) has no ownership concept and is left untouched.
 */
export function assertOwnedBrandingRef(userId: string, value: string | null | undefined) {
  if (!value?.trim()) return
  const trimmed = value.trim()
  const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')

  if (isUrl) {
    const embeddedPath = extractBrandingStoragePath(trimmed)
    if (embeddedPath === null) return // no /branding/ segment — genuine external image URL
    if (!embeddedPath.startsWith(`${userId}/`)) {
      throw new Error('נתיב קובץ לא תקין')
    }
    return
  }

  const storagePath = extractBrandingStoragePath(trimmed)
  if (!storagePath || !storagePath.startsWith(`${userId}/`)) {
    throw new Error('נתיב קובץ לא תקין')
  }
}

export function getBrandingPreviewUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl?.trim()) return null

  const trimmed = pathOrUrl.trim()
  if (trimmed.startsWith('blob:')) return trimmed
  if (trimmed.startsWith('/api/gallery-media')) return trimmed

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const storagePath = extractBrandingStoragePath(trimmed)
    if (storagePath) {
      return `/api/gallery-media?key=${encodeURIComponent(`branding/${storagePath}`)}`
    }
    return trimmed
  }

  const storagePath = extractBrandingStoragePath(trimmed)
  if (storagePath) {
    return `/api/gallery-media?key=${encodeURIComponent(`branding/${storagePath}`)}`
  }

  return `/api/gallery-media?key=${encodeURIComponent(`branding/${trimmed}`)}`
}
