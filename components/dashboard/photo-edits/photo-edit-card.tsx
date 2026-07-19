'use client'

import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { getPhotoEditDisplayPreviewUrl } from '@/lib/photo-edit-image-url'
import type { PhotoEditComparison } from '@/lib/types/photo-edit-comparison'

type PhotoEditCardProps = {
  item: PhotoEditComparison
  signedUrls?: Record<string, string>
  disabled?: boolean
  onEdit: (item: PhotoEditComparison) => void
  onDelete: (item: PhotoEditComparison) => void
  onToggleActive: (item: PhotoEditComparison, isActive: boolean) => void
}

function Thumb({ src, label }: { src: string | null; label: string }) {
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-[--border] bg-[--dashboard-surface]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-[--muted]">
          אין תמונה
        </div>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-center text-[10px] text-white">
        {label}
      </span>
    </div>
  )
}

export function PhotoEditCard({
  item,
  signedUrls,
  disabled,
  onEdit,
  onDelete,
  onToggleActive,
}: PhotoEditCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  const originalSrc = getPhotoEditDisplayPreviewUrl({
    previewPath: item.originalImageUrl,
    watermarkedPath: item.originalWatermarkedUrl,
    autoApplyWatermark: item.autoApplyWatermark,
    signedUrls,
  })
  const editedSrc = getPhotoEditDisplayPreviewUrl({
    previewPath: item.editedImageUrl,
    watermarkedPath: item.editedWatermarkedUrl,
    autoApplyWatermark: item.autoApplyWatermark,
    signedUrls,
  })
  const descriptionPreview = item.description
    ? item.description.length > 90
      ? `${item.description.slice(0, 90)}…`
      : item.description
    : null

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4 md:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <button
          type="button"
          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[--muted] hover:bg-[--muted]/15 hover:text-[--foreground] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] disabled:opacity-50"
          aria-label="שינוי סדר"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex gap-2">
          <Thumb src={originalSrc} label="מקור" />
          <Thumb src={editedSrc} label="מעובד" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {item.title ? (
              <h3 className="font-semibold text-[--foreground]">{item.title}</h3>
            ) : (
              <h3 className="font-medium text-[--muted]">ללא כותרת</h3>
            )}
            <Badge variant={item.isActive ? 'default' : 'outline'}>
              {item.isActive ? 'פעיל' : 'מוסתר'}
            </Badge>
            <Badge variant="outline">
              {item.displayStyle === 'development' ? 'פיתוח תמונה' : 'חשיפה'}
            </Badge>
          </div>
          {descriptionPreview ? (
            <p className="text-sm leading-relaxed text-[--muted]">{descriptionPreview}</p>
          ) : null}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-sm text-[--muted]">
              {item.isActive ? 'מוצג באתר' : 'מוסתר מהאתר'}
            </span>
            <Switch
              checked={item.isActive}
              disabled={disabled}
              onCheckedChange={(checked) => onToggleActive(item, checked)}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-1 self-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onEdit(item)}
            aria-label="עריכה"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onDelete(item)}
            aria-label="מחיקה"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
