import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { TENANT_HOST_HEADER } from '@/lib/domains/rewrite'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { getBrandingFaviconPublicUrl, getBrandingPublicMediaUrl } from '@/lib/branding-public-url'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicBlogPageHTML } from '@/lib/public-blog-html'
import { fetchPublicBlogPosts } from '@/lib/public-blog-posts'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { resolvePostsPageTitle } from '@/lib/posts-section-copy'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'
import { getCanonicalBaseUrl, getGoogleSiteVerificationToken } from '@/lib/domains/custom-domain-lookup'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { canUseFeature } from '@/lib/subscriptions/entitlements'
import { isReactPublicSiteEnabled } from '@/lib/public-site/react-rollout'
import { buildBlogListViewModel } from '@/lib/public-site/adapters/build-blog-list-view-model'
import { toClassicBlogListPageProps } from '@/lib/public-site/adapters/theme-props/classic'
import { ClassicBlogListShell } from '@/components/photographer/react-site/ClassicBlogListShell'
import { toDarkBlogListPageProps } from '@/lib/public-site/adapters/theme-props/dark'
import { DarkBlogListShell } from '@/components/photographer/react-site/DarkBlogListShell'
import { toElegantBlogListPageProps } from '@/lib/public-site/adapters/theme-props/elegant'
import { ElegantBlogListShell } from '@/components/photographer/react-site/ElegantBlogListShell'
import { toModernBlogListPageProps } from '@/lib/public-site/adapters/theme-props/modern'
import { ModernBlogListShell } from '@/components/photographer/react-site/ModernBlogListShell'

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
  const hasFaq = canUseFeature(entitlements, 'faq') && sanitizeFaqItems(parseFaqItems(typed.faq_items)).length > 0

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
  const hasPackages = canUseFeature(entitlements, 'packages') && (packageCount ?? 0) > 0
  const hasPhotoEditComparisons = canUseFeature(entitlements, 'before_after') && (photoEditCount ?? 0) > 0
  const isPortfolioLayout = (typed.gallery_layout_mode ?? 'separated') === 'portfolio'

  if (await isReactPublicSiteEnabled()) {
    const viewModel = buildBlogListViewModel({
      photographer: {
        studio_name: typed.studio_name,
        name: typed.name,
        logo_url: logoUrl,
        should_color_logo: typed.should_color_logo,
        accent_color: typed.accent_color,
        heading_font: typed.heading_font,
        about_title_font: typed.about_title_font,
        site_language: typed.site_language,
        posts_page_title: typed.posts_page_title,
        posts_display_style: typed.posts_display_style,
        gallery_layout_mode: typed.gallery_layout_mode,
      },
      posts: blogPosts,
      homepagePath,
      blogPath,
      portfolioPath: `${canonicalPath}/portfolio`,
      beforeAfterPath: `${canonicalPath}/before-after`,
      hasFaq,
      hasPackages,
      hasPhotoEditComparisons,
    })

    if (typed.selected_theme === 'dark' || typed.selected_theme === 'bold') {
      return <DarkBlogListShell pageProps={toDarkBlogListPageProps(viewModel)} blogPath={blogPath} />
    }

    if (typed.selected_theme === 'elegant') {
      return <ElegantBlogListShell pageProps={toElegantBlogListPageProps(viewModel)} blogPath={blogPath} />
    }

    if (typed.selected_theme === 'modern') {
      return <ModernBlogListShell pageProps={toModernBlogListPageProps(viewModel)} blogPath={blogPath} />
    }

    return <ClassicBlogListShell pageProps={toClassicBlogListPageProps(viewModel)} blogPath={blogPath} />
  }

  const html = generatePublicBlogPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    blogPath,
    studioPath: canonicalPath || '/',
    hasFaq,
    hasPackages,
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
    const baseUrl = await getCanonicalBaseUrl(typed.id)
    const canonicalPath = baseUrl
      ? ''
      : (getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`)
    const blogPath = `${canonicalPath}/blog`
    const title = `${pageTitle} | ${studioName}`
    const description = `הבלוג של ${studioName}`
    const googleSiteVerificationToken = await getGoogleSiteVerificationToken(typed.id)
    const logoIconUrl =
      getBrandingFaviconPublicUrl(typed.id, typed.logo_url) ??
      getBrandingPublicMediaUrl(typed.logo_url)

    return {
      title,
      description,
      ...(googleSiteVerificationToken ? { verification: { google: googleSiteVerificationToken } } : {}),
      ...(logoIconUrl
        ? {
            icons: {
              icon: logoIconUrl,
              shortcut: logoIconUrl,
              apple: logoIconUrl,
            },
          }
        : {}),
      alternates: { canonical: buildCanonicalUrl(blogPath, baseUrl) },
      openGraph: buildPublicOpenGraph({
        title,
        description,
        canonicalPath: blogPath,
        imageUrl: null,
        baseUrl,
      }),
    }
  } catch {
    return { title: 'בלוג' }
  }
}
