'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trash2,
  CloudUpload,
  Filter,
  Plus,
  ArrowRight,
  Rocket,
  CheckCircle2,
  X,
  Edit3,
  RefreshCw,
  Image as ImageIcon,
  Hourglass,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { GalleryUploadCallbacks } from '@/lib/gallery-upload-client'
import {
  formatGalleryUploadCount,
  uploadGalleryPhotosWithQueue,
  type GalleryUploadProgress,
} from '@/lib/gallery-upload-client'
import { deletePhotosBulk, setPhotosVisibilityBulk, setPhotosProcessedBulk } from '@/lib/actions/photo.actions'
import { updateGalleryStatus } from '@/lib/actions/gallery.actions'
import { PUBLIC_ONLY_MVP, MVP_GALLERY_DB_STATUS, MAX_PUBLIC_GALLERY_PHOTOS, getRemainingPublicGalleryPhotoSlots, buildPublicGalleryPhotoLimitError } from '@/lib/types/app.types'
import { GalleryUploadProgressBar } from '@/components/gallery/GalleryUploadProgressBar'
import {
  GalleryGrid,
  type PendingGalleryPhoto,
} from '@/components/gallery/GalleryGrid'
import { Button } from '@/components/ui/button'
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
  applyAutoWatermark?: boolean
  photos: Photo[]
  signedUrls: Record<string, string>
  showWizardHeader?: boolean
  showWizardFooter?: boolean
  initialPhotoLimit?: number
}

