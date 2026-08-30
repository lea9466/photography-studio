import { notFound } from 'next/navigation'
import { fetchGalleryDetail, ensurePortfolioSlug } from '@/lib/actions/gallery.actions'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { galleryKind } from '@/lib/gallery-kind'
import type { Gallery, Client, GallerySettings } from '@/lib/types/database.types'
import { ShowcaseGalleryDetail } from '@/components/dashboard/ShowcaseGalleryDetail'
import { ClientGalleryDetail } from '@/components/dashboard/ClientGalleryDetail'

type GalleryPageProps = {
  params: Promise<{ id: string }>
}

/**
 * Thin switch: a gallery's manage view is entirely kind-specific. Public
 * showcase galleries and private client galleries share nothing here beyond
 * photo upload, so each gets its own composition component.
 */
export default async function GalleryOverviewPage({ params }: GalleryPageProps) {
  const { id } = await params

  let context
  try {
    context = await requireDashboardContext()
  } catch {
    notFound()
  }

  const { userId, supabase } = context

  const { data: profileData } = await supabase
    .from('users')
    .select('studio_name')
    .eq('id', userId)
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
  const client = Array.isArray(gallery.clients) ? gallery.clients[0] : gallery.clients
  const settings = Array.isArray(gallery.gallery_settings)
    ? gallery.gallery_settings[0]
    : gallery.gallery_settings

  if (gallery.gallery_type === 'portfolio' && !gallery.slug) {
    await ensurePortfolioSlug(gallery.id, gallery.title, gallery.slug)
  }

  if (galleryKind(gallery) === 'showcase') {
    return (
      <ShowcaseGalleryDetail
        gallery={gallery}
        settings={settings ?? null}
        userId={userId}
        studioName={studioName}
      />
    )
  }

  return (
    <ClientGalleryDetail
      gallery={gallery}
      client={client ?? null}
      settings={settings ?? null}
      userId={userId}
      studioName={studioName}
    />
  )
}
