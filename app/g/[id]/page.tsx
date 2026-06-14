import { notFound } from 'next/navigation'
import {
  getClientGallery,
  getClientGalleryPublicMeta,
} from '@/lib/actions/client-gallery.actions'
import { hasGallerySession } from '@/lib/gallery-session'
import { ClientGalleryView } from '@/components/gallery/ClientGalleryView'
import { PasswordGate } from '@/components/gallery/PasswordGate'

type ClientGalleryPageProps = {
  params: Promise<{ id: string }>
}

export default async function ClientGalleryPage({
  params,
}: ClientGalleryPageProps) {
  const { id } = await params
  const meta = await getClientGalleryPublicMeta(id)

  if (!meta || meta.status === 'draft') {
    notFound()
  }

  const hasSession = await hasGallerySession(id)

  if (!hasSession) {
    return (
      <PasswordGate
        galleryId={id}
        galleryTitle={meta.title}
        studioName={meta.studio_name}
      />
    )
  }

  const data = await getClientGallery(id)
  if (!data) notFound()

  return <ClientGalleryView gallery={data.gallery} photos={data.photos} />
}
