import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Info } from 'lucide-react'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { fetchClients } from '@/lib/actions/client.actions'
import { getPublicGalleryQuota, getPrivateGalleryQuota } from '@/lib/actions/gallery.actions'
import { fetchActiveGalleryPassBundles } from '@/lib/gallery-pass/loader'
import { fetchAvailableGalleryPassCredits } from '@/lib/gallery-pass/credits'
import { GalleryBreadcrumb } from '@/components/dashboard/GalleryBreadcrumb'
import { ShowcaseGalleryForm } from '@/components/gallery/ShowcaseGalleryForm'
import { ClientGalleryWizard } from '@/components/gallery/ClientGalleryWizard'
import { GalleryPassPurchasePanel } from '@/components/gallery/GalleryPassPurchasePanel'
import { Button } from '@/components/ui/button'
import { isGalleryKind, GALLERY_KIND_LABELS } from '@/lib/gallery-kind'
import {
  MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER,
  MAX_PUBLIC_PHOTOS_PER_PHOTOGRAPHER,
  CLIENT_GALLERIES_ENABLED,
  DOWNLOAD_PERMISSIONS_ENABLED,
} from '@/lib/types/app.types'

type NewGalleryPageProps = {
  searchParams: Promise<{ kind?: string; buy?: string }>
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
  const canCreateClientGalleries = CLIENT_GALLERIES_ENABLED
  const { kind: kindParam, buy } = await searchParams
  const requestedKind = isGalleryKind(kindParam) ? kindParam : 'showcase'
  const kind = canCreateClientGalleries ? requestedKind : 'showcase'
  const meta = KIND_META[kind]
  const wantsBuyPanel = buy === '1'

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

  const isClient = kind === 'client'
  const [passBundles, availableCredits] = isClient
    ? await Promise.all([
        fetchActiveGalleryPassBundles().catch(() => []),
        fetchAvailableGalleryPassCredits(userId).catch(() => []),
      ])
    : [[], []]
  const canBuyPass = passBundles.length > 0
  const tierBlocked = isClient && blockedByQuota

  const buyPanel = (
    <GalleryPassPurchasePanel
      backHref={wantsBuyPanel ? '/dashboard/galleries/new?kind=client' : meta.list.href}
      bundles={passBundles.map((b) => ({
        code: b.code,
        name: b.name,
        photoCap: b.photo_cap,
        validityDays: b.validity_days,
        amountAgorot: b.amount_agorot,
      }))}
    />
  )

  const downloadPermissionsEnabled = DOWNLOAD_PERMISSIONS_ENABLED

  // What to render below the header:
  //  - explicit "buy a pass" request, or tier-blocked with no credit to fall
  //    back on → the purchase panel (falling through to the dead-end copy only
  //    when there's nothing to sell);
  //  - otherwise the wizard, which itself lets her choose tier vs. which credit.
  let body: React.ReactNode
  if (isClient && (wantsBuyPanel || (tierBlocked && availableCredits.length === 0)) && canBuyPass) {
    body = buyPanel
  } else if (blockedByQuota && !(isClient && availableCredits.length > 0)) {
    body = (
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
    )
  } else if (isClient) {
    body = (
      <ClientGalleryWizard
        clients={clients}
        defaultWatermarkText={studioName}
        downloadPermissionsEnabled={downloadPermissionsEnabled}
        tierBlocked={tierBlocked}
        buyMoreHref={canBuyPass ? '/dashboard/galleries/new?kind=client&buy=1' : null}
        availableCredits={availableCredits.map((c) => ({
          id: c.id,
          name: c.bundle_code,
          photoCap: c.photo_cap,
          validityDays: c.validity_days,
        }))}
      />
    )
  } else {
    body = <ShowcaseGalleryForm defaultWatermarkText={studioName} />
  }

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

      {body}
    </div>
  )
}
