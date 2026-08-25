'use client'

import { ElegantSiteHeader } from '@/components/photographer/site-chrome/ElegantSiteHeader'
import { ElegantSiteFooter } from '@/components/photographer/site-chrome/ElegantSiteFooter'

/**
 * Shared layout for every elegant-theme dev-preview route
 * (app/dev-preview/elegant/{page,portfolio,blog,blog/post,before-after}).
 *
 * Previously each of the 5 page-composition components
 * (ElegantHomePage/ElegantPortfolioPage/ElegantBlogListPage/ElegantBlogPostPage/
 * ElegantBeforeAfterPage) rendered its own <ElegantSiteHeader>+<ElegantSiteFooter>
 * internally, so every client-side navigation between them unmounted one
 * header instance and mounted a fresh one — defeating the whole point of
 * ElegantSiteHeader.tsx's scroll/mobile-menu state being a single persistent
 * instance across client-side navigation (same rationale as
 * ClassicSiteHeader.tsx's doc comment). Hoisting the header/footer here so
 * they mount once for the whole /dev-preview/elegant subtree fixes that: the
 * header now survives navigation between pages instead of flashing/resetting.
 *
 * Also consolidates the font `<link>` tags + `html { scroll-behavior: smooth }`
 * style that used to be duplicated verbatim in every
 * app/dev-preview/elegant/*\/page.tsx (mirrors
 * app/dev-preview/{classic,dark,modern}/layout.tsx's already-established
 * pattern for the other 3 themes).
 *
 * The mock studio identity + nav config below is the ONE shared source of
 * truth for every preview route's chrome — values match what every
 * individual preview page.tsx previously passed to its own Header/Footer, so
 * nothing changes visually. The one intentional exception: the standalone
 * Portfolio preview page used to hardcode `galleryLayoutMode="portfolio"` for
 * its own header (giving it a "תיק עבודות" nav label + a self-link), while
 * every other page used `"separated"`. A single shared header instance can't
 * have it both ways, so this picks `"separated"` — the value 4 of the 5 pages
 * already agreed on — meaning the portfolio preview page's nav label now
 * reads "גלריה" (linking to the homepage's #gallery anchor) instead of "תיק
 * עבודות". Content-level `galleryLayoutMode` props (e.g. ElegantHomePage's own
 * gallery-vs-portfolio section choice) are unaffected — those still live on
 * each page.tsx as before.
 */
const MOCK_ACCENT = '#b8953f'

const ELEGANT_PREVIEW_SITE = {
  studioName: 'סטודיו אלגנט',
  logoUrl: null as string | null,
  shouldColorLogo: false,
  accentColor: MOCK_ACCENT,
  language: 'he' as const,
  homepagePath: '/dev-preview/elegant',
  blogPath: '/dev-preview/elegant/blog',
  beforeAfterPath: '/dev-preview/elegant/before-after',
  portfolioPath: '/dev-preview/elegant/portfolio',
  galleryLayoutMode: 'separated' as const,
  hasFaq: true,
  hasPackages: true,
  hasBlog: true,
  hasPhotoEditComparisons: true,
}

export default function ElegantPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-elegant">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@300;400;500;700;900&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`html { scroll-behavior: smooth; } .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }`}</style>

      <ElegantSiteHeader
        studioName={ELEGANT_PREVIEW_SITE.studioName}
        logoUrl={ELEGANT_PREVIEW_SITE.logoUrl}
        shouldColorLogo={ELEGANT_PREVIEW_SITE.shouldColorLogo}
        primaryColor={ELEGANT_PREVIEW_SITE.accentColor}
        headingFont={null}
        aboutTitleFont={null}
        homepagePath={ELEGANT_PREVIEW_SITE.homepagePath}
        hasFaq={ELEGANT_PREVIEW_SITE.hasFaq}
        hasPackages={ELEGANT_PREVIEW_SITE.hasPackages}
        hasBlog={ELEGANT_PREVIEW_SITE.hasBlog}
        blogPath={ELEGANT_PREVIEW_SITE.blogPath}
        hasPhotoEditComparisons={ELEGANT_PREVIEW_SITE.hasPhotoEditComparisons}
        beforeAfterPath={ELEGANT_PREVIEW_SITE.beforeAfterPath}
        galleryLayoutMode={ELEGANT_PREVIEW_SITE.galleryLayoutMode}
        portfolioPath={ELEGANT_PREVIEW_SITE.portfolioPath}
        language={ELEGANT_PREVIEW_SITE.language}
      />

      {children}

      <ElegantSiteFooter
        studioName={ELEGANT_PREVIEW_SITE.studioName}
        logoUrl={ELEGANT_PREVIEW_SITE.logoUrl}
        primaryColor={ELEGANT_PREVIEW_SITE.accentColor}
        language={ELEGANT_PREVIEW_SITE.language}
      />
    </div>
  )
}
