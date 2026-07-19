'use client'

import { useEffect, useState } from 'react'
import { Check, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { resolveWatermarkText } from '@/lib/images/process'
import { getPhotoEditDisplayPreviewUrl } from '@/lib/photo-edit-image-url'
import { uploadPhotoEditDisplayImage } from '@/lib/photo-edit-upload-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { PhotoEditComparison } from '@/lib/types/photo-edit-comparison'

export type PhotoEditFormValues = {
  comparisonId: string
  title: string
  description: string
  originalImageUrl: string
  originalWatermarkedUrl: string
  editedImageUrl: string
  editedWatermarkedUrl: string
  displayStyle: 'development'
  isActive: boolean
  autoApplyWatermark: boolean
  watermarkText: string
  originalPreviewUrl: string | null
  editedPreviewUrl: string | null
}

type PhotoEditFormProps = {
  initial?: PhotoEditComparison | null
  studioName?: string | null
  signedUrls?: Record<string, string>
  saving?: boolean
  onCancel: () => void
  onSubmit: (values: PhotoEditFormValues) => void
}

function createEmptyForm(): PhotoEditFormValues {
  return {
    comparisonId: crypto.randomUUID(),
    title: '',
    description: '',
    originalImageUrl: '',
    originalWatermarkedUrl: '',
    editedImageUrl: '',
    editedWatermarkedUrl: '',
    displayStyle: 'development',
    isActive: true,
    autoApplyWatermark: true,
    watermarkText: '',
    originalPreviewUrl: null,
    editedPreviewUrl: null,
  }
}

function fromExisting(
  item: PhotoEditComparison,
  signedUrls?: Record<string, string>
): PhotoEditFormValues {
  return {
    comparisonId: item.id,
    title: item.title ?? '',
    description: item.description ?? '',
    originalImageUrl: item.originalImageUrl,
    originalWatermarkedUrl: item.originalWatermarkedUrl,
    editedImageUrl: item.editedImageUrl,
    editedWatermarkedUrl: item.editedWatermarkedUrl,
    displayStyle: 'development',
    isActive: item.isActive,
    autoApplyWatermark: item.autoApplyWatermark,
    watermarkText: item.watermarkText ?? '',
    originalPreviewUrl: getPhotoEditDisplayPreviewUrl({
      previewPath: item.originalImageUrl,
      watermarkedPath: item.originalWatermarkedUrl,
      autoApplyWatermark: item.autoApplyWatermark,
      signedUrls,
    }),
    editedPreviewUrl: getPhotoEditDisplayPreviewUrl({
      previewPath: item.editedImageUrl,
      watermarkedPath: item.editedWatermarkedUrl,
      autoApplyWatermark: item.autoApplyWatermark,
      signedUrls,
    }),
  }
}

function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const result = { width: img.naturalWidth, height: img.naturalHeight }
      URL.revokeObjectURL(url)
      resolve(result)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('לא הצלחנו לקרוא את מימדי התמונה'))
    }
    img.src = url
  })
}

function aspectRatio(width: number, height: number) {
  if (!height) return 0
  return width / height
}

