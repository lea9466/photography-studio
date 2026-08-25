'use client'

import { ClassicSiteHeader } from '@/components/photographer/site-chrome/ClassicSiteHeader'
import { ClassicSiteFooter } from '@/components/photographer/site-chrome/ClassicSiteFooter'

/**
 * Shared layout for every classic-theme dev-preview route — mounts
 * ClassicSiteHeader/ClassicSiteFooter ONCE so they persist as a single
 * instance across client-side navigation between the 5 preview pages (home,
 * portfolio, blog list, blog post, before/after), instead of each page
 * composition remounting a fresh Header/Footer on every route change. See
 * ClassicSiteHeader.tsx's doc comment for the same "single persistent
 * instance" rationale — ClassicSiteHeader already reads the route itself via
 * `usePathname()` internally, so it needs no route-specific props here.
 * (Mirrors app/dev-preview/dark/layout.tsx's already-established pattern for
 * the dark theme.)
 *
 * Also consolidates the font <link> tags + `html { scroll-behavior: smooth }`
 * style that used to be duplicated verbatim in every
 * app/dev-preview/classic/*\/page.tsx.
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
 * reads "גלריה" (linking to the homepage's #galleries anchor) instead of
 * "תיק עבודות". Content-level `galleryLayoutMode` props (e.g. ClassicHomePage's
 * own gallery-vs-portfolio section choice) are unaffected — those still live
 * on each page.tsx as before.
 */
const MOCK_ACCENT = '#b5816a'

const CLASSIC_PREVIEW_SITE = {
  studioName: 'סטודיו אורלי כהן',
  logoUrl: null as string | null,
  shouldColorLogo: false,
  accentColor: MOCK_ACCENT,
  language: 'he' as const,
  homepagePath: '/dev-preview/classic',
  blogPath: '/dev-preview/classic/blog',
  beforeAfterPath: '/dev-preview/classic/before-after',
  portfolioPath: '/dev-preview/classic/portfolio',
  galleryLayoutMode: 'separated' as const,
  hasFaq: true,
  hasPackages: true,
  hasBlog: true,
  hasPhotoEditComparisons: true,
}

export default function ClassicPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-classic">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@400;700&family=Great+Vibes&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`html { scroll-behavior: smooth; } .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }`}</style>

      <ClassicSiteHeader
        studioName={CLASSIC_PREVIEW_SITE.studioName}
        logoUrl={CLASSIC_PREVIEW_SITE.logoUrl}
        shouldColorLogo={CLASSIC_PREVIEW_SITE.shouldColorLogo}
        primaryColor={CLASSIC_PREVIEW_SITE.accentColor}
        headingFont={null}
        aboutTitleFont={null}
        homepagePath={CLASSIC_PREVIEW_SITE.homepagePath}
        hasFaq={CLASSIC_PREVIEW_SITE.hasFaq}
        hasPackages={CLASSIC_PREVIEW_SITE.hasPackages}
        hasBlog={CLASSIC_PREVIEW_SITE.hasBlog}
        blogPath={CLASSIC_PREVIEW_SITE.blogPath}
        hasPhotoEditComparisons={CLASSIC_PREVIEW_SITE.hasPhotoEditComparisons}
        beforeAfterPath={CLASSIC_PREVIEW_SITE.beforeAfterPath}
        galleryLayoutMode={CLASSIC_PREVIEW_SITE.galleryLayoutMode}
        portfolioPath={CLASSIC_PREVIEW_SITE.portfolioPath}
        language={CLASSIC_PREVIEW_SITE.language}
      />

      {children}

      <ClassicSiteFooter
        studioName={CLASSIC_PREVIEW_SITE.studioName}
        logoUrl={CLASSIC_PREVIEW_SITE.logoUrl}
        primaryColor={CLASSIC_PREVIEW_SITE.accentColor}
        language={CLASSIC_PREVIEW_SITE.language}
      />
    </div>
  )
}
