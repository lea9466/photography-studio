'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, Loader2 } from 'lucide-react'
import { PhotoCard } from '@/components/gallery/PhotoCard'
import type { Photo } from '@/lib/types/database.types'

export type PendingGalleryPhoto = {
  id: string
  previewUrl: string
  status: 'queued' | 'uploading' | 'uploaded' | 'registering' | 'failed'
}

type GalleryGridProps = {
  photos: Photo[]
  signedUrls: Record<string, string>
  showActions?: boolean
  pendingPhotos?: PendingGalleryPhoto[]
  selectedIds?: Set<string>
  onToggleSelect?: (photoId: string) => void
}

function PendingPhotoCard({ photo }: { photo: PendingGalleryPhoto }) {
  const statusLabel =
    photo.status === 'queued' || photo.status === 'uploading'
      ? 'מעלה...'
      : photo.status === 'uploaded'
        ? 'הועלה'
        : photo.status === 'registering'
          ? 'שומר...'
          : 'נכשל'

  return (
    <div className="relative overflow-hidden rounded-xl border border-[--border] bg-[--background] animate-float-up">
      <div className="relative aspect-square">
        {photo.previewUrl ? (
          <Image
            src={photo.previewUrl}
            alt=""
            fill
            unoptimized
            className={`object-cover transition-opacity ${
              photo.status === 'failed' ? 'opacity-40' : 'opacity-100'
            }`}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : null}
        {photo.status !== 'uploaded' && photo.status !== 'failed' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[--foreground]/30">
            <Loader2 className="h-8 w-8 animate-spin text-[--background]" />
          </div>
        ) : null}
        {photo.status === 'uploaded' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[--foreground]/20">
            <Check className="h-8 w-8 text-[--background]" />
          </div>
        ) : null}
      </div>
      <p className="px-2 py-1.5 text-center text-xs text-[--muted]">{statusLabel}</p>
    </div>
  )
}

export function GalleryGrid({
  photos,
  signedUrls,
  showActions = true,
  pendingPhotos = [],
  selectedIds,
  onToggleSelect,
}: GalleryGridProps) {
  const [removed, setRemoved] = useState<Set<string>>(new Set())

  const visible = useMemo(
    () => photos.filter((p) => !removed.has(p.id)),
    [photos, removed]
  )

  const visiblePending = useMemo(
    () =>
      pendingPhotos.filter(
        (photo) =>
          photo.status !== 'failed' && !visible.some((p) => p.id === photo.id)
      ),
    [pendingPhotos, visible]
  )

  if (visible.length === 0 && visiblePending.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[--muted]">
        אין תמונות עדיין — העלי תמונות למעלה
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {visiblePending.map((photo) => (
        <PendingPhotoCard key={photo.id} photo={photo} />
      ))}
      {visible.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          previewUrl={
            photo.preview_url ? signedUrls[photo.preview_url] : null
          }
          showActions={showActions}
          selected={selectedIds?.has(photo.id)}
          onToggleSelect={
            onToggleSelect ? () => onToggleSelect(photo.id) : undefined
          }
          onDelete={() =>
            setRemoved((prev) => new Set(prev).add(photo.id))
          }
        />
      ))}
    </div>
  )
}
