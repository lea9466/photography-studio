import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminDashboard, { type AdminTab } from '@/components/admin/AdminDashboard'
import AdminThemeShell from '@/components/admin/AdminThemeShell'
import { getPhotographerSession } from '@/lib/auth-helpers'
import {
  adminEnsureGalleryClient,
  adminFetchAlbums,
  adminFetchClients,
  adminFetchClientsForSelect,
  adminFetchImagesGroupedByAlbum,
  adminFetchPackages,
  adminFetchSelectionsByImage,
  adminFetchSiteSettings,
} from '@/lib/admin-db'
import { getR2GalleryUploadStatus } from '@/lib/r2-status'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'
import { adminFetchTestimonials } from '@/lib/testimonials-db'
import { studioLogoutAction } from '@/app/studio/actions'
import { tenantPath } from '@/lib/tenant-paths'

export const dynamic = 'force-dynamic'

const ADMIN_TABS = new Set<AdminTab>([
  'settings',
  'galleries',
  'clients',
  'packages',
  'testimonials',
])

function resolveAdminTab(raw: string | undefined): AdminTab {
  if (raw && ADMIN_TABS.has(raw as AdminTab)) {
    return raw as AdminTab
  }
  return 'settings'
}

type PageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminPage({ searchParams }: PageProps) {
  const session = await getPhotographerSession()
  if (!session) {
    redirect('/studio/login?next=/admin')
  }

  const { tab: tabParam } = await searchParams
  const initialTab = resolveAdminTab(tabParam)

  const { photographer } = session
  const photographerId = photographer.id
  const configured = !!getAdminClient()

  if (configured) {
    await adminEnsureGalleryClient(photographerId)
  }

  const [
    settings,
    albums,
    clients,
    clientOptions,
    imagesByAlbum,
    selectionsByImage,
    packages,
    testimonials,
  ] = configured
    ? await Promise.all([
        adminFetchSiteSettings(photographerId),
        adminFetchAlbums(photographerId),
        adminFetchClients(photographerId),
        adminFetchClientsForSelect(photographerId),
        adminFetchImagesGroupedByAlbum(photographerId),
        adminFetchSelectionsByImage(photographerId),
        adminFetchPackages(photographerId),
        adminFetchTestimonials(photographerId),
      ])
    : [null, [], [], [], {}, {}, [], []]

  const r2Status = getR2GalleryUploadStatus()
  const displayName =
    photographer.display_name?.trim() || settings?.business_name?.trim() || photographer.slug

  return (
    <AdminThemeShell
      themeStyle={settings?.theme_style}
      primaryColor={settings?.primary_color}
      secondaryColor={settings?.secondary_color}
    >
      <main className="mx-auto w-full max-w-[1320px] px-5 py-10 pb-28 sm:px-8 lg:px-12">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              סטודיו צילום
            </p>
            <h1 className="font-display text-3xl font-medium text-foreground md:text-4xl">
              שלום, {displayName}
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              כאן מנהלים את האתר, הגלריות והלקוחות — הכל במקום אחד נעים וברור.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={tenantPath(photographer.slug)}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:border-foreground/20 hover:shadow-md"
            >
              <svg
                className="h-4 w-4 opacity-60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
              צפייה באתר
            </Link>
            <form action={studioLogoutAction}>
              <button
                type="submit"
                className="rounded-full border border-border bg-transparent px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                יציאה
              </button>
            </form>
          </div>
        </header>

        <AdminDashboard
          settings={settings}
          albums={albums}
          clients={clients}
          clientOptions={clientOptions}
          imagesByAlbum={imagesByAlbum}
          selectionsByImage={selectionsByImage}
          packages={packages}
          testimonials={testimonials}
          configured={configured}
          configMessage={adminConfigError()}
          r2Ready={r2Status.ready}
          r2Message={r2Status.message}
          initialTab={initialTab}
        />
      </main>
    </AdminThemeShell>
  )
}
