import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchGalleryDetail, ensurePortfolioSlug } from '@/lib/actions/gallery.actions'
import { GALLERY_STATUS_LABELS, GALLERY_TYPE_LABELS } from '@/lib/types/app.types'
import type { Gallery, Client, GallerySettings } from '@/lib/types/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GalleryActions } from '@/components/dashboard/GalleryActions'
import { ClientEditForm } from '@/components/dashboard/ClientEditForm'

type GalleryPageProps = {
  params: Promise<{ id: string }>
}

export default async function GalleryOverviewPage({ params }: GalleryPageProps) {
  const { id } = await params
  const data = await fetchGalleryDetail(id)
  if (!data) notFound()

  type Detail = Gallery & {
    clients: Client | Client[] | null
    gallery_settings: GallerySettings | GallerySettings[] | null
  }

  const gallery = data as Detail
  const client = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients
  const settings = Array.isArray(gallery.gallery_settings)
    ? gallery.gallery_settings[0]
    : gallery.gallery_settings

  let slug = gallery.slug
  if (gallery.gallery_type === 'portfolio' && !slug) {
    slug = await ensurePortfolioSlug(gallery.id, gallery.title, gallery.slug)
  }

  const clientLink =
    gallery.gallery_type === 'portfolio' && slug
      ? `/portfolio/${slug}`
      : `/g/${gallery.id}`

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="muted">{GALLERY_STATUS_LABELS[gallery.status]}</Badge>
        <Badge variant="outline">{GALLERY_TYPE_LABELS[gallery.gallery_type]}</Badge>
      </div>

      <GalleryActions
        galleryId={gallery.id}
        status={gallery.status}
        galleryType={gallery.gallery_type}
        clientLink={clientLink}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {client ? (
          <ClientEditForm client={client} galleryId={gallery.id} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>פרטי לקוח</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[--muted]">
              לא משויך לקוח לגלריה זו
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>גישה</CardTitle>
            <CardDescription>
              {gallery.gallery_type === 'portfolio'
                ? 'לינק ציבורי לתיק עבודות'
                : 'לינק ללקוח'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="break-all text-sm" dir="ltr">
              {process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}
              {clientLink}
            </p>
            <p className="text-sm">
              <span className="text-[--muted]">סיסמה: </span>
              <span dir="ltr">{gallery.password ?? '—'}</span>
            </p>
            {settings?.max_album_selection != null ? (
              <p className="text-sm text-[--muted]">
                מקסימום אלבום: {settings.max_album_selection}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/galleries/${id}/photos`}>ניהול תמונות</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/galleries/${id}/selections`}>צפייה בבחירות</Link>
        </Button>
      </div>
    </div>
  )
}
