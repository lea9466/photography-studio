'use client'

import { useEffect, type ReactNode } from 'react'
import { isSiteLtr, type SiteLanguage } from '@/lib/site-language'
import { ModernSiteHeader, type ModernSiteHeaderProps } from '@/components/photographer/site-chrome/ModernSiteHeader'
import { ModernSiteFooter, type ModernSiteFooterProps } from '@/components/photographer/site-chrome/ModernSiteFooter'
import { getGoogleFontUrl, buildBrandFontVarsCss } from '@/lib/fonts'
import '@/components/photographer/themes/modern/modern-theme.css'

export type ModernPageChromeProps = {
  language: SiteLanguage
  headerProps: ModernSiteHeaderProps
  footerProps: ModernSiteFooterProps
  children: ReactNode
}

/** Modern-theme counterpart of ClassicPageChrome.tsx — see its doc comment
 * for why this lives at the page-branch level and why dir/lang is a client
 * effect instead of a real <html> attribute. Font links match
 * app/dev-preview/modern/layout.tsx's own set verbatim. */
export function ModernPageChrome({ language, headerProps, footerProps, children }: ModernPageChromeProps) {
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
  const brandFontCss = buildBrandFontVarsCss(headerProps.headingFont, headerProps.aboutTitleFont, '.theme-modern')

  return (
    <div className="theme-modern">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;700&family=Rubik:wght@400;500;700&display=swap"
      />
      {brandFontUrl ? <link rel="stylesheet" href={brandFontUrl} /> : null}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`html { scroll-behavior: smooth; } .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; } ${brandFontCss}`}</style>

      <ModernSiteHeader {...headerProps} />
      {children}
      <ModernSiteFooter {...footerProps} />
    </div>
  )
}