export function GalleryPhotosSection({
  galleryId,
  userId,
  watermarkText,
  applyAutoWatermark = true,
  photos,
  signedUrls,
  showWizardHeader = true,
  showWizardFooter = true,
  initialPhotoLimit = 20,
}: GalleryPhotosSectionProps) {
  const router = useRouter()
  const objectUrlsRef = useRef<string[]>([])
  const [pendingPhotos, setPendingPhotos] = useState<PendingGalleryPhoto[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processedSelectedIds, setProcessedSelectedIds] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<GalleryUploadProgress | null>(null)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  // MVP: public-only — force uploads to "מעובדות" (final/public) photos only.
  const [activeTab, setActiveTab] = useState<'regular' | 'processed'>(
    PUBLIC_ONLY_MVP ? 'processed' : 'regular'
  )
  const activeTabRef = useRef<'regular' | 'processed'>(
    PUBLIC_ONLY_MVP ? 'processed' : 'regular'
  )

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
    [clearPending]
  )

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const selected = Array.from(fileList).filter((file) =>
        file.type.startsWith('image/')
      )
      if (selected.length === 0) {
        toast.error('יש לבחור קבצי תמונה')
        return
      }

      const limitError = buildPublicGalleryPhotoLimitError(photos.length, selected.length)
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

        console.log('👉 About to upload photos, activeTab:', activeTab, 'activeTabRef:', activeTabRef.current, 'isProcessed:', activeTabRef.current === 'processed')
        const result = await uploadGalleryPhotosWithQueue(
          galleryId,
          userId,
          selected,
          watermarkText,
          setUploadProgress,
          uploadCallbacks,
          activeTabRef.current === 'processed',
          applyAutoWatermark
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
    [galleryId, userId, watermarkText, applyAutoWatermark, uploadCallbacks, router, photos.length]
  )

  const regularPhotos = useMemo(
    () => photos.filter(photo => !photo.is_processed),
    [photos]
  )

  const processedPhotos = useMemo(
    () => photos.filter(photo => photo.is_processed),
    [photos]
  )

  const currentPhotos = activeTab === 'regular' ? regularPhotos : processedPhotos
  const currentSelectedIds = activeTab === 'regular' ? selectedIds : processedSelectedIds
  const setCurrentSelectedIds = activeTab === 'regular' ? setSelectedIds : setProcessedSelectedIds

  const visiblePhotoIds = useMemo(
    () => currentPhotos.map((photo) => photo.id),
    [currentPhotos]
  )

  const allSelected =
    visiblePhotoIds.length > 0 &&
    visiblePhotoIds.every((id) => currentSelectedIds.has(id))

  function toggleSelectAll() {
    if (allSelected) {
      setCurrentSelectedIds(new Set())
      return
    }
    setCurrentSelectedIds(new Set(visiblePhotoIds))
  }

  function togglePhotoSelected(photoId: string) {
    setCurrentSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }

  function bulkSetVisibility(visible: boolean) {
    const ids = Array.from(currentSelectedIds)
    if (ids.length === 0) {
      toast.error('בחרי תמונות קודם')
      return
    }

    startTransition(async () => {
      try {
        await setPhotosVisibilityBulk(galleryId, ids, visible)
        toast.success(visible ? 'התמונות גלויות ללקוח' : 'התמונות הוסתרו מהלקוח')
        setCurrentSelectedIds(new Set())
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function bulkSetProcessed(processed: boolean) {
    const ids = Array.from(currentSelectedIds)
    if (ids.length === 0) {
      toast.error('בחרי תמונות קודם')
      return
    }

    startTransition(async () => {
      try {
        await setPhotosProcessedBulk(galleryId, ids, processed)
        toast.success(processed ? 'התמונות סומנו כמעובדות' : 'התמונות סומנו כרגילות')
        setCurrentSelectedIds(new Set())
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function deleteSelectedPhotos() {
    const ids = Array.from(currentSelectedIds)
    if (ids.length === 0) {
      toast.error('בחרי תמונות קודם')
      return
    }

    startTransition(async () => {
      try {
        await deletePhotosBulk(galleryId, ids)
        toast.success(`${ids.length} תמונות נמחקו`)
        setCurrentSelectedIds(new Set())
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
    setDeleteDialogOpen(false)
  }

  function handlePublishGallery() {
    startTransition(async () => {
      try {
        await updateGalleryStatus(
          galleryId,
          PUBLIC_ONLY_MVP ? MVP_GALLERY_DB_STATUS : 'selection'
        )
        toast.success(PUBLIC_ONLY_MVP ? 'הגלריה פורסמה!' : 'הגלריה נשלחה ללקוח!')
        router.push('/dashboard/galleries')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שליחת הגלריה נכשלה')
      }
    })
  }

  function handleSaveAsDraft() {
    startTransition(async () => {
      try {
        await updateGalleryStatus(galleryId, 'draft')
        toast.success('הגלריה נשמרה כטיוטה')
        router.push('/dashboard/galleries')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שמירת הגלריה נכשלה')
      }
    })
  }

  function handleBack() {
    router.push('/dashboard/galleries')
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

  // Calculate which photos to show based on limit and state
  const displayPhotos = showAllPhotos ? currentPhotos : currentPhotos.slice(0, initialPhotoLimit)
  const hasMorePhotos = currentPhotos.length > initialPhotoLimit
  const shouldShowToggleButton = currentPhotos.length > 0
  const remainingPhotoSlots = getRemainingPublicGalleryPhotoSlots(photos.length)
  const atPhotoLimit = remainingPhotoSlots === 0

  return (
    <div className={showWizardHeader ? 'min-h-screen bg-[#fdf8fa]' : 'bg-transparent'}>
      {/* Header / Progress Indicator */}
      {showWizardHeader && (
        <header className="bg-white px-4 py-4 sm:px-6 md:px-10 md:py-6 border-b border-[#c9c5cd] flex flex-col gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#100d1f]">אשף יצירת גלריה</h2>
            <p className="text-[#48464c] text-sm sm:text-base">שלב 4 מתוך 4: העלאת תמונות ופרסום</p>
          </div>
          {/* Step Progress Dots */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 w-full">
            <div className="flex shrink-0 flex-col items-center gap-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#100d1f] text-white flex items-center justify-center text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-[9px] sm:text-[10px] text-[#48464c] font-semibold whitespace-nowrap">פרטים</span>
            </div>
            <div className="w-6 sm:w-12 h-[2px] bg-[#100d1f] shrink-0"></div>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#100d1f] text-white flex items-center justify-center text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-[9px] sm:text-[10px] text-[#48464c] font-semibold whitespace-nowrap">עיצוב</span>
            </div>
            <div className="w-6 sm:w-12 h-[2px] bg-[#100d1f] shrink-0"></div>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#100d1f] text-white flex items-center justify-center text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-[9px] sm:text-[10px] text-[#48464c] font-semibold whitespace-nowrap">פרטיות</span>
            </div>
            <div className="w-6 sm:w-12 h-[2px] bg-[#100d1f] shrink-0"></div>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#100d1f] text-white flex items-center justify-center text-xs border-2 border-[#100d1f]">
                4
              </div>
              <span className="text-[9px] sm:text-[10px] text-[#100d1f] font-bold whitespace-nowrap">העלאה</span>
            </div>
          </div>
        </header>
      )}

      <section
        className={`flex-1 max-w-[1600px] mx-auto w-full ${
          showWizardHeader ? 'p-4 sm:p-6 md:p-10' : 'p-0'
        }`}
      >
        <div className="space-y-6 sm:space-y-8">
          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed border-[#c9c5cd] bg-white rounded-xl p-6 sm:p-10 md:p-16 flex flex-col items-center justify-center text-center transition-all duration-300 group ${
              atPhotoLimit || isUploading
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:bg-[#f7f2f4]'
            }`}
            onClick={() => {
              if (atPhotoLimit || isUploading) return
              fileInputRef.current?.click()
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (atPhotoLimit || isUploading) return
              uploadFiles(e.dataTransfer.files)
            }}
          >
            {isUploading ? (
              <Loader2 className="w-14 h-14 sm:w-20 sm:h-20 animate-spin text-[#100d1f] mb-4 sm:mb-6" />
            ) : (
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[#ebe7e9] flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <CloudUpload className="w-7 h-7 sm:w-10 sm:h-10 text-[#100d1f]" />
              </div>
            )}
            <h3 className="text-sm sm:text-base font-semibold text-[#100d1f] mb-2">
              {isUploading ? 'מעלה תמונות...' : 'גררו תמונות לכאן או לחצו לבחירה'}
            </h3>
            <p className="text-[#48464c] text-sm sm:text-base max-w-sm px-2">
              {atPhotoLimit
                ? `הגעת למקסימום ${MAX_PUBLIC_GALLERY_PHOTOS} תמונות בגלריה ציבורית`
                : `תמיכה בפורמטים JPG, PNG ו-RAW. נותרו ${remainingPhotoSlots} תמונות (מקסימום ${MAX_PUBLIC_GALLERY_PHOTOS} בגלריה).`}
            </p>
            <button
              className="mt-4 sm:mt-6 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border border-[#100d1f] text-[#100d1f] rounded-xl font-semibold hover:bg-[#100d1f] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                e.stopPropagation()
                if (atPhotoLimit || isUploading) return
                fileInputRef.current?.click()
              }}
              disabled={isUploading || atPhotoLimit}
            >
              {isUploading ? 'מעלה...' : 'בחירת קבצים מהמחשב'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={isUploading || atPhotoLimit}
              onChange={(e) => {
                if (e.target.files?.length) uploadFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {/* Upload Progress Bar */}
          {isUploading && uploadProgress ? (
            <GalleryUploadProgressBar progress={uploadProgress} />
          ) : null}

          {/* Upload Grid */}
          <div className="space-y-4">
            {activeTab === 'regular' && !PUBLIC_ONLY_MVP && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <span className="font-semibold">⚠️ לתשומת לב:</span> כדי להעלות תמונות מעובדות, עבר/י לטאב &quot;מעובדות&quot; למטה
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm sm:text-base font-semibold text-[#100d1f]">
                תמונות {activeTab === 'regular' ? 'רגילות' : 'מעובדות'} ({currentPhotos.length})
              </h4>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeTab === 'regular' ? 'default' : 'outline'}
                  size="sm"
                  disabled={PUBLIC_ONLY_MVP}
                  onClick={() => {
                    if (PUBLIC_ONLY_MVP) return
                    setActiveTab('regular')
                    activeTabRef.current = 'regular'
                  }}
                  className={`min-w-[7.5rem] flex-1 sm:flex-none ${activeTab === 'regular' ? 'bg-[#6b2d43] hover:bg-[#5a2538]' : 'border-[#c9c5cd] hover:bg-[#f7f2f4]'} ${PUBLIC_ONLY_MVP ? 'opacity-35 pointer-events-none cursor-not-allowed' : ''}`}
                >
                  רגילות ({regularPhotos.length})
                </Button>
                <Button
                  variant={activeTab === 'processed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setActiveTab('processed')
                    activeTabRef.current = 'processed'
                  }}
                  className={`min-w-[7.5rem] flex-1 sm:flex-none ${activeTab === 'processed' ? 'bg-[#6b2d43] hover:bg-[#5a2538]' : 'border-[#c9c5cd] hover:bg-[#f7f2f4]'}`}
                >
                  מעובדות ({processedPhotos.length})
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="border-[#c9c5cd] hover:bg-[#f7f2f4] text-xs"
                >
                  {allSelected ? 'בטל בחירה' : 'בחר הכל'}
                </Button>
                {currentSelectedIds.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkSetVisibility(true)}
                      className="border-green-300 hover:bg-green-50 text-green-600 text-xs"
                    >
                      הצג ללקוח
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkSetVisibility(false)}
                      className="border-blue-300 hover:bg-blue-50 text-blue-600 text-xs"
                    >
                      הסתר מלקוח
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="border-red-300 hover:bg-red-50 text-red-600 text-xs"
                    >
                      מחק נבחרים ({currentSelectedIds.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div>
              <div
                className={`transition-all duration-500 ease-in-out relative ${
                  showAllPhotos ? 'max-h-none' : 'max-h-[300px] overflow-hidden'
                }`}
              >
                <GalleryGrid
                  photos={displayPhotos}
                  signedUrls={signedUrls}
                  pendingPhotos={pendingPhotos}
                  selectedIds={currentSelectedIds}
                  onToggleSelect={togglePhotoSelected}
                />
                {!showAllPhotos && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white to-transparent" />
                )}
              </div>
              {shouldShowToggleButton && !showAllPhotos && (
                <div className="flex justify-center -mt-12 relative z-10">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllPhotos(true)}
                    className="bg-white hover:bg-[#f7f2f4] border-[#c9c5cd] shadow-sm"
                  >
                    הצג את כל התמונות ({currentPhotos.length})
                  </Button>
                </div>
              )}
              {shouldShowToggleButton && showAllPhotos && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllPhotos(false)}
                    className="bg-white hover:bg-[#f7f2f4] border-[#c9c5cd] shadow-sm"
                  >
                    הסתר תמונות / כווץ תצוגה
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Fixed Bottom Action Bar */}
      {showWizardFooter && (
        <footer className="mt-auto bg-white border-t border-[#c9c5cd] px-4 py-4 sm:px-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sticky bottom-0 z-10 backdrop-blur-md bg-opacity-90">
          <button
            onClick={handleBack}
            className="w-full sm:w-auto px-6 py-3 border border-[#c9c5cd] text-[#100d1f] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#f7f2f4] transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            חזרה לרשימה
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
            <button
              onClick={handleSaveAsDraft}
              disabled={isPending}
              className="w-full sm:w-auto px-6 py-3 text-[#48464c] font-bold hover:text-[#100d1f] transition-colors disabled:opacity-50"
            >
              שמור כטיוטה
            </button>
            <button
              onClick={handlePublishGallery}
              disabled={isPending}
              className="w-full sm:w-auto bg-[#7D3A52] text-white px-6 sm:px-12 py-3 rounded-xl font-bold text-base sm:text-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              סיום ופרסום הגלריה
              <Rocket className="w-5 h-5" />
            </button>
          </div>
        </footer>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            מחיקת תמונות
          </DialogTitle>
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
              onClick={deleteSelectedPhotos}
            >
              מחק תמונות
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
