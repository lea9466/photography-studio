import { notFound } from 'next/navigation'
import { fetchGalleryDetail, ensurePortfolioSlug } from '@/lib/actions/gallery.actions'
import type { Gallery, Client, GallerySettings } from '@/lib/types/database.types'
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
    <div className="animate-fade-in space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">פעולות</h2>
          <p className="text-sm text-[--muted]">
            שליחה ללקוח, תצוגה מקדימה וניהול סטטוס
          </p>
        </div>
        <GalleryActions
          galleryId={gallery.id}
          galleryTitle={gallery.title}
          status={gallery.status}
          galleryType={gallery.gallery_type}
          clientLink={clientLink}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">פרטים</h2>
          <p className="text-sm text-[--muted]">
            פרטי לקוח, לינק גישה והגדרות בחירה
          </p>
        </div>
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
      </section>
    </div>
  )
}
