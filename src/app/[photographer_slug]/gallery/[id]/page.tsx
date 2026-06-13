import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchPhotographerBySlug, fetchPublicAlbumById } from '@/lib/db'
import GalleryLightbox, { type GalleryPhoto } from '@/components/GalleryLightbox'
import { resolveGalleryPhotoUrls } from '@/lib/gallery-media-urls'
import { pickGridMediaUrl, pickPreviewMediaUrl } from '@/lib/media-urls'
import { tenantHashPath, tenantQueryHashPath } from '@/lib/tenant-paths'

export const dynamic = 'force-dynamic'

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ photographer_slug: string; id: string }>
}) {
  const { photographer_slug, id } = await params
  const photographer = await fetchPhotographerBySlug(photographer_slug)
  if (!photographer) notFound()

  const album = await fetchPublicAlbumById(id, photographer.id)
  if (!album) notFound()

  const title = album.title?.trim() || 'גלריה'

  const photos = album.images.flatMap((img) => {
    const photo = resolveGalleryPhotoUrls(album.id, img, album.photographer_id)
    return photo ? [photo satisfies GalleryPhoto] : []
  })

  const cover = album.cover_image?.trim()
  if (photos.length === 0 && cover) {
    photos.push({
      id: album.id,
      src: pickPreviewMediaUrl(null, cover),
      thumb: pickGridMediaUrl(null, cover),
      downloadSrc: cover,
    })
  }

  return (
    <main className="relative overflow-hidden bg-background text-foreground" dir="rtl">
      <section className="relative scroll-mt-24 px-[5vw] py-16 md:scroll-mt-28 md:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-border to-transparent" />
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: 'var(--gradient-soft)' }}
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-[min(100%,1880px)]">
          <Link
            href={tenantHashPath(photographer_slug, '#galleries')}
            className="theme-label inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] transition-opacity hover:opacity-70"
          >
            <span aria-hidden>→</span>
            חזרה לגלריות
          </Link>

          <div className="mt-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="theme-label mb-6 text-[11px] uppercase tracking-[0.5em]">
                Portfolio · סדרה
              </p>
              <h1 className="font-display text-5xl leading-[0.95] text-foreground md:text-7xl">
                {title}
              </h1>
              <span className="theme-underline mt-6 inline-block h-[5px] w-24 rounded-full opacity-80" />
            </div>
            <div className="lg:col-span-5">
              <p className="max-w-md leading-loose text-muted-foreground lg:mr-auto">
                {photos.length} תמונות · לחצו על תמונה להגדלה ולצפייה במסך מלא
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="public-gallery-photos px-[5vw] pt-12 pb-20 md:pt-20 md:pb-28">
        <GalleryLightbox photos={photos} title={title} />
      </section>

      <section className="border-t border-border/60 bg-secondary/40 px-3 py-20 sm:px-4 md:py-28">
        <div className="mx-auto w-full max-w-[min(100%,1880px)] text-center">
          <p className="theme-label mb-6 text-[11px] uppercase tracking-[0.5em]">
            Next step · הצעד הבא
          </p>
          <h2 className="font-display text-3xl text-foreground md:text-5xl">
            אוהבים את מה שראיתם?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-loose text-muted-foreground">
            בואו ניצור יחד גלריה שמספרת את הסיפור שלכם — בדיוק כמו זו.
          </p>
          <Link
            href={tenantQueryHashPath(photographer_slug, { source: 'gallery' }, '#contact')}
            className="theme-cta-primary theme-cta-pill theme-shaped mt-10 inline-flex items-center gap-3 bg-foreground px-10 py-4 text-xs uppercase tracking-[0.3em] text-background transition-all duration-500 hover:bg-foreground/85"
          >
            <span>לתיאום צילום</span>
            <span aria-hidden>←</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
