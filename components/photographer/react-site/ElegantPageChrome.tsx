'use client'

import { useEffect, type ReactNode } from 'react'
import { isSiteLtr, type SiteLanguage } from '@/lib/site-language'
import { ElegantSiteHeader, type ElegantSiteHeaderProps } from '@/components/photographer/site-chrome/ElegantSiteHeader'
import { ElegantSiteFooter, type ElegantSiteFooterProps } from '@/components/photographer/site-chrome/ElegantSiteFooter'
import { getGoogleFontUrl, buildBrandFontVarsCss } from '@/lib/fonts'
import '@/components/photographer/themes/elegant/elegant-theme.css'

export type ElegantPageChromeProps = {
  language: SiteLanguage
  headerProps: ElegantSiteHeaderProps
  footerProps: ElegantSiteFooterProps
  children: ReactNode
}

/** Elegant-theme counterpart of ClassicPageChrome.tsx — see its doc comment
 * for why this lives at the page-branch level and why dir/lang is a client
 * effect instead of a real <html> attribute. Font links match
 * app/dev-preview/elegant/layout.tsx's own set verbatim. */
export function ElegantPageChrome({ language, headerProps, footerProps, children }: ElegantPageChromeProps) {
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
  const brandFontCss = buildBrandFontVarsCss(headerProps.headingFont, headerProps.aboutTitleFont, '.theme-elegant')

  return (
    <div className="theme-elegant">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@300;400;500;700;900&display=swap"
      />
      {brandFontUrl ? <link rel="stylesheet" href={brandFontUrl} /> : null}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`html { scroll-behavior: smooth; } .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; } ${brandFontCss}`}</style>

      <ElegantSiteHeader {...headerProps} />
      {children}
      <ElegantSiteFooter {...footerProps} />
    </div>
  )
}
