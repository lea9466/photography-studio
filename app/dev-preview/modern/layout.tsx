'use client'

import type { ReactNode } from 'react'
import { ModernSiteHeader } from '@/components/photographer/site-chrome/ModernSiteHeader'
import { ModernSiteFooter } from '@/components/photographer/site-chrome/ModernSiteFooter'

/**
 * Shared layout for every modern-theme dev-preview route
 * (app/dev-preview/modern/{page,portfolio,blog,blog/post,before-after}).
 *
 * Previously each of the 5 page-composition components
 * (ModernHomePage/ModernPortfolioPage/ModernBlogListPage/ModernBlogPostPage/
 * ModernBeforeAfterPage) rendered its own <ModernSiteHeader>+<ModernSiteFooter>
 * internally, so every client-side navigation between them unmounted one
 * header instance and mounted a fresh one — defeating the whole point of
 * ModernSiteHeader.tsx's `usePathname`-derived transparency/scroll state
 * (see that component's doc comment: it's designed to be "a single
 * persistent instance across client-side navigation" instead of every route
 * telling it which mode to render in). Hoisting the header/footer here so
 * they mount once for the whole /dev-preview/modern subtree fixes that: the
 * header now survives navigation between pages instead of flashing/resetting.
 *
 * Font `<link>` tags + `scroll-behavior: smooth` were previously duplicated
 * in every app/dev-preview/modern page.tsx file — consolidated here instead.
 *
 * The mock studio identity/nav config below is intentionally the single
 * source of truth for every preview page's header+footer — values mirror
 * what each page.tsx was passing individually before this refactor.
 */
const MOCK_ACCENT = '#4f46e5'

const STUDIO_CONFIG = {
  studioName: 'סטודיו נובה',
  logoUrl: null as string | null,
  shouldColorLogo: false,
  accentColor: MOCK_ACCENT,
  language: 'he' as const,
  homepagePath: '/dev-preview/modern',
  blogPath: '/dev-preview/modern/blog',
  beforeAfterPath: '/dev-preview/modern/before-after',
  portfolioPath: '/dev-preview/modern/portfolio',
  galleryLayoutMode: 'separated' as const,
  hasFaq: true,
  hasPackages: true,
  hasBlog: true,
  hasPhotoEditComparisons: true,
}

export default function ModernPreviewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-modern">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;700&family=Rubik:wght@400;500;700&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`html { scroll-behavior: smooth; } .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }`}</style>

      <ModernSiteHeader
        studioName={STUDIO_CONFIG.studioName}
        logoUrl={STUDIO_CONFIG.logoUrl}
        shouldColorLogo={STUDIO_CONFIG.shouldColorLogo}
        primaryColor={STUDIO_CONFIG.accentColor}
        headingFont={null}
        aboutTitleFont={null}
        homepagePath={STUDIO_CONFIG.homepagePath}
        hasFaq={STUDIO_CONFIG.hasFaq}
        hasPackages={STUDIO_CONFIG.hasPackages}
        hasBlog={STUDIO_CONFIG.hasBlog}
        blogPath={STUDIO_CONFIG.blogPath}
        hasPhotoEditComparisons={STUDIO_CONFIG.hasPhotoEditComparisons}
        beforeAfterPath={STUDIO_CONFIG.beforeAfterPath}
        galleryLayoutMode={STUDIO_CONFIG.galleryLayoutMode}
        portfolioPath={STUDIO_CONFIG.portfolioPath}
        language={STUDIO_CONFIG.language}
      />

      {children}

      <ModernSiteFooter
        studioName={STUDIO_CONFIG.studioName}
        logoUrl={STUDIO_CONFIG.logoUrl}
        primaryColor={STUDIO_CONFIG.accentColor}
        language={STUDIO_CONFIG.language}
      />
    </div>
  )
}
