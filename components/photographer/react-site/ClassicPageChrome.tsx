'use client'

import { useEffect, type ReactNode } from 'react'
import { isSiteLtr, type SiteLanguage } from '@/lib/site-language'
import { ClassicSiteHeader, type ClassicSiteHeaderProps } from '@/components/photographer/site-chrome/ClassicSiteHeader'
import { ClassicSiteFooter, type ClassicSiteFooterProps } from '@/components/photographer/site-chrome/ClassicSiteFooter'
import { getGoogleFontUrl, buildBrandFontVarsCss } from '@/lib/fonts'
import '@/components/photographer/themes/classic/classic-theme.css'

export type ClassicPageChromeProps = {
  language: SiteLanguage
  headerProps: ClassicSiteHeaderProps
  footerProps: ClassicSiteFooterProps
  children: ReactNode
}

/**
 * Shared Phase-0 shell for every classic-theme page (see
 * ClassicHomepageShell.tsx's doc comment for why this lives at the
 * page-branch level instead of the shared app/[slug]/layout.tsx, and why
 * dir/lang is a client effect instead of a real <html> attribute) — extracted
 * once fonts/header/footer/dir-fix needed to be shared by portfolio, blog
 * list, blog post, and before-after in addition to the homepage.
 */
export function ClassicPageChrome({ language, headerProps, footerProps, children }: ClassicPageChromeProps) {
  useEffect(() => {
    const ltr = isSiteLtr(language)
    document.documentElement.lang = ltr ? 'en' : 'he'
    document.documentElement.dir = ltr ? 'ltr' : 'rtl'
    return () => {
      document.documentElement.lang = 'he'
      document.documentElement.dir = 'rtl'
    }
  }, [language])

  const brandFontUrl = getGoogleFontUrl(headerProps.headingFont, headerProps.aboutTitleFont)
  const brandFontCss = buildBrandFontVarsCss(headerProps.headingFont, headerProps.aboutTitleFont, '.theme-classic')

  return (
    <div className="theme-classic">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@400;700&family=Great+Vibes&display=swap"
      />
      {brandFontUrl ? <link rel="stylesheet" href={brandFontUrl} /> : null}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`html { scroll-behavior: smooth; } .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; } ${brandFontCss}`}</style>

      <ClassicSiteHeader {...headerProps} />
      {children}
      <ClassicSiteFooter {...footerProps} />
    </div>
  )
}
