'use client'

import Image from 'next/image'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { deletePhoto, togglePhotoVisibility } from '@/lib/actions/photo.actions'
import type { Photo } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type PhotoCardProps = {
  photo: Photo
  previewUrl?: string | null
  onDelete?: () => void
  showActions?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

export function PhotoCard({
  photo,
  previewUrl,
  onDelete,
  showActions = true,
  selected = false,
  onToggleSelect,
}: PhotoCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleToggleVisibility() {
    startTransition(async () => {
      try {
        await togglePhotoVisibility(photo.id, !photo.is_visible_to_client)
        toast.success(
          photo.is_visible_to_client ? 'הוסתר מהלקוח' : 'גלוי ללקוח'
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deletePhoto(photo.id)
        toast.success('התמונה נמחקה')
        onDelete?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-[--background] animate-float-up ${
        selected ? 'border-[--accent] ring-2 ring-[--accent]/30' : 'border-[--border]'
      }`}
    >
      {onToggleSelect ? (
        <button
          type="button"
          className="absolute start-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-[--border] bg-[--background]/90 text-xs font-medium shadow-sm"
          onClick={onToggleSelect}
          aria-label={selected ? 'בטל בחירה' : 'בחר תמונה'}
        >
          {selected ? '✓' : ''}
        </button>
      ) : null}
      <div className="relative aspect-square">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[--muted]">
            אין תצוגה
          </div>
        )}
      </div>

      {showActions ? (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-[--foreground]/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex gap-1">
            <Badge variant="muted">
              {photo.is_visible_to_client ? 'גלוי' : 'מוסתר'}
            </Badge>
            <Badge variant={photo.is_processed ? 'default' : 'muted'}>
              {photo.is_processed ? 'מעובד' : 'רגיל'}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-[--background]"
              disabled={isPending}
              onClick={handleToggleVisibility}
              aria-label="הצג/הסתר"
            >
              {photo.is_visible_to_client ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-[--background]"
              disabled={isPending}
              onClick={handleDelete}
              aria-label="מחק"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
