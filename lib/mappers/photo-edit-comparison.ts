import type {
  PhotoEditComparison,
  PhotoEditComparisonRow,
  PhotoEditDisplayStyle,
} from '@/lib/types/photo-edit-comparison'

function asDisplayStyle(value: string | null | undefined): PhotoEditDisplayStyle {
  return value === 'reveal' ? 'reveal' : 'development'
}

export function mapPhotoEditComparisonRow(row: PhotoEditComparisonRow): PhotoEditComparison {
  return {
    id: row.id,
    studioId: row.user_id,
    title: row.title,
    description: row.description,
    originalImageUrl: row.original_image_url,
    originalWatermarkedUrl: row.original_watermarked_url,
    editedImageUrl: row.edited_image_url,
    editedWatermarkedUrl: row.edited_watermarked_url,
    autoApplyWatermark: row.auto_apply_watermark ?? true,
    watermarkText: row.watermark_text ?? null,
    displayStyle: asDisplayStyle(row.display_style),
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapPhotoEditComparisonRows(
  rows: PhotoEditComparisonRow[] | null | undefined
): PhotoEditComparison[] {
  return (rows ?? []).map(mapPhotoEditComparisonRow)
}
