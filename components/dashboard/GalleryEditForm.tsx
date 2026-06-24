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
  const [watermark, setWatermark] = useState(settings?.watermark_text ?? '')
  const [maxAlbum, setMaxAlbum] = useState(settings?.max_album_selection?.toString() ?? '')
  const [maxEdit, setMaxEdit] = useState(settings?.max_edit_selection?.toString() ?? '')
  const [allowDownloadPreview, setAllowDownloadPreview] = useState(settings?.allow_download_preview ?? false)
  const [allowDownloadOriginal, setAllowDownloadOriginal] = useState(settings?.allow_download_original ?? false)

  function handleSave() {
    startTransition(async () => {
      try {
        const payload = {
          title,
          password: password || undefined,
          expiresAt: expiresAt || undefined,
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
