'use client'

import { DarkSiteHeader } from '@/components/photographer/site-chrome/DarkSiteHeader'
import { DarkSiteFooter } from '@/components/photographer/site-chrome/DarkSiteFooter'

/**
 * Shared layout for every dark-theme dev-preview route — mounts
 * DarkSiteHeader/DarkSiteFooter ONCE so they persist as a single instance
 * across client-side navigation between the 5 preview pages (home,
 * portfolio, blog list, blog post, before/after), instead of each page
 * composition remounting a fresh Header/Footer on every route change. See
 * ClassicSiteHeader.tsx's doc comment for the same "single persistent
 * instance" rationale — DarkSiteHeader already reads the route itself via
 * `usePathname()` internally, so it needs no route-specific props here.
 *
 * Also consolidates the font <link> tags + `html { scroll-behavior: smooth }`
 * style that used to be duplicated verbatim in every
 * app/dev-preview/dark/*\/page.tsx.
 *
 * The mock studio identity + nav config below is the ONE shared source of
 * truth for every preview route's chrome — values match what every
 * individual preview page.tsx previously passed to its own Header/Footer, so
 * nothing changes visually. The one intentional exception: the standalone
 * Portfolio preview page used to hardcode `galleryLayoutMode="portfolio"`
 * for its own header (giving it a "תיק עבודות" nav label + a self-link),
 * while every other page used `"separated"`. A single shared header instance
 * can't have it both ways, so this picks `"separated"` — the value 4 of the
 * 5 pages already agreed on — meaning the portfolio preview page's nav label
 * now reads "גלריה" (linking to the homepage's #gallery anchor) instead of
 * "תיק עבודות" (linking to itself). Content-level `galleryLayoutMode` props
 * (e.g. DarkHomePage's own gallery-vs-no-gallery-section decision) are
 * unaffected — those still live on each page.tsx as before.
 */
const MOCK_ACCENT = '#e0396b'

const DARK_PREVIEW_SITE = {
  studioName: 'סטודיו נועה שחר',
  logoUrl: null as string | null,
  shouldColorLogo: false,
  accentColor: MOCK_ACCENT,
  language: 'he' as const,
  homepagePath: '/dev-preview/dark',
  blogPath: '/dev-preview/dark/blog',
  beforeAfterPath: '/dev-preview/dark/before-after',
  portfolioPath: '/dev-preview/dark/portfolio',
  galleryLayoutMode: 'separated' as const,
  hasFaq: true,
  hasPackages: true,
  hasBlog: true,
  hasPhotoEditComparisons: true,
}

export default function DarkPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-dark">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Frank+Ruhl+Libre:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Rubik:wght@500;600;700;800&family=Space+Grotesk:wght@300;700;800&family=Heebo:wght@300;400;500;700&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`html { scroll-behavior: smooth; background: #121217; } .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }`}</style>

      <DarkSiteHeader
        studioName={DARK_PREVIEW_SITE.studioName}
        logoUrl={DARK_PREVIEW_SITE.logoUrl}
        shouldColorLogo={DARK_PREVIEW_SITE.shouldColorLogo}
        primaryColor={DARK_PREVIEW_SITE.accentColor}
        headingFont={null}
        aboutTitleFont={null}
        homepagePath={DARK_PREVIEW_SITE.homepagePath}
        hasFaq={DARK_PREVIEW_SITE.hasFaq}
        hasPackages={DARK_PREVIEW_SITE.hasPackages}
        hasBlog={DARK_PREVIEW_SITE.hasBlog}
        blogPath={DARK_PREVIEW_SITE.blogPath}
        hasPhotoEditComparisons={DARK_PREVIEW_SITE.hasPhotoEditComparisons}
        beforeAfterPath={DARK_PREVIEW_SITE.beforeAfterPath}
        galleryLayoutMode={DARK_PREVIEW_SITE.galleryLayoutMode}
        portfolioPath={DARK_PREVIEW_SITE.portfolioPath}
        language={DARK_PREVIEW_SITE.language}
      />

      {children}

      <DarkSiteFooter
        studioName={DARK_PREVIEW_SITE.studioName}
        logoUrl={DARK_PREVIEW_SITE.logoUrl}
        primaryColor={DARK_PREVIEW_SITE.accentColor}
        language={DARK_PREVIEW_SITE.language}
      />
    </div>
  )
}
