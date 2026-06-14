'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createR2UploadUrls } from '@/lib/actions/storage.actions'
import { registerEditedPhotosBatch } from '@/lib/actions/photo.actions'
import { buildStoragePath } from '@/lib/images/process'
import { putToPresignedUrl } from '@/lib/r2/upload-client'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

type SelectedPhoto = {
  id: string
  edited_signed_url: string | null
}

type UploadEditedProps = {
  galleryId: string
  userId: string
  selectedPhotos: SelectedPhoto[]
}

type FileMatch = {
  photoId: string
  file: File
}

function matchFilesToPhotos(
  files: File[],
  editPhotos: SelectedPhoto[]
): FileMatch[] {
  const pending = editPhotos.filter((photo) => !photo.edited_signed_url)
  const sortedFiles = [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  )

  const matches: FileMatch[] = []
  const usedPhotoIds = new Set<string>()
  const unmatchedFiles: File[] = []

  for (const file of sortedFiles) {
    const byId = pending.find(
      (photo) => file.name.includes(photo.id) && !usedPhotoIds.has(photo.id)
    )
    if (byId) {
      matches.push({ photoId: byId.id, file })
      usedPhotoIds.add(byId.id)
      continue
    }
    unmatchedFiles.push(file)
  }

  const remainingPhotos = pending.filter((photo) => !usedPhotoIds.has(photo.id))
  for (
    let index = 0;
    index < Math.min(unmatchedFiles.length, remainingPhotos.length);
    index += 1
  ) {
    matches.push({
      photoId: remainingPhotos[index].id,
      file: unmatchedFiles[index],
    })
  }

  return matches
}

export function UploadEdited({
  galleryId,
  userId,
  selectedPhotos,
}: UploadEditedProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadedCount = selectedPhotos.filter(
    (photo) => photo.edited_signed_url
  ).length
  const pendingCount = selectedPhotos.length - uploadedCount

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((file) =>
        file.type.startsWith('image/')
      )
      if (files.length === 0) {
        toast.error('יש לבחור קבצי תמונה')
        return
      }

      const matches = matchFilesToPhotos(files, selectedPhotos)
      if (matches.length === 0) {
        toast.error('לא נמצאו תמונות לשיוך — ודאי שהלקוח בחר תמונות לעיבוד')
        return
      }

      if (matches.length < files.length) {
        toast.info(
          `${files.length - matches.length} קבצים לא שויכו — יש ${pendingCount} תמונות ממתינות לעיבוד`
        )
      }

      setIsUploading(true)
      setProgress(5)

      try {
        const items = matches.map(({ photoId, file }) => ({
          photoId,
          file,
          path: buildStoragePath(userId, galleryId, `${photoId}-edited.jpg`),
          contentType: file.type || 'image/jpeg',
        }))

        setProgress(15)
        const uploadUrls = await createR2UploadUrls(
          galleryId,
          items.map((item) => ({
            bucket: 'edited' as const,
            path: item.path,
            contentType: item.contentType,
          }))
        )

        setProgress(30)
        const chunkSize = 5
        for (let offset = 0; offset < items.length; offset += chunkSize) {
          const chunk = items.slice(offset, offset + chunkSize)
          await Promise.all(
            chunk.map((item, index) =>
              putToPresignedUrl(uploadUrls[offset + index], item.file)
            )
          )
          setProgress(30 + Math.round(((offset + chunk.length) / items.length) * 55))
        }

        setProgress(90)
        await registerEditedPhotosBatch({
          galleryId,
          items: items.map((item) => ({
            photoId: item.photoId,
            editedPath: item.path,
          })),
        })

        setProgress(100)
        toast.success(
          matches.length === 1
            ? 'תמונה מעובדת הועלתה — התמונות הרגילות הוסתרו מהלקוח'
            : `${matches.length} תמונות מעובדות הועלו — התמונות הרגילות הוסתרו מהלקוח`
        )
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'העלאה נכשלה')
      } finally {
        setIsUploading(false)
        setProgress(0)
      }
    },
    [galleryId, userId, selectedPhotos, pendingCount, router]
  )

  if (selectedPhotos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-[--muted]">
          אין תמונות שנבחרו לעיבוד — הלקוח צריך לסמן ✨ תחילה
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="muted">
          {uploadedCount}/{selectedPhotos.length} מעובדות הועלו
        </Badge>
        {pendingCount > 0 ? (
          <span className="text-[--muted]">{pendingCount} ממתינות</span>
        ) : (
          <span className="text-[--muted]">הכל הועלה ✓</span>
        )}
      </div>

      {isUploading ? (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-center text-sm text-[--muted]">מעלה תמונות מעובדות...</p>
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(event) =>
          event.key === 'Enter' && !isUploading && inputRef.current?.click()
        }
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          if (!isUploading) uploadFiles(event.dataTransfer.files)
        }}
        className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[--border] bg-[--background] p-8 text-center transition-shadow hover:shadow-md"
      >
        {isUploading ? (
          <Loader2 className="h-10 w-10 animate-spin text-[--muted]" />
        ) : (
          <ImagePlus className="h-10 w-10 text-[--muted]" />
        )}
        <p className="text-sm text-[--muted]">
          גררי את כל התמונות המעובדות לכאן
        </p>
        <p className="text-xs text-[--muted]">
          הקבצים ישויכו לפי סדר השמות · התמונות הרגילות יוסתרו מהלקוח אוטומטית
        </p>
        <Badge variant="muted">JPEG, PNG, WebP · העלאה מרוכזת</Badge>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading}
          onChange={(event) => {
            if (event.target.files?.length) uploadFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
