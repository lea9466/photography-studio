import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { SiteGateScreen } from '@/components/site-gate/SiteGateScreen'
import {
  applyOwnerPreviewBypass,
  resolvePublicSiteGateBySlug,
} from '@/lib/site-access/public-gate'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { resolveHomepagePath } from '@/lib/photographer-site-paths'
import { TENANT_HOST_HEADER } from '@/lib/domains/rewrite'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { resolveSiteLanguage } from '@/lib/site-language'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { canUseFeature } from '@/lib/subscriptions/entitlements'
import { isReactPublicSiteEnabled } from '@/lib/public-site/react-rollout'
import {
  toClassicSiteFooterProps,
  toClassicSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/classic'
import { ClassicPageChrome } from '@/components/photographer/react-site/ClassicPageChrome'
import {
  toDarkSiteFooterProps,
  toDarkSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/dark'
import { DarkPageChrome } from '@/components/photographer/react-site/DarkPageChrome'
import {
  toElegantSiteFooterProps,
  toElegantSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/elegant'
import { ElegantPageChrome } from '@/components/photographer/react-site/ElegantPageChrome'
import {
  toModernSiteFooterProps,
  toModernSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/modern'
import { ModernPageChrome } from '@/components/photographer/react-site/ModernPageChrome'

type PhotographerSiteLayoutProps = {
  children: ReactNode
  params: Promise<{ slug: string }>
}

/**
 * Real shared layout for every page nested under a studio's slug (home,
 * portfolio, blog, blog post, before/after) — the thing Lea expected to
 * already exist. Computes the header/footer chrome data (photographer info,
 * entitlement-gated nav flags) exactly ONCE per request here, instead of
 * each nested page.tsx recomputing its own copy — which is what let the
 * hasFaq/hasPackages/hasBlog/hasPhotoEditComparisons entitlement bug drift
 * out of sync across pages in the first place. Each nested page's own
 * isReactPublicSiteEnabled() branch now renders bare page content only (no
 * more per-page Shell/header/footer) — this layout supplies the chrome
 * around it.
 *
 * NOT shared with app/public-gallery/[id]/page.tsx — that route lives
 * outside the [slug] segment entirely, so Next.js can't nest it under this
 * same layout file. It keeps its own independent (but still
 * canUseFeature-gated, see the same fix applied there) computation.
 *
 * When the React rollout flag is off, or anything about resolving the
 * photographer/chrome fails, this renders `children` completely unwrapped —
 * the old iframe/string-HTML system already renders its own header/footer
 * inside its own markup, and every nested page.tsx still has its own
 * complete fallback logic (redirects, free-tier gating, 404s) that must run
 * unaffected either way.
 */
export default async function PhotographerSiteLayout({
  children,
  params,
}: PhotographerSiteLayoutProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const gate = await applyOwnerPreviewBypass(
    await resolvePublicSiteGateBySlug(decodedSlug)
  )

  if (gate) {
    return (
      <SiteGateScreen
        mode={gate.mode}
        studioName={gate.studioName}
        siteLanguage={gate.siteLanguage}
      />
    )
  }

  if (!(await isReactPublicSiteEnabled())) {
    return children
  }

  const photographer = await findPhotographerBySlug(decodedSlug)
  if (!photographer) {
    return children
  }

  const typed = photographer as typeof photographer & {
    id: string
    accent_color: string | null
    selected_theme: string | null
    should_color_logo: boolean | null
    heading_font: string | null
    about_title_font: string | null
    site_language: string | null
    gallery_layout_mode: string | null
    faq_items: unknown
  }

  const entitlements = await getStudioEntitlements(typed.id)
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

  const isTenantDomain = (await headers()).has(TENANT_HOST_HEADER)
  const canonicalPath = isTenantDomain
    ? ''
    : (getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`)
  const homepagePath = isTenantDomain ? '/' : resolveHomepagePath(typed.slug, typed.studio_name)

  const chromeViewModel = {
    studioName: typed.studio_name || typed.name || '',
    logoUrl: await resolveBrandingPath(typed.logo_url),
    shouldColorLogo: Boolean(typed.should_color_logo),
    accentColor: typed.accent_color || '#7c3aed',
    headingFont: typed.heading_font,
    aboutTitleFont: typed.about_title_font,
    language: resolveSiteLanguage(typed.site_language),
    homepagePath,
    hasFaq: canUseFeature(entitlements, 'faq') && sanitizeFaqItems(parseFaqItems(typed.faq_items)).length > 0,
    hasPackages: canUseFeature(entitlements, 'packages') && (packageCount ?? 0) > 0,
    hasBlog: canUseFeature(entitlements, 'posts') && (postCount ?? 0) > 0,
    blogPath: `${canonicalPath}/blog`,
    hasPhotoEditComparisons:
      canUseFeature(entitlements, 'before_after') && (photoEditCount ?? 0) > 0,
    beforeAfterPath: `${canonicalPath}/before-after`,
    galleryLayoutMode: (typed.gallery_layout_mode === 'portfolio' ? 'portfolio' : 'separated') as
      | 'separated'
      | 'portfolio',
    portfolioPath: `${canonicalPath}/portfolio`,
  }

  // Matches every page.tsx's own React-branch theme selection exactly (raw
  // selected_theme comparison, classic as the final fallback) — deliberately
  // NOT normalizeSiteTheme(), which has different fallback behavior
  // (defaults to 'elegant', maps dark -> 'bold') meant for the old system.
  if (typed.selected_theme === 'dark' || typed.selected_theme === 'bold') {
    return (
      <DarkPageChrome
        language={chromeViewModel.language}
        headerProps={toDarkSiteHeaderProps(chromeViewModel)}
        footerProps={toDarkSiteFooterProps(chromeViewModel)}
      >
        {children}
      </DarkPageChrome>
    )
  }

  if (typed.selected_theme === 'elegant') {
    return (
      <ElegantPageChrome
        language={chromeViewModel.language}
        headerProps={toElegantSiteHeaderProps(chromeViewModel)}
        footerProps={toElegantSiteFooterProps(chromeViewModel)}
      >
        {children}
      </ElegantPageChrome>
    )
  }

  if (typed.selected_theme === 'modern') {
    return (
      <ModernPageChrome
        language={chromeViewModel.language}
        headerProps={toModernSiteHeaderProps(chromeViewModel)}
        footerProps={toModernSiteFooterProps(chromeViewModel)}
      >
        {children}
      </ModernPageChrome>
    )
  }

  return (
    <ClassicPageChrome
      language={chromeViewModel.language}
      headerProps={toClassicSiteHeaderProps(chromeViewModel)}
      footerProps={toClassicSiteFooterProps(chromeViewModel)}
    >
      {children}
    </ClassicPageChrome>
  )
}
