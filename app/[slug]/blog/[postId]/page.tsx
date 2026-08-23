import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { TENANT_HOST_HEADER } from '@/lib/domains/rewrite'
import { resolveBrandingPath } from '@/lib/branding-urls'
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
        imageUrl: post.coverUrl,
      }),
    }
  } catch {
    return { title: 'פוסט' }
  }
}
