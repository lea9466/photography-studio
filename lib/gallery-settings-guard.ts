/**
 * Defense-in-depth for the single gallery-settings write path
 * (updateGallerySettings). A showcase (portfolio) gallery and a client
 * (selection) gallery have disjoint editable fields — see lib/gallery-kind.ts.
 * The two edit forms already send only their own kind's fields, but this guard
 * makes it structurally impossible for any caller (a future form, a script, a
 * crafted request) to push a field that doesn't belong to the gallery's kind.
 *
 * `is_public` is deliberately NOT checked here — it has its own dedicated guard
 * in updateGallerySettings (rejects toggling it for non-portfolio galleries).
 */

type GallerySettingsInput = {
  password?: unknown
  expiresAt?: unknown
  maxAlbumSelection?: unknown
  maxEditSelection?: unknown
  allowDownloadPreview?: unknown
  allowDownloadOriginal?: unknown
  coverImage?: unknown
}

/** Fields only a private client gallery has. */
const CLIENT_ONLY_FIELDS = [
  'password',
  'expiresAt',
  'maxAlbumSelection',
  'maxEditSelection',
  'allowDownloadPreview',
  'allowDownloadOriginal',
] as const

export function assertSettingsInputAllowedForType(
  galleryType: string | null | undefined,
  input: GallerySettingsInput
): void {
  const isShowcase = galleryType === 'portfolio'

  if (isShowcase) {
    const offending = CLIENT_ONLY_FIELDS.find((field) => input[field] !== undefined)
    if (offending) {
      throw new Error('לא ניתן לערוך הגדרות של גלריית לקוח בגלריה ציבורית')
    }
    return
  }

  if (input.coverImage !== undefined) {
    throw new Error('תמונת שער זמינה רק לגלריה ציבורית')
  }
}
