import { notFound } from 'next/navigation'
import { fetchGalleryDetail } from '@/lib/actions/gallery.actions'
import { fetchClients } from '@/lib/actions/client.actions'
import { GalleryEditForm } from '@/components/gallery/GalleryEditForm'
import type { Gallery, GallerySettings, Client } from '@/lib/types/database.types'

type EditPageProps = {
  params: Promise<{ id: string }>
}

export default async function GalleryEditPage({ params }: EditPageProps) {
  const { id } = await params
  const [galleryData, clientsData] = await Promise.all([
    fetchGalleryDetail(id),
    fetchClients(),
  ])

  if (!galleryData) notFound()

  type GalleryDetail = Gallery & {
    clients: Client | Client[] | null
    gallery_settings: GallerySettings | GallerySettings[] | null
  }

  const gallery = galleryData as GalleryDetail
  const clients = clientsData || []

  const client = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients

  const settings = Array.isArray(gallery.gallery_settings)
    ? gallery.gallery_settings[0]
    : gallery.gallery_settings

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">עריכת גלריה</h1>
        <p className="text-sm text-[--muted]">
          ערוך את פרטי הגלריה, סוג הגלריה, הגדרות מתקדמות ונהל את התמונות
        </p>
      </div>

      <GalleryEditForm
        gallery={gallery}
        client={client}
        settings={settings}
        clients={clients}
      />
    </div>
  )
}
