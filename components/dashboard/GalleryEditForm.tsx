'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateGallerySettings } from '@/lib/actions/gallery.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

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
    max_album_selection: number | null
    max_edit_selection: number | null
    allow_download_preview: boolean
    allow_download_original: boolean
  } | null
}

export function GalleryEditForm({ gallery, settings }: GalleryEditFormProps) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(gallery.title)
  const [password, setPassword] = useState(gallery.password ?? '')
  const [expiresAt, setExpiresAt] = useState(gallery.expires_at ? gallery.expires_at.slice(0, 10) : '')
  const [coverImage, setCoverImage] = useState(gallery.cover_image ?? '')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [watermark, setWatermark] = useState(settings?.watermark_text ?? '')
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
            const formData = new FormData()
            formData.append('file', coverImageFile)
            formData.append('type', 'cover')
            
            const uploadResponse = await fetch('/api/upload-cover', {
              method: 'POST',
              body: formData,
            })
            
            if (!uploadResponse.ok) {
              throw new Error('העלאת תמונת השער נכשלה')
            }
            
            const uploadData = await uploadResponse.json()
            finalCoverImage = uploadData.url
          } catch (error) {
            console.error('Error uploading cover image:', error)
            toast.error('העלאת תמונת השער נכשלה')
            setIsUploadingCover(false)
            return
          }
          setIsUploadingCover(false)
        }

        const payload = {
          title,
          password: password || undefined,
          expiresAt: expiresAt || undefined,
          coverImage: finalCoverImage || undefined,
          watermarkText: watermark || undefined,
          maxAlbumSelection: maxAlbum ? parseInt(maxAlbum) : undefined,
          maxEditSelection: maxEdit ? parseInt(maxEdit) : undefined,
          allowDownloadPreview,
          allowDownloadOriginal,
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
      <div className="grid gap-6 sm:grid-cols-2">
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
        <div className="space-y-2">
          <Label htmlFor="cover-image" className="text-[#100d1f]">
            תמונת שער לאתר הציבורי
            <span className="text-[#6b2d43] font-normal mr-1">(מוצג רק כאשר הגלריה מופיעה באתר הציבורי)</span>
          </Label>
          <div className="space-y-3">
            {(coverImageFile || coverImage) ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-[#c9c5cd]">
                <img
                  src={coverImageFile ? URL.createObjectURL(coverImageFile) : coverImage}
                  alt="תמונת שער"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImageFile(null)
                    setCoverImage('')
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  disabled={isUploadingCover}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#c9c5cd] rounded-lg p-6 text-center hover:border-[#6b2d43] transition-colors">
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
              אם לא תוזן, תוצג התמונה הראשונה מהגלריה
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#100d1f]">סיסמה</Label>
          <Input
            id="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="הכנס סיסמה"
            className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expires" className="text-[#100d1f]">תפוגה</Label>
          <Input
            id="expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43] h-12"
          />
        </div>
        <div className="space-y-2">
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
        <div className="space-y-2">
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

      <div className="space-y-4 rounded-xl border border-[#c9c5cd] p-6 bg-[#f7f2f4]">
        <div className="flex items-center justify-between">
          <Label className="text-[#100d1f]">הורדת preview</Label>
          <Switch
            checked={allowDownloadPreview}
            onCheckedChange={(checked) => {
              console.log('allowDownloadPreview changed:', checked)
              setAllowDownloadPreview(checked)
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-[#100d1f]">הורדת מקור</Label>
          <Switch
            checked={allowDownloadOriginal}
            onCheckedChange={(checked) => {
              console.log('allowDownloadOriginal changed:', checked)
              setAllowDownloadOriginal(checked)
            }}
          />
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-8 left-8 z-50">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-[#6b2d43] text-white px-12 py-3 rounded-xl font-bold text-lg shadow-sm hover:bg-[#5a2538] active:scale-[0.98] transition-all"
        >
          {isPending ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>
    </>
  )
}
