'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { SelectionToggle } from '@/components/gallery/SelectionToggle'

type MasonryPhoto = {
  id: string
  src: string | null
  lightboxSrc?: string | null
  width?: number | null
  height?: number | null
  selected_album: boolean
  selected_edit: boolean
}

type ClientPhotoMasonryProps = {
  photos: MasonryPhoto[]
  canSelectAlbum: boolean
  canSelectEdit: boolean
  onOpen: (index: number, lightboxSrc: string | null) => void
  onToggleAlbum: (id: string) => void
  onToggleEdit: (id: string) => void
  getGlobalIndex: (id: string) => number
}

// width / height ratio used to lay a photo out before we know its real
// dimensions (older uploads never recorded them). Close to a typical portrait
// frame so the reserved box is roughly the right size.
const FALLBACK_ASPECT = 0.75

function useColumnCount() {
  const [count, setCount] = useState(3)

  useEffect(() => {
    const read = () => {
      const width = window.innerWidth
      setCount(width < 640 ? 1 : width < 1024 ? 2 : 3)
    }
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  return count
}

// Reveal a tile once it scrolls into view — fade + grow, held until then.
// Local copy of the intersect-then-flip pattern used elsewhere in the app
// (useRevealOnScroll / Reveal.tsx) so the gallery stays self-contained.
function useReveal(delayMs: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        if (delayMs > 0) {
          timeoutId = setTimeout(() => setRevealed(true), delayMs)
        } else {
          setRevealed(true)
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [delayMs])

  return { ref, revealed }
}

// Assign each photo to the currently-shortest column, tracking running heights
// from each photo's aspect ratio. A photo never leaves the column it lands in,
// so images settling in one column can't shove images in another — unlike a
// CSS `columns` masonry, which re-balances the whole grid on every load and
// makes the photos visibly jump around while the gallery opens.
function toColumns(
  photos: MasonryPhoto[],
  columnCount: number
): MasonryPhoto[][] {
  const columns: MasonryPhoto[][] = Array.from(
    { length: columnCount },
    () => []
  )
  const heights = new Array<number>(columnCount).fill(0)

  for (const photo of photos) {
    const aspect =
      photo.width && photo.height ? photo.width / photo.height : FALLBACK_ASPECT
    let shortest = 0
    for (let i = 1; i < columnCount; i += 1) {
      if (heights[i] < heights[shortest]) shortest = i
    }
    columns[shortest].push(photo)
    heights[shortest] += 1 / aspect
  }

  return columns
}

export function ClientPhotoMasonry({
  photos,
  canSelectAlbum,
  canSelectEdit,
  onOpen,
  onToggleAlbum,
  onToggleEdit,
  getGlobalIndex,
}: ClientPhotoMasonryProps) {
  const columnCount = useColumnCount()
  const columns = useMemo(
    () => toColumns(photos, columnCount),
    [photos, columnCount]
  )

  return (
    <div className="flex items-start gap-1">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-1">
          {column.map((photo, rowIndex) => (
            <MasonryTile
              key={photo.id}
              photo={photo}
              revealDelayMs={Math.min(rowIndex, 5) * 70}
              canSelectAlbum={canSelectAlbum}
              canSelectEdit={canSelectEdit}
              onOpen={onOpen}
              onToggleAlbum={onToggleAlbum}
              onToggleEdit={onToggleEdit}
              getGlobalIndex={getGlobalIndex}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

type MasonryTileProps = {
  photo: MasonryPhoto
  revealDelayMs: number
  canSelectAlbum: boolean
  canSelectEdit: boolean
  onOpen: (index: number, lightboxSrc: string | null) => void
  onToggleAlbum: (id: string) => void
  onToggleEdit: (id: string) => void
  getGlobalIndex: (id: string) => number
}

function MasonryTile({
  photo,
  revealDelayMs,
  canSelectAlbum,
  canSelectEdit,
  onOpen,
  onToggleAlbum,
  onToggleEdit,
  getGlobalIndex,
}: MasonryTileProps) {
  const { ref, revealed } = useReveal(revealDelayMs)

  const knownAspect =
    photo.width && photo.height ? photo.width / photo.height : null
  const [aspect, setAspect] = useState<number>(knownAspect ?? FALLBACK_ASPECT)

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden bg-[--foreground]/[0.04] transition duration-[900ms] ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${
        revealed
          ? 'translate-y-0 scale-100 opacity-100'
          : 'translate-y-5 scale-[0.9] opacity-0'
      }`}
      style={{ aspectRatio: aspect }}
    >
      <button
        type="button"
        className="absolute inset-0 block h-full w-full"
        onClick={() =>
          onOpen(getGlobalIndex(photo.id), photo.lightboxSrc ?? photo.src)
        }
      >
        {photo.src ? (
          <Image
            src={photo.src}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onLoad={(event) => {
              if (knownAspect) return
              const img = event.currentTarget
              if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                setAspect(img.naturalWidth / img.naturalHeight)
              }
            }}
          />
        ) : null}
      </button>

      {canSelectAlbum || canSelectEdit ? (
        <div
          className={`absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 transition-opacity ${
            photo.selected_album || photo.selected_edit
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {canSelectAlbum ? (
            <SelectionToggle
              type="album"
              selected={photo.selected_album}
              onClick={() => onToggleAlbum(photo.id)}
              showLabel
              size="sm"
            />
          ) : null}
          {canSelectEdit ? (
            <SelectionToggle
              type="edit"
              selected={photo.selected_edit}
              onClick={() => onToggleEdit(photo.id)}
              showLabel
              size="sm"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