export function PhotoEditForm({
  initial,
  studioName,
  signedUrls,
  saving,
  onCancel,
  onSubmit,
}: PhotoEditFormProps) {
  const [form, setForm] = useState<PhotoEditFormValues>(() =>
    initial ? fromExisting(initial, signedUrls) : createEmptyForm()
  )
  const [uploadingOriginal, setUploadingOriginal] = useState(false)
  const [uploadingEdited, setUploadingEdited] = useState(false)
  const [aspectWarning, setAspectWarning] = useState(false)
  const [originalDims, setOriginalDims] = useState<{ width: number; height: number } | null>(null)
  const [editedDims, setEditedDims] = useState<{ width: number; height: number } | null>(null)

  // Remount via dialog `key` handles create vs edit. Avoid resetting the form
  // when parent signedUrls refresh mid-edit (that wiped newly uploaded paths).
  useEffect(() => {
    if (!originalDims || !editedDims) return
    const a = aspectRatio(originalDims.width, originalDims.height)
    const b = aspectRatio(editedDims.width, editedDims.height)
    setAspectWarning(Math.abs(a - b) > 0.03)
  }, [originalDims, editedDims])

  useEffect(() => {
    const url = form.originalPreviewUrl
    return () => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }, [form.originalPreviewUrl])

  useEffect(() => {
    const url = form.editedPreviewUrl
    return () => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }, [form.editedPreviewUrl])

  async function handleUpload(
    role: 'original' | 'edited',
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    const setUploading = role === 'original' ? setUploadingOriginal : setUploadingEdited
    setUploading(true)

    try {
      try {
        const dims = await loadImageDimensions(file)
        if (role === 'original') setOriginalDims(dims)
        else setEditedDims(dims)
      } catch {
        // Non-blocking
      }

      const uploaded = await uploadPhotoEditDisplayImage({
        comparisonId: form.comparisonId,
        role,
        file,
        watermarkText: resolveWatermarkText(form.watermarkText, studioName),
        applyAutoWatermark: form.autoApplyWatermark,
      })

      setForm((current) => {
        const previousPreview =
          role === 'original' ? current.originalPreviewUrl : current.editedPreviewUrl
        if (previousPreview?.startsWith('blob:')) {
          URL.revokeObjectURL(previousPreview)
        }

        return {
          ...current,
          ...(role === 'original'
            ? {
                originalImageUrl: uploaded.previewPath,
                originalWatermarkedUrl: uploaded.watermarkedPath,
                originalPreviewUrl: uploaded.localPreviewUrl,
              }
            : {
                editedImageUrl: uploaded.previewPath,
                editedWatermarkedUrl: uploaded.watermarkedPath,
                editedPreviewUrl: uploaded.localPreviewUrl,
              }),
        }
      })
      toast.success(role === 'original' ? 'התמונה המקורית הועלתה' : 'התמונה המעובדת הועלתה')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function handleSubmit() {
    if (!form.originalImageUrl || !form.editedImageUrl) {
      toast.error('יש להעלות תמונה מקורית ותמונה מעובדת')
      return
    }
    if (!form.originalWatermarkedUrl || !form.editedWatermarkedUrl) {
      toast.error('חסרות גרסאות התצוגה של התמונות. העלי מחדש.')
      return
    }
    if (form.title.length > 80) {
      toast.error('הכותרת יכולה להכיל עד 80 תווים')
      return
    }
    if (form.description.length > 180) {
      toast.error('התיאור יכול להכיל עד 180 תווים')
      return
    }
    onSubmit(form)
  }

  const busy = saving || uploadingOriginal || uploadingEdited

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-xl border border-[--border] px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Label>הטבע סימן מים על תמונות</Label>
          </div>
          <Switch
            checked={form.autoApplyWatermark}
            disabled={busy}
            onCheckedChange={(checked) =>
              setForm((current) => ({ ...current, autoApplyWatermark: checked }))
            }
          />
        </div>
        {form.autoApplyWatermark ? (
          <div className="space-y-2">
            <Label htmlFor="photo-edit-watermark">טקסט סימן המים</Label>
            <Input
              id="photo-edit-watermark"
              value={form.watermarkText}
              disabled={busy}
              onChange={(e) =>
                setForm((current) => ({ ...current, watermarkText: e.target.value }))
              }
              placeholder={
                studioName ? `ברירת מחדל: ${studioName}` : 'למשל: © שם הסטודיו'
              }
            />
            <p className="text-xs text-[--muted]">אם השדה ריק, יוצג שם הסטודיו שלך</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="photo-edit-original">התמונה המקורית</Label>
          <p className="text-xs text-[--muted]">העלי את התמונה לפני העיבוד.</p>
          <div className="overflow-hidden rounded-lg border border-[--border] bg-[--dashboard-surface]">
            <div className="relative aspect-[4/3] bg-[--muted]/10">
              {form.originalPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.originalPreviewUrl}
                  alt="תצוגה מקדימה של התמונה המקורית"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[--muted]">
                  אין תמונה
                </div>
              )}
            </div>
            <div className="p-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[--foreground]">
                <Upload className="h-4 w-4" />
                {uploadingOriginal ? 'מעלה...' : form.originalImageUrl ? 'החלפת תמונה' : 'העלאת תמונה'}
                <input
                  id="photo-edit-original"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => handleUpload('original', e)}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="photo-edit-edited">התמונה המעובדת</Label>
          <p className="text-xs text-[--muted]">העלי את התוצאה הסופית לאחר העיבוד.</p>
          <div className="overflow-hidden rounded-lg border border-[--border] bg-[--dashboard-surface]">
            <div className="relative aspect-[4/3] bg-[--muted]/10">
              {form.editedPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.editedPreviewUrl}
                  alt="תצוגה מקדימה של התמונה המעובדת"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[--muted]">
                  אין תמונה
                </div>
              )}
            </div>
            <div className="p-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[--foreground]">
                <Upload className="h-4 w-4" />
                {uploadingEdited ? 'מעלה...' : form.editedImageUrl ? 'החלפת תמונה' : 'העלאת תמונה'}
                <input
                  id="photo-edit-edited"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => handleUpload('edited', e)}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {aspectWarning ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">יחסי התמונות שונים</p>
          <p className="mt-1">
            לקבלת מעבר חלק, מומלץ להעלות שתי תמונות באותו יחס, באותו גודל ובאותו חיתוך.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="photo-edit-title">כותרת</Label>
        <Input
          id="photo-edit-title"
          value={form.title}
          maxLength={80}
          placeholder="לדוגמה: עריכת אור וצבע"
          disabled={busy}
          onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
        />
        <p className="text-xs text-[--muted]">{form.title.length}/80</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo-edit-description">תיאור קצר</Label>
        <Textarea
          id="photo-edit-description"
          value={form.description}
          maxLength={180}
          rows={3}
          placeholder="לדוגמה: איזון התאורה, חימום הגוונים והדגשת הפרטים."
          disabled={busy}
          onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
        />
        <p className="text-xs text-[--muted]">{form.description.length}/180</p>
      </div>

      <div className="space-y-3">
        <Label>סגנון תצוגה</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-[#7D3A52] bg-[#7D3A52]/5 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7D3A52] text-white">
                <Check className="h-3 w-3" />
              </span>
              <span className="font-medium">פיתוח תמונה</span>
            </div>
            <p className="mt-2 pr-7 text-xs text-[--muted]">
              התמונה המקורית מתפתחת בהדרגה והופכת לתוצאה המעובדת.
            </p>
          </div>
          <div className="rounded-xl border border-[--border] bg-[--muted]/10 p-4 opacity-70">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[--muted]">חשיפה אינטראקטיבית</span>
              <Badge variant="outline">בקרוב</Badge>
            </div>
            <p className="mt-2 text-xs text-[--muted]">אפשרות זו תהיה זמינה בקרוב.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-[--border] px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Label>הציגי את הזוג באתר</Label>
            <p className="mt-1 text-xs text-[--muted]">
              כאשר כבוי, הזוג יישאר שמור אך מוסתר מהאתר הציבורי.
            </p>
          </div>
          <Switch
            checked={form.isActive}
            disabled={busy}
            onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
          ביטול
        </Button>
        <Button type="button" disabled={busy} onClick={handleSubmit}>
          {saving ? 'שומרת שינויים...' : initial ? 'שמירת השינויים' : 'שמירת הזוג'}
        </Button>
      </div>
    </div>
  )
}
