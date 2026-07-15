import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'
import {
  buildPostCanonicalPath,
  buildPostDescription,
  buildPostSeoTitle,
  fetchPhotographerPostById,
} from '@/lib/seo/photographer-discovery'
import { formatSiteDate, resolveSiteLanguage } from '@/lib/site-language'

interface PostPageProps {
  params: Promise<{ slug: string; postId: string }>
}

function renderPostContent(content: string) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return null
  }

  return paragraphs.map((paragraph, index) => (
    <p key={index} className="leading-relaxed text-[--foreground]">
      {paragraph}
    </p>
  ))
}

export default async function PhotographerPostPage({ params }: PostPageProps) {
  const { slug, postId } = await params
  const decodedSlug = decodeURIComponent(slug)
  const photographer = await findPhotographerBySlug(decodedSlug)

  if (!photographer) notFound()

  const post = await fetchPhotographerPostById(photographer.id, postId)
  if (!post) notFound()

  const studioName = photographer.studio_name ?? photographer.name ?? 'Studio Gallery'
  const studioPath = getPublicSitePath(photographer.slug, photographer.studio_name) ?? `/${decodedSlug}`
  const blogPath = `${studioPath}/blog`
  const siteLanguage = resolveSiteLanguage(photographer.site_language)
  const formattedDate = formatSiteDate(post.created_at, siteLanguage)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="breadcrumb" className="mb-6 text-sm text-[--muted]">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={studioPath} className="underline">
              {studioName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={blogPath} className="underline">
              בלוג
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>{post.title}</li>
        </ol>
      </nav>

      <article>
        <header className="mb-8 border-b border-[--border] pb-6">
          <h1 className="text-3xl font-semibold text-[--foreground]">{post.title}</h1>
          {post.subtitle ? (
            <p className="mt-3 text-lg text-[--muted]">{post.subtitle}</p>
          ) : null}
          <time dateTime={post.created_at} className="mt-4 block text-sm text-[--muted]">
            {formattedDate}
          </time>
        </header>

        <div className="space-y-4">{renderPostContent(post.content)}</div>
      </article>
    </main>
  )
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug, postId } = await params
  const decodedSlug = decodeURIComponent(slug)

  try {
    const photographer = await findPhotographerBySlug(decodedSlug)
    if (!photographer) return { title: 'פוסט לא נמצא' }

    const post = await fetchPhotographerPostById(photographer.id, postId)
    if (!post) return { title: 'פוסט לא נמצא' }

    const studioName = photographer.studio_name ?? photographer.name ?? 'Studio Gallery'
    const studioPath = getPublicSitePath(photographer.slug, photographer.studio_name) ?? `/${decodedSlug}`
    const canonicalPath = buildPostCanonicalPath(studioPath, post.id)
    const title = buildPostSeoTitle(post.title, studioName)
    const description = buildPostDescription(post)

    return {
      title,
      description,
      alternates: {
        canonical: buildCanonicalUrl(canonicalPath),
      },
      openGraph: buildPublicOpenGraph({
        title,
        description,
        canonicalPath,
      }),
    }
  } catch {
    return { title: 'פוסט' }
  }
}
