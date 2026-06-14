'use client'

import {
  formatGalleryUploadCount,
  type GalleryUploadProgress,
} from '@/lib/gallery-upload-client'
import { Progress } from '@/components/ui/progress'

export function galleryUploadPercent(progress: GalleryUploadProgress) {
  if (progress.total <= 0) return 0
  if (progress.phase === 'preparing') return 0
  if (progress.phase === 'registering') {
    return Math.round((progress.completed / progress.total) * 100)
  }
  const processed = progress.total - progress.staged
  return Math.round((processed / progress.total) * 100)
}

type GalleryUploadProgressBarProps = {
  progress: GalleryUploadProgress
}

export function GalleryUploadProgressBar({
  progress,
}: GalleryUploadProgressBarProps) {
  const percent = galleryUploadPercent(progress)
  const processedCount =
    progress.phase === 'registering'
      ? progress.completed
      : progress.total - progress.staged
  const label =
    progress.phase === 'preparing'
      ? 'מכין תמונות להעלאה...'
      : progress.phase === 'registering'
        ? `שומר ${formatGalleryUploadCount(progress.completed)} מתוך ${formatGalleryUploadCount(progress.total)} בגלריה...`
        : `הועלו ${formatGalleryUploadCount(processedCount)} מתוך ${formatGalleryUploadCount(progress.total)}`

  return (
    <div className="rounded-xl border border-[--border] bg-[--background] p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{label}</p>
        <span className="text-2xl font-semibold tabular-nums text-[--foreground]">
          {progress.phase === 'preparing' ? '…' : `${percent}%`}
        </span>
      </div>
      <Progress value={percent} className="mt-3 h-3" />
      <p className="mt-2 text-xs text-[--muted]">
        {progress.phase === 'registering'
          ? 'רישום מרוכז ל-Supabase · '
          : progress.staged > 0 && progress.completed < progress.total
            ? `${formatGalleryUploadCount(progress.staged)} בתור · `
            : null}
        {progress.failed ? `${formatGalleryUploadCount(progress.failed)} דילגו · ` : null}
        אל תסגרי את הדף · השאירי את הטאב פעיל
      </p>
    </div>
  )
}
