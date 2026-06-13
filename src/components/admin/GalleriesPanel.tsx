'use client'

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  bulkDeleteImagesAction,
  deleteAlbumAction,
  deleteAllAlbumImagesAction,
  deleteImageAction,
  saveAlbumAction,
  type ActionResult,
} from '@/app/admin/actions'
import type { AlbumWithClient } from '@/lib/admin-db'
import type { ClientsRow, ImagesRow } from '@/lib/database.types'
import AdminImagePreview from './AdminImagePreview'
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCheckbox,
  AdminEmpty,
  AdminField,
  AdminFileInput,
  AdminInfoBox,
  AdminMessage,
  AdminPanelToolbar,
  AdminSectionHeading,
  AdminSelect,
  toDatetimeLocal,
} from './admin-ui'
import type { ThemeStyle } from '@/lib/theme-styles'
import CopyLink from './CopyLink'
import GalleryUploadProgressBar from './GalleryUploadProgressBar'
import AdminClientSelectionsGrid from './AdminClientSelectionsGrid'
import GalleryGridImage from '@/components/GalleryGridImage'
import { resolveGalleryMediaUrls } from '@/lib/gallery-media-urls'
import { useIncrementalReveal } from '@/lib/useIncrementalReveal'
import {
  buildAdminBulkDownloadUrl,
  cleanupAlbumPendingImages,
  formatGalleryUploadCount,
  MAX_BULK_DOWNLOAD,
  RECOMMENDED_UPLOAD_BATCH,
  UPLOAD_CONCURRENCY,
  uploadGalleryImagesResume,
  uploadGalleryImagesWithQueue,
  uploadAlbumCoverFromBrowser,
  type GalleryUploadProgress,
} from '@/lib/gallery-upload-client'
import { thumbnailWorkerPoolSize } from '@/lib/gallery-thumbnail-compress'

const initial: ActionResult = { ok: false, message: '' }
const MAX_UPLOAD_MB = 50

const STATUS_OPTIONS = [
  { value: 'draft', label: 'טיוטה (הלקוח עדיין לא בוחר)' },
  { value: 'active', label: 'פעיל (הלקוח בוחר תמונות)' },
  { value: 'expired', label: 'פג תוקף' },
]

function DeletingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/55 text-white">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"
        aria-hidden
      />
      <span className="text-xs font-medium">מחיקה בתהליך...</span>
    </div>
  )
}

function PendingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-amber-500/35">
      <span className="rounded-full bg-amber-700 px-2 py-0.5 text-[10px] font-medium text-white">
        ממתינה להעלאה
      </span>
    </div>
  )
}

