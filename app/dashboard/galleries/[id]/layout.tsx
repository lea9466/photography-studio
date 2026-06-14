import { notFound } from 'next/navigation'
import { fetchGalleryDetail } from '@/lib/actions/gallery.actions'
import { TabNav } from '@/components/gallery/TabNav'
import type { Gallery, Client, GallerySettings } from '@/lib/types/database.types'

type GalleryLayoutProps = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function GalleryLayout({
  children,
  params,
}: GalleryLayoutProps) {
  const { id } = await params
  const data = await fetchGalleryDetail(id)

  if (!data) notFound()

  type Detail = Gallery & {
    clients: Client | Client[] | null
    gallery_settings: GallerySettings | GallerySettings[] | null
  }

  const gallery = data as Detail

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{gallery.title}</h1>
        <p className="mt-1 text-sm text-[--muted]">
          {(Array.isArray(gallery.clients)
            ? gallery.clients[0]
            : gallery.clients
          )?.name ?? 'ללא לקוח'}
        </p>
      </div>
      <TabNav galleryId={id} />
      {children}
    </div>
  )
}
