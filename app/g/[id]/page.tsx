import { notFound } from 'next/navigation'
import {
  getClientGallery,
  getClientGalleryPublicMeta,
  getPublicPortfolioGallery,
} from '@/lib/actions/client-gallery.actions'
import { hasGallerySession } from '@/lib/gallery-session'
import { ClientGalleryView } from '@/components/gallery/ClientGalleryView'
import { PublicPortfolioGalleryView } from '@/components/gallery/PublicPortfolioGalleryView'
import { PasswordGate } from '@/components/gallery/PasswordGate'
import { createAdminClient } from '@/lib/supabase/admin'
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
  const meta = await getClientGalleryPublicMeta(id)

  if (!meta || (meta.status === 'draft' && !meta.is_public)) {
    notFound()
  }

  // is_public flag takes absolute precedence - bypass ALL auth checks
  if (meta.is_public) {
    const data = await getClientGallery(id, true)
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
        emailHint={meta.emailHint}
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
