'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateGallerySettings } from '@/lib/actions/gallery.actions'
import { uploadGalleryCoverFile } from '@/lib/cover-upload-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DOWNLOAD_PERMISSIONS_ENABLED } from '@/lib/types/app.types'

type GalleryEditFormProps = {
  gallery: {
    id: string
    title: string
    password: string | null
    expires_at: string | null
    cover_image: string | null
  }
  settings: {
    watermark_text: string | null
    auto_apply_watermark?: boolean
    max_album_selection: number | null
    max_edit_selection: number | null
    allow_download_preview: boolean
    allow_download_original: boolean
  } | null
}

export function GalleryEditForm({ gallery, settings }: GalleryEditFormProps) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(gallery.title)
  const [password, setPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState(gallery.expires_at ? gallery.expires_at.slice(0, 10) : '')
  const [coverImage, setCoverImage] = useState(gallery.cover_image ?? '')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [watermark, setWatermark] = useState(settings?.watermark_text ?? '')
  const [autoApplyWatermark, setAutoApplyWatermark] = useState(
    settings?.auto_apply_watermark ?? true
  )
  const [maxAlbum, setMaxAlbum] = useState(settings?.max_album_selection?.toString() ?? '')
  const [maxEdit, setMaxEdit] = useState(settings?.max_edit_selection?.toString() ?? '')
  const [allowDownloadPreview, setAllowDownloadPreview] = useState(settings?.allow_download_preview ?? false)
  const [allowDownloadOriginal, setAllowDownloadOriginal] = useState(settings?.allow_download_original ?? false)

  function handleSave() {
    startTransition(async () => {
      try {
        // Upload cover image if file is selected
        let finalCoverImage = coverImage
        if (coverImageFile) {
          setIsUploadingCover(true)
          try {
            finalCoverImage = await uploadGalleryCoverFile(coverImageFile)
            setCoverImage(finalCoverImage)
            setCoverImageFile(null)
          } catch (error) {
            console.error('Error uploading cover image:', error)
            toast.error(error instanceof Error ? error.message : 'העלאת תמונת השער נכשלה')
            setIsUploadingCover(false)
            return
          }
          setIsUploadingCover(false)
        }

        const payload = {
          title,
          password: password || undefined,
          expiresAt: expiresAt || undefined,
          coverImage: finalCoverImage || null,
          watermarkText: watermark || undefined,
          autoApplyWatermark,
          maxAlbumSelection: maxAlbum ? parseInt(maxAlbum) : undefined,
          maxEditSelection: maxEdit ? parseInt(maxEdit) : undefined,
          allowDownloadPreview: DOWNLOAD_PERMISSIONS_ENABLED
            ? allowDownloadPreview
            : false,
          allowDownloadOriginal: DOWNLOAD_PERMISSIONS_ENABLED
            ? allowDownloadOriginal
            : false,
        }
        
        console.log('Saving gallery settings:', {
          galleryId: gallery.id,
          ...payload,
        })
        
        await updateGallerySettings(gallery.id, payload)

        toast.success('הגדרות הגלריה נשמרו בהצלחה')
      } catch (error) {
        console.error('Error saving gallery settings:', error)
        toast.error(error instanceof Error ? error.message : 'שגיאה בשמירה')
      }
    })
  }

  return (
    <>
      <div className="grid gap-6 pb-24 sm:pb-0 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-[#100d1f]">שם הגלריה</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="למשל: חתונה של דנה ואבי"
            className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="watermark" className="text-[#100d1f]">סימן מים</Label>
          <Input
            id="watermark"
            value={watermark}
            onChange={(e) => setWatermark(e.target.value)}
            placeholder="למשל: © שם הסטודיו"
            className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <div className="flex flex-col gap-3 rounded-xl border border-[#c9c5cd] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Label className="text-[#100d1f]">החל סימן מים אוטומטי</Label>
              <p className="text-xs text-[#48464c] mt-1">
                בעת העלאת תמונות, הטקסט יוחל על גרסת התצוגה הציבורית
              </p>
            </div>
            <Switch
              checked={autoApplyWatermark}
              onCheckedChange={setAutoApplyWatermark}
            />
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cover-image" className="text-[#100d1f]">
            תמונת שער לאתר הציבורי
            <span className="mt-1 block text-xs font-normal text-[#6b2d43] sm:mt-0 sm:inline sm:mr-1 sm:text-sm">
              (מוצגת בכרטיס הגלריה בדף הבית; בנוסף 4 תמונות מהגלריה יוצגו בסקשן &quot;תמונות אחרונות&quot;)
            </span>
          </Label>
          <div className="space-y-3">
            {(coverImageFile || coverImage) ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-[#c9c5cd]">
                  <img
                    src={
                      coverImageFile
                        ? URL.createObjectURL(coverImageFile)
                        : coverImage.startsWith('http') || coverImage.startsWith('/')
                          ? coverImage
                          : `/api/gallery-media?key=${encodeURIComponent(`branding/${coverImage}`)}`
                    }
                    alt="תמונת שער"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setCoverImageFile(file)
                    }}
                    className="hidden"
                    id="cover-image-replace"
                    disabled={isUploadingCover || isPending}
                  />
                  <label
                    htmlFor="cover-image-replace"
                    className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-[#c9c5cd] px-4 py-2 text-sm text-[#100d1f] hover:border-[#6b2d43] transition-colors sm:w-auto"
                  >
                    החלף תמונה
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImageFile(null)
                      setCoverImage('')
                    }}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors sm:w-auto"
                    disabled={isUploadingCover || isPending}
                  >
                    הסר תמונה
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#c9c5cd] rounded-lg p-4 text-center hover:border-[#6b2d43] transition-colors sm:p-6">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setCoverImageFile(file)
                    }
                  }}
                  className="hidden"
                  id="cover-image-upload"
                  disabled={isUploadingCover}
                />
                <label
                  htmlFor="cover-image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#48464c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-[#48464c]">{isUploadingCover ? 'מעלה...' : 'לחץ לבחירת תמונה'}</span>
                  <span className="text-xs text-[#48464c]">או גרור קובץ לכאן</span>
                </label>
              </div>
            )}
            <p className="text-xs text-[#48464c]">
              מומלץ להעלות תמונה רוחבית. אם לא תוזן, תוצג התמונה הראשונה מהגלריה
            </p>
          </div>
        </div>
        {/* MVP: private-only fields below are frozen for public-only */}
        <div className="space-y-2 opacity-35 pointer-events-none select-none">
          <Label htmlFor="password" className="text-[#100d1f]">סיסמה</Label>
          <Input
            id="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="השאירי ריק לשמירת הסיסמה הקיימת"
            className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
          />
        </div>
        <div className="space-y-2 opacity-35 pointer-events-none select-none">
          <Label htmlFor="expires" className="text-[#100d1f]">תפוגה</Label>
          <Input
            id="expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
          />
        </div>
        <div className="space-y-2 opacity-35 pointer-events-none select-none">
          <Label htmlFor="max-album" className="text-[#100d1f]">מקסימום אלבום</Label>
          <Input
            id="max-album"
            type="number"
            value={maxAlbum}
            onChange={(e) => setMaxAlbum(e.target.value)}
            placeholder="למשל: 50"
            className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
          />
        </div>
        <div className="space-y-2 opacity-35 pointer-events-none select-none">
          <Label htmlFor="max-edit" className="text-[#100d1f]">מקסימום עיבוד</Label>
          <Input
            id="max-edit"
            type="number"
            value={maxEdit}
            onChange={(e) => setMaxEdit(e.target.value)}
            placeholder="למשל: 30"
            className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
          />
        </div>
      </div>

      <div className={`relative space-y-4 rounded-xl border border-[#c9c5cd] p-4 bg-[#f7f2f4] sm:p-6 ${DOWNLOAD_PERMISSIONS_ENABLED ? '' : 'opacity-35 pointer-events-none select-none'}`}>
        {!DOWNLOAD_PERMISSIONS_ENABLED ? (
          <span className="absolute top-4 left-4 z-10 rounded-full bg-[#100d1f] px-3 py-1 text-xs font-semibold text-white">
            לא זמין כרגע
          </span>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Label className="text-[#100d1f]">הורדת preview</Label>
          <Switch
            checked={allowDownloadPreview}
            disabled={!DOWNLOAD_PERMISSIONS_ENABLED}
            onCheckedChange={setAllowDownloadPreview}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Label className="text-[#100d1f]">הורדת מקור</Label>
          <Switch
            checked={allowDownloadOriginal}
            disabled={!DOWNLOAD_PERMISSIONS_ENABLED}
            onCheckedChange={setAllowDownloadOriginal}
          />
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-8 sm:right-auto">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="w-full bg-[#6b2d43] text-white px-8 py-3 rounded-xl font-bold text-base shadow-sm hover:bg-[#5a2538] active:scale-[0.98] transition-all sm:w-auto sm:px-12 sm:text-lg"
        >
          {isPending ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>
    </>
  )
}
