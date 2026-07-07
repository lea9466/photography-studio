'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SelectionToggle } from '@/components/gallery/SelectionToggle'
import type { ClientGalleryPhoto } from '@/lib/actions/client-gallery.actions'

const LIGHTBOX_MAX_WIDTH = 1920

type LightboxProps = {
  photos: ClientGalleryPhoto[]
  index: number
  open: boolean
  activeSrc?: string | null
  onOpenChange: (open: boolean) => void
  onNavigate: (index: number) => void
  canSelect: boolean
  isLimitedQuality?: boolean
  onToggleAlbum: (photoId: string) => void
  onToggleEdit: (photoId: string) => void
}

export function Lightbox({
  photos,
  index,
  open,
  activeSrc,
  onOpenChange,
  onNavigate,
  canSelect,
  isLimitedQuality = false,
  onToggleAlbum,
  onToggleEdit,
}: LightboxProps) {
  const photo = photos[index]
  if (!photo) return null

  const src =
    activeSrc ?? photo.lightbox_signed_url ?? photo.preview_signed_url

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/95"
        className="flex max-h-[98vh] w-[calc(100%-1rem)] max-w-[min(1920px,calc(100vw-1rem))] flex-col overflow-hidden border-none bg-black p-0 [&>button]:text-white [&>button]:hover:text-white/80"
      >
        <DialogTitle className="sr-only">
          תמונה {index + 1} מתוך {photos.length}
        </DialogTitle>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black px-2 py-2 sm:px-4">
            {isLimitedQuality ? (
              <p className="absolute start-4 top-4 z-10 rounded-none border border-white/20 bg-black/80 px-2.5 py-1 text-xs text-white/80">
                תצוגה מקדימה · איכות מוגבלת
              </p>
            ) : null}
            {src ? (
              <div className="relative h-[min(88vh,calc(100vw-2rem))] w-full max-w-[1920px]">
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-contain"
                  sizes={`(max-width: 768px) 100vw, ${LIGHTBOX_MAX_WIDTH}px`}
                  quality={90}
                  priority
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black px-4 py-2.5">
            <Button
              variant="outline"
              size="icon"
              disabled={index === 0}
              onClick={() => onNavigate(index - 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {canSelect ? (
              <div className="flex gap-4">
                <SelectionToggle
                  type="album"
                  selected={photo.selected_album}
                  onClick={() => onToggleAlbum(photo.id)}
                  showLabel
                  size="lg"
                />
                <SelectionToggle
                  type="edit"
                  selected={photo.selected_edit}
                  onClick={() => onToggleEdit(photo.id)}
                  showLabel
                  size="lg"
                />
              </div>
            ) : (
              <span className="text-sm text-white/70">
                {index + 1} / {photos.length}
              </span>
            )}

            <Button
              variant="outline"
              size="icon"
              disabled={index >= photos.length - 1}
              onClick={() => onNavigate(index + 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
