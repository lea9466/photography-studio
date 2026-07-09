'use client'

import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CloudUpload, Image as ImageIcon, Loader2, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  formatPostUploadCount,
  uploadPostPhotosWithQueue,
  type PostUploadCallbacks,
  type PostUploadProgress,
} from '@/lib/post-upload-client'
import { deletePostPhotosBulk } from '@/lib/actions/post-photo.actions'
import { setPostCoverPhoto } from '@/lib/actions/post.actions'
import { buildPostPhotoLimitError, MAX_POST_PHOTOS } from '@/lib/post-photo-limits'
import { GalleryUploadProgressBar } from '@/components/gallery/GalleryUploadProgressBar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PostPhoto } from '@/lib/types/database.types'

type PostPhotosSectionProps = {
  postId: string
  userId: string
  watermarkText?: string | null
  applyAutoWatermark?: boolean
  photos: PostPhoto[]
  coverPhotoId?: string | null
  signedUrls: Record<string, string>
}

export function PostPhotosSection({
  postId,
  userId,
  watermarkText,
  applyAutoWatermark = true,
  photos,
  coverPhotoId,
  signedUrls,
}: PostPhotosSectionProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<PostUploadProgress | null>(null)

  const uploadCallbacks = useMemo<PostUploadCallbacks>(() => ({}), [])

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const selected = Array.from(fileList).filter((file) => file.type.startsWith('image/'))
      if (selected.length === 0) {
        toast.error('יש לבחור קבצי תמונה')
        return
      }

      const limitError = buildPostPhotoLimitError(photos.length, selected.length)
      if (limitError) {
        toast.error(limitError)
        return
      }

      try {
        setIsUploading(true)
        setUploadProgress({
          completed: 0,
          staged: selected.length,
          total: selected.length,
          phase: 'preparing',
        })

        const result = await uploadPostPhotosWithQueue(
          postId,
          userId,
          selected,
          watermarkText,
          setUploadProgress,
          uploadCallbacks,
          applyAutoWatermark
        )

        if (result.ok) {
          toast.success(
            result.uploaded === 1
              ? 'תמונה אחת הועלתה'
              : `${formatPostUploadCount(result.uploaded)} תמונות הועלו לפוסט`
          )
          router.refresh()
        } else {
          toast.error(result.message ?? 'שגיאה בהעלאת תמונות')
          if (result.uploaded > 0) router.refresh()
        }
      } catch {
        toast.error('שגיאה בהעלאת תמונות')
      } finally {
        setIsUploading(false)
        setUploadProgress(null)
      }
    },
    [postId, userId, watermarkText, applyAutoWatermark, uploadCallbacks, router, photos.length]
  )

  const remainingSlots = MAX_POST_PHOTOS - photos.length
  const canUpload = remainingSlots > 0 && !isUploading

  function togglePhotoSelected(photoId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }

  function handleSetCover(photoId: string) {
    const nextCover = coverPhotoId === photoId ? null : photoId
    startTransition(async () => {
      try {
        await setPostCoverPhoto(postId, nextCover)
        toast.success(nextCover ? 'התמונה סומנה כתמונת הפוסט' : 'הוסר סימון תמונת הפוסט')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function deleteSelectedPhotos() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) {
      toast.error('בחרי תמונות קודם')
      return
    }

    startTransition(async () => {
      try {
        await deletePostPhotosBulk(postId, ids)
        toast.success(`${ids.length} תמונות נמחקו`)
        setSelectedIds(new Set())
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
    setDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">תמונות לפוסט</h3>
          <p className="text-xs text-[--muted]">
            עד {MAX_POST_PHOTOS} תמונות · נותרו {remainingSlots}
          </p>
          <p className="mt-1.5 text-xs text-[--muted]">
            <Star className="mb-0.5 inline h-3 w-3 text-[--primary]" />{' '}
            {photos.length > 0 ? (
              <>
                לחצי על הכוכב לסימון{' '}
                <span className="font-medium text-[--foreground]">תמונת השער</span> — התמונה שתוצג
                בכרטיס הפוסט בדף הבית ובבלוג. מומלץ לבחור{' '}
                <span className="font-medium text-[--foreground]">תמונה רחבה</span> (לרוחב).
              </>
            ) : (
              <>
                אחרי העלאה, סמני בכוכב את{' '}
                <span className="font-medium text-[--foreground]">תמונת השער</span> לכרטיס הפוסט.
                מומלץ <span className="font-medium text-[--foreground]">תמונה רחבה</span> (לרוחב).
              </>
            )}
          </p>
        </div>
        {selectedIds.size > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-red-600"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4 ml-1" />
            מחק {selectedIds.size} נבחרות
          </Button>
        )}
      </div>

      {uploadProgress && <GalleryUploadProgressBar progress={uploadProgress} />}

      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 ${
          canUpload ? '' : 'opacity-60'
        }`}
      >
        {photos.map((photo) => {
          const previewUrl = photo.preview_url ? signedUrls[photo.preview_url] : null
          const isSelected = selectedIds.has(photo.id)
          const isCover = coverPhotoId === photo.id
          return (
            <div
              key={photo.id}
              className={`group relative aspect-square overflow-hidden rounded-lg border bg-[--background] transition ${
                isSelected
                  ? 'border-[--primary] ring-2 ring-[--primary]/30'
                  : isCover
                    ? 'border-[--primary]'
                    : 'border-[--border] hover:border-[--primary]/50'
              }`}
            >
              <button
                type="button"
                onClick={() => togglePhotoSelected(photo.id)}
                className="block h-full w-full"
                aria-label="בחר תמונה"
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[--muted]">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSetCover(photo.id)}
                disabled={isPending}
                aria-label={isCover ? 'תמונת הפוסט' : 'סמן כתמונת הפוסט'}
                title={isCover ? 'תמונת הפוסט' : 'סמן כתמונת הפוסט'}
                className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition ${
                  isCover
                    ? 'border-[--primary] bg-[--primary] text-white'
                    : 'border-white/70 bg-black/40 text-white opacity-0 group-hover:opacity-100'
                }`}
              >
                <Star className={`h-4 w-4 ${isCover ? 'fill-current' : ''}`} />
              </button>
              {isCover && (
                <span className="absolute bottom-1.5 right-1.5 rounded bg-[--primary] px-1.5 py-0.5 text-[10px] font-medium text-white">
                  תמונת פוסט
                </span>
              )}
            </div>
          )
        })}

        {canUpload && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[--border] bg-[--background] text-[--muted] transition hover:border-[--primary]/50 hover:text-[--foreground]"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <CloudUpload className="h-6 w-6" />
            )}
            <span className="text-xs">הוסף תמונות</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void uploadFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogTitle>מחיקת תמונות</DialogTitle>
          <DialogDescription>
            למחוק {selectedIds.size} תמונות מהפוסט? פעולה זו אינה ניתנת לביטול.
          </DialogDescription>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              ביטול
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={deleteSelectedPhotos}
              disabled={isPending}
            >
              {isPending ? 'מוחק...' : 'מחק'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