function AlbumImagesSection({
  albumId,
  photographerId,
  images,
  selectionsByImage,
  disabled,
  r2Ready,
  r2Message,
}: {
  albumId: string
  photographerId?: string | null
  images: ImagesRow[]
  selectionsByImage: Record<string, string[]>
  disabled?: boolean
  r2Ready: boolean
  r2Message: string
}) {
  const router = useRouter()
  const [uploadState, setUploadState] = useState<ActionResult>(initial)
  const [uploadPending, setUploadPending] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<GalleryUploadProgress | null>(
    null
  )
  const [deleteState, setDeleteState] = useState<ActionResult>(initial)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteAllState, setDeleteAllState] = useState<ActionResult>(initial)
  const [deleteAllPending, setDeleteAllPending] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkPending, setBulkPending] = useState(false)
  const [bulkState, setBulkState] = useState<ActionResult>(initial)
  const [cleanupPending, setCleanupPending] = useState(false)
  const [cleanupState, setCleanupState] = useState<ActionResult>(initial)
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const { count, sentinelRef } = useIncrementalReveal(images.length)
  const sectionRef = useRef<HTMLDivElement>(null)

  const pendingImages = images.filter((img) => img.status === 'pending')
  const pendingCount = pendingImages.length
  const readyCount = images.filter((img) => img.status === 'ready').length
  const selectableImages = images.filter((img) => img.status !== 'deleting')
  const deletingCount = images.length - selectableImages.length
  const allSelectableSelected =
    selectableImages.length > 0 &&
    selectableImages.every((img) => selectedIds.has(img.id))

  useEffect(() => {
    if (
      uploadState.ok ||
      deleteState.ok ||
      deleteAllState.ok ||
      bulkState.ok ||
      cleanupState.ok
    ) {
      router.refresh()
    }
  }, [
    uploadState.ok,
    deleteState.ok,
    deleteAllState.ok,
    bulkState.ok,
    cleanupState.ok,
    router,
  ])

  useEffect(() => {
    if (deletingCount === 0) return
    const interval = window.setInterval(() => router.refresh(), 3000)
    return () => window.clearInterval(interval)
  }, [deletingCount, router])

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(selectableImages.map((img) => img.id))
      const next = new Set([...prev].filter((id) => valid.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [images])

  useEffect(() => {
    if (!uploadPending) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const t = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => window.clearTimeout(t)
  }, [uploadPending])

  useEffect(() => {
    if (!uploadPending) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [uploadPending])

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled || uploadPending) return

    if (!r2Ready) {
      setUploadState({ ok: false, message: r2Message })
      return
    }

    const form = event.currentTarget
    const rawFiles = Array.from(
      form.querySelector<HTMLInputElement>('input[name="gallery_files"]')?.files ??
        []
    ).filter((f) => f.size > 0)

    if (rawFiles.length === 0) {
      setUploadState({ ok: false, message: 'לא נבחרו תמונות להעלאה' })
      return
    }

    if (rawFiles.length > RECOMMENDED_UPLOAD_BATCH) {
      const label = rawFiles.length.toLocaleString('he-IL')
      const limit = RECOMMENDED_UPLOAD_BATCH.toLocaleString('he-IL')
      if (
        !window.confirm(
          `נבחרו ${label} תמונות.\nהמערכת תעלה אותן אוטומטית במנות של ${limit} כדי לשמור על זיכרון נמוך בדפדפן.\nלהמשיך?`
        )
      ) {
        return
      }
    }

    setUploadPending(true)
    setUploadProgress({
      completed: 0,
      staged: 0,
      total: rawFiles.length,
      phase: 'preparing',
    })
    setUploadState(initial)

    try {
      const result = await uploadGalleryImagesWithQueue(
        albumId,
        rawFiles,
        setUploadProgress
      )

      if (result.ok) {
        setUploadState({
          ok: true,
          message:
            result.uploaded === 1
              ? 'תמונה אחת הועלתה'
              : `${formatGalleryUploadCount(result.uploaded)} תמונות הועלו לגלריה`,
        })
        form.reset()
        router.refresh()
      } else {
        setUploadState({ ok: false, message: result.message })
        if (result.uploaded > 0) router.refresh()
      }
    } catch {
      setUploadState({ ok: false, message: 'שגיאה בהעלאת תמונות' })
    } finally {
      setUploadPending(false)
      setUploadProgress(null)
    }
  }

  async function handleResumeUpload(files: File[]) {
    if (disabled || uploadPending || !r2Ready) return

    const rawFiles = files.filter((f) => f.size > 0)
    if (rawFiles.length === 0) {
      setUploadState({ ok: false, message: 'לא נבחרו תמונות להמשך העלאה' })
      return
    }

    setUploadPending(true)
    setUploadProgress({
      completed: 0,
      staged: rawFiles.length,
      total: rawFiles.length,
      phase: 'preparing',
    })
    setUploadState(initial)

    try {
      const result = await uploadGalleryImagesResume(
        albumId,
        rawFiles,
        setUploadProgress
      )

      if (result.ok) {
        setUploadState({
          ok: true,
          message:
            result.uploaded === 1
              ? 'תמונה אחת הושלמה'
              : `${formatGalleryUploadCount(result.uploaded)} תמונות הושלמו`,
        })
        if (resumeInputRef.current) resumeInputRef.current.value = ''
        router.refresh()
      } else {
        setUploadState({ ok: false, message: result.message })
        if (result.uploaded > 0) router.refresh()
      }
    } catch {
      setUploadState({ ok: false, message: 'שגיאה בהמשך העלאה' })
    } finally {
      setUploadPending(false)
      setUploadProgress(null)
    }
  }

  async function handleCleanupPending() {
    if (disabled || cleanupPending || pendingCount === 0) return

    const label = pendingCount.toLocaleString('he-IL')
    if (
      !window.confirm(
        `לנקות ${label} שורות תלויות?\nשורות אלו נוצרו כשהעלאה נקטעה — אין להן קבצים ב-R2.`
      )
    ) {
      return
    }

    setCleanupPending(true)
    setCleanupState(initial)
    try {
      const result = await cleanupAlbumPendingImages(albumId)
      setCleanupState(
        result.ok
          ? { ok: true, message: result.message }
          : { ok: false, message: result.message }
      )
      if (result.ok) router.refresh()
    } catch {
      setCleanupState({ ok: false, message: 'שגיאה בניקוי שורות תלויות' })
    } finally {
      setCleanupPending(false)
    }
  }

  function handleBulkDownload() {
    const readyIds = Array.from(selectedIds).filter((id) => {
      const img = images.find((row) => row.id === id)
      return img?.status === 'ready'
    })

    if (readyIds.length === 0) {
      setBulkState({ ok: false, message: 'אין תמונות מוכנות להורדה בבחירה' })
      return
    }

    if (readyIds.length > MAX_BULK_DOWNLOAD) {
      setBulkState({
        ok: false,
        message: `ניתן להוריד עד ${MAX_BULK_DOWNLOAD.toLocaleString('he-IL')} תמונות בבקשה אחת`,
      })
      return
    }

    if (readyIds.length < selectedIds.size) {
      if (
        !window.confirm(
          `רק ${readyIds.length.toLocaleString('he-IL')} מתוך ${selectedIds.size.toLocaleString('he-IL')} תמונות מוכנות להורדה. להמשיך?`
        )
      ) {
        return
      }
    }

    window.location.href = buildAdminBulkDownloadUrl(albumId, readyIds)
  }

  function confirmDeleteAll() {
    if (
      !window.confirm(
        `למחוק את כל ${selectableImages.length} התמונות בגלריה?\nהגלריה עצמה תישאר — רק התמונות יימחקו.`
      )
    ) {
      return
    }
    void handleDeleteAll()
  }

  async function handleDeleteAll() {
    if (deleteAllPending || deletePending || bulkPending) return
    setDeleteAllPending(true)
    setDeleteAllState(initial)
    setSelectedIds(new Set())
    try {
      const formData = new FormData()
      formData.set('album_id', albumId)
      const result = await deleteAllAlbumImagesAction(initial, formData)
      setDeleteAllState(result)
      if (result.ok) router.refresh()
    } catch {
      setDeleteAllState({
        ok: false,
        message: 'שגיאת רשת — ייתכן שהשרת לא זמין. נסי שוב.',
      })
    } finally {
      setDeleteAllPending(false)
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (deletePending || deleteAllPending || bulkPending) return
    if (!window.confirm('למחוק תמונה?')) return

    setDeletePending(true)
    setDeleteState(initial)
    try {
      const formData = new FormData()
      formData.set('image_id', imageId)
      formData.set('album_id', albumId)
      const result = await deleteImageAction(initial, formData)
      setDeleteState(result)
      if (result.ok) router.refresh()
    } catch {
      setDeleteState({
        ok: false,
        message: 'שגיאת רשת — ייתכן שהשרת לא זמין. נסי שוב.',
      })
    } finally {
      setDeletePending(false)
    }
  }

  function toggleSelected(imageId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(imageId)) next.delete(imageId)
      else next.add(imageId)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(selectableImages.map((img) => img.id)))
  }

  async function handleBulkDelete() {
    const count = selectedIds.size
    if (count === 0 || bulkPending) return

    const label = count.toLocaleString('he-IL')
    if (
      !window.confirm(
        count === 1
          ? 'למחוק תמונה אחת?'
          : `למחוק ${label} תמונות?\nהמחיקה תתבצע ברקע — התמונות יסומנו כ"מחיקה בתהליך".`
      )
    ) {
      return
    }

    setBulkPending(true)
    setBulkState(initial)
    try {
      const result = await bulkDeleteImagesAction(albumId, Array.from(selectedIds))
      setBulkState(result)
      if (result.ok) setSelectedIds(new Set())
      router.refresh()
    } catch {
      setBulkState({ ok: false, message: 'שגיאה במחיקת התמונות' })
    } finally {
      setBulkPending(false)
    }
  }

  return (
    <AdminCard ref={sectionRef} className="scroll-mt-24 space-y-6">
      {uploadPending && uploadProgress ? (
        <GalleryUploadProgressBar progress={uploadProgress} variant="fixed" />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <AdminSectionHeading
            title={`תמונות בגלריה (${images.length.toLocaleString('he-IL')})`}
            description={
              readyCount > 0
                ? `${readyCount.toLocaleString('he-IL')} מוכנות לצפייה`
                : undefined
            }
          />
          {pendingCount > 0 ? (
            <p className="text-xs text-amber-800">
              {pendingCount.toLocaleString('he-IL')} ממתינות להעלאה — השתמשי ב&quot;המשך העלאה&quot;
            </p>
          ) : null}
          {deletingCount > 0 ? (
            <p className="text-xs text-amber-800">
              {deletingCount.toLocaleString('he-IL')} תמונות במחיקה — הדף מתרענן אוטומטית
            </p>
          ) : null}
        </div>
        {selectableImages.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton
              type="button"
              variant="secondary"
              disabled={disabled || bulkPending}
              onClick={toggleSelectAll}
            >
              {allSelectableSelected ? 'בטלי בחירה' : 'בחרי הכל'}
            </AdminButton>
            <AdminButton
              type="button"
              variant="danger"
              disabled={disabled || deletePending || deleteAllPending || bulkPending}
              onClick={confirmDeleteAll}
            >
              {deleteAllPending ? 'מוחק הכל...' : 'מחק את כל התמונות'}
            </AdminButton>
          </div>
        ) : null}
      </div>

      {pendingCount > 0 ? (
        <AdminInfoBox variant="warning" className="space-y-3">
          <p className="text-sm font-medium text-amber-950">
            העלאה קודמת נקטעה — {pendingCount.toLocaleString('he-IL')} שורות ממתינות
          </p>
          <p className="text-xs text-amber-900/80">
            בחרי בדיוק {pendingCount.toLocaleString('he-IL')} קבצים (באותו סדר אם אפשר) ולחצי
            &quot;המשך העלאה&quot;. לביטול — &quot;נקה שורות תלויות&quot;.
          </p>
          <input
            ref={resumeInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={disabled || uploadPending || cleanupPending || !r2Ready}
            className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-amber-700 file:px-4 file:py-2 file:text-white"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? [])
              if (picked.length > 0) void handleResumeUpload(picked)
            }}
          />
          <div className="flex flex-wrap gap-2">
            <AdminButton
              type="button"
              variant="secondary"
              disabled={disabled || cleanupPending || uploadPending}
              onClick={handleCleanupPending}
            >
              {cleanupPending ? 'מנקה...' : 'נקה שורות תלויות'}
            </AdminButton>
          </div>
          <AdminMessage ok={cleanupState.ok} message={cleanupState.message} />
        </AdminInfoBox>
      ) : null}

      <form onSubmit={handleUpload} className="space-y-4">
        <input type="hidden" name="album_id" value={albumId} />
        <label className="block text-sm">
          <span className="font-medium text-foreground">העלאת תמונות</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            מקור ל-originals · WebP מכווץ (~200KB) ל-thumbnails · עד {MAX_UPLOAD_MB}
            MB לקובץ · {thumbnailWorkerPoolSize()} כיווצי Web Workers ·{' '}
            {UPLOAD_CONCURRENCY} העלאות במקביל · מעל{' '}
            {RECOMMENDED_UPLOAD_BATCH.toLocaleString('he-IL')} — פיצול אוטומטי למנות · השאירי את הטאב פעיל
          </span>
          <span className="mt-1 block text-xs text-muted-foreground/80">
            להעלאות של 500+ תמונות בפיתוח: הריצי{' '}
            <code className="rounded bg-muted px-1">npm run build &amp;&amp; npm run start</code>
          </span>
          <AdminFileInput
            name="gallery_files"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={disabled || uploadPending || !r2Ready}
          />
        </label>

        {uploadPending && uploadProgress ? (
          <GalleryUploadProgressBar progress={uploadProgress} variant="inline" />
        ) : null}

        {!r2Ready ? (
          <p className="text-sm text-amber-800">{r2Message}</p>
        ) : null}

        <AdminMessage ok={uploadState.ok} message={uploadState.message} />
        <AdminButton type="submit" disabled={disabled || uploadPending || !r2Ready}>
          {uploadPending ? 'מעלה...' : 'העלאת תמונות'}
        </AdminButton>
      </form>

      {uploadPending ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          העלאה פעילה — מד ההתקדמות בראש המסך. אל תרענני את הדף.
        </p>
      ) : null}

      <AdminMessage ok={deleteState.ok} message={deleteState.message} />
      <AdminMessage ok={deleteAllState.ok} message={deleteAllState.message} />
      <AdminMessage ok={bulkState.ok} message={bulkState.message} />

      {images.length > 0 ? (
        <>
        <AdminClientSelectionsGrid
          albumId={albumId}
          photographerId={photographerId}
          images={images}
          selectionsByImage={selectionsByImage}
        />

        <ul className="gallery-grid grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.slice(0, count).map((img, index) => {
            const media = resolveGalleryMediaUrls(albumId, img, photographerId)
            const isDeleting = img.status === 'deleting'
            const isPending = img.status === 'pending'
            const isSelected = selectedIds.has(img.id)
            return (
            <li
              key={img.id}
              className={`gallery-photo-frame group relative aspect-square overflow-hidden bg-card shadow-sm ${
                isSelected ? 'ring-2 ring-foreground ring-offset-2' : ''
              }`}
            >
              <GalleryGridImage
                thumbnailUrl={media.thumb}
                imageUrl={media.preview}
                index={index}
              />
              {isDeleting ? <DeletingOverlay /> : null}
              {isPending ? <PendingOverlay /> : null}
              {!isDeleting ? (
                <label className="absolute left-2 top-2 z-20 flex cursor-pointer items-center gap-1 rounded-lg bg-black/45 px-2 py-1 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 has-[:checked]:opacity-100">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={disabled || bulkPending}
                    onChange={() => toggleSelected(img.id)}
                    className="h-4 w-4 rounded border-white/60"
                    aria-label={`בחירת תמונה ${index + 1}`}
                  />
                </label>
              ) : null}
              {!isDeleting ? (
                <div className="absolute bottom-2 left-2 z-20 opacity-0 transition-opacity group-hover:opacity-100">
                  <AdminButton
                    type="button"
                    variant="danger"
                    disabled={disabled || deletePending || bulkPending}
                    onClick={() => handleDeleteImage(img.id)}
                  >
                    מחק
                  </AdminButton>
                </div>
              ) : null}
            </li>
          )})}
        </ul>
        {count < images.length ? (
          <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
        ) : null}
        {selectedIds.size > 0 ? (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                {selectedIds.size.toLocaleString('he-IL')} תמונות נבחרו
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <AdminButton
                  type="button"
                  variant="secondary"
                  disabled={bulkPending}
                  onClick={() => setSelectedIds(new Set())}
                >
                  ביטול
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="secondary"
                  disabled={disabled || bulkPending}
                  onClick={handleBulkDownload}
                >
                  הורד נבחרות
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="danger"
                  disabled={disabled || bulkPending}
                  onClick={handleBulkDelete}
                >
                  {bulkPending
                    ? 'מתחיל מחיקה...'
                    : `מחק ${selectedIds.size.toLocaleString('he-IL')} נבחרות`}
                </AdminButton>
              </div>
            </div>
          </div>
        ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          עדיין אין תמונות. בחרי קבצים למעלה והעלי.
        </p>
      )}
    </AdminCard>
  )
}

