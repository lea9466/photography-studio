'use client'

import { useState } from 'react'
import type { ImagesRow } from '@/lib/database.types'
import { resolveGalleryMediaUrls } from '@/lib/gallery-media-urls'
import {
  mediaMasonrySrcSet,
  mediaMasonryUrl,
  pickGridMediaUrl,
} from '@/lib/media-urls'
import { useIncrementalReveal } from '@/lib/useIncrementalReveal'

const CLIENT_SELECTION_TYPES = new Set(['album', 'edit'])

const MASONRY_SIZES =
  '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw'

function BookIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  )
}

function PencilIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  )
}

function SelectionMasonryImage({
  thumbnailUrl,
  imageUrl,
  index,
}: {
  thumbnailUrl: string | null | undefined
  imageUrl: string | null | undefined
  index: number
}) {
  const raw = pickGridMediaUrl(thumbnailUrl, imageUrl)
  const fallback = (imageUrl || thumbnailUrl)?.trim() || ''
  const masonrySrc = mediaMasonryUrl(raw)
  const srcSet = mediaMasonrySrcSet(raw)
  const [src, setSrc] = useState(masonrySrc)

  if (!masonrySrc) return null

  const eager = index < 6

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? MASONRY_SIZES : undefined}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={index < 4 ? 'high' : 'low'}
      className="block h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
      onError={() => {
        if (fallback && src !== fallback) setSrc(fallback)
      }}
    />
  )
}

export default function AdminClientSelectionsGrid({
  albumId,
  photographerId,
  images,
  selectionsByImage,
}: {
  albumId: string
  photographerId?: string | null
  images: ImagesRow[]
  selectionsByImage: Record<string, string[]>
}) {
  const selectedImages = images.filter((img) => {
    if (img.status === 'deleting' || img.status === 'pending') return false
    const types = selectionsByImage[img.id] ?? []
    return types.some((type) => CLIENT_SELECTION_TYPES.has(type))
  })

  const { count, sentinelRef } = useIncrementalReveal(selectedImages.length)

  if (selectedImages.length === 0) return null

  return (
    <section className="space-y-4 border-b border-border/60 pb-8">
      <div className="space-y-1">
        <h3 className="text-base font-medium text-foreground">בחירות הלקוח</h3>
        <p className="text-sm text-muted-foreground">
          {selectedImages.length.toLocaleString('he-IL')} תמונות — עד 3 בעמודה,
          בפרופורציה המקורית. ריחוף מציג את סוג הבחירה.
        </p>
      </div>

      <div className="gallery-grid columns-1 gap-x-0 [column-fill:balance] sm:columns-2 sm:gap-x-4 md:columns-3 md:gap-x-5">
        {selectedImages.slice(0, count).map((img, index) => {
          const media = resolveGalleryMediaUrls(albumId, img, photographerId)
          const types = (selectionsByImage[img.id] ?? []).filter((type) =>
            CLIENT_SELECTION_TYPES.has(type)
          )
          const albumOn = types.includes('album')
          const editOn = types.includes('edit')

          return (
            <figure
              key={img.id}
              className="group mb-4 inline-block w-full break-inside-avoid sm:mb-5"
            >
              <div className="gallery-photo-frame relative block w-full overflow-hidden bg-muted ring-1 ring-border/40 transition-all duration-500 hover:ring-border">
                <SelectionMasonryImage
                  thumbnailUrl={media.thumb}
                  imageUrl={media.preview}
                  index={index}
                />
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                >
                  {albumOn ? (
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm"
                      title="לאלבום"
                    >
                      <BookIcon />
                    </span>
                  ) : null}
                  {editOn ? (
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-emerald-700 shadow-sm"
                      title="לעיבוד"
                    >
                      <PencilIcon />
                    </span>
                  ) : null}
                </div>
              </div>
            </figure>
          )
        })}
      </div>

      {count < selectedImages.length ? (
        <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
      ) : null}
    </section>
  )
}
