/**
 * The cover image of a private client gallery is a separate upload (not one of
 * the gallery's photos). It is stored in the `previews` bucket under the
 * gallery's own prefix — `<userId>/<galleryId>/cover-<timestamp>.jpg` — because
 * the gallery-media-guard Worker gates everything under that prefix on the
 * gallery's session cookie (see workers/gallery-media-guard/worker.js). The
 * `branding` bucket is served without any check and must never hold a client's
 * cover. The lifecycle sweep (delete-client-gallery.ts) removes the whole
 * prefix, so the cover goes away with the gallery.
 */

/** Longest edge of the stored cover — big enough for a hero, too small to print. */
export const CLIENT_COVER_MAX_DIMENSION = 1600

/** Ceiling on the stored (already compressed) cover, enforced when the upload is requested. */
export const CLIENT_COVER_MAX_BYTES = 2 * 1024 * 1024

/** Ceiling on the raw file picked in the browser, before it is compressed. */
export const CLIENT_COVER_MAX_SOURCE_BYTES = 30 * 1024 * 1024

export const CLIENT_COVER_SOURCE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const COVER_FILENAME_PATTERN = /^cover-\d{10,16}\.jpg$/

/** Message for a picked file that can't be used as a cover, or null when it's fine. */
export function validateCoverSourceFile(file: { type: string; size: number }): string | null {
  if (!(CLIENT_COVER_SOURCE_TYPES as readonly string[]).includes(file.type)) {
    return 'יש לבחור תמונה בפורמט JPG, PNG או WebP'
  }
  if (file.size > CLIENT_COVER_MAX_SOURCE_BYTES) {
    return 'התמונה גדולה מדי — הגבלה של 30MB'
  }
  return null
}

export function clientCoverPrefix(userId: string, galleryId: string) {
  return `${userId}/${galleryId}/`
}

export function buildClientCoverPath(userId: string, galleryId: string, now = Date.now()) {
  return `${clientCoverPrefix(userId, galleryId)}cover-${now}.jpg`
}

/**
 * True only for a cover path that sits inside this gallery's own prefix with
 * the exact generated filename shape — anything else (a legacy value, a path
 * pointing into another gallery) is not a cover we will sign or delete.
 */
export function isClientCoverPath(
  path: string | null | undefined,
  userId: string,
  galleryId: string
): path is string {
  if (!path) return false
  const prefix = clientCoverPrefix(userId, galleryId)
  return path.startsWith(prefix) && COVER_FILENAME_PATTERN.test(path.slice(prefix.length))
}
