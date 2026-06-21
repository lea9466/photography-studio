import type { GalleryStatus, GalleryType } from '@/lib/types/database.types'

export const GALLERY_STATUS_LABELS: Record<GalleryStatus, string> = {
  draft: 'טיוטה',
  selection: 'בחירה',
  editing: 'עיבוד',
  delivery_ready: 'מוכן למסירה',
  locked: 'ארכיב',
}

export const GALLERY_TYPE_LABELS: Record<GalleryType, string> = {
  selection: 'בחירה',
  delivery: 'מסירה',
  portfolio: 'תיק עבודות',
}

export type GalleryListItem = {
  id: string
  title: string
  status: GalleryStatus
  gallery_type: GalleryType
  created_at: string
  client_name: string | null
  photo_count: number
}

export type GalleryStatusFilter = GalleryStatus | 'all'
