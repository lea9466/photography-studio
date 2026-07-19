import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicBlogPageHTML } from '@/lib/public-blog-html'
import { fetchPublicBlogPosts } from '@/lib/public-blog-posts'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { resolvePostsPageTitle } from '@/lib/posts-section-copy'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'

interface BlogPageProps {
  params: Promise<{ slug: string }>
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

  const blogPosts = await fetchPublicBlogPosts(typed.id, {
    siteLanguage: typed.site_language,
  })

  const siteTheme = normalizeSiteTheme(typed.selected_theme)
  const accentColor = typed.accent_color ?? '#7c3aed'
  const studioName = typed.studio_name ?? 'Studio Gallery'
  const homepagePath = resolveHomepagePath(typed.slug, typed.studio_name)
  const canonicalPath = getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`
  const blogPath = `${canonicalPath}/blog`
  const logoUrl = await resolveBrandingPath(typed.logo_url)
  const hasFaq = sanitizeFaqItems(parseFaqItems(typed.faq_items)).length > 0

  const admin = createAdminClient()
  const [{ count: packageCount }, { count: photoEditCount }] = await Promise.all([
    admin
      .from('photography_packages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', typed.id)
      .eq('is_active', true),
    admin
      .from('photo_edit_comparisons')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', typed.id)
      .eq('is_active', true),
  ])

  const pageTitle = resolvePostsPageTitle(siteTheme, typed.posts_page_title)
  const hasPhotoEditComparisons = (photoEditCount ?? 0) > 0

  const html = generatePublicBlogPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    blogPath,
    studioPath: canonicalPath,
    hasFaq,
    hasPackages: (packageCount ?? 0) > 0,
    hasPhotoEditComparisons,
    beforeAfterPath: hasPhotoEditComparisons ? `${canonicalPath}/before-after` : undefined,
    shouldColorLogo: typed.should_color_logo ?? false,
    blog: {
      pageTitle,
      posts: blogPosts,
      accentColor,
    },
    siteLanguage: typed.site_language,
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
