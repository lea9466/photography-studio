import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { TENANT_HOST_HEADER } from '@/lib/domains/rewrite'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicBlogPageHTML } from '@/lib/public-blog-html'
import { fetchPublicBlogPosts } from '@/lib/public-blog-posts'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { resolvePostsPageTitle } from '@/lib/posts-section-copy'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { canUseFeature } from '@/lib/subscriptions/entitlements'

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

  // Check entitlements for posts feature
  const entitlements = await getStudioEntitlements(typed.id)
  if (!canUseFeature(entitlements, 'posts')) {
    notFound()
  }

  const blogPosts = await fetchPublicBlogPosts(typed.id, {
    siteLanguage: typed.site_language,
  })

  const siteTheme = normalizeSiteTheme(typed.selected_theme)
  const accentColor = typed.accent_color ?? '#7c3aed'
  const studioName = typed.studio_name ?? 'Studio Gallery'
  // See app/[slug]/page.tsx for why: on a photographer's connected custom
  // domain, nav links built from the real slug path would 404 there (only a
  // small fixed set of tenant-relative paths is recognized — see
  // lib/domains/rewrite.ts), so an empty base is used for concatenation
  // instead.
  const isTenantDomain = (await headers()).has(TENANT_HOST_HEADER)
  const homepagePath = isTenantDomain ? '/' : resolveHomepagePath(typed.slug, typed.studio_name)
  const canonicalPath = isTenantDomain
    ? ''
    : (getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`)
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
  const isPortfolioLayout = (typed.gallery_layout_mode ?? 'separated') === 'portfolio'

  const html = generatePublicBlogPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    blogPath,
    studioPath: canonicalPath || '/',
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
    displayStyle: typed.posts_display_style,
    headingFont: typed.heading_font,
    aboutTitleFont: typed.about_title_font,
    galleryLayoutMode: isPortfolioLayout ? 'portfolio' : 'separated',
    portfolioPath: isPortfolioLayout ? `${canonicalPath}/portfolio` : undefined,
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
