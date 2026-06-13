'use client'

import {
  formatGalleryUploadCount,
  type GalleryUploadProgress,
} from '@/lib/gallery-upload-client'

export function galleryUploadPercent(progress: GalleryUploadProgress): number {
  if (progress.total <= 0) return 0
  if (progress.phase === 'preparing') return 0
  const processed = Math.min(progress.total - progress.staged, progress.total)
  return Math.round((processed / progress.total) * 100)
}

type Props = {
  progress: GalleryUploadProgress
  variant?: 'fixed' | 'inline'
}

export default function GalleryUploadProgressBar({
  progress,
  variant = 'inline',
}: Props) {
  const percent = galleryUploadPercent(progress)
  const processedCount = Math.min(progress.total - progress.staged, progress.total)
  const label =
    progress.phase === 'preparing'
      ? 'מכין תמונות להעלאה...'
      : progress.phase === 'registering'
        ? `שומר ${formatGalleryUploadCount(progress.completed)} מתוך ${formatGalleryUploadCount(progress.total)} בגלריה...`
        : `הועלו ${formatGalleryUploadCount(progress.completed)} מתוך ${formatGalleryUploadCount(progress.total)}`

  const bar = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className="font-display text-2xl tabular-nums text-foreground">
          {progress.phase === 'preparing' ? '…' : `${percent}%`}
        </span>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={processedCount}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-label="התקדמות העלאת גלריה"
      >
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {progress.phase === 'registering'
          ? 'רישום מרוכז ל-Supabase · '
          : progress.staged > 0 && processedCount < progress.total
            ? `${formatGalleryUploadCount(progress.staged)} נותרו בתור · `
            : null}
        {progress.failed
          ? `${formatGalleryUploadCount(progress.failed)} דילגו · `
          : null}
        אל תסגרי את הדף · השאירי את הטאב פעיל
      </p>
    </>
  )

  if (variant === 'fixed') {
    return (
      <div
        className="fixed inset-x-0 top-0 z-[200] border-b border-border bg-card/95 px-4 py-4 shadow-lg backdrop-blur-md sm:px-8"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto max-w-3xl">{bar}</div>
      </div>
    )
  }

  return (
    <div
      className="admin-card p-4"
      role="status"
      aria-live="polite"
    >
      {bar}
    </div>
  )
}
