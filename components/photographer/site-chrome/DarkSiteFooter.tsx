import Link from 'next/link'
import { getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'
import { DarkBrandLastWord } from '../themes/dark/DarkBrandLastWord'

export type DarkSiteFooterProps = {
  studioName: string
  logoUrl: string | null
  primaryColor: string
  language: SiteLanguage
}

/**
 * Dark theme's footer — 1:1 port of the `case 'dark':` branch of
 * generateSiteFooter() (lib/photographer-site-chrome.ts, ~line 440): no logo
 * falls back to `brandLastWord(studioName)` (last word colored/rendered via
 * DarkBrandLastWord, same helper the header/hero already use), legal links
 * are small uppercase/tracking-widest labels (not classic's plain-body
 * links), and the whole row sits on the fixed `#121217` background with a
 * faint top border — no per-studio background color here (dark's surface
 * colors are fixed, only the accent is dynamic, same convention as
 * dark-theme.css).
 */
export function DarkSiteFooter({ studioName, logoUrl, primaryColor, language }: DarkSiteFooterProps) {
  const copy = getSiteChromeCopy(language)
  const year = new Date().getFullYear()
  const rightsLine = `© ${year} ${studioName}. ${copy.footer.rights}`

  return (
    <footer
      className="w-full border-t border-white/10 bg-[#121217] py-16"
      style={{ '--footer-accent': primaryColor } as React.CSSProperties}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-8 md:flex-row rtl:md:flex-row-reverse">
        <div className="text-[24px] leading-[1.3] font-bold tracking-tighter text-[#f5f5f0]" style={{ fontFamily: 'var(--headline-font, "Space Grotesk", sans-serif)' }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={studioName} className="h-10 w-auto object-contain" />
          ) : (
            <DarkBrandLastWord text={studioName} accentColor={primaryColor} />
          )}
        </div>
        <div className="flex flex-row flex-wrap items-center justify-center gap-4 lg:gap-8 rtl:flex-row-reverse">
          <Link
            href="/terms"
            className="text-[10px] tracking-widest text-[#b8b8c0] uppercase transition-colors hover:text-[var(--footer-accent)] md:text-xs"
          >
            {copy.footer.terms}
          </Link>
          <Link
            href="/privacy"
            className="text-[10px] tracking-widest text-[#b8b8c0] uppercase transition-colors hover:text-[var(--footer-accent)] md:text-xs"
          >
            {copy.footer.privacy}
          </Link>
          <Link
            href="/accessibility"
            className="text-[10px] tracking-widest text-[#b8b8c0] uppercase transition-colors hover:text-[var(--footer-accent)] md:text-xs"
          >
            {copy.footer.accessibility}
          </Link>
        </div>
        <div className="text-[10px] text-[#b8b8c0] opacity-50 md:text-xs">{rightsLine}</div>
        <div className="inline-flex shrink-0 flex-row items-center gap-2">
          <span className="text-[10px] tracking-wider whitespace-nowrap text-[#b8b8c0]/60 uppercase">
            {copy.footer.studioSignupQuestion}
          </span>
          <Link
            href="/register"
            className="rounded-sm border border-[var(--footer-accent)]/35 px-2 py-0.5 text-[10px] tracking-wider whitespace-nowrap text-[var(--footer-accent)]/90 uppercase transition-colors hover:bg-[var(--footer-accent)]/10"
          >
            {copy.footer.studioSignupButton}
          </Link>
        </div>
      </div>
    </footer>
  )
}
