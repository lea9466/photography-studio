export type SelectionField = 'selected_album' | 'selected_edit'

export type SelectionItem = {
  id?: string
  selected_album: boolean
  selected_edit: boolean
}

export type ClientSelectionPayload = {
  photoId: string
  selected_album: boolean
  selected_edit: boolean
}

export function countSelections(
  items: Pick<SelectionItem, 'selected_album' | 'selected_edit'>[],
  field: SelectionField
) {
  return items.filter((item) => item[field]).length
}

export function canToggleSelection(
  items: (SelectionItem & { id?: string })[],
  photoId: string,
  field: SelectionField,
  maxAlbum?: number | null,
  maxEdit?: number | null
): boolean {
  const photo = items.find((item) => item.id === photoId)
  if (!photo) return false

  const nextValue = !photo[field]
  if (!nextValue) return true

  const max = field === 'selected_album' ? maxAlbum : maxEdit
  if (max == null) return true

  return countSelections(items, field) < max
}

/**
 * Returns a client-facing error message when the selection exceeds a limit,
 * or null when it's within bounds. Returns (rather than throws) so a Server
 * Action can forward the message to the browser — Next.js replaces thrown
 * error messages with a generic string in production.
 */
export function checkSelectionLimits(
  selections: Pick<SelectionItem, 'selected_album' | 'selected_edit'>[],
  maxAlbum?: number | null,
  maxEdit?: number | null
): string | null {
  const albumCount = countSelections(selections, 'selected_album')
  const editCount = countSelections(selections, 'selected_edit')

  if (maxAlbum != null && albumCount > maxAlbum) {
    return `בחרת ${albumCount} תמונות לאלבום — המקסימום הוא ${maxAlbum}`
  }
  if (maxEdit != null && editCount > maxEdit) {
    return `בחרת ${editCount} תמונות לעיבוד — המקסימום הוא ${maxEdit}`
  }
  return null
}

export function selectionStorageKey(galleryId: string) {
  return `gallery-selections-${galleryId}`
}
