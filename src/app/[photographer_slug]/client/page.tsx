import Image from 'next/image'
import Link from 'next/link'
import { logoutAction } from './actions'
import LoginForm from '@/components/client/LoginForm'
import TestimonialForm from '@/components/client/TestimonialForm'
import { fetchClientAlbums, fetchClientName, isAlbumExpired } from '@/lib/client-db'
import { fetchClientTestimonial } from '@/lib/testimonials-db'
import { getClientSession } from '@/lib/client-session'

import { tenantPath } from '@/lib/tenant-paths'

export const dynamic = 'force-dynamic'

export default async function ClientPage({
  params,
}: {
  params: Promise<{ photographer_slug: string }>
}) {
  const { photographer_slug } = await params
  const clientBase = tenantPath(photographer_slug, '/client')
  const clientId = await getClientSession()

  if (!clientId) {
    return (
      <main className="client-area-page px-[5vw] py-24">
        <div className="client-album-shell text-right">
          <h1 className="font-display mb-10 text-center text-4xl text-foreground md:text-5xl">
            אזור לקוח
          </h1>
          <LoginForm photographerSlug={photographer_slug} />
        </div>
      </main>
    )
  }

  const [name, albums, testimonial] = await Promise.all([
    fetchClientName(clientId),
    fetchClientAlbums(clientId),
    fetchClientTestimonial(clientId),
  ])

  return (
    <main className="client-area-page px-[5vw] py-16 text-right md:py-24">
      <div className="client-album-shell">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-foreground md:text-5xl">
              שלום{name ? `, ${name}` : ''}
            </h1>
            <p className="client-muted-text mt-3 text-sm tracking-wide">
              הגלריות שלך
            </p>
          </div>
          <form action={logoutAction.bind(null, photographer_slug)}>
            <button
              type="submit"
              className="client-btn-outline px-5 py-2.5 text-sm"
            >
              התנתקות
            </button>
          </form>
        </div>

        {albums.length === 0 ? (
          <p className="client-muted-text mt-14">
            עדיין אין גלריות משויכות לחשבונך. הסטודיו יוסיף אותן בקרוב.
          </p>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {albums.map((album) => {
              const expired = isAlbumExpired(album)
              const title = album.title?.trim() || 'גלריה'
              return (
                <Link
                  key={album.id}
                  href={tenantPath(photographer_slug, `/client/album/${album.id}`)}
                  aria-label={`פתיחת הגלריה ${title}`}
                  className="theme-gallery-card theme-shaped gallery-photo-frame group relative block aspect-[3/4] overflow-hidden bg-muted"
                >
                  {album.cover_image ? (
                    <Image
                      src={album.cover_image}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="client-muted-text flex h-full items-center justify-center text-sm">
                      ללא תמונת שער
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent opacity-90 transition-opacity duration-700 group-hover:opacity-100" />
                  {album.image_count > 0 ? (
                    <span className="absolute right-5 top-5 rounded-full bg-background/85 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground backdrop-blur-sm">
                      {album.image_count} תמונות
                    </span>
                  ) : null}
                  {expired ? (
                    <span className="absolute left-5 top-5 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">
                      פג תוקף
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 p-8 text-background">
                    <p className="text-[10px] uppercase tracking-[0.4em] opacity-80">
                      גלריה
                    </p>
                    <h2 className="mt-2 font-display text-3xl">{title}</h2>
                    <div className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
                      <span className="transition-transform duration-500 group-hover:-translate-x-1">
                        ←
                      </span>
                      לצפייה
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <TestimonialForm existing={testimonial} photographerSlug={photographer_slug} />
      </div>
    </main>
  )
}
