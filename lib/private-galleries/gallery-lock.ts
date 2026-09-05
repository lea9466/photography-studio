/**
 * Client galleries are "one-time use" (docs/private-gallery-lifecycle-plan.md §1.א):
 * the first send (see sendGallery) stamps `galleries.photos_locked_at`, and from
 * that moment the source album is frozen — the photographer can no longer add,
 * delete or replace album photos, only upload edited deliverables (the
 * `is_processed` photos / `edited_photos` — same delivery job).
 *
 * Showcase (portfolio) galleries are never frozen, and a client gallery that
 * has not been sent yet (photos_locked_at is null) stays fully editable.
 */

export const CLIENT_ALBUM_LOCKED_MESSAGE =
  'הגלריה נשלחה ללקוח — לא ניתן להוסיף, למחוק או להחליף תמונות באלבום. ניתן עדיין להעלות תמונות מעובדות.'

type GalleryLockShape = {
  gallery_type?: string | null
  photos_locked_at?: string | null
}

/** True once a client gallery's source album has been frozen by its first send. */
export function isClientAlbumFrozen(gallery: GalleryLockShape): boolean {
  return gallery.gallery_type === 'selection' && Boolean(gallery.photos_locked_at)
}

/**
 * Guard for actions that add or remove *album* photos (regular, not
 * `is_processed`). No-op for showcase galleries and for client galleries that
 * haven't been sent yet.
 */
export function assertClientAlbumEditable(gallery: GalleryLockShape): void {
  if (isClientAlbumFrozen(gallery)) {
    throw new Error(CLIENT_ALBUM_LOCKED_MESSAGE)
  }
}
