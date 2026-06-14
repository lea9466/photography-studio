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

export function validateSelectionLimits(
  selections: Pick<SelectionItem, 'selected_album' | 'selected_edit'>[],
  maxAlbum?: number | null,
  maxEdit?: number | null
) {
  const albumCount = countSelections(selections, 'selected_album')
  const editCount = countSelections(selections, 'selected_edit')

  if (maxAlbum != null && albumCount > maxAlbum) {
    throw new Error('הגעת למקסימום הבחירות לאלבום')
  }
  if (maxEdit != null && editCount > maxEdit) {
    throw new Error('הגעת למקסימום הבחירות לעיבוד')
  }
}

export function selectionStorageKey(galleryId: string) {
  return `gallery-selections-${galleryId}`
}
