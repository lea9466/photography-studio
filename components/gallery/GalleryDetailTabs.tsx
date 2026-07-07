'use client'

import { Upload, Image as ImageIcon, Settings } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GalleryActions } from '@/components/dashboard/GalleryActions'
import { ClientEditForm } from '@/components/dashboard/ClientEditForm'
import { SelectionsView } from '@/components/dashboard/SelectionsView'
import { UploadEdited } from '@/components/gallery/UploadEdited'
import { GalleryPhotosSection } from '@/components/gallery/GalleryPhotosSection'
import type { Gallery, Client, GallerySettings } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type GalleryDetailTabsProps = {
  gallery: Gallery
  client: Client | null
  settings: GallerySettings | null
  clientLink: string
  albumPhotos: any[]
  editPhotos: any[]
  photos: any[]
  signedUrls: Record<string, string>
  userId: string
  watermarkText: string | null
}

export function GalleryDetailTabs({
  gallery,
  client,
  settings,
  clientLink,
  albumPhotos,
  editPhotos,
  photos,
  signedUrls,
  userId,
  watermarkText,
}: GalleryDetailTabsProps) {
  return (
    <div className="space-y-8">
      {/* Section 1: Overview - Actions */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">פעולות</h2>
          <p className="text-sm text-[--muted]">
            שליחה ללקוח, תצוגה מקדימה וניהול סטטוס
          </p>
        </div>
        <GalleryActions
          galleryId={gallery.id}
          galleryTitle={gallery.title}
          status={gallery.status}
          galleryType={gallery.gallery_type}
          clientLink={clientLink}
        />
      </section>

      {/* Section 2: Info and Actions - Details */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">פרטים</h2>
          <p className="text-sm text-[--muted]">
            פרטי לקוח, לינק גישה והגדרות בחירה
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {client ? (
            <ClientEditForm client={client} galleryId={gallery.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>פרטי לקוח</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[--muted]">
                לא משויך לקוח לגלריה זו
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>גישה</CardTitle>
              <CardDescription>
                {gallery.gallery_type === 'portfolio'
                  ? 'לינק ציבורי לתיק עבודות'
                  : 'לינק ללקוח'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="break-all text-sm" dir="ltr">
                {process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}
                {clientLink}
              </p>
              <p className="text-sm">
                <span className="text-[--muted]">סיסמה: </span>
                <span dir="ltr">{gallery.password ?? '—'}</span>
              </p>
              {settings?.max_album_selection != null ? (
                <p className="text-sm text-[--muted]">
                  מקסימום אלבום: {settings.max_album_selection}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3: Photos - Selections */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            בחירות
          </h2>
          <p className="text-sm text-[--muted]">
            בחירות הלקוח ותמונות מעובדות
          </p>
        </div>
        <SelectionsView
          galleryId={gallery.id}
          albumPhotos={albumPhotos}
          editPhotos={editPhotos}
        />

        {['editing', 'delivery_ready'].includes(gallery.status) ? (
          <Card>
            <CardHeader>
              <CardTitle>העלאת תמונות מעובדות</CardTitle>
              <CardDescription>
                גררי את כל התמונות המעובדות — הן ישויכו לבחירות הלקוח
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadEdited
                galleryId={gallery.id}
                userId={userId}
                selectedPhotos={editPhotos}
              />
            </CardContent>
          </Card>
        ) : null}
      </section>

      {/* Section 4: Upload and Management */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Upload className="w-5 h-5" />
            העלאה וניהול
          </h2>
          <p className="text-sm text-[--muted]">
            העלאת תמונות חדשות וניהול הגלריה
          </p>
        </div>
        <GalleryPhotosSection
          galleryId={gallery.id}
          userId={userId}
          watermarkText={watermarkText}
          applyAutoWatermark={settings?.auto_apply_watermark ?? true}
          photos={photos}
          signedUrls={signedUrls}
        />
      </section>

      {/* Section 5: Settings - Edit Gallery */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Settings className="w-5 h-5" />
            הגדרות
          </h2>
          <p className="text-sm text-[--muted]">
            עריכת פרטי הגלריה, סוג הגלריה והגדרות מתקדמות
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Button asChild className="w-full">
              <Link href={`/dashboard/galleries/${gallery.id}/edit`}>
                ערוך גלריה
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
