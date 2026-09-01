import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Info } from 'lucide-react'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { fetchClients } from '@/lib/actions/client.actions'
import { getPublicGalleryQuota, getPrivateGalleryQuota } from '@/lib/actions/gallery.actions'
import { GalleryBreadcrumb } from '@/components/dashboard/GalleryBreadcrumb'
import { ShowcaseGalleryForm } from '@/components/gallery/ShowcaseGalleryForm'
import { ClientGalleryWizard } from '@/components/gallery/ClientGalleryWizard'
import { Button } from '@/components/ui/button'
import { isGalleryKind, GALLERY_KIND_LABELS } from '@/lib/gallery-kind'
import {
  MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER,
  MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER,
  PUBLIC_ONLY_MVP,
  DOWNLOAD_PERMISSIONS_ENABLED,
  isMvpBypassUser,
} from '@/lib/types/app.types'

type NewGalleryPageProps = {
  searchParams: Promise<{ kind?: string }>
}

const KIND_META = {
  showcase: {
    list: { href: '/dashboard/galleries', label: 'גלריות ציבוריות' },
    note:
      'גלריה ציבורית מוצגת באתר התדמית שלך, ללא סיסמה — כרטיס עם תמונת שער ותמונות בסקשן "תמונות אחרונות". ליצירת גלריה פרטית ללקוח, עברי לטאב "גלריות פרטיות".',
  },
  client: {
    list: { href: '/dashboard/private-galleries', label: 'גלריות פרטיות' },
    note:
      'גלריה פרטית נשלחת ללקוח, מוגנת בסיסמה ומוגשת מדומיין נפרד ומאובטח. הלקוח בוחר תמונות והגלריה נמסרת בסוף התהליך. ליצירת גלריה לאתר, עברי לטאב "גלריות ציבוריות".',
  },
} as const

export default async function NewGalleryPage({ searchParams }: NewGalleryPageProps) {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context

  // The kind is decided by which list the "גלריה חדשה" button was pressed on —
  // there is no in-flow chooser. Accounts without private galleries are always
  // showcase.
  const canCreateClientGalleries = !PUBLIC_ONLY_MVP || isMvpBypassUser(userId)
  const kindParam = (await searchParams).kind
  const requestedKind = isGalleryKind(kindParam) ? kindParam : 'showcase'
  const kind = canCreateClientGalleries ? requestedKind : 'showcase'
  const meta = KIND_META[kind]

  const [{ data: profileData }, clients, quota, privateQuota] = await Promise.all([
    supabase.from('users').select('studio_name').eq('id', userId).single(),
    fetchClients(),
    getPublicGalleryQuota(),
    getPrivateGalleryQuota(),
  ])

  const studioName =
    (profileData as { studio_name: string | null } | null)?.studio_name ?? ''

  const maxGalleries = quota?.maxGalleries ?? MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER
  const photoCount = quota?.photoCount ?? 0
  const maxPhotos = quota?.maxPhotos ?? MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER
  const blockedByQuota =
    kind === 'showcase'
      ? !(quota?.canCreateGallery ?? true)
      : !(privateQuota?.canCreateGallery ?? true)

  const downloadPermissionsEnabled =
    DOWNLOAD_PERMISSIONS_ENABLED || isMvpBypassUser(userId)

  return (
    <div className="space-y-6">
      <GalleryBreadcrumb
        galleryTitle="גלריה חדשה"
        backHref={meta.list.href}
        backLabel={meta.list.label}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">
            גלריה חדשה · {GALLERY_KIND_LABELS[kind]}
          </h1>
          {kind === 'showcase' ? (
            <p className="mt-1 text-sm text-[--muted]">
              {blockedByQuota
                ? `הגעת למקסימום ${maxGalleries} גלריות`
                : `${quota?.galleryCount ?? 0} מתוך ${maxGalleries} גלריות · ${photoCount}/${maxPhotos} תמונות`}
            </p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href={meta.list.href}>ביטול</Link>
        </Button>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-[#c9c5cd] bg-[#f7f2f4] px-4 py-3 text-sm leading-relaxed text-[#48464c]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#7D3A52]" aria-hidden />
        <p>{meta.note}</p>
      </div>

      {blockedByQuota ? (
        <div className="rounded-xl border border-[#c9c5cd] bg-white p-8 text-center">
          <p className="text-[#48464c]">
            {kind === 'client' ? (
              privateQuota?.isLifetime ? (
                'ניצלת כבר את הגלריה הפרטית החינמית שלך — מחיקתה לא תשחרר מקום. יש לשדרג למסלול בתשלום כדי ליצור גלריה נוספת.'
              ) : (
                <>
                  ניתן ליצור עד {privateQuota?.maxGalleries} גלריות פרטיות במקביל במסלול הנוכחי,
                  עם עד {privateQuota?.maxPhotosPerGallery} תמונות לגלריה. מחקי גלריה קיימת או שדרגי
                  כדי ליצור חדשה.
                </>
              )
            ) : (
              <>
                ניתן ליצור עד {maxGalleries} גלריות, עם עד {maxPhotos} תמונות בסך הכל.
                מחקי גלריה קיימת כדי ליצור חדשה.
              </>
            )}
          </p>
          <Button asChild className="mt-6 bg-[#7D3A52] text-white hover:bg-[#6a2f44]">
            <Link href={meta.list.href}>חזרה לגלריות</Link>
          </Button>
        </div>
      ) : kind === 'client' ? (
        <ClientGalleryWizard
          clients={clients}
          defaultWatermarkText={studioName}
          downloadPermissionsEnabled={downloadPermissionsEnabled}
        />
      ) : (
        <ShowcaseGalleryForm defaultWatermarkText={studioName} />
      )}
    </div>
  )
}
