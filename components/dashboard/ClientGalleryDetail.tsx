import { Zap, Info, Settings, Image as ImageIcon, Upload, Link as LinkIcon, Lock } from 'lucide-react'
import { fetchGallerySelections, fetchGalleryPhotos } from '@/lib/actions/photo.actions'
import { resolveWatermarkText } from '@/lib/images/process'
import { resolvePrivateGalleryPaths } from '@/lib/storage'
import { getPrivateGalleryBaseUrl } from '@/lib/private-gallery-url'
import { isPhotoLimitTestUser } from '@/lib/gallery-photo-limits'
import {
  PUBLIC_ONLY_MVP,
  DOWNLOAD_PERMISSIONS_ENABLED,
  isMvpBypassUser,
} from '@/lib/types/app.types'
import type { Gallery, Client, GallerySettings } from '@/lib/types/database.types'
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
import { GalleryPhotosSection } from '@/components/gallery/GalleryPhotosSection'
import { ClientGalleryEditForm } from '@/components/dashboard/ClientGalleryEditForm'

type ClientGalleryDetailProps = {
  gallery: Gallery
  client: Client | null
  settings: GallerySettings | null
  userId: string
  studioName: string | null
}

const SECTION_CLASS = 'relative space-y-6 rounded-xl border border-[#c9c5cd] p-6'

/**
 * Manage view for a private client gallery — the full client-delivery surface:
 * actions (send / status / delivery), client details + access link, settings,
 * the client's selections, photo upload (originals included).
 */
export async function ClientGalleryDetail({
  gallery,
  client,
  settings,
  userId,
  studioName,
}: ClientGalleryDetailProps) {
  const effectiveMvp = PUBLIC_ONLY_MVP && !isMvpBypassUser(userId)
  const effectiveDownloadPermissionsEnabled =
    DOWNLOAD_PERMISSIONS_ENABLED || isMvpBypassUser(userId)

  const clientLink = `/g/${gallery.id}`

  const { albumPhotos, editPhotos } = await fetchGallerySelections(gallery.id)
  const photos = await fetchGalleryPhotos(gallery.id)
  // Owner viewing her own private gallery — serve her the media through the
  // content-filter-exempt subdomain (middleware mints the sg_gallery_<id>
  // cookie that authorizes it).
  const signedUrls = await resolvePrivateGalleryPaths(
    'previews',
    photos.map((p) => (p as { preview_url: string | null }).preview_url)
  )

  return (
    <div className="animate-fade-in space-y-8 sm:space-y-12">
      <section className={SECTION_CLASS}>
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-[#100d1f]">
            <Zap className="h-5 w-5" />
            פעולות
          </h2>
          <p className="text-sm text-[#48464c]">שליחה ללקוח, תצוגה מקדימה וניהול סטטוס</p>
        </div>
        <GalleryActions
          galleryId={gallery.id}
          galleryTitle={gallery.title}
          status={gallery.status}
          galleryType={gallery.gallery_type}
          clientLink={clientLink}
          publicOnlyMvp={effectiveMvp}
        />
      </section>

      <section className={SECTION_CLASS}>
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-[#100d1f]">
            <Info className="h-5 w-5" />
            פרטים
          </h2>
          <p className="text-sm text-[#48464c]">פרטי לקוח, לינק גישה והגדרות בחירה</p>
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
              <CardDescription className="text-[#48464c]">לינק ללקוח</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[#48464c]">
                  <LinkIcon className="h-4 w-4" />
                  לינק גישה
                </div>
                <div className="rounded-lg border border-[#c9c5cd] bg-[#f7f2f4] p-3">
                  <p className="break-all text-sm font-medium text-[#100d1f]" dir="ltr">
                    {getPrivateGalleryBaseUrl()}
                    {clientLink}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[#48464c]">
                  <Lock className="h-4 w-4" />
                  קוד כניסה
                </div>
                <p className="rounded-lg border border-[#c9c5cd] bg-[#f7f2f4] p-3 text-sm leading-relaxed text-[#48464c]">
                  הלקוח מבקש קוד חד-פעמי שנשלח למייל שלו, והקוד פג לאחר שימוש. אין
                  סיסמה קבועה.
                </p>
              </div>
              {settings?.max_album_selection != null && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#48464c]">
                    <ImageIcon className="h-4 w-4" />
                    מקסימום אלבום
                  </div>
                  <div className="rounded-lg border border-[#c9c5cd] bg-[#f7f2f4] p-3">
                    <p className="text-sm font-medium text-[#100d1f]">
                      {settings.max_album_selection}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#100d1f] sm:text-xl">
            <Settings className="h-5 w-5" />
            הגדרות
          </h2>
          <p className="text-sm text-[#48464c]">
            שם, תפוגה, מגבלות בחירה, הרשאות הורדה וסימן מים
          </p>
        </div>
        <Card className="border-[#c9c5cd] shadow-sm">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-[#100d1f]">עריכת הגדרות</CardTitle>
            <CardDescription className="text-[#48464c]">
              שינויים נשמרים בלחיצה על &quot;שמור הגדרות&quot;
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ClientGalleryEditForm
              gallery={{
                id: gallery.id,
                title: gallery.title,
                expires_at: gallery.expires_at,
              }}
              settings={settings}
              downloadPermissionsEnabled={effectiveDownloadPermissionsEnabled}
            />
          </CardContent>
        </Card>
      </section>

      <section className={SECTION_CLASS}>
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-[#100d1f]">
            <ImageIcon className="h-5 w-5" />
            בחירות
          </h2>
          <p className="text-sm text-[#48464c]">בחירות הלקוח ותמונות מעובדות</p>
        </div>
        <SelectionsView
          galleryId={gallery.id}
          clientName={client?.name?.trim() || 'לקוח'}
          albumPhotos={albumPhotos}
          editPhotos={editPhotos}
        />
      </section>

      <section className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#100d1f] sm:text-xl">
            <Upload className="h-5 w-5" />
            העלאה וניהול
          </h2>
          <p className="text-sm text-[#48464c]">
            העלאת תמונות חדשות — בגלריית לקוח נשמרות גם תמונות המקור
          </p>
        </div>
        <GalleryPhotosSection
          galleryId={gallery.id}
          userId={userId}
          watermarkText={resolveWatermarkText(settings?.watermark_text, studioName)}
          applyAutoWatermark={settings?.auto_apply_watermark ?? true}
          photos={photos as never}
          signedUrls={signedUrls}
          showWizardHeader={false}
          initialPhotoLimit={20}
          publicOnlyMvp={false}
          photoCountLimitBypassed={isPhotoLimitTestUser(userId)}
          storeOriginalPhotos
        />
      </section>
    </div>
  )
}
