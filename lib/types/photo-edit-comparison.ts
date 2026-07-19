export type PhotoEditDisplayStyle = 'development' | 'reveal'

export type PhotoEditComparison = {
  id: string
  /** Photographer / studio owner id (DB column: user_id) */
  studioId: string
  title: string | null
  description: string | null
  /** R2 path in `previews` bucket */
  originalImageUrl: string
  /** R2 path in `watermarked` bucket */
  originalWatermarkedUrl: string
  /** R2 path in `previews` bucket */
  editedImageUrl: string
  /** R2 path in `watermarked` bucket */
  editedWatermarkedUrl: string
  autoApplyWatermark: boolean
  watermarkText: string | null
  displayStyle: PhotoEditDisplayStyle
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PhotoEditComparisonRow = {
  id: string
  user_id: string
  title: string | null
  description: string | null
  original_image_url: string
  original_watermarked_url: string
  edited_image_url: string
  edited_watermarked_url: string
  auto_apply_watermark: boolean
  watermark_text: string | null
  display_style: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
