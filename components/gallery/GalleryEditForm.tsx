'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateGallerySettings } from '@/lib/actions/gallery.actions'
import { GalleryPhotosSection } from '@/components/gallery/GalleryPhotosSection'
import type { Gallery, GallerySettings, Client, GalleryType } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GALLERY_TYPE_LABELS } from '@/lib/types/app.types'
import { Lock, Zap, Droplets, Download, UserCheck, Eye, ImageIcon } from 'lucide-react'

type GalleryEditFormProps = {
  gallery: Gallery & { clients: Client | Client[] | null }
  client: Client | null
  settings: GallerySettings | null
  clients: Client[]
}

export function GalleryEditForm({
  gallery,
  client,
  settings,
  clients,
}: GalleryEditFormProps) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(gallery.title)
  const [galleryType, setGalleryType] = useState<GalleryType>(gallery.gallery_type)
  const [clientId, setClientId] = useState(client?.id ?? '')
  const [password, setPassword] = useState(gallery.password ?? '')
  const [expiresAt, setExpiresAt] = useState(
    gallery.expires_at ? gallery.expires_at.slice(0, 10) : ''
  )
  const [maxAlbum, setMaxAlbum] = useState(
    settings?.max_album_selection?.toString() ?? ''
  )
  const [maxEdit, setMaxEdit] = useState(
    settings?.max_edit_selection?.toString() ?? ''
  )
  const [watermark, setWatermark] = useState(settings?.watermark_text ?? '')
  const [allowPreview, setAllowPreview] = useState(
    settings?.allow_download_preview ?? false
  )
  const [allowOriginal, setAllowOriginal] = useState(
    settings?.allow_download_original ?? false
  )

  function handleSave() {
    startTransition(async () => {
      try {
        await updateGallerySettings(gallery.id, {
          title,
          password: password || undefined,
          expiresAt: expiresAt || null,
          maxAlbumSelection: maxAlbum ? Number(maxAlbum) : null,
          maxEditSelection: maxEdit ? Number(maxEdit) : null,
          watermarkText: watermark || null,
          allowDownloadPreview: allowPreview,
          allowDownloadOriginal: allowOriginal,
        })
        toast.success('הגלריה עודכנה בהצלחה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה בעדכון הגלריה')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Gallery Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>פרטי גלריה</CardTitle>
          <CardDescription>ערוך את פרטי הגלריה הבסיסיים</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">שם הגלריה</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="למשל: חתונה של דנה ואבי"
              />
            </div>

            <div className="space-y-2">
              <Label>לקוח</Label>
              <Input
                value={client?.name || 'ללא לקוח'}
                disabled
                className="bg-[--background]"
              />
            </div>

            <div className="space-y-2">
              <Label>סוג גלריה</Label>
              <Input
                value={GALLERY_TYPE_LABELS[galleryType]}
                disabled
                className="bg-[--background]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#7D3A52]" />
            אבטחה ופרטיות
          </CardTitle>
          <CardDescription>הגדרות גישה ותאריך תפוגה</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">סיסמת גלריה</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזן סיסמה..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">תאריך תפוגה</Label>
              <Input
                id="expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-[--muted] italic">
            לאחר תאריך התפוגה, הגישה לגלריה תיחסם אוטומטית.
          </p>
        </CardContent>
      </Card>

      {/* Limits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#7D3A52]" />
            מגבלות אלבום
          </CardTitle>
          <CardDescription>הגדרת מגבלות לבחירה ועריכה</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-album">מקסימום תמונות בגלריה</Label>
              <Input
                id="max-album"
                type="number"
                value={maxAlbum}
                onChange={(e) => setMaxAlbum(e.target.value)}
                placeholder="ללא הגבלה"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-edit">מקסימום תמונות לעריכה</Label>
              <Input
                id="max-edit"
                type="number"
                value={maxEdit}
                onChange={(e) => setMaxEdit(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content & Watermark Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-[#7D3A52]" />
            תוכן וסימן מים
          </CardTitle>
          <CardDescription>הגדרות סימן מים ומיתוג</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="watermark">טקסט לסימן מים</Label>
            <Input
              id="watermark"
              value={watermark}
              onChange={(e) => setWatermark(e.target.value)}
              placeholder="הזן טקסט למיתוג..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Download Permissions Section — MVP: frozen for public-only */}
      <Card className="opacity-35 pointer-events-none select-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-[#7D3A52]" />
            הרשאות הורדה
          </CardTitle>
          <CardDescription>הגדרת הרשאות הורדה עבור הלקוח</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">אפשר הורדת תצוגה מקדימה</h4>
              <p className="text-sm text-[--muted]">הורדת תמונות ברזולוציה נמוכה עם סימן מים</p>
            </div>
            <Switch checked={allowPreview} onCheckedChange={setAllowPreview} />
          </div>
          <div className="h-[1px] w-full bg-[--border]"></div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">אפשר הורדת קבצי מקור</h4>
              <p className="text-sm text-[--muted]">הורדת קבצי Full HD ללא סימן מים</p>
            </div>
            <Switch checked={allowOriginal} onCheckedChange={setAllowOriginal} />
          </div>
        </CardContent>
      </Card>

      {/* Photo Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>ניהול תמונות</CardTitle>
          <CardDescription>העלה, ערוך ונהל את התמונות בגלריה</CardDescription>
        </CardHeader>
        <CardContent>
          <GalleryPhotosSection
            galleryId={gallery.id}
            userId={gallery.user_id}
            watermarkText={watermark}
            photos={[]}
            signedUrls={{}}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isPending}
        >
          ביטול
        </Button>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-[#7D3A52] text-white hover:bg-[#6a2f44]"
        >
          {isPending ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>
    </div>
  )
}
