/**
 * Pure gallery access decision — used by getClientGallery and unit tests.
 * UUID alone is never authorization.
 */

export type GalleryAccessMode = 'public' | 'session'

export function resolveGalleryAccessMode(input: {
  isPublic: boolean
  hasSessionForGallery: boolean
}): GalleryAccessMode | null {
  if (input.isPublic) return 'public'
  if (input.hasSessionForGallery) return 'session'
  return null
}
