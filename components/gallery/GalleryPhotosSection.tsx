'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trash2,
  CloudUpload,
  Filter,
  Plus,
  Info,
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
import { fetchGalleryDetail } from '@/lib/actions/gallery.actions'

type GalleryPhotosSectionProps = {
  galleryId: string
  userId: string
  watermarkText?: string | null
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [galleryTitle, setGalleryTitle] = useState<string>('')
  const [galleryDate, setGalleryDate] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<GalleryUploadProgress | null>(null)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [viewFilter, setViewFilter] = useState<'all' | 'processed'>('all')

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [])

  // Fetch gallery details for sidebar
  useEffect(() => {
    const fetchGalleryInfo = async () => {
      try {
        const galleryData = await fetchGalleryDetail(galleryId)
        if (galleryData) {
          setGalleryTitle(galleryData.title || '')
          setGalleryDate(galleryData.created_at ? new Date(galleryData.created_at).toLocaleDateString('he-IL') : '')
        }
      } catch (error) {
        console.error('Failed to fetch gallery details:', error)
      }
    }
    fetchGalleryInfo()
  }, [galleryId])

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
    [galleryId, userId, watermarkText, uploadCallbacks, router]
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

  function bulkSetProcessed(processed: boolean) {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) {
      toast.error('בחרי תמונות קודם')
      return
    }

    startTransition(async () => {
      try {
        await setPhotosProcessedBulk(galleryId, ids, processed)
        toast.success(processed ? 'התמונות סומנו כמעובדות' : 'התמונות סומנו כרגילות')
        setSelectedIds(new Set())
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
        await deletePhotosBulk(galleryId, ids)
        toast.success(`${ids.length} תמונות נמחקו`)
        setSelectedIds(new Set())
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
        await updateGalleryStatus(galleryId, 'selection')
        toast.success('הגלריה נשלחה ללקוח!')
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

  const totalPhotos = photos.length + activePendingCount
  const storageUsage = Math.round((totalPhotos * 5.9) / 1024 * 10) / 10 // Approximate 5.9MB per photo
  const storagePercentage = (storageUsage / 10240) * 100 // 10GB = 10240MB

  // Calculate which photos to show based on limit and state
  const displayPhotos = showAllPhotos ? photos : photos.slice(0, initialPhotoLimit)
  const hasMorePhotos = photos.length > initialPhotoLimit
  const shouldShowToggleButton = photos.length > 0

  // Filter photos based on view filter
  const filteredPhotos = useMemo(() => {
    if (viewFilter === 'processed') {
      return photos.filter(photo => photo.is_processed)
    }
    return photos
  }, [photos, viewFilter])
  const displayFilteredPhotos = showAllPhotos ? filteredPhotos : filteredPhotos.slice(0, initialPhotoLimit)

  return (
    <div className="min-h-screen bg-[#fdf8fa]">
      {/* Header / Progress Indicator */}
      {showWizardHeader && (
        <header className="bg-white px-10 py-6 border-b border-[#c9c5cd] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#100d1f]">אשף יצירת גלריה</h2>
            <p className="text-[#48464c] text-base">שלב 4 מתוך 4: העלאת תמונות ופרסום</p>
          </div>
          {/* Step Progress Dots */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#100d1f] text-white flex items-center justify-center text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#48464c] font-semibold">פרטים</span>
            </div>
            <div className="w-12 h-[2px] bg-[#100d1f]"></div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#100d1f] text-white flex items-center justify-center text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#48464c] font-semibold">עיצוב</span>
            </div>
            <div className="w-12 h-[2px] bg-[#100d1f]"></div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#100d1f] text-white flex items-center justify-center text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#48464c] font-semibold">פרטיות</span>
            </div>
            <div className="w-12 h-[2px] bg-[#100d1f]"></div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#100d1f] text-white flex items-center justify-center text-xs border-2 border-[#100d1f]">
                4
              </div>
              <span className="text-[10px] text-[#100d1f] font-bold">העלאה</span>
            </div>
          </div>
        </header>
      )}

      <section className="flex-1 p-10 grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        {/* Left Column: Upload Area & Grid (Main) */}
        <div className="xl:col-span-9 space-y-8">
          {/* Drag & Drop Zone */}
          <div
            className="border-2 border-dashed border-[#c9c5cd] bg-white rounded-xl p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f7f2f4] transition-all duration-300 group"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              uploadFiles(e.dataTransfer.files)
            }}
          >
            {isUploading ? (
              <Loader2 className="w-20 h-20 animate-spin text-[#100d1f] mb-6" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#ebe7e9] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CloudUpload className="w-10 h-10 text-[#100d1f]" />
              </div>
            )}
            <h3 className="text-base font-semibold text-[#100d1f] mb-2">
              {isUploading ? 'מעלה תמונות...' : 'גררו תמונות לכאן או לחצו לבחירה'}
            </h3>
            <p className="text-[#48464c] text-base max-w-sm">תמיכה בפורמטים JPG, PNG ו-RAW. ניתן להעלות עד 100 קבצים בו זמנית (מקסימום 50MB לקובץ).</p>
            <button
              className="mt-6 px-8 py-4 border border-[#100d1f] text-[#100d1f] rounded-xl font-semibold hover:bg-[#100d1f] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              disabled={isUploading}
            >
              {isUploading ? 'מעלה...' : 'בחירת קבצים מהמחשב'}
            </button>
            <input
              ref={fileInputRef}
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

          {/* Upload Progress Bar */}
          {isUploading && uploadProgress ? (
            <GalleryUploadProgressBar progress={uploadProgress} />
          ) : null}

          {/* Upload Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-[#100d1f]">תמונות שהועלו ({totalPhotos})</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="border-[#c9c5cd] hover:bg-[#f7f2f4] text-xs"
                >
                  {allSelected ? 'בטל בחירה' : 'בחר הכל'}
                </Button>
                {selectedIds.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkSetProcessed(true)}
                      className="border-green-300 hover:bg-green-50 text-green-600 text-xs"
                    >
                      סמן כמעובד
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkSetProcessed(false)}
                      className="border-blue-300 hover:bg-blue-50 text-blue-600 text-xs"
                    >
                      סמן כרגיל
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="border-red-300 hover:bg-red-50 text-red-600 text-xs"
                    >
                      מחק נבחרים ({selectedIds.size})
                    </Button>
                  </>
                )}
                <div className="flex items-center gap-2 border-r border-[#c9c5cd] pr-2">
                  <span className="text-xs text-[#48464c]">צפה:</span>
                  <Button
                    variant={viewFilter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('all')}
                    className={viewFilter === 'all' ? 'bg-[#6b2d43] hover:bg-[#5a2538]' : 'hover:bg-[#f7f2f4] text-xs'}
                  >
                    הכל
                  </Button>
                  <Button
                    variant={viewFilter === 'processed' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('processed')}
                    className={viewFilter === 'processed' ? 'bg-[#6b2d43] hover:bg-[#5a2538]' : 'hover:bg-[#f7f2f4] text-xs'}
                  >
                    מעובד
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <div
                className={`transition-all duration-500 ease-in-out relative ${
                  showAllPhotos ? 'max-h-none' : 'max-h-[300px] overflow-hidden'
                }`}
              >
                <GalleryGrid
                  photos={displayFilteredPhotos}
                  signedUrls={signedUrls}
                  pendingPhotos={pendingPhotos}
                  selectedIds={selectedIds}
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
                    הצג את כל התמונות ({filteredPhotos.length})
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

        {/* Right Column: Sidebar / Summary */}
        <aside className="xl:col-span-3 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl border border-[#c9c5cd] p-6 shadow-sm">
            <h5 className="text-base font-semibold text-[#100d1f] mb-4">סיכום העלאה</h5>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-base">
                <span className="text-[#48464c]">סה"כ תמונות:</span>
                <span className="font-bold">{totalPhotos}</span>
              </div>
              <div className="flex justify-between items-center text-base">
                <span className="text-[#48464c]">נפח אחסון:</span>
                <span className="font-bold">{storageUsage} MB</span>
              </div>
              <div className="pt-4 border-t border-[#c9c5cd]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold">ניצול אחסון (חבילת פרימיום)</span>
                  <span className="text-xs text-[#48464c]">{storageUsage}MB / 10GB</span>
                </div>
                <div className="w-full bg-[#ebe7e9] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#7D3A52] h-full" style={{width: `${storagePercentage}%`}}></div>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-[#f7f2f4] p-4 rounded-lg">
                <Info className="w-5 h-5 text-[#7D3A52]" />
                <p className="text-xs text-[#48464c]">זכור: פרסום הגלריה ישלח הודעת עדכון ללקוח המקושר אוטומטית.</p>
              </div>
            </div>
          </div>

          {/* Gallery Details Quick View */}
          <div className="bg-white rounded-xl border border-[#c9c5cd] p-6 shadow-sm">
            <h5 className="text-base font-semibold text-[#100d1f] mb-4">פרטי גלריה</h5>
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-xs text-[#48464c]">שם הגלריה</span>
                <span className="text-base font-semibold">{galleryTitle || 'לא צוין'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#48464c]">תאריך אירוע</span>
                <span className="text-base font-semibold">{galleryDate || 'לא צוין'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#48464c]">סטטוס נוכחי</span>
                <span className="inline-flex items-center gap-2 text-xs font-bold text-[#7D3A52]">
                  <span className="w-2 h-2 rounded-full bg-[#7D3A52]"></span>
                  טיוטה
                </span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* Fixed Bottom Action Bar */}
      {showWizardFooter && (
        <footer className="mt-auto bg-white border-t border-[#c9c5cd] px-10 py-4 flex items-center justify-between sticky bottom-0 z-10 backdrop-blur-md bg-opacity-90">
          <button
            onClick={handleBack}
            className="px-6 py-3 border border-[#c9c5cd] text-[#100d1f] rounded-xl font-bold flex items-center gap-2 hover:bg-[#f7f2f4] transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            חזרה לדאשבורד
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveAsDraft}
              disabled={isPending}
              className="px-6 py-3 text-[#48464c] font-bold hover:text-[#100d1f] transition-colors disabled:opacity-50"
            >
              שמור כטיוטה
            </button>
            <button
              onClick={handlePublishGallery}
              disabled={isPending}
              className="bg-[#7D3A52] text-white px-12 py-3 rounded-xl font-bold text-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
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
