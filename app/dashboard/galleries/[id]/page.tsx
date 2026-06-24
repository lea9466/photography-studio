import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchGalleryDetail, ensurePortfolioSlug } from '@/lib/actions/gallery.actions'
import { fetchGallerySelections } from '@/lib/actions/photo.actions'
import { createClient } from '@/lib/supabase/server'
import { fetchGalleryPhotos } from '@/lib/actions/photo.actions'
import { fetchClients } from '@/lib/actions/client.actions'
import { resolveWatermarkText } from '@/lib/images/process'
import { signStoragePaths } from '@/lib/storage'
import { unwrapOne } from '@/lib/unwrap'
import type { Gallery, Client, GallerySettings, GalleryType } from '@/lib/types/database.types'
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
import { GalleryEditForm } from '@/components/dashboard/GalleryEditForm'
import { Upload, Image as ImageIcon, Settings, Lock, Link as LinkIcon, Zap, Droplets, Download, UserCheck, Eye, ImageIcon as ImageIcon2, Rocket, User, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GALLERY_TYPE_LABELS } from '@/lib/types/app.types'
import { GalleryUploadProgressBar } from '@/components/gallery/GalleryUploadProgressBar'

type GalleryPageProps = {
  params: Promise<{ id: string }>
}

export default async function GalleryOverviewPage({ params }: GalleryPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: profileData } = await supabase
    .from('users')
    .select('studio_name')
    .eq('id', user.id)
    .single()

  const studioName =
    (profileData as { studio_name: string | null } | null)?.studio_name ?? null

  const data = await fetchGalleryDetail(id)
  if (!data) notFound()

  type Detail = Gallery & {
    clients: Client | Client[] | null
    gallery_settings: GallerySettings | GallerySettings[] | null
  }

  const gallery = data as Detail
  const client = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients
  const settings = Array.isArray(gallery.gallery_settings)
    ? gallery.gallery_settings[0]
    : gallery.gallery_settings

  let slug = gallery.slug
  if (gallery.gallery_type === 'portfolio' && !slug) {
    slug = await ensurePortfolioSlug(gallery.id, gallery.title, gallery.slug)
  }

  const clientLink =
    gallery.gallery_type === 'portfolio' && slug
      ? `/portfolio/${slug}`
      : `/g/${gallery.id}`

  const { albumPhotos, editPhotos } = await fetchGallerySelections(id)
  const photos = await fetchGalleryPhotos(id)
  const clients = await fetchClients()
  const signedUrls = await signStoragePaths(
    'previews',
    photos.map((p) => (p as { preview_url: string | null }).preview_url)
  )

  return (
    <div className="animate-fade-in space-y-12">
      {/* Section 1: Overview - Actions */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#100d1f] flex items-center gap-2">
            <Zap className="w-5 h-5" />
            פעולות
          </h2>
          <p className="text-sm text-[#48464c]">
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
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#100d1f] flex items-center gap-2">
            <Info className="w-5 h-5" />
            פרטים
          </h2>
          <p className="text-sm text-[#48464c]">
            פרטי לקוח, לינק גישה והגדרות בחירה
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {client ? (
            <ClientEditForm client={client} galleryId={gallery.id} />
          ) : (
            <Card className="border-[#c9c5cd] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#100d1f]">פרטי לקוח</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[#48464c]">
                לא משויך לקוח לגלריה זו
              </CardContent>
            </Card>
          )}

          <Card className="border-[#c9c5cd] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#100d1f]">גישה</CardTitle>
              <CardDescription className="text-[#48464c]">
                {gallery.gallery_type === 'portfolio'
                  ? 'לינק ציבורי לתיק עבודות'
                  : 'לינק ללקוח'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#48464c] font-medium">
                  <LinkIcon className="w-4 h-4" />
                  לינק גישה
                </div>
                <div className="bg-[#f7f2f4] rounded-lg p-3 border border-[#c9c5cd]">
                  <p className="break-all text-sm text-[#100d1f] font-medium" dir="ltr">
                    {process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}
                    {clientLink}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#48464c] font-medium">
                  <Lock className="w-4 h-4" />
                  סיסמה
                </div>
                <div className="bg-[#f7f2f4] rounded-lg p-3 border border-[#c9c5cd]">
                  <p className="text-sm text-[#100d1f] font-medium" dir="ltr">
                    {gallery.password ?? '—'}
                  </p>
                </div>
              </div>
              {settings?.max_album_selection != null && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[#48464c] font-medium">
                    <ImageIcon className="w-4 h-4" />
                    מקסימום אלבום
                  </div>
                  <div className="bg-[#f7f2f4] rounded-lg p-3 border border-[#c9c5cd]">
                    <p className="text-sm text-[#100d1f] font-medium">
                      {settings.max_album_selection}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3: Settings - Edit Gallery */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#100d1f] flex items-center gap-2">
            <Settings className="w-5 h-5" />
            הגדרות
          </h2>
          <p className="text-sm text-[#48464c]">
            עריכת פרטי הגלריה, סוג הגלריה והגדרות מתקדמות
          </p>
        </div>
        <Card className="border-[#c9c5cd] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#100d1f]">עריכת הגדרות</CardTitle>
            <CardDescription className="text-[#48464c]">שינויים נשמרים בלחיצה על &quot;שמור הגדרות&quot;</CardDescription>
          </CardHeader>
          <CardContent>
            <GalleryEditForm
              gallery={{
                id: gallery.id,
                title: gallery.title,
                password: gallery.password,
                expires_at: gallery.expires_at,
              }}
              settings={settings}
            />
          </CardContent>
        </Card>
      </section>

      {/* Section 4: Photos - Selections */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#100d1f] flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            בחירות
          </h2>
          <p className="text-sm text-[#48464c]">
            בחירות הלקוח ותמונות מעובדות
          </p>
        </div>
        <SelectionsView
          galleryId={gallery.id}
          albumPhotos={albumPhotos}
          editPhotos={editPhotos}
        />
      </section>

      {/* Section 5: Upload and Management */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#100d1f] flex items-center gap-2">
            <Upload className="w-5 h-5" />
            העלאה וניהול
          </h2>
          <p className="text-sm text-[#48464c]">
            העלאת תמונות חדשות וניהול הגלריה
          </p>
        </div>
        <GalleryPhotosSection
          galleryId={gallery.id}
          userId={user.id}
          watermarkText={resolveWatermarkText(settings?.watermark_text, studioName)}
          photos={photos as never}
          signedUrls={signedUrls}
          showWizardHeader={false}
          showWizardFooter={false}
          initialPhotoLimit={20}
        />
      </section>

      {/* Floating Save Button */}
      <div className="fixed bottom-8 left-8 z-50">
        <Button
          className="bg-[#6b2d43] text-white px-12 py-3 rounded-xl font-bold text-lg shadow-sm hover:bg-[#5a2538] active:scale-[0.98] transition-all"
        >
          שמור הגדרות
        </Button>
      </div>
    </div>
  )
}
