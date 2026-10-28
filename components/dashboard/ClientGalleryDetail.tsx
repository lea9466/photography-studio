import {
  Zap,
  Info,
  Settings,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Lock,
} from 'lucide-react'
import { fetchGallerySelections, fetchGalleryPhotos } from '@/lib/actions/photo.actions'
import { resolveWatermarkText } from '@/lib/images/process'
import { resolvePrivateGalleryPaths } from '@/lib/storage'
import { getPrivateGalleryBaseUrl } from '@/lib/private-gallery-url'
import { isPhotoLimitTestUser } from '@/lib/gallery-photo-limits'
import { getPrivateGalleryEntitlements } from '@/lib/private-galleries/loader'
import { isClientCoverPath } from '@/lib/private-galleries/client-cover'
import {
  DOWNLOAD_PERMISSIONS_ENABLED,
  GALLERY_STATUS_LABELS,
  isClientSelectionComplete,
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
import { SendGalleryToClientButton } from '@/components/dashboard/SendGalleryToClientButton'
import { ClientEditForm } from '@/components/dashboard/ClientEditForm'
import { SelectionsView } from '@/components/dashboard/SelectionsView'
import { GalleryPhotosSection } from '@/components/gallery/GalleryPhotosSection'
import { ClientGalleryEditForm } from '@/components/dashboard/ClientGalleryEditForm'
import { ScrollToSection } from '@/components/dashboard/ScrollToSection'
import { CollapsibleSection } from '@/components/dashboard/CollapsibleSection'

type ClientGalleryDetailProps = {
  gallery: Gallery
  client: Client | null
  settings: GallerySettings | null
  userId: string
  studioName: string | null
}

const SECTION_CLASS = 'relative space-y-6 rounded-xl border border-[#c9c5cd] p-6'

/** What the photographer should do next, per gallery status. Display only. */
const NEXT_STEP: Partial<Record<Gallery['status'], string>> = {
  draft: 'העלי תמונות ושלחי ללקוח',
  selection: 'ממתינה שהלקוח יסיים לבחור תמונות',
  editing: 'הלקוח סיים לבחור — העלי את התמונות המעובדות',
  delivery_ready: 'הגלריה נמסרה — אין צעד נוסף',
}

/**
 * Manage view for a private client gallery — the full client-delivery surface:
 * status + next step, actions (send / delivery), the client's selections, photo
 * upload (originals included), and — folded away, since they're set-and-forget —
 * client details + access link and gallery settings.
 */
export async function ClientGalleryDetail({
  gallery,
  client,
  settings,
  userId,
  studioName,
}: ClientGalleryDetailProps) {
  const clientLink = `/g/${gallery.id}`
  // One-time use: once sent, the source album is frozen (see
  // docs/private-gallery-lifecycle-plan.md).
  const albumLocked = Boolean(gallery.photos_locked_at)

  // Suspended = the private-gallery subscription lapsed past its 15-day grace.
  // The client AND the photographer are blocked from the content until renewal.
  if (gallery.suspended_at) {
    return (
      <div className="animate-fade-in">
        <div className={`${SECTION_CLASS} mx-auto max-w-lg text-center`}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#7D3A52]/10 text-[#7D3A52]">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-[#100d1f]">הגלריה מושהית</h2>
          <p className="text-sm leading-relaxed text-[#48464c]">
            המנוי לגלריות פרטיות פג ולא חודש, ולכן כל גלריות הלקוח שלך מושהות —
            הלקוחות ואת חסומים מהתוכן. חידוש המנוי מחזיר את הגישה לכל הגלריות
            מיד.
          </p>
          <a
            href="/dashboard/usage-packages"
            className="inline-flex items-center justify-center rounded-xl bg-[#6b2d43] px-6 py-3 text-sm font-bold text-white hover:bg-[#5a2538]"
          >
            חידוש מנוי
          </a>
          <p className="text-xs text-[#48464c]">
            שימי לב: אם לא תחדשי מנוי בתוך 15 יום נוספים (30 יום סה״כ מאז שהמנוי
            פג), הגלריות המושהות יימחקו לצמיתות.
          </p>
        </div>
      </div>
    )
  }

  const { albumPhotos, editPhotos } = await fetchGallerySelections(gallery.id)
  const photos = await fetchGalleryPhotos(gallery.id)
  // A tier-rows failure must not 500 the manage page — degrade to no hint.
  const privateGalleryLimits = await getPrivateGalleryEntitlements(userId)
    .then((e) => e.limits)
    .catch(() => null)
  // Owner viewing her own private gallery — serve her the media through the
  // content-filter-exempt subdomain (middleware mints the sg_gallery_<id>
  // cookie that authorizes it).
  const signedUrls = await resolvePrivateGalleryPaths(
    'previews',
    photos.map((p) => (p as { preview_url: string | null }).preview_url)
  )
  // The cover is a separate upload in the gallery's gated prefix (not a photo
  // row), so it is signed on its own — and only when it's a path we generated.
  const coverPath = isClientCoverPath(gallery.cover_image, userId, gallery.id)
    ? gallery.cover_image
    : null
  const coverUrl = coverPath
    ? ((await resolvePrivateGalleryPaths('previews', [coverPath]))[coverPath] ?? null)
    : null

  const selectionsCount = albumPhotos.length + editPhotos.length
  const nextStep = NEXT_STEP[gallery.status]

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      {/* Deep-link from the "client finished selecting" email (?section=selections).
          The selections CollapsibleSection opens itself for that same param. */}
      <ScrollToSection />

      {/* Every topic is the same folded card: title, one-line digest, details on
          open. Photos come last — they are the bulk of the page. */}
      <CollapsibleSection
        id="actions"
        tone="burgundy"
        icon={<Zap className="h-5 w-5" />}
        title="פעולות"
        summary={`${GALLERY_STATUS_LABELS[gallery.status] ?? gallery.status}${nextStep ? ` · ${nextStep}` : ''}`}
        defaultOpen
      >
        <GalleryActions
          galleryId={gallery.id}
          galleryTitle={gallery.title}
          status={gallery.status}
          galleryType={gallery.gallery_type}
          clientLink={clientLink}
          publicOnlyMvp={false}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="selections"
        tone="burgundy"
        icon={<ImageIcon className="h-5 w-5" />}
        title="בחירות הלקוח"
        summary={`אלבום ${albumPhotos.length} · לעיבוד ${editPhotos.length}`}
        defaultOpen={selectionsCount > 0}
      >
        <SelectionsView
          galleryId={gallery.id}
          clientName={client?.name?.trim() || 'לקוח'}
          albumPhotos={albumPhotos}
          editPhotos={editPhotos}
        />
      </CollapsibleSection>

      <div className="grid items-start gap-4 md:grid-cols-2">
      <CollapsibleSection
        tone="violet"
        icon={<Info className="h-5 w-5" />}
        title="לקוח וקישור גישה"
        summary={
          client
            ? [client.name, client.email].filter(Boolean).join(' · ')
            : 'לא משויך לקוח'
        }
      >
        <div className="space-y-4">
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
            <CardContent className="space-y-4">
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
              <p className="flex items-start gap-2 text-xs leading-relaxed text-[#48464c]">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                הלקוח מקבל קוד חד-פעמי למייל בכל כניסה. אין סיסמה קבועה.
              </p>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        tone="violet"
        icon={<Settings className="h-5 w-5" />}
        title="הגדרות הגלריה"
        summary={[
          gallery.title,
          gallery.expires_at
            ? `תפוגה ${new Date(gallery.expires_at).toLocaleDateString('he-IL')}`
            : 'ללא תפוגה',
          settings?.auto_apply_watermark === false ? 'ללא סימן מים' : 'סימן מים פעיל',
        ].join(' · ')}
      >
        <ClientGalleryEditForm
          gallery={{
            id: gallery.id,
            title: gallery.title,
            expires_at: gallery.expires_at,
          }}
          locked={albumLocked}
          settings={settings}
          downloadPermissionsEnabled={DOWNLOAD_PERMISSIONS_ENABLED}
          coverUrl={coverUrl}
        />
      </CollapsibleSection>
      </div>

      <CollapsibleSection
        id="photos"
        tone="burgundy"
        icon={<Upload className="h-5 w-5" />}
        title="תמונות"
        summary={
          albumLocked
            ? `${photos.length} תמונות · אלבום המקור נעול`
            : `${photos.length} תמונות`
        }
        defaultOpen
      >
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
          privateGalleryPhotoLimit={
            (gallery as { pass_photo_cap: number | null }).pass_photo_cap ??
            privateGalleryLimits?.maxPhotosPerGallery
          }
          processedTabLocked={!isClientSelectionComplete(gallery.status)}
          watermarkPlacement="center"
          albumLocked={albumLocked}
        />
      </CollapsibleSection>

      {/* Once the client has finished choosing, the processed photos are
          uploaded right above — keep "send processed photos" floating at the
          bottom, same bar as on the upload screen. */}
      {gallery.status === 'editing' && client?.email ? (
        <div className="pointer-events-none sticky bottom-4 z-30 flex justify-start sm:bottom-6">
          <div className="pointer-events-auto rounded-2xl border border-[#e5e1e3] bg-white/95 px-3 py-2 shadow-xl shadow-black/10 backdrop-blur">
            <SendGalleryToClientButton galleryId={gallery.id} status={gallery.status} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
