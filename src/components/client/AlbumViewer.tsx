'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toggleSelectionAction } from '@/app/[photographer_slug]/client/actions'
import {
  buildClientBulkDownloadUrl,
  MAX_CLIENT_BULK_DOWNLOAD,
} from '@/lib/album-download-urls'
import type { ResolvedGalleryMedia } from '@/lib/gallery-media-urls'
import {
  mediaMasonrySrcSet,
  mediaMasonryUrl,
  pickGridMediaUrl,
} from '@/lib/media-urls'
import { useIncrementalReveal } from '@/lib/useIncrementalReveal'
import type { SelectionType } from '@/lib/database.types'

type AlbumImagesPageResponse = {
  ok: boolean
  message?: string
  images?: ViewerImage[]
  nextCursor?: string | null
  totalCount?: number
}

type ViewerImage = {
  id: string
  image_url?: string | null
  thumbnail_url?: string | null
  original_ext?: string | null
} & Partial<ResolvedGalleryMedia>

type SelectionState = Record<string, Set<SelectionType>>

const LABELS: Record<'album' | 'edit', { label: string; active: string }> = {
  album: { label: 'לאלבום', active: 'client-btn-primary' },
  edit: { label: 'לעיבוד', active: 'bg-[var(--color-accent)] text-[var(--bg-primary)]' },
}

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

