'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  mediaMasonrySrcSet,
  mediaMasonryUrl,
  mediaOriginalUrl,
} from '@/lib/media-urls'
import { useIncrementalReveal } from '@/lib/useIncrementalReveal'

export type GalleryPhoto = {
  id: string
  src: string
  thumb?: string
  /** URL מקורי HD להורדה (ללא טרנספורמציות) */
  downloadSrc?: string
}

const MASONRY_SIZES =
  '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw'

export default function GalleryLightbox({
  photos,
  title,
}: {
  photos: GalleryPhoto[]
  title: string
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { count, sentinelRef } = useIncrementalReveal(photos.length)

  const close = useCallback(() => setOpenIndex(null), [])

  const goNext = useCallback(() => {
    setOpenIndex((current) =>
      current === null ? current : (current + 1) % photos.length
    )
  }, [photos.length])

  const goPrev = useCallback(() => {
    setOpenIndex((current) =>
      current === null
        ? current
        : (current - 1 + photos.length) % photos.length
    )
  }, [photos.length])

  useEffect(() => {
    if (openIndex === null) return

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
      else if (event.key === 'ArrowRight') goPrev()
      else if (event.key === 'ArrowLeft') goNext()
    }

    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [openIndex, close, goNext, goPrev])

  const active = openIndex === null ? null : photos[openIndex]
  const activeDownloadUrl = active
    ? mediaOriginalUrl(active.downloadSrc || active.src)
    : ''

  if (photos.length === 0) {
    return (
      <div className="gallery-grid theme-shaped border border-border/60 bg-card/80 px-8 py-16 text-center backdrop-blur-sm">
        <p className="font-display text-2xl text-foreground">עדיין אין תמונות</p>
        <p className="mt-3 text-sm text-muted-foreground">
          הגלריה מתעדכנת — חזרו בקרוב.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="gallery-grid columns-1 gap-x-0 [column-fill:balance] sm:columns-2 sm:gap-x-3 lg:columns-3 lg:gap-x-4">
        {photos.slice(0, count).map((photo, index) => {
          const raw = photo.thumb || photo.src
          const masonrySrc = mediaMasonryUrl(raw)
          const srcSet = mediaMasonrySrcSet(raw)
          const eager = index < 6

          return (
            <figure
              key={photo.id}
              className="theme-gallery-photo group animate-fade-in-up mb-4 inline-block w-full break-inside-avoid sm:mb-5"
              style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label="הגדלת התמונה"
                className="gallery-photo-frame relative block w-full overflow-hidden bg-muted ring-1 ring-border/40 transition-all duration-500 active:scale-[0.99] hover:ring-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={masonrySrc}
                  srcSet={srcSet}
                  sizes={srcSet ? MASONRY_SIZES : undefined}
                  alt=""
                  loading={eager ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index < 4 ? 'high' : 'low'}
                  className="block h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span
                  className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/10"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center py-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                  aria-hidden
                >
                  <span className="theme-label text-[10px] uppercase tracking-[0.4em]">
                    הגדלה
                  </span>
                </span>
              </button>
            </figure>
          )
        })}
      </div>

      {count < photos.length ? (
        <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
      ) : null}

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`תצוגת תמונה — ${title}`}
          className="theme-lightbox-backdrop animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-md sm:p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="סגירה"
            className="theme-lightbox-btn absolute right-3 top-3 z-10 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center text-2xl leading-none transition-all sm:right-5 sm:top-5"
          >
            ✕
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  goPrev()
                }}
                aria-label="התמונה הקודמת"
                className="theme-lightbox-btn absolute right-2 top-1/2 z-10 flex h-12 w-12 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-3xl leading-none transition-all sm:right-6"
              >
                ›
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  goNext()
                }}
                aria-label="התמונה הבאה"
                className="theme-lightbox-btn absolute left-2 top-1/2 z-10 flex h-12 w-12 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-3xl leading-none transition-all sm:left-6"
              >
                ‹
              </button>
            </>
          ) : null}

          <figure
            className="flex max-h-[92vh] max-w-full flex-col items-center gap-3 sm:max-w-[92vw] sm:gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={active.id}
              src={active.src}
              alt={title}
              loading="eager"
              decoding="async"
              className="gallery-photo-frame animate-fade-in max-h-[72vh] max-w-full object-contain shadow-2xl sm:max-h-[80vh]"
            />
            {activeDownloadUrl ? (
              <a
                href={activeDownloadUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="theme-lightbox-download text-xs uppercase tracking-[0.3em] transition-all"
              >
                הורדת תמונה (HD)
              </a>
            ) : null}
            {photos.length > 1 ? (
              <figcaption className="font-display text-center text-sm tracking-wide text-white/70">
                {openIndex! + 1} / {photos.length}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}
    </>
  )
}
