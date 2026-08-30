'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateGallerySettings } from '@/lib/actions/gallery.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DOWNLOAD_PERMISSIONS_ENABLED } from '@/lib/types/app.types'

type ClientGalleryEditFormProps = {
  gallery: {
    id: string
    title: string
    expires_at: string | null
  }
  settings: {
    watermark_text: string | null
    auto_apply_watermark?: boolean
    max_album_selection: number | null
    max_edit_selection: number | null
    allow_download_preview: boolean
    allow_download_original: boolean
  } | null
  /** Per-account override, computed server-side — see isMvpBypassUser. */
  downloadPermissionsEnabled?: boolean
}

/**
 * Edit form for a private client gallery — the full client-delivery settings.
 * No cover image (that is a public showcase concept).
 */
export function ClientGalleryEditForm({
  gallery,
  settings,
  downloadPermissionsEnabled: downloadPermissionsEnabledProp,
}: ClientGalleryEditFormProps) {
  const downloadPermissionsEnabled =
    downloadPermissionsEnabledProp ?? DOWNLOAD_PERMISSIONS_ENABLED
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(gallery.title)
  const [expiresAt, setExpiresAt] = useState(
    gallery.expires_at ? gallery.expires_at.slice(0, 10) : ''
  )
  const [watermark, setWatermark] = useState(settings?.watermark_text ?? '')
  const [autoApplyWatermark, setAutoApplyWatermark] = useState(
    settings?.auto_apply_watermark ?? true
  )
  const [maxAlbum, setMaxAlbum] = useState(settings?.max_album_selection?.toString() ?? '')
  const [maxEdit, setMaxEdit] = useState(settings?.max_edit_selection?.toString() ?? '')
  const [allowDownloadPreview, setAllowDownloadPreview] = useState(
    settings?.allow_download_preview ?? false
  )
  const [allowDownloadOriginal, setAllowDownloadOriginal] = useState(
    settings?.allow_download_original ?? false
  )

  function handleSave() {
    startTransition(async () => {
      try {
        await updateGallerySettings(gallery.id, {
          title,
          expiresAt: expiresAt || undefined,
          watermarkText: watermark || undefined,
          autoApplyWatermark,
          maxAlbumSelection: maxAlbum ? parseInt(maxAlbum, 10) : undefined,
          maxEditSelection: maxEdit ? parseInt(maxEdit, 10) : undefined,
          allowDownloadPreview: downloadPermissionsEnabled ? allowDownloadPreview : false,
          allowDownloadOriginal: downloadPermissionsEnabled ? allowDownloadOriginal : false,
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
            placeholder="למשל: חתונה של דנה ואבי"
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
                בעת העלאת תמונות, הטקסט יוחל על גרסת התצוגה שהלקוח רואה
              </p>
            </div>
            <Switch checked={autoApplyWatermark} onCheckedChange={setAutoApplyWatermark} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="expires" className="text-[#100d1f]">תאריך תפוגה</Label>
          <Input
            id="expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="h-12 border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
          />
          <p className="text-xs text-[#48464c]">
            לאחר תאריך זה הגישה לגלריה תיחסם. הלקוח נכנס עם קוד חד-פעמי שנשלח למייל
            — אין סיסמה קבועה להגדרה.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-album" className="text-[#100d1f]">מקסימום אלבום</Label>
          <Input
            id="max-album"
            type="number"
            value={maxAlbum}
            onChange={(e) => setMaxAlbum(e.target.value)}
            placeholder="למשל: 50"
            className="h-12 border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
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
            className="h-12 border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
          />
        </div>
      </div>

      <div
        className={`relative space-y-4 rounded-xl border border-[#c9c5cd] bg-[#f7f2f4] p-4 sm:p-6 ${
          downloadPermissionsEnabled ? '' : 'pointer-events-none select-none opacity-35'
        }`}
      >
        {!downloadPermissionsEnabled ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-[#100d1f] px-3 py-1 text-xs font-semibold text-white">
            לא זמין כרגע
          </span>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Label className="text-[#100d1f]">הורדת preview</Label>
          <Switch
            checked={allowDownloadPreview}
            disabled={!downloadPermissionsEnabled}
            onCheckedChange={setAllowDownloadPreview}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Label className="text-[#100d1f]">הורדת מקור</Label>
          <Switch
            checked={allowDownloadOriginal}
            disabled={!downloadPermissionsEnabled}
            onCheckedChange={setAllowDownloadOriginal}
          />
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
