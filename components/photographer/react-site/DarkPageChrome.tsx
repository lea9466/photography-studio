'use client'

import { useEffect, type ReactNode } from 'react'
import { isSiteLtr, type SiteLanguage } from '@/lib/site-language'
import { DarkSiteHeader, type DarkSiteHeaderProps } from '@/components/photographer/site-chrome/DarkSiteHeader'
import { DarkSiteFooter, type DarkSiteFooterProps } from '@/components/photographer/site-chrome/DarkSiteFooter'
import { getGoogleFontUrl, buildBrandFontVarsCss } from '@/lib/fonts'
import '@/components/photographer/themes/dark/dark-theme.css'

export type DarkPageChromeProps = {
  language: SiteLanguage
  headerProps: DarkSiteHeaderProps
  footerProps: DarkSiteFooterProps
  children: ReactNode
}

/** Dark-theme counterpart of ClassicPageChrome.tsx — see its doc comment for
 * why this lives at the page-branch level and why dir/lang is a client
 * effect instead of a real <html> attribute. */
export function DarkPageChrome({ language, headerProps, footerProps, children }: DarkPageChromeProps) {
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
  const brandFontCss = buildBrandFontVarsCss(headerProps.headingFont, headerProps.aboutTitleFont, '.theme-dark')

  return (
    <div className="theme-dark">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Frank+Ruhl+Libre:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Rubik:wght@500;600;700;800&family=Space+Grotesk:wght@300;700;800&family=Heebo:wght@300;400;500;700&display=swap"
      />
      {brandFontUrl ? <link rel="stylesheet" href={brandFontUrl} /> : null}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`html { scroll-behavior: smooth; background: #121217; } .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; } ${brandFontCss}`}</style>

      <DarkSiteHeader {...headerProps} />
      {children}
      <DarkSiteFooter {...footerProps} />
    </div>
  )
}
