'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateGallerySettings } from '@/lib/actions/gallery.actions'
import type { Gallery, GallerySettings } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type GallerySettingsFormProps = {
  gallery: Gallery
  settings: GallerySettings | null
}

export function GallerySettingsForm({
  gallery,
  settings,
}: GallerySettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(gallery.title)
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
        toast.success('ההגדרות נשמרו')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>הגדרות גלריה</CardTitle>
        <CardDescription>עריכה ושמירה</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">שם הגלריה</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires">תפוגה</Label>
            <Input
              id="expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-album">מקסימום אלבום</Label>
            <Input
              id="max-album"
              type="number"
              value={maxAlbum}
              onChange={(e) => setMaxAlbum(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-edit">מקסימום עיבוד</Label>
            <Input
              id="max-edit"
              type="number"
              value={maxEdit}
              onChange={(e) => setMaxEdit(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="watermark">סימן מים</Label>
            <Input
              id="watermark"
              value={watermark}
              onChange={(e) => setWatermark(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-[--border] p-4">
          <div className="flex items-center justify-between">
            <Label>הורדת preview</Label>
            <Switch checked={allowPreview} onCheckedChange={setAllowPreview} />
          </div>
          <div className="flex items-center justify-between">
            <Label>הורדת מקור</Label>
            <Switch checked={allowOriginal} onCheckedChange={setAllowOriginal} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </CardContent>
    </Card>
  )
}
