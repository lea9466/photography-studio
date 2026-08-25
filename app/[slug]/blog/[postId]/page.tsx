import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { TENANT_HOST_HEADER } from '@/lib/domains/rewrite'
import { getCanonicalBaseUrl } from '@/lib/domains/custom-domain-lookup'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { getBrandingFaviconPublicUrl, getBrandingPublicMediaUrl } from '@/lib/branding-public-url'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicBlogPostPageHTML } from '@/lib/public-blog-html'
import {
  fetchBlogPostNavigation,
  fetchPublicBlogPostById,
} from '@/lib/public-blog-posts'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'
import {
  buildPostCanonicalPath,
  buildPostDescription,
  buildPostSeoTitle,
} from '@/lib/seo/photographer-discovery'
import { resolveActiveStudioPath } from '@/lib/seo/sitemap-validation'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { canUseFeature } from '@/lib/subscriptions/entitlements'
import { isReactPublicSiteEnabled } from '@/lib/public-site/react-rollout'
import { buildBlogPostViewModel } from '@/lib/public-site/adapters/build-blog-post-view-model'
import {
  toClassicBlogPostPageProps,
  toClassicSiteFooterProps,
  toClassicSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/classic'
import { ClassicBlogPostShell } from '@/components/photographer/react-site/ClassicBlogPostShell'
import {
  toDarkBlogPostPageProps,
  toDarkSiteFooterProps,
  toDarkSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/dark'
import { DarkBlogPostShell } from '@/components/photographer/react-site/DarkBlogPostShell'
import {
  toElegantBlogPostPageProps,
  toElegantSiteFooterProps,
  toElegantSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/elegant'
import { ElegantBlogPostShell } from '@/components/photographer/react-site/ElegantBlogPostShell'
import {
  toModernBlogPostPageProps,
  toModernSiteFooterProps,
  toModernSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/modern'
import { ModernBlogPostShell } from '@/components/photographer/react-site/ModernBlogPostShell'

interface PostPageProps {
  params: Promise<{ slug: string; postId: string }>
}

export default async function PhotographerPostPage({ params }: PostPageProps) {
  const { slug, postId } = await params
  const decodedSlug = decodeURIComponent(slug)
  const photographer = await findPhotographerBySlug(decodedSlug)

  if (!photographer) notFound()

  const typed = photographer as typeof photographer & {
    id: string
    accent_color: string | null
    selected_theme: string | null
    should_color_logo: boolean
    faq_items: unknown
  }

  // studioPath stays the REAL slug path regardless of domain — it gates
  // notFound() above and feeds postPath's canonical identity below, neither
  // of which should change based on which domain a visitor is on. Only the
  // nav links a visitor can actually click (home/blog list/prev/next) need
  // to be tenant-relative; see app/[slug]/page.tsx for the full rationale.
  const studioPath = resolveActiveStudioPath(photographer)
  if (!studioPath) notFound()

  // Check entitlements for posts feature
  const entitlements = await getStudioEntitlements(typed.id)
  if (!canUseFeature(entitlements, 'posts')) {
    notFound()
  }

  const post = await fetchPublicBlogPostById(typed.id, postId, photographer.site_language)
  if (!post) notFound()

  const isTenantDomain = (await headers()).has(TENANT_HOST_HEADER)
  const navBasePath = isTenantDomain ? '' : studioPath

  const { prev, next } = await fetchBlogPostNavigation(
    typed.id,
    postId,
    navBasePath,
    photographer.site_language
  )

  const siteTheme = normalizeSiteTheme(typed.selected_theme)
  const accentColor = typed.accent_color ?? '#7c3aed'
  const studioName = photographer.studio_name ?? photographer.name ?? 'Studio Gallery'
  const homepagePath = isTenantDomain ? '/' : resolveHomepagePath(photographer.slug, photographer.studio_name)
  const canonicalPath = isTenantDomain
    ? ''
    : (getPublicSitePath(photographer.slug, photographer.studio_name) ?? studioPath)
  const blogPath = `${canonicalPath}/blog`
  const postPath = buildPostCanonicalPath(studioPath, post.id)
  const logoUrl = await resolveBrandingPath(photographer.logo_url)
  const hasFaq = sanitizeFaqItems(parseFaqItems(typed.faq_items)).length > 0

  const admin = createAdminClient()
  const [{ count: packageCount }, { count: postCount }, { count: photoEditCount }] =
    await Promise.all([
      admin
        .from('photography_packages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', typed.id)
        .eq('is_active', true),
      admin.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', typed.id),
      admin
        .from('photo_edit_comparisons')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', typed.id)
        .eq('is_active', true),
    ])

  const hasPhotoEditComparisons = (photoEditCount ?? 0) > 0
  const isPortfolioLayout = (photographer.gallery_layout_mode ?? 'separated') === 'portfolio'

  if (await isReactPublicSiteEnabled()) {
    const viewModel = buildBlogPostViewModel({
      photographer: {
        studio_name: typed.studio_name,
        name: typed.name,
        logo_url: logoUrl,
        should_color_logo: typed.should_color_logo,
        accent_color: typed.accent_color,
        heading_font: typed.heading_font,
        about_title_font: typed.about_title_font,
        site_language: typed.site_language,
        gallery_layout_mode: typed.gallery_layout_mode,
      },
      post,
      postPath,
      prevPost: prev,
      nextPost: next,
      homepagePath,
      blogPath,
      portfolioPath: `${canonicalPath}/portfolio`,
      beforeAfterPath: `${canonicalPath}/before-after`,
      hasFaq,
      hasPackages: (packageCount ?? 0) > 0,
      hasPhotoEditComparisons,
    })

    if (typed.selected_theme === 'dark' || typed.selected_theme === 'bold') {
      return (
        <DarkBlogPostShell
          headerProps={toDarkSiteHeaderProps(viewModel)}
          footerProps={toDarkSiteFooterProps(viewModel)}
          pageProps={toDarkBlogPostPageProps(viewModel)}
        />
      )
    }

    if (typed.selected_theme === 'elegant') {
      return (
        <ElegantBlogPostShell
          headerProps={toElegantSiteHeaderProps(viewModel)}
          footerProps={toElegantSiteFooterProps(viewModel)}
          pageProps={toElegantBlogPostPageProps(viewModel)}
        />
      )
    }

    if (typed.selected_theme === 'modern') {
      return (
        <ModernBlogPostShell
          headerProps={toModernSiteHeaderProps(viewModel)}
          footerProps={toModernSiteFooterProps(viewModel)}
          pageProps={toModernBlogPostPageProps(viewModel)}
        />
      )
    }

    return (
      <ClassicBlogPostShell
        headerProps={toClassicSiteHeaderProps(viewModel)}
        footerProps={toClassicSiteFooterProps(viewModel)}
        pageProps={toClassicBlogPostPageProps(viewModel)}
      />
    )
  }

  const html = generatePublicBlogPostPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    blogPath,
    postPath,
    post,
    prevPost: prev,
    nextPost: next,
    accentColor,
    hasFaq,
    hasPackages: (packageCount ?? 0) > 0,
    hasBlog: (postCount ?? 0) > 0,
    hasPhotoEditComparisons,
    beforeAfterPath: hasPhotoEditComparisons ? `${canonicalPath}/before-after` : undefined,
    shouldColorLogo: typed.should_color_logo ?? false,
    siteLanguage: photographer.site_language,
    headingFont: typed.heading_font,
    aboutTitleFont: typed.about_title_font,
    galleryLayoutMode: isPortfolioLayout ? 'portfolio' : 'separated',
    portfolioPath: isPortfolioLayout ? `${canonicalPath}/portfolio` : undefined,
  })

  return <HtmlFramePage html={html} title={`${post.title} | ${studioName}`} />
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug, postId } = await params
  const decodedSlug = decodeURIComponent(slug)

  try {
    const photographer = await findPhotographerBySlug(decodedSlug)
    if (!photographer) return { title: 'פוסט לא נמצא' }

    const post = await fetchPublicBlogPostById(photographer.id, postId, photographer.site_language)
    if (!post) return { title: 'פוסט לא נמצא' }

    const studioName = photographer.studio_name ?? photographer.name ?? 'Studio Gallery'
    const studioPath = resolveActiveStudioPath(photographer)
    if (!studioPath) return { title: 'פוסט לא נמצא' }

    // postPath identity (used for e.g. buildPostCanonicalPath elsewhere) stays
    // slug-based always — only the canonical URL's HOST prefers the custom
    // domain when one exists, with the post's path kept relative to it.
    const baseUrl = await getCanonicalBaseUrl(photographer.id)
    const canonicalPath = baseUrl
      ? buildPostCanonicalPath('', post.id)
      : buildPostCanonicalPath(studioPath, post.id)
    const title = buildPostSeoTitle(post.title, studioName)
    const description = buildPostDescription(post)
    const logoIconUrl =
      getBrandingFaviconPublicUrl(photographer.id, photographer.logo_url) ??
      getBrandingPublicMediaUrl(photographer.logo_url)

    return {
      title,
      description,
      ...(logoIconUrl
        ? {
            icons: {
              icon: logoIconUrl,
              shortcut: logoIconUrl,
              apple: logoIconUrl,
            },
          }
        : {}),
      alternates: {
        canonical: buildCanonicalUrl(canonicalPath, baseUrl),
      },
      openGraph: buildPublicOpenGraph({
        title,
        description,
        canonicalPath,
        imageUrl: post.coverUrl,
        baseUrl,
      }),
    }
  } catch {
    return { title: 'פוסט' }
  }
}
