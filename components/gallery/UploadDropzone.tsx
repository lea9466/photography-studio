'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  formatGalleryUploadCount,
  uploadGalleryPhotosWithQueue,
  type GalleryUploadCallbacks,
  type GalleryUploadProgress,
} from '@/lib/gallery-upload-client'
import { GalleryUploadProgressBar } from '@/components/gallery/GalleryUploadProgressBar'
import { Badge } from '@/components/ui/badge'

type UploadDropzoneProps = {
  galleryId: string
  userId: string
  watermarkText?: string | null
  uploadCallbacks?: GalleryUploadCallbacks
}

export function UploadDropzone({
  galleryId,
  userId,
  watermarkText,
  uploadCallbacks,
}: UploadDropzoneProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] =
    useState<GalleryUploadProgress | null>(null)

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch (err) {
      console.warn('Wake Lock request failed:', err)
    }
  }, [])

  const startSilentAudio = useCallback(() => {
    try {
      const audio = new Audio()
      audio.src =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='
      audio.loop = true
      audio.volume = 0.01
      audio.play().catch(() => {
        // Audio play failed (likely due to autoplay policy)
      })
      audioRef.current = audio
    } catch (err) {
      console.warn('Silent audio fallback failed:', err)
    }
  }, [])

  const releaseKeepAlive = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isUploading) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    requestWakeLock()
    startSilentAudio()

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      releaseKeepAlive()
    }
  }, [isUploading, requestWakeLock, startSilentAudio, releaseKeepAlive])

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const selected = Array.from(fileList).filter((file) =>
        file.type.startsWith('image/')
      )
      if (selected.length === 0) {
        toast.error('יש לבחור קבצי תמונה')
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

        const result = await uploadGalleryPhotosWithQueue(
          galleryId,
          userId,
          selected,
          watermarkText,
          setUploadProgress,
          uploadCallbacks
        )

        if (result.ok) {
          toast.success(
            result.uploaded === 1
              ? 'תמונה אחת הועלתה'
              : `${formatGalleryUploadCount(result.uploaded)} תמונות הועלו לגלריה`
          )
          router.refresh()
          uploadCallbacks?.onComplete?.()
        } else {
          toast.error(result.message ?? 'שגיאה בהעלאת תמונות')
          if (result.uploaded > 0) {
            router.refresh()
            uploadCallbacks?.onComplete?.()
          }
        }
      } catch {
        toast.error('שגיאה בהעלאת תמונות')
      } finally {
        setIsUploading(false)
        setUploadProgress(null)
      }
    },
    [galleryId, userId, watermarkText] // Remove router and uploadCallbacks to prevent infinite loop
  )

  return (
    <div className="space-y-4">
      {isUploading && uploadProgress ? (
        <GalleryUploadProgressBar progress={uploadProgress} />
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) =>
          e.key === 'Enter' && !isUploading && inputRef.current?.click()
        }
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (!isUploading) uploadFiles(e.dataTransfer.files)
        }}
        className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[--border] bg-[--background] p-8 text-center transition-shadow hover:shadow-md"
      >
        {isUploading ? (
          <Loader2 className="h-10 w-10 animate-spin text-[--muted]" />
        ) : (
          <ImagePlus className="h-10 w-10 text-[--muted]" />
        )}
        <p className="text-sm text-[--muted]">
          גררי תמונות לכאן או לחצי להעלאה
        </p>
        <Badge variant="muted">JPEG, PNG, WebP · העלאה מקבילית מהירה</Badge>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading}
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
