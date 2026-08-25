import Link from 'next/link'
import { getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'

export type ElegantSiteFooterProps = {
  studioName: string
  logoUrl: string | null
  primaryColor: string
  language: SiteLanguage
}

/**
 * Elegant theme's footer — 1:1 port of the `case 'elegant':` branch of
 * generateSiteFooter() (lib/photographer-site-chrome.ts, ~line 372): no logo
 * falls back to the plain studio name rendered uppercase/tracking-widest in
 * the display font (not brandLastWord — elegant's fallback never colors the
 * last word, unlike dark's), legal links are small uppercase/tracking-widest
 * labels (same convention as dark's footer, not classic's plain-body links),
 * and the "studio signup" CTA mirrors `generateStudioSignupFooterCta`'s
 * elegant branch — a bordered/uppercase link, not classic's rounded pill.
 */
export function ElegantSiteFooter({ studioName, logoUrl, primaryColor, language }: ElegantSiteFooterProps) {
  const copy = getSiteChromeCopy(language)
  const year = new Date().getFullYear()
  const rightsLine = `© ${year} ${studioName}. ${copy.footer.rights}`

  return (
    <footer
      className="w-full border-t border-[#c7c7c0]/20 bg-[#FAFAF8] py-12 pb-32"
      style={{ '--footer-accent': primaryColor } as React.CSSProperties}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row rtl:md:flex-row-reverse">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={studioName} className="h-10 w-auto object-contain" />
        ) : (
          <div
            className="font-display text-xl tracking-widest text-[#1c1b1b] uppercase"
            style={{ fontFamily: 'var(--headline-font, "Playfair Display", serif)' }}
          >
            {studioName}
          </div>
        )}
        <div className="flex flex-row flex-wrap justify-center gap-8 text-xs tracking-widest uppercase rtl:flex-row-reverse">
          <Link href="/terms" className="text-[#464742] transition-colors hover:text-[var(--footer-accent)]">
            {copy.footer.terms}
          </Link>
          <Link href="/privacy" className="text-[#464742] transition-colors hover:text-[var(--footer-accent)]">
            {copy.footer.privacy}
          </Link>
          <Link href="/accessibility" className="text-[#464742] transition-colors hover:text-[var(--footer-accent)]">
            {copy.footer.accessibility}
          </Link>
        </div>
        <div className="text-[10px] tracking-widest text-[#464742] uppercase">{rightsLine}</div>
        <div className="inline-flex shrink-0 flex-row items-center gap-2">
          <span className="text-[10px] tracking-wider whitespace-nowrap text-[#464742]/60 uppercase">
            {copy.footer.studioSignupQuestion}
          </span>
          <Link
            href="/register"
            className="border border-[var(--footer-accent)]/15 px-2 py-0.5 text-[10px] tracking-wider whitespace-nowrap text-[var(--footer-accent)]/55 uppercase transition-colors hover:border-[var(--footer-accent)]/35 hover:text-[var(--footer-accent)]"
          >
            {copy.footer.studioSignupButton}
          </Link>
        </div>
      </div>
    </footer>
  )
}
