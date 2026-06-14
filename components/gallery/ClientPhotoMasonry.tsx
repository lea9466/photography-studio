'use client'

import Image from 'next/image'
import { SelectionToggle } from '@/components/gallery/SelectionToggle'

type ClientPhotoMasonryProps = {
  photos: Array<{
    id: string
    src: string | null
    selected_album: boolean
    selected_edit: boolean
  }>
  canSelect: boolean
  onOpen: (index: number) => void
  onToggleAlbum: (id: string) => void
  onToggleEdit: (id: string) => void
  getGlobalIndex: (id: string) => number
}

export function ClientPhotoMasonry({
  photos,
  canSelect,
  onOpen,
  onToggleAlbum,
  onToggleEdit,
  getGlobalIndex,
}: ClientPhotoMasonryProps) {
  return (
    <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative mb-3 break-inside-avoid overflow-hidden rounded-none animate-float-up"
        >
          <button
            type="button"
            className="relative block w-full"
            onClick={() => onOpen(getGlobalIndex(photo.id))}
          >
            {photo.src ? (
              <Image
                src={photo.src}
                alt=""
                width={800}
                height={1200}
                className="h-auto w-full rounded-none transition-transform group-hover:scale-[1.01]"
                sizes="(max-width: 1024px) 50vw, 33vw"
              />
            ) : null}
          </button>

          {canSelect ? (
            <div
              className={`absolute inset-x-0 bottom-0 flex justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 transition-opacity ${
                photo.selected_album || photo.selected_edit
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <SelectionToggle
                type="album"
                selected={photo.selected_album}
                onClick={() => onToggleAlbum(photo.id)}
              />
              <SelectionToggle
                type="edit"
                selected={photo.selected_edit}
                onClick={() => onToggleEdit(photo.id)}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
