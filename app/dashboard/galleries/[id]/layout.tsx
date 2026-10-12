import { notFound } from 'next/navigation'
import { User } from 'lucide-react'
import { fetchGalleryDetail } from '@/lib/actions/gallery.actions'
import { galleryKind } from '@/lib/gallery-kind'
import { GalleryBreadcrumb } from '@/components/dashboard/GalleryBreadcrumb'
import type { Gallery, Client, GallerySettings } from '@/lib/types/database.types'

const LIST_BY_KIND = {
  showcase: { href: '/dashboard/galleries', label: 'גלריות ציבוריות' },
  client: { href: '/dashboard/private-galleries', label: 'גלריות פרטיות' },
} as const

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
  const kind = galleryKind(gallery)
  const list = LIST_BY_KIND[kind]

  const clientName =
    (Array.isArray(gallery.clients)
      ? gallery.clients[0]
      : gallery.clients
    )?.name ?? 'ללא לקוח'

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <GalleryBreadcrumb
          galleryTitle={gallery.title}
          backHref={list.href}
          backLabel={list.label}
        />

        <div className="relative overflow-hidden rounded-2xl border border-[#7D3A52]/15 bg-gradient-to-l from-[#7D3A52]/[0.10] via-[#7c3aed]/[0.04] to-white px-6 py-5">
          <span className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-b from-[#7D3A52] to-[#7c3aed]" aria-hidden />
          <h1 className="text-2xl font-bold tracking-tight text-[#100d1f] sm:text-3xl">
            {gallery.title}
          </h1>
          {kind === 'client' ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#7D3A52]">
              <User className="h-4 w-4" aria-hidden />
              {clientName}
            </p>
          ) : null}
        </div>
      </div>

      {children}
    </div>
  )
}
