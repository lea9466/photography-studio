import { notFound, permanentRedirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  fetchGalleryForPublicPage,
  normalizeRouteParam,
} from '@/lib/queries/public-gallery-page'
import { getPublicSitePath } from '@/lib/queries/public-photographer'

type PublicGalleryRedirectPageProps = {
  params: Promise<{ id: string }>
}

/**
 * Redirect shim — the real page now lives at app/[slug]/gallery/[id]/page.tsx
 * (nested under app/[slug] so it shares that segment's layout.tsx chrome;
 * this old top-level route can't, since it's a sibling of [slug] rather than
 * a child — see that layout's doc comment). Looks up the gallery's *current*
 * owning slug fresh on every request (not cached), so an old
 * /public-gallery/{id} link always lands on the correct studio in a single
 * hop even after the studio has since renamed its slug.
 */
export default async function PublicGalleryRedirectPage({
  params,
}: PublicGalleryRedirectPageProps) {
  const { id: rawId } = await params
  const normalizedId = normalizeRouteParam(rawId)

  const admin = createAdminClient()
  const galleryData = await fetchGalleryForPublicPage(admin, rawId)
  if (!galleryData) {
    notFound()
  }

  const { data: user } = await admin
    .from('users')
    .select('slug, studio_name')
    .eq('id', galleryData.user_id)
    .maybeSingle()

  const typedUser = user as { slug: string | null; studio_name: string | null } | null
  const segment = getPublicSitePath(typedUser?.slug, typedUser?.studio_name)?.replace(/^\//, '')
  if (!segment) {
    notFound()
  }

  permanentRedirect(`/${segment}/gallery/${normalizedId}`)
}