function MasonryImage({
  thumbnailUrl,
  imageUrl,
  index,
}: {
  thumbnailUrl: string
  imageUrl: string
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

export default function AlbumViewer({
  albumId,
  photographerId,
  images: initialImages,
  initialNextCursor = null,
  totalCount: initialTotalCount,
  initialSelections,
  downloadHref,
  token,
  expired,
  maxAlbum,
  maxEdit,
}: {
  albumId: string
  photographerId?: string | null
  images: ViewerImage[]
  initialNextCursor?: string | null
  totalCount?: number
  initialSelections: Record<string, SelectionType[]>
  downloadHref: string
  token?: string
  expired?: boolean
  maxAlbum?: number | null
  maxEdit?: number | null
}) {
  const [images, setImages] = useState(initialImages)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [totalCount, setTotalCount] = useState(
    initialTotalCount ?? initialImages.length
  )
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState('')
  const loadingMoreRef = useRef(false)
  const [selections, setSelections] = useState<SelectionState>(() => {
    const state: SelectionState = {}
    for (const [imageId, types] of Object.entries(initialSelections)) {
      state[imageId] = new Set(types)
    }
    return state
  })
  const [error, setError] = useState('')
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(() => new Set())
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [limitToast, setLimitToast] = useState('')
  const [downloadSelectedIds, setDownloadSelectedIds] = useState<Set<string>>(
    () => new Set()
  )
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { count, sentinelRef } = useIncrementalReveal(images.length)

  useEffect(() => {
    setImages(initialImages)
    setNextCursor(initialNextCursor)
    setTotalCount(initialTotalCount ?? initialImages.length)
    setLoadError('')
    const state: SelectionState = {}
    for (const [imageId, types] of Object.entries(initialSelections)) {
      state[imageId] = new Set(types)
    }
    setSelections(state)
    setPendingToggles(new Set())
    setDownloadSelectedIds(new Set())
    setError('')
  }, [albumId, initialImages, initialNextCursor, initialTotalCount, initialSelections])

  const fetchMoreImages = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current) return

    loadingMoreRef.current = true
    setLoadingMore(true)
    setLoadError('')

    try {
      const params = new URLSearchParams({ album: albumId, cursor: nextCursor })
      if (token) params.set('token', token)

      const res = await fetch(`/api/album-images?${params}`)
      const data = (await res.json()) as AlbumImagesPageResponse

      if (!res.ok || !data.ok || !data.images) {
        setLoadError(data.message || 'שגיאה בטעינת תמונות')
        return
      }

      setImages((prev) => {
        const seen = new Set(prev.map((img) => img.id))
        const merged = [...prev]
        for (const img of data.images!) {
          if (!seen.has(img.id)) merged.push(img)
        }
        return merged
      })
      setNextCursor(data.nextCursor ?? null)
      if (typeof data.totalCount === 'number') setTotalCount(data.totalCount)
    } catch {
      setLoadError('שגיאה בטעינת תמונות')
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [albumId, nextCursor, token])

  useEffect(() => {
    if (!nextCursor || loadingMore || count < images.length) return
    void fetchMoreImages()
  }, [count, images.length, nextCursor, loadingMore, fetchMoreImages])

  const previewImage = previewIndex != null ? images[previewIndex] : null
  const previewOriginal = previewImage?.download ?? previewImage?.preview ?? ''

  function closePreview() {
    setPreviewIndex(null)
  }

  function showPrev() {
    setPreviewIndex((i) =>
      i == null ? i : (i - 1 + images.length) % images.length
    )
  }

  function showNext() {
    setPreviewIndex((i) => (i == null ? i : (i + 1) % images.length))
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  useEffect(() => {
    if (previewIndex == null) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closePreview()
      // ניווט RTL: חץ ימינה = הקודם, חץ שמאלה = הבא
      else if (event.key === 'ArrowRight') showPrev()
      else if (event.key === 'ArrowLeft') showNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewIndex, images.length])

  function showLimitToast(message: string) {
    setLimitToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setLimitToast(''), 3500)
  }

  const counts = useMemo(() => {
    let album = 0
    let edit = 0
    for (const set of Object.values(selections)) {
      if (set.has('album')) album += 1
      if (set.has('edit')) edit += 1
    }
    return { album, edit }
  }, [selections])

  function isSelected(imageId: string, type: SelectionType): boolean {
    return selections[imageId]?.has(type) ?? false
  }

  function toggleKey(imageId: string, type: SelectionType): string {
    return `${imageId}:${type}`
  }

  function isTogglePending(imageId: string, type: SelectionType): boolean {
    return pendingToggles.has(toggleKey(imageId, type))
  }

  function applySelection(imageId: string, type: SelectionType, on: boolean) {
    setSelections((prev) => {
      const next: SelectionState = { ...prev }
      const set = new Set(next[imageId] ?? [])
      if (on) set.add(type)
      else set.delete(type)
      next[imageId] = set
      return next
    })
  }

  const allDownloadSelected =
    images.length > 0 && images.every((img) => downloadSelectedIds.has(img.id))

  function toggleDownloadSelected(imageId: string) {
    setDownloadSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(imageId)) next.delete(imageId)
      else next.add(imageId)
      return next
    })
  }

  function toggleSelectAllDownload() {
    if (allDownloadSelected) {
      setDownloadSelectedIds(new Set())
      return
    }
    setDownloadSelectedIds(new Set(images.map((img) => img.id)))
  }

  function handleBulkDownload(compressed: boolean) {
    const ids = Array.from(downloadSelectedIds)
    if (ids.length === 0) return

    if (ids.length > MAX_CLIENT_BULK_DOWNLOAD) {
      showLimitToast(
        `ניתן להוריד עד ${MAX_CLIENT_BULK_DOWNLOAD.toLocaleString('he-IL')} תמונות בבקשה אחת`
      )
      return
    }

    window.location.href = buildClientBulkDownloadUrl(albumId, ids, {
      token,
      compressed,
    })
  }

  async function toggle(imageId: string, type: 'album' | 'edit') {
    if (expired) return

    const key = toggleKey(imageId, type)
    if (pendingToggles.has(key)) return

    const turningOn = !isSelected(imageId, type)
    if (turningOn) {
      const max = type === 'album' ? maxAlbum : maxEdit
      const current = type === 'album' ? counts.album : counts.edit
      if (max != null && current >= max) {
        showLimitToast(
          `הגעת למקסימום של ${max} תמונות ${type === 'album' ? 'לאלבום' : 'לעיבוד'}. הסירו תמונה כדי לבחור אחרת.`
        )
        return
      }
    }

    setError('')
    applySelection(imageId, type, turningOn)
    setPendingToggles((prev) => new Set(prev).add(key))

    try {
      const result = await toggleSelectionAction({ albumId, imageId, type, token })
      if (!result.ok) {
        applySelection(imageId, type, !turningOn)
        if (result.message.includes('ניתן לבחור עד')) {
          showLimitToast(result.message)
        } else {
          setError(result.message || 'שגיאה בשמירת הבחירה')
        }
        return
      }
      if (result.selected !== turningOn) {
        applySelection(imageId, type, result.selected)
      }
    } catch {
      applySelection(imageId, type, !turningOn)
      setError('שגיאה בשמירת הבחירה, נסו שוב')
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <div className="client-album-content space-y-8">
      {limitToast ? (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed inset-x-0 top-6 z-[100] flex justify-center px-4"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-amber-500 px-6 py-4 text-sm font-medium text-white shadow-xl shadow-amber-900/20">
            <span className="text-lg leading-none">⚠</span>
            <span>{limitToast}</span>
            <button
              type="button"
              onClick={() => setLimitToast('')}
              aria-label="סגירה"
              className="mr-1 rounded-full px-2 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      <div className="client-album-toolbar sticky top-20 z-30 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex flex-wrap gap-4 text-sm text-foreground/80">
          <span>
            {totalCount} תמונות
            {images.length < totalCount ? ` (נטענו ${images.length})` : ''}
          </span>
          <span className="client-brand-text flex items-center gap-1.5">
            <BookIcon className="h-4 w-4 shrink-0" />
            לאלבום: {counts.album}
            {maxAlbum != null ? ` / ${maxAlbum}` : ''}
          </span>
          <span className="client-edit-text flex items-center gap-1.5">
            <PencilIcon className="h-4 w-4 shrink-0" />
            לעיבוד: {counts.edit}
            {maxEdit != null ? ` / ${maxEdit}` : ''}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!expired ? (
            <span className="client-muted-text text-xs">
              הבחירות נשמרות אוטומטית
            </span>
          ) : null}
          {!expired && images.length > 0 ? (
            <button
              type="button"
              onClick={toggleSelectAllDownload}
              className="client-btn-outline px-4 py-2 text-sm"
            >
              {allDownloadSelected ? 'בטל בחירה להורדה' : 'בחר הכל להורדה'}
            </button>
          ) : null}
          {totalCount > 0 && !expired ? (
            <a
              href={downloadHref}
              className="client-btn-primary px-6 py-2.5 text-sm tracking-wide"
            >
              הורדת כל התמונות (ZIP)
            </a>
          ) : null}
        </div>
      </div>

      {expired ? (
        <p className="rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
          תוקף הגלריה פג. ניתן לצפות, אך לא ניתן לבחור או להוריד. פנו לסטודיו.
        </p>
      ) : null}

      {error ? (
        <p
          role="status"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      {loadError ? (
        <p
          role="status"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {loadError}
        </p>
      ) : null}

      {totalCount === 0 ? (
        <p className="client-muted-text text-sm">
          עדיין אין תמונות בגלריה זו.
        </p>
      ) : (
        <div className="gallery-grid columns-1 gap-x-0 [column-fill:balance] sm:columns-2 sm:gap-x-3 lg:columns-3 lg:gap-x-4">
          {images.slice(0, count).map((img, index) => {
            const albumOn = isSelected(img.id, 'album')
            const editOn = isSelected(img.id, 'edit')
            const thumb = img.thumb ?? ''
            const preview = img.preview ?? thumb
            const hasSelection = albumOn || editOn
            const downloadOn = downloadSelectedIds.has(img.id)

            return (
              <figure
                key={img.id}
                className="group mb-4 inline-block w-full break-inside-avoid sm:mb-5"
              >
                <div className="gallery-photo-frame relative overflow-hidden bg-muted shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    className="relative block w-full"
                    aria-label="הגדלת תמונה"
                  >
                    <MasonryImage
                      thumbnailUrl={thumb}
                      imageUrl={preview}
                      index={index}
                    />
                  </button>

                  {!expired ? (
                    <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        disabled={isTogglePending(img.id, 'album')}
                        onClick={(event) => {
                          event.stopPropagation()
                          void toggle(img.id, 'album')
                        }}
                        aria-label={albumOn ? 'הסרה מאלבום' : 'הוספה לאלבום'}
                        title={albumOn ? 'הסרה מאלבום' : 'הוספה לאלבום'}
                        aria-pressed={albumOn}
                        className={`pointer-events-auto flex h-6 w-6 cursor-pointer items-center justify-center transition-all disabled:cursor-not-allowed disabled:opacity-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] sm:h-5 sm:w-5 ${
                          albumOn
                            ? 'client-brand-text'
                            : 'text-white hover:opacity-90'
                        }`}
                      >
                        <BookIcon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isTogglePending(img.id, 'edit')}
                        onClick={(event) => {
                          event.stopPropagation()
                          void toggle(img.id, 'edit')
                        }}
                        aria-label={editOn ? 'הסרה מעיבוד' : 'הוספה לעיבוד'}
                        title={editOn ? 'הסרה מעיבוד' : 'הוספה לעיבוד'}
                        aria-pressed={editOn}
                        className={`pointer-events-auto flex h-6 w-6 cursor-pointer items-center justify-center transition-all disabled:cursor-not-allowed disabled:opacity-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] sm:h-5 sm:w-5 ${
                          editOn
                            ? 'client-edit-text'
                            : 'text-white hover:opacity-90'
                        }`}
                      >
                        <PencilIcon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ) : null}

                  {!expired && hasSelection ? (
                    <div
                      className="pointer-events-none absolute bottom-2 left-2 hidden items-center gap-1.5 transition-opacity duration-300 group-hover:opacity-0 sm:flex"
                      aria-hidden
                    >
                      {albumOn ? (
                        <span className="client-brand-text flex h-6 w-6 items-center justify-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] sm:h-5 sm:w-5">
                          <BookIcon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
                        </span>
                      ) : null}
                      {editOn ? (
                        <span className="client-edit-text flex h-6 w-6 items-center justify-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] sm:h-5 sm:w-5">
                          <PencilIcon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {!expired ? (
                    <label className="absolute bottom-2 right-2 z-20 flex cursor-pointer items-center opacity-100 transition-opacity has-[:checked]:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <input
                        type="checkbox"
                        checked={downloadOn}
                        onChange={() => toggleDownloadSelected(img.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="h-5 w-5 cursor-pointer border-white/80 bg-black/25 text-[var(--color-brand)] drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] focus:ring-2 focus:ring-white/50 sm:h-4 sm:w-4"
                        aria-label={`בחירת תמונה ${index + 1} להורדה`}
                      />
                    </label>
                  ) : null}
                </div>
              </figure>
            )
          })}
        </div>
      )}

      {downloadSelectedIds.size > 0 && !expired ? (
        <div className="client-album-bottom-bar fixed inset-x-0 bottom-0 z-50 px-[5vw] py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="client-album-shell flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">
              {downloadSelectedIds.size.toLocaleString('he-IL')} תמונות נבחרו להורדה
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDownloadSelectedIds(new Set())}
                className="client-btn-outline px-4 py-2 text-sm"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => handleBulkDownload(false)}
                className="client-btn-outline px-4 py-2 text-sm"
              >
                הורד נבחרות (HD)
              </button>
              <button
                type="button"
                onClick={() => handleBulkDownload(true)}
                className="client-btn-primary px-4 py-2 text-sm"
              >
                הורדה מכווצת
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {count < images.length || nextCursor ? (
        <div
          ref={sentinelRef}
          className="flex h-10 w-full items-center justify-center"
          aria-hidden={!loadingMore}
        >
          {loadingMore ? (
            <span className="client-muted-text text-sm">
              טוען תמונות...
            </span>
          ) : null}
        </div>
      ) : null}

      {previewImage && (previewImage.preview || previewImage.thumb) ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closePreview}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <button
            type="button"
            onClick={closePreview}
            aria-label="סגירת תצוגה"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-3.5 py-1.5 text-lg text-white transition-colors hover:bg-white/25"
          >
            ✕
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  showPrev()
                }}
                aria-label="התמונה הקודמת"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl leading-none text-white transition-colors hover:bg-white/25 sm:right-6"
              >
                ›
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  showNext()
                }}
                aria-label="התמונה הבאה"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl leading-none text-white transition-colors hover:bg-white/25 sm:left-6"
              >
                ‹
              </button>
            </>
          ) : null}

          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-full max-w-full flex-col items-center gap-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.preview || previewImage.thumb}
              alt=""
              loading="eager"
              decoding="async"
              className="gallery-photo-frame max-h-[74vh] max-w-[92vw] object-contain"
            />

            {previewOriginal && !expired ? (
              <a
                href={previewOriginal}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/15 px-6 py-2.5 text-sm tracking-wide text-white transition-colors hover:bg-white/30"
              >
                הורדת תמונה (HD)
              </a>
            ) : null}

            {!expired ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isTogglePending(previewImage.id, 'album')}
                  onClick={() => void toggle(previewImage.id, 'album')}
                  className={`rounded-full px-6 py-2.5 text-sm tracking-wide transition-all disabled:opacity-50 ${
                    isSelected(previewImage.id, 'album')
                      ? LABELS.album.active
                      : 'border border-white/50 text-white hover:border-white hover:bg-white/10'
                  }`}
                >
                  {isSelected(previewImage.id, 'album') ? '✓ ' : ''}
                  {LABELS.album.label}
                </button>
                <button
                  type="button"
                  disabled={isTogglePending(previewImage.id, 'edit')}
                  onClick={() => void toggle(previewImage.id, 'edit')}
                  className={`rounded-full px-6 py-2.5 text-sm tracking-wide transition-all disabled:opacity-50 ${
                    isSelected(previewImage.id, 'edit')
                      ? LABELS.edit.active
                      : 'border border-white/50 text-white hover:border-white hover:bg-white/10'
                  }`}
                >
                  {isSelected(previewImage.id, 'edit') ? '✓ ' : ''}
                  {LABELS.edit.label}
                </button>
              </div>
            ) : null}

            <span className="text-xs tracking-wide text-white/70">
              {previewIndex! + 1} / {images.length}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
