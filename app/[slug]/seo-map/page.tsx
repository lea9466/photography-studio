import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'
import {
  buildPostCanonicalPath,
  buildPublicGalleryCanonicalPath,
  buildSeoMapPath,
  fetchPhotographerDiscoveryGalleries,
  fetchPhotographerDiscoveryPosts,
} from '@/lib/seo/photographer-discovery'

interface SeoMapPageProps {
  params: Promise<{ slug: string }>
}

export default async function PhotographerSeoMapPage({ params }: SeoMapPageProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const photographer = await findPhotographerBySlug(decodedSlug)

  if (!photographer) notFound()

  const studioName = photographer.studio_name ?? photographer.name ?? 'Studio Gallery'
  const studioPath = getPublicSitePath(photographer.slug, photographer.studio_name) ?? `/${decodedSlug}`

  const [galleries, posts] = await Promise.all([
    fetchPhotographerDiscoveryGalleries(photographer.id),
    fetchPhotographerDiscoveryPosts(photographer.id),
  ])

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">מפת תוכן — {studioName}</h1>
        <p className="mt-2 text-sm text-[--muted]">
          רשימת גלריות ופוסטים ציבוריים לסריקה על ידי מנועי חיפוש.
        </p>
        <p className="mt-3">
          <Link href={studioPath} className="text-sm underline">
            חזרה לדף הבית של {studioName}
          </Link>
        </p>
      </header>

      <section aria-labelledby="seo-map-galleries" className="mb-10">
        <h2 id="seo-map-galleries" className="mb-4 text-xl font-semibold">
          גלריות ({galleries.length})
        </h2>
        {galleries.length > 0 ? (
          <ul className="list-disc space-y-2 ps-5">
            {galleries.map((gallery) => (
              <li key={gallery.id}>
                <Link href={buildPublicGalleryCanonicalPath(gallery)}>{gallery.title}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[--muted]">אין גלריות ציבוריות.</p>
        )}
      </section>

      <section aria-labelledby="seo-map-posts">
        <h2 id="seo-map-posts" className="mb-4 text-xl font-semibold">
          פוסטים ({posts.length})
        </h2>
        {posts.length > 0 ? (
          <ul className="list-disc space-y-2 ps-5">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={buildPostCanonicalPath(studioPath, post.id)}>{post.title}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[--muted]">אין פוסטים.</p>
        )}
      </section>
    </main>
  )
}

export async function generateMetadata({ params }: SeoMapPageProps): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  try {
    const photographer = await findPhotographerBySlug(decodedSlug)
    if (!photographer) return { title: 'מפת תוכן לא נמצאה' }

    const studioName = photographer.studio_name ?? photographer.name ?? 'Studio Gallery'
    const studioPath = getPublicSitePath(photographer.slug, photographer.studio_name) ?? `/${decodedSlug}`
    const seoMapPath = buildSeoMapPath(studioPath)
    const title = `מפת תוכן | ${studioName}`
    const description = `רשימת גלריות ופוסטים ציבוריים של ${studioName} לסריקה על ידי מנועי חיפוש.`

    return {
      title,
      description,
      robots: {
        index: false,
        follow: true,
      },
      alternates: {
        canonical: buildCanonicalUrl(seoMapPath),
      },
      openGraph: buildPublicOpenGraph({
        title,
        description,
        canonicalPath: seoMapPath,
      }),
    }
  } catch {
    return { title: 'מפת תוכן' }
  }
}
