import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { fetchGalleryDetail } from '@/lib/actions/gallery.actions'
import { GALLERY_STATUS_LABELS, GALLERY_TYPE_LABELS } from '@/lib/types/app.types'
import { GalleryBreadcrumb } from '@/components/dashboard/GalleryBreadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

  const clientName =
    (Array.isArray(gallery.clients)
      ? gallery.clients[0]
      : gallery.clients
    )?.name ?? 'ללא לקוח'

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <GalleryBreadcrumb galleryTitle={gallery.title} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{gallery.title}</h1>
            <p className="mt-1 text-sm text-[--muted]">{clientName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="muted">
                {GALLERY_STATUS_LABELS[gallery.status]}
              </Badge>
              <Badge variant="outline">
                {GALLERY_TYPE_LABELS[gallery.gallery_type]}
              </Badge>
            </div>
          </div>

          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/dashboard">
              <ChevronRight className="h-4 w-4" />
              חזרה לרשימה
            </Link>
          </Button>
        </div>
      </div>

      {children}
    </div>
  )
}
