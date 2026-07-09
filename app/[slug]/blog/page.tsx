import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { resolveMediaUrl } from '@/lib/r2/storage'
import { signStoragePaths } from '@/lib/storage'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicBlogPageHTML, type PublicBlogPost } from '@/lib/public-blog-html'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { resolvePostsPageTitle } from '@/lib/posts-section-copy'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'

interface BlogPageProps {
  params: Promise<{ slug: string }>
}

type PostPhotoRow = {
  id: string
  preview_url: string | null
  watermarked_preview_url: string | null
  sort_order: number
}

type PostRow = {
  id: string
  title: string
  subtitle: string | null
  content: string
  auto_apply_watermark: boolean
  cover_photo_id: string | null
  created_at: string
  post_photos: PostPhotoRow[]
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const photographer = await findPhotographerBySlug(decodedSlug)

  if (!photographer) notFound()

  const typed = photographer as typeof photographer & {
    id: string
    posts_page_title: string | null
  }

  const admin = createAdminClient()

  const { data: postsData } = await admin
    .from('posts')
    .select(
      'id, title, subtitle, content, auto_apply_watermark, cover_photo_id, created_at, post_photos(id, preview_url, watermarked_preview_url, sort_order)'
    )
    .eq('user_id', typed.id)
    .order('created_at', { ascending: false })

  const posts = (postsData ?? []) as PostRow[]

  const previewPaths: string[] = []
  const watermarkedPaths: string[] = []

  for (const post of posts) {
    for (const photo of post.post_photos) {
      if (post.auto_apply_watermark) {
        if (photo.watermarked_preview_url) watermarkedPaths.push(photo.watermarked_preview_url)
      } else if (photo.preview_url) {
        previewPaths.push(photo.preview_url)
      }
    }
  }

  const emptyMap: Record<string, string> = {}
  const [previewUrls, watermarkedUrls] = await Promise.all([
    previewPaths.length ? signStoragePaths('previews', previewPaths) : Promise.resolve(emptyMap),
    watermarkedPaths.length
      ? signStoragePaths('watermarked', watermarkedPaths)
      : Promise.resolve(emptyMap),
  ])

  const resolvePhotoUrl = (post: PostRow, photo: PostPhotoRow): string | null => {
    if (post.auto_apply_watermark) {
      return photo.watermarked_preview_url
        ? watermarkedUrls[photo.watermarked_preview_url] ?? null
        : photo.preview_url
          ? previewUrls[photo.preview_url] ?? null
          : null
    }
    return photo.preview_url ? previewUrls[photo.preview_url] ?? null : null
  }

  const blogPosts: PublicBlogPost[] = posts.map((post) => {
    const orderedPhotos = [...post.post_photos].sort((a, b) => a.sort_order - b.sort_order)
    const images = orderedPhotos
      .map((photo) => resolvePhotoUrl(post, photo))
      .filter((url): url is string => Boolean(url))

    const coverPhoto = post.cover_photo_id
      ? orderedPhotos.find((photo) => photo.id === post.cover_photo_id)
      : null
    const coverUrl = coverPhoto ? resolvePhotoUrl(post, coverPhoto) : images[0] ?? null

    return {
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      content: post.content,
      date: formatDate(post.created_at),
      coverUrl,
      images,
    }
  })

  const siteTheme = normalizeSiteTheme(typed.selected_theme)
  const accentColor = typed.accent_color ?? '#7c3aed'
  const studioName = typed.studio_name ?? 'Studio Gallery'
  const homepagePath = resolveHomepagePath(typed.slug, typed.studio_name)
  const canonicalPath = getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`
  const blogPath = `${canonicalPath}/blog`
  const logoUrl = await resolveBrandingPath(typed.logo_url)
  const hasFaq = sanitizeFaqItems(parseFaqItems(typed.faq_items)).length > 0

  const { count: packageCount } = await admin
    .from('photography_packages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', typed.id)
    .eq('is_active', true)

  const pageTitle = resolvePostsPageTitle(siteTheme, typed.posts_page_title)

  const html = generatePublicBlogPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    blogPath,
    hasFaq,
    hasPackages: (packageCount ?? 0) > 0,
    shouldColorLogo: typed.should_color_logo ?? false,
    blog: {
      pageTitle,
      posts: blogPosts,
      accentColor,
    },
  })

  return <HtmlFramePage html={html} title={`${pageTitle} | ${studioName}`} />
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  try {
    const photographer = await findPhotographerBySlug(decodedSlug)
    if (!photographer) return { title: 'בלוג לא נמצא' }

    const typed = photographer as typeof photographer & { posts_page_title: string | null }
    const siteTheme = normalizeSiteTheme(typed.selected_theme)
    const studioName = typed.studio_name ?? 'Studio Gallery'
    const pageTitle = resolvePostsPageTitle(siteTheme, typed.posts_page_title)
    const canonicalPath =
      getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`
    const blogPath = `${canonicalPath}/blog`
    const title = `${pageTitle} | ${studioName}`
    const description = `הבלוג של ${studioName}`

    return {
      title,
      description,
      alternates: { canonical: buildCanonicalUrl(blogPath) },
      openGraph: buildPublicOpenGraph({
        title,
        description,
        canonicalPath: blogPath,
        imageUrl: null,
      }),
    }
  } catch {
    return { title: 'בלוג' }
  }
}
