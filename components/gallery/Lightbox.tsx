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

type LightboxProps = {
  photos: ClientGalleryPhoto[]
  index: number
  open: boolean
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
  onOpenChange,
  onNavigate,
  canSelect,
  isLimitedQuality = false,
  onToggleAlbum,
  onToggleEdit,
}: LightboxProps) {
  const photo = photos[index]
  if (!photo) return null

  const src = photo.lightbox_signed_url ?? photo.preview_signed_url

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black"
        className="max-h-[96vh] w-[calc(100%-1rem)] max-w-7xl overflow-hidden border-none bg-black p-0 [&>button]:text-white [&>button]:hover:text-white/80"
      >
        <DialogTitle className="sr-only">
          תמונה {index + 1} מתוך {photos.length}
        </DialogTitle>
        <div className="relative flex min-h-[82vh] flex-col">
          <div className="relative min-h-[72vh] flex-1 bg-black">
            {isLimitedQuality ? (
              <p className="absolute start-4 top-4 z-10 rounded-none border border-white/20 bg-black/80 px-2.5 py-1 text-xs text-white/80">
                תצוגה מקדימה · איכות מוגבלת
              </p>
            ) : null}
            {src ? (
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                className="object-contain"
                sizes="100vw"
                priority
              />
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