function resolveCoverFile(
  formCover: FormDataEntryValue | null,
  pendingCover: File | null
): File | null {
  if (pendingCover?.size) return pendingCover
  if (formCover instanceof File && formCover.size > 0) return formCover
  return null
}

function AlbumForm({
  album,
  clients,
  images,
  selectionsByImage,
  onCancel,
  onCreated,
  disabled,
  r2Ready,
  r2Message,
  theme,
}: {
  album: AlbumWithClient | null
  clients: Pick<ClientsRow, 'id' | 'full_name'>[]
  images: ImagesRow[]
  selectionsByImage: Record<string, string[]>
  onCancel?: () => void
  onCreated?: (albumId: string) => void
  disabled?: boolean
  r2Ready: boolean
  r2Message: string
  theme: ThemeStyle
}) {
  const router = useRouter()
  const [state, setState] = useState<ActionResult>(initial)
  const [pending, setPending] = useState(false)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled || pending) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const coverFile = resolveCoverFile(
      formData.get('cover_file'),
      pendingCoverFile
    )
    formData.delete('cover_file')

    setPending(true)
    let gallerySaved = false
    let savedId: string | undefined

    try {
      const result = await saveAlbumAction(state, formData)
      if (!result.ok) {
        setState(result)
        return
      }

      gallerySaved = true
      savedId = result.id

      if (coverFile && savedId) {
        const uploadResult = await uploadAlbumCoverFromBrowser(savedId, coverFile)
        if (!uploadResult.ok) {
          setState({
            ok: false,
            message:
              uploadResult.message ||
              'הגלריה נשמרה, אך העלאת תמונת השער נכשלה',
          })
          if (!album && savedId) onCreated?.(savedId)
          router.refresh()
          return
        }
      }

      setState({
        ok: true,
        message: coverFile
          ? 'הגלריה נשמרה ותמונת השער הועלתה'
          : result.message,
      })
      setPendingCoverFile(null)
      if (!album && savedId) onCreated?.(savedId)
      router.refresh()
    } catch {
      setState({
        ok: false,
        message: gallerySaved
          ? 'הגלריה נשמרה, אך אירעה שגיאה בהמשך (ייתכן בתמונת השער) — רענני את הדף'
          : 'שגיאה בשמירת הגלריה — ייתכן שהשרת לא זמין. בדקי אם הגלריה נוצרה ורענני',
      })
      if (gallerySaved && savedId && !album) onCreated?.(savedId)
      if (gallerySaved) router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-8">
      <AdminCard>
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <AdminSectionHeading
          title={album ? 'עריכת גלריה' : 'גלריה חדשה'}
          description={
            album
              ? 'עדכנו פרטים, תמונת שער או העלו תמונות נוספות.'
              : 'צרו גלריה חדשה והעלו תמונות ללקוח.'
          }
        />

        {album?.id ? (
          <input type="hidden" name="album_id" value={album.id} />
        ) : null}

        <AdminSelect
          label="לקוח"
          name="client_id"
          defaultValue={album?.client_id ?? clients[0]?.id ?? ''}
          disabled={disabled}
          hint='אם אין לקוחות — נוצר אוטומטית "גלריה כללית"'
        >
          {clients.length === 0 ? (
            <option value="">— ייווצר לקוח כללי אוטומטית —</option>
          ) : (
            clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name?.trim() || `לקוח ${c.id.slice(0, 8)}`}
              </option>
            ))
          )}
        </AdminSelect>

        <div className="grid gap-5 md:grid-cols-2">
          <AdminField
            label="כותרת"
            name="title"
            defaultValue={album?.title ?? ''}
            required
          />
          <AdminSelect
            label="סטטוס"
            name="status"
            defaultValue={album?.status ?? 'active'}
            disabled={disabled}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </AdminSelect>
          <AdminField
            label="תמונת שער (URL חיצוני — אופציונלי)"
            name="cover_image"
            defaultValue={album?.cover_image ?? ''}
          />
          <AdminField
            label="תאריך תפוגה"
            name="expires_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(album?.expires_at ?? null)}
          />
          <AdminField
            label="מקסימום תמונות לאלבום"
            name="max_album_selections"
            type="number"
            min={0}
            defaultValue={album?.max_album_selections ?? ''}
            hint="השאירו ריק = ללא הגבלה"
          />
          <AdminField
            label="מקסימום תמונות לעיבוד"
            name="max_edit_selections"
            type="number"
            min={0}
            defaultValue={album?.max_edit_selections ?? ''}
            hint="השאירו ריק = ללא הגבלה"
          />
        </div>

        <AdminCheckbox
          name="is_public"
          label="מוצג באתר הציבורי (גלריה / דף הבית)"
          description='סמנו רק לאחר שהלקוח אישר. ללא סימון — הגלריה לא תופיע באתר, גם אם הסטטוס "פעיל".'
          defaultChecked={album?.is_public ?? false}
          disabled={disabled}
        />

        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground">תמונת שער — העלאה</p>
            <p className="mt-1 text-xs text-muted-foreground">
              עד {MAX_UPLOAD_MB}MB לקובץ · איכות מקורית
            </p>
          </div>
          <p className="text-xs text-muted-foreground">תמונת שער — עומד</p>
          <AdminImagePreview
            src={album?.cover_image ?? null}
            pendingFile={pendingCoverFile}
            emptyText="עדיין לא הועלתה תמונת שער"
          />
          <AdminFileInput
            name="cover_file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={disabled || pending}
            onFileChange={setPendingCoverFile}
          />
        </div>

        {album?.id && album.access_token ? (
          <AdminInfoBox>
            <CopyLink
              path={`/g/${album.access_token}`}
              label="קישור סודי ישיר (לשליחה ללקוח במייל)"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              מי שיש לו את הקישור יכול לצפות, לבחור תמונות ולהוריד — בלי התחברות.
            </p>
          </AdminInfoBox>
        ) : null}

        <AdminMessage ok={state.ok} message={state.message} />

        <div className="flex flex-wrap gap-3">
          <AdminButton type="submit" disabled={disabled || pending}>
            {pending ? 'שומר...' : album ? 'עדכון גלריה' : 'יצירת גלריה'}
          </AdminButton>
          {onCancel ? (
            <AdminButton type="button" variant="secondary" onClick={onCancel}>
              ביטול
            </AdminButton>
          ) : null}
        </div>
      </form>
      </AdminCard>

      {album?.id ? (
        <AlbumImagesSection
          albumId={album.id}
          photographerId={album.photographer_id}
          images={images}
          selectionsByImage={selectionsByImage}
          disabled={disabled}
          r2Ready={r2Ready}
          r2Message={r2Message}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          אחרי יצירת הגלריה תוכלו להעלות תמונות נוספות.
        </p>
      )}
    </div>
  )
}

