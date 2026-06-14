'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { GalleryUploadCallbacks } from '@/lib/gallery-upload-client'
import { setPhotosVisibilityBulk } from '@/lib/actions/photo.actions'
import { UploadDropzone } from '@/components/gallery/UploadDropzone'
import {
  GalleryGrid,
  type PendingGalleryPhoto,
} from '@/components/gallery/GalleryGrid'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Photo } from '@/lib/types/database.types'

type GalleryPhotosSectionProps = {
  galleryId: string
  userId: string
  watermarkText?: string | null
  photos: Photo[]
  signedUrls: Record<string, string>
}

export function GalleryPhotosSection({
  galleryId,
  userId,
  watermarkText,
  photos,
  signedUrls,
}: GalleryPhotosSectionProps) {
  const objectUrlsRef = useRef<string[]>([])
  const [pendingPhotos, setPendingPhotos] = useState<PendingGalleryPhoto[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [])

  const clearPending = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current = []
    setPendingPhotos([])
  }, [])

  const uploadCallbacks = useMemo<GalleryUploadCallbacks>(
    () => ({
      onJobsReady: (jobs) => {
        const items: PendingGalleryPhoto[] = jobs.map((job) => {
          const previewUrl = URL.createObjectURL(job.file)
          objectUrlsRef.current.push(previewUrl)
          return {
            id: job.photoId,
            previewUrl,
            status: 'uploading',
          }
        })
        setPendingPhotos(items)
      },
      onPhotoUploaded: (photoId) => {
        setPendingPhotos((prev) =>
          prev.map((photo) =>
            photo.id === photoId ? { ...photo, status: 'uploaded' } : photo
          )
        )
      },
      onPhotoFailed: (photoId) => {
        setPendingPhotos((prev) =>
          prev.map((photo) =>
            photo.id === photoId ? { ...photo, status: 'failed' } : photo
          )
        )
      },
      onPhaseChange: (phase) => {
        if (phase === 'registering') {
          setPendingPhotos((prev) =>
            prev.map((photo) =>
              photo.status === 'uploaded'
                ? { ...photo, status: 'registering' }
                : photo
            )
          )
        }
      },
      onComplete: clearPending,
    }),
    [clearPending]
  )

  const activePendingCount = pendingPhotos.filter(
    (photo) => photo.status !== 'failed'
  ).length

  const visiblePhotoIds = useMemo(
    () => photos.map((photo) => photo.id),
    [photos]
  )

  const allSelected =
    visiblePhotoIds.length > 0 &&
    visiblePhotoIds.every((id) => selectedIds.has(id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(visiblePhotoIds))
  }

  function togglePhotoSelected(photoId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }

  function bulkSetVisibility(visible: boolean) {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) {
      toast.error('בחרי תמונות קודם')
      return
    }

    startTransition(async () => {
      try {
        await setPhotosVisibilityBulk(galleryId, ids, visible)
        toast.success(visible ? 'התמונות גלויות ללקוח' : 'התמונות הוסתרו מהלקוח')
        setSelectedIds(new Set())
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>העלאת תמונות</CardTitle>
          <CardDescription>
            נוצרות תצוגה מקדימה וסימן מים אוטומטית
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadDropzone
            galleryId={galleryId}
            userId={userId}
            watermarkText={watermarkText}
            uploadCallbacks={uploadCallbacks}
          />
        </CardContent>
      </Card>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">
            {photos.length + activePendingCount} תמונות
            {activePendingCount > 0 ? (
              <span className="text-sm font-normal text-[--muted]">
                {' '}
                (כולל מעלות כעת)
              </span>
            ) : null}
          </h2>
          {photos.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
              >
                {allSelected ? 'נקה בחירה' : 'בחר הכל'}
              </Button>
              {selectedIds.size > 0 ? (
                <>
                  <span className="text-sm text-[--muted]">
                    {selectedIds.size} נבחרו
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => bulkSetVisibility(true)}
                  >
                    הצג ללקוח
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => bulkSetVisibility(false)}
                  >
                    הסתר מהלקוח
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <GalleryGrid
          photos={photos}
          signedUrls={signedUrls}
          pendingPhotos={pendingPhotos}
          selectedIds={selectedIds}
          onToggleSelect={togglePhotoSelected}
        />
      </div>
    </div>
  )
}
