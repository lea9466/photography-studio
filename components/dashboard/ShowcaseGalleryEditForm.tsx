'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ImageIcon, X } from 'lucide-react'
import { updateGallerySettings } from '@/lib/actions/gallery.actions'
import { uploadGalleryCoverFile } from '@/lib/cover-upload-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type ShowcaseGalleryEditFormProps = {
  gallery: {
    id: string
    title: string
    cover_image: string | null
  }
  settings: {
    watermark_text: string | null
    auto_apply_watermark?: boolean
  } | null
}

/**
 * Edit form for a public showcase gallery — only the three settings a showcase
 * gallery has (title, cover image, watermark). Password / expiry / selection
 * limits / download permissions are client-gallery concepts and live in
 * ClientGalleryEditForm.
 */
export function ShowcaseGalleryEditForm({ gallery, settings }: ShowcaseGalleryEditFormProps) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(gallery.title)
  const [watermark, setWatermark] = useState(settings?.watermark_text ?? '')
  const [autoApplyWatermark, setAutoApplyWatermark] = useState(
    settings?.auto_apply_watermark ?? true
  )
  const [coverImage, setCoverImage] = useState(gallery.cover_image ?? '')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  function handleSave() {
    startTransition(async () => {
      try {
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

        await updateGallerySettings(gallery.id, {
          title,
          coverImage: finalCoverImage || null,
          watermarkText: watermark || undefined,
          autoApplyWatermark,
        })

        toast.success('הגדרות הגלריה נשמרו בהצלחה')
      } catch (error) {
        console.error('Error saving gallery settings:', error)
        toast.error(error instanceof Error ? error.message : 'שגיאה בשמירה')
      }
    })
  }

  return (
    <>
      <div className="grid gap-6 pb-24 sm:grid-cols-2 sm:pb-0">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-[#100d1f]">שם הגלריה</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="למשל: חתונות / ניו בורן"
            className="h-12 border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="watermark" className="text-[#100d1f]">סימן מים</Label>
          <Input
            id="watermark"
            value={watermark}
            onChange={(e) => setWatermark(e.target.value)}
            placeholder="למשל: © שם הסטודיו"
            className="h-12 border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <div className="flex flex-col gap-3 rounded-xl border border-[#c9c5cd] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Label className="text-[#100d1f]">החל סימן מים אוטומטי</Label>
              <p className="mt-1 text-xs text-[#48464c]">
                בעת העלאת תמונות, הטקסט יוחל על גרסת התצוגה הציבורית
              </p>
            </div>
            <Switch checked={autoApplyWatermark} onCheckedChange={setAutoApplyWatermark} />
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cover-image" className="text-[#100d1f]">
            תמונת שער לאתר הציבורי
            <span className="mt-1 block text-xs font-normal text-[#6b2d43] sm:mt-0 sm:mr-1 sm:inline sm:text-sm">
              (מוצגת בכרטיס הגלריה בדף הבית; בנוסף 4 תמונות מהגלריה יוצגו בסקשן &quot;תמונות אחרונות&quot;)
            </span>
          </Label>
          <div className="space-y-3">
            {(coverImageFile || coverImage) ? (
              <div className="space-y-3">
                <div className="relative aspect-video overflow-hidden rounded-lg border border-[#c9c5cd]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      coverImageFile
                        ? URL.createObjectURL(coverImageFile)
                        : coverImage.startsWith('http') || coverImage.startsWith('/')
                          ? coverImage
                          : `/api/gallery-media?key=${encodeURIComponent(`branding/${coverImage}`)}`
                    }
                    alt="תמונת שער"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImageFile(null)
                      setCoverImage('')
                    }}
                    disabled={isUploadingCover || isPending}
                    className="absolute left-2 top-2 rounded-full bg-white/90 p-1 text-[#100d1f] shadow-sm transition-colors hover:bg-white"
                    aria-label="הסר תמונה"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <label
                  htmlFor="cover-image-replace"
                  className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-[#c9c5cd] px-4 py-2 text-sm text-[#100d1f] transition-colors hover:border-[#6b2d43] sm:w-auto"
                >
                  החלף תמונה
                </label>
                <input
                  type="file"
                  accept="image/*"
                  id="cover-image-replace"
                  className="hidden"
                  disabled={isUploadingCover || isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setCoverImageFile(file)
                  }}
                />
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-[#c9c5cd] p-6 text-center transition-colors hover:border-[#6b2d43]">
                <input
                  type="file"
                  accept="image/*"
                  id="cover-image-upload"
                  className="hidden"
                  disabled={isUploadingCover}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setCoverImageFile(file)
                  }}
                />
                <label
                  htmlFor="cover-image-upload"
                  className="flex cursor-pointer flex-col items-center gap-2"
                >
                  <ImageIcon className="h-8 w-8 text-[#48464c]" />
                  <span className="text-sm text-[#48464c]">
                    {isUploadingCover ? 'מעלה...' : 'לחצי לבחירת תמונה'}
                  </span>
                  <span className="text-xs text-[#48464c]">מומלץ תמונה רוחבית</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-8 sm:right-auto">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="w-full rounded-xl bg-[#6b2d43] px-8 py-3 text-base font-bold text-white transition-all hover:bg-[#5a2538] active:scale-[0.98] sm:w-auto sm:px-12 sm:text-lg"
        >
          {isPending ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>
    </>
  )
}