export default function GalleriesPanel({
  albums,
  clients,
  imagesByAlbum,
  selectionsByImage,
  disabled,
  r2Ready,
  r2Message,
  theme,
}: {
  albums: AlbumWithClient[]
  clients: Pick<ClientsRow, 'id' | 'full_name'>[]
  imagesByAlbum: Record<string, ImagesRow[]>
  selectionsByImage: Record<string, string[]>
  disabled?: boolean
  r2Ready: boolean
  r2Message: string
  theme: ThemeStyle
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list')
  const [editing, setEditing] = useState<AlbumWithClient | null>(null)
  const [pendingEditId, setPendingEditId] = useState<string | null>(null)
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAlbumAction,
    initial
  )

  useEffect(() => {
    if (deleteState.ok) {
      router.refresh()
      setMode('list')
      setEditing(null)
    }
  }, [deleteState.ok, router])

  useEffect(() => {
    if (!pendingEditId) return
    const album = albums.find((item) => item.id === pendingEditId)
    if (!album) return
    setEditing(album)
    setMode('edit')
    setPendingEditId(null)
  }, [albums, pendingEditId])

  function startEdit(album: AlbumWithClient) {
    setEditing(album)
    setMode('edit')
  }

  function startNew() {
    setEditing(null)
    setMode('new')
  }

  const editingImages = editing?.id ? (imagesByAlbum[editing.id] ?? []) : []

  return (
    <div className="space-y-8">
      {mode === 'list' ? (
        <>
          <AdminPanelToolbar
            count={albums.length}
            countLabel="גלריות"
            action={
              <AdminButton type="button" onClick={startNew} disabled={disabled}>
                + גלריה חדשה
              </AdminButton>
            }
          />

          <AdminMessage ok={deleteState.ok} message={deleteState.message} />

          {albums.length === 0 ? (
            <AdminEmpty>
              אין גלריות עדיין. לחצו &quot;גלריה חדשה&quot;, העלו תמונת שער וסמנו
              &quot;מוצג באתר&quot; כדי שתופיע באתר הציבורי.
            </AdminEmpty>
          ) : (
            <ul className="space-y-3">
              {albums.map((album) => {
                const count = imagesByAlbum[album.id]?.length ?? 0
                return (
                  <li key={album.id}>
                  <AdminCard hover className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      {album.cover_image ? (
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={album.cover_image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">
                          ללא שער
                        </div>
                      )}
                      <div className="min-w-0 text-right">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">
                            {album.title?.trim() || 'ללא כותרת'}
                          </p>
                          <AdminBadge variant={album.is_public ? 'success' : 'muted'}>
                            {album.is_public ? 'מוצג באתר' : 'לא מוצג באתר'}
                          </AdminBadge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {album.clients?.full_name?.trim() || 'גלריה כללית'} ·{' '}
                          {album.status ?? 'draft'} · {count} תמונות
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <AdminButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={disabled}
                        onClick={() => startEdit(album)}
                      >
                        עריכה
                      </AdminButton>
                      <form
                        action={deleteFormAction}
                        onSubmit={(e) => {
                          const title = album.title?.trim() || 'ללא כותרת'
                          const photos =
                            count > 0
                              ? '\nיימחקו גם כל התמונות בגלריה (כולל קבצים ב-R2).'
                              : ''
                          if (
                            !window.confirm(
                              `למחוק את הגלריה "${title}"?${photos}\nלא ניתן לשחזר.`
                            )
                          ) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <input type="hidden" name="album_id" value={album.id} />
                        <AdminButton
                          type="submit"
                          variant="danger"
                          size="sm"
                          disabled={disabled || deletePending}
                        >
                          {deletePending ? 'מוחק...' : 'מחיקה'}
                        </AdminButton>
                      </form>
                    </div>
                  </AdminCard>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      ) : (
        <AlbumForm
          album={mode === 'edit' ? editing : null}
          clients={clients}
          images={editingImages}
          selectionsByImage={selectionsByImage}
          disabled={disabled}
          r2Ready={r2Ready}
          r2Message={r2Message}
          theme={theme}
          onCreated={setPendingEditId}
          onCancel={() => {
            setMode('list')
            setEditing(null)
            setPendingEditId(null)
          }}
        />
      )}
    </div>
  )
}
