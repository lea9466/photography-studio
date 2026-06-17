'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { GalleryUploadCallbacks } from '@/lib/gallery-upload-client'
import { deletePhotosBulk, setPhotosVisibilityBulk } from '@/lib/actions/photo.actions'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
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
      onPhotoStaged: (photoId, file, previewUrl) => {
        objectUrlsRef.current.push(previewUrl)
        setPendingPhotos((prev) => [
          ...prev,
          {
            id: photoId,
            previewUrl,
            status: 'uploading',
          },
        ])
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
    [] // Remove clearPending dependency to prevent infinite loop
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

  function bulkDeletePhotos() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) {
      toast.error('בחרי תמונות קודם')
      return
    }

    startTransition(async () => {
      try {
        const { deleted } = await deletePhotosBulk(galleryId, ids)
        toast.success(`${deleted} תמונות נמחקו`)
        setSelectedIds(new Set())
        setDeleteDialogOpen(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-medium">ניהול תמונות</h2>
        <p className="text-sm text-[--muted]">
          העלאה, תצוגה מקדימה והצגה או הסתרה מהלקוח
        </p>
      </div>

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
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    מחק תמונות
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogTitle>מחיקת תמונות</DialogTitle>
          <DialogDescription>
            למחוק {selectedIds.size} תמונות מהגלריה? פעולה זו אינה ניתנת לביטול.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setDeleteDialogOpen(false)}
            >
              ביטול
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={bulkDeletePhotos}
            >
              מחק
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
