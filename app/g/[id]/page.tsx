import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import {
  getClientGallery,
  getClientGalleryPublicMeta,
} from '@/lib/actions/client-gallery.actions'
import { getPrivateGalleryHost } from '@/lib/private-gallery/isolation'
import { hasGallerySession } from '@/lib/gallery-session'
import { ClientGalleryView } from '@/components/gallery/ClientGalleryView'
import { PasswordGate } from '@/components/gallery/PasswordGate'
import { SiteGateScreen } from '@/components/site-gate/SiteGateScreen'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  applyOwnerPreviewBypass,
  resolvePublicSiteGateByGalleryId,
} from '@/lib/site-access/public-gate'
import {
  buildCanonicalUrl,
  buildPublicOpenGraph,
  resolveGalleryShareImage,
} from '@/lib/seo/public-metadata'

type ClientGalleryPageProps = {
  params: Promise<{ id: string }>
}

export default async function ClientGalleryPage({
  params,
}: ClientGalleryPageProps) {
  const { id } = await params

  const siteGate = await applyOwnerPreviewBypass(
    await resolvePublicSiteGateByGalleryId(id)
  )
  if (siteGate) {
    return (
      <SiteGateScreen
        mode={siteGate.mode}
        studioName={siteGate.studioName}
        siteLanguage={siteGate.siteLanguage}
      />
    )
  }

  const meta = await getClientGalleryPublicMeta(id)

  if (!meta || (meta.status === 'draft' && !meta.is_public)) {
    notFound()
  }

  // Public galleries: getClientGallery authorizes via is_public server-side.
  if (meta.is_public) {
    // The isolated private-gallery subdomain is promised to carry only
    // password-gated client galleries. A public gallery reaching /g/ there
    // (an old link, a crawler) is sent to its canonical public URL on the
    // main domain instead of rendering here. No-op until the subdomain is
    // configured — getPrivateGalleryHost() is null and this never matches.
    const privateHost = getPrivateGalleryHost()
    if (privateHost) {
      const requestHost = (await headers()).get('host')
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
      if (requestHost === privateHost && appUrl) {
        redirect(new URL(`/public-gallery/${id}`, appUrl).toString())
      }
    }

    const data = await getClientGallery(id)
    if (!data) notFound()
    return <ClientGalleryView gallery={data.gallery} photos={data.photos} />
  }

  const hasSession = await hasGallerySession(id)

  if (!hasSession) {
    return (
      <PasswordGate
        galleryId={id}
        galleryTitle={meta.title}
        studioName={meta.studio_name}
        maskedEmail={meta.maskedEmail}
      />
    )
  }

  const data = await getClientGallery(id)
  if (!data) notFound()

  return <ClientGalleryView gallery={data.gallery} photos={data.photos} />
}

export async function generateMetadata({ params }: ClientGalleryPageProps) {
  const { id } = await params
  const meta = await getClientGalleryPublicMeta(id)

  if (!meta) {
    return {
      title: 'גלריה לא נמצאה',
    }
  }

  // Add noindex for private galleries to prevent search engine indexing
  if (!meta.is_public || meta.gallery_type !== 'portfolio') {
    return {
      title: meta.title,
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  // Public portfolio galleries can be indexed
  const admin = createAdminClient()
  const { data: gallery } = await admin
    .from('galleries')
    .select('cover_image, slug')
    .eq('id', id)
    .single()

  const galleryRow = gallery as { cover_image: string | null; slug: string | null } | null
  const title = `${meta.title} | ${meta.studio_name || 'Studio Gallery'}`
  const description = `תיק עבודות מאת ${meta.studio_name || 'Studio Gallery'}`
  const canonicalPath =
    galleryRow?.slug && meta.gallery_type === 'portfolio'
      ? `/portfolio/${galleryRow.slug}`
      : `/g/${id}`
  const shareImage = await resolveGalleryShareImage(id, galleryRow?.cover_image ?? null)

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonicalUrl(canonicalPath),
    },
    openGraph: buildPublicOpenGraph({
      title,
      description,
      canonicalPath,
      imageUrl: shareImage,
    }),
  }
}
