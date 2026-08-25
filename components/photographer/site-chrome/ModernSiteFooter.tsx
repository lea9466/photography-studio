import Link from 'next/link'
import { Mail, Share2 } from 'lucide-react'
import { getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'

export type ModernSiteFooterProps = {
  studioName: string
  logoUrl: string | null
  primaryColor: string
  language: SiteLanguage
}

/**
 * Modern-theme footer — 1:1 port of the `case 'modern'` branch of
 * generateSiteFooter (lib/photographer-site-chrome.ts): brand+tagline on one
 * side, legal links centered, rights line, and (unlike classic, which has
 * none of these) a pair of circular share/mail icon buttons plus the studio
 * signup CTA. Both icon buttons are `href="#"` placeholders in the original
 * HTML-string renderer too — no real share/mail behavior wired up there
 * either, so kept as inert decorative links here rather than inventing new
 * behavior.
 */
export function ModernSiteFooter({ studioName, logoUrl, primaryColor, language }: ModernSiteFooterProps) {
  const copy = getSiteChromeCopy(language)
  const year = new Date().getFullYear()
  const rightsLine = `© ${year} ${studioName}. ${copy.footer.rights}`

  return (
    <footer
      className="w-full border-t border-[#0f172a]/10 bg-[#F8FAFC] py-12 pb-[120px]"
      style={{ '--footer-accent': primaryColor } as React.CSSProperties}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row rtl:md:flex-row-reverse">
        <div className="flex flex-col items-center gap-1 md:items-start rtl:md:items-end">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={studioName} className="h-10 w-auto object-contain" />
          ) : (
            <span
              className="text-2xl font-bold text-[var(--footer-accent)]"
              style={{ fontFamily: 'var(--headline-font, "Space Grotesk", sans-serif)' }}
            >
              {studioName}
            </span>
          )}
          <p className="text-sm text-[#0f172a]/60">{copy.footer.modernTagline}</p>
        </div>

        <div className="flex flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 rtl:flex-row-reverse">
          <Link
            href="/terms"
            className="text-sm text-[#0f172a]/60 transition-colors hover:text-[var(--footer-accent)]"
          >
            {copy.footer.terms}
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-[#0f172a]/60 transition-colors hover:text-[var(--footer-accent)]"
          >
            {copy.footer.privacy}
          </Link>
          <Link
            href="/accessibility"
            className="text-sm text-[#0f172a]/60 transition-colors hover:text-[var(--footer-accent)]"
          >
            {copy.footer.accessibility}
          </Link>
        </div>

        <div className="text-center text-sm text-[#0f172a]/60">{rightsLine}</div>

        <div className="flex gap-3">
          <a
            aria-label="שיתוף"
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a]/5 text-[var(--footer-accent)] transition-all hover:bg-[var(--footer-accent)] hover:text-white"
          >
            <Share2 className="h-5 w-5" />
          </a>
          <a
            aria-label="אימייל"
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a]/5 text-[var(--footer-accent)] transition-all hover:bg-[var(--footer-accent)] hover:text-white"
          >
            <Mail className="h-5 w-5" />
          </a>
        </div>

        <div className="inline-flex shrink-0 flex-row items-center gap-2">
          <span className="text-[11px] whitespace-nowrap text-[#0f172a]/70">{copy.footer.studioSignupQuestion}</span>
          <Link
            href="/register"
            className="rounded-md border border-[var(--footer-accent)]/25 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-[var(--footer-accent)] transition-colors hover:bg-[var(--footer-accent)]/10"
          >
            {copy.footer.studioSignupButton}
          </Link>
        </div>
      </div>
    </footer>
  )
}
