import Link from 'next/link'
import { getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'

export type ClassicSiteFooterProps = {
  studioName: string
  logoUrl: string | null
  primaryColor: string
  language: SiteLanguage
}

export function ClassicSiteFooter({ studioName, logoUrl, primaryColor, language }: ClassicSiteFooterProps) {
  const copy = getSiteChromeCopy(language)
  const year = new Date().getFullYear()
  const rightsLine = `© ${year} ${studioName}. ${copy.footer.rights}`

  return (
    <footer
      className="w-full border-t border-[#d1c6b4]/20 bg-[#FAF7F4] py-12 pb-20"
      style={{ '--footer-accent': primaryColor } as React.CSSProperties}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row rtl:md:flex-row-reverse">
        <div
          className="text-[36px] leading-[1.3] font-semibold tracking-tight text-[var(--footer-accent)]"
          style={{ fontFamily: 'var(--headline-font, "Frank Ruhl Libre", serif)' }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={studioName} className="h-10 w-auto object-contain" />
          ) : (
            studioName
          )}
        </div>
        <div className="flex flex-row flex-wrap justify-center gap-6 rtl:flex-row-reverse">
          <Link
            href="/terms"
            className="text-[16px] leading-[1.6] text-[#5a504a] transition-colors hover:text-[var(--footer-accent)]"
          >
            {copy.footer.terms}
          </Link>
          <Link
            href="/privacy"
            className="text-[16px] leading-[1.6] text-[#5a504a] transition-colors hover:text-[var(--footer-accent)]"
          >
            {copy.footer.privacy}
          </Link>
          <Link
            href="/accessibility"
            className="text-[16px] leading-[1.6] text-[#5a504a] transition-colors hover:text-[var(--footer-accent)]"
          >
            {copy.footer.accessibility}
          </Link>
        </div>
        <div className="text-[16px] leading-[1.6] text-[#2d2825]/60">{rightsLine}</div>
        <div className="inline-flex shrink-0 flex-row items-center gap-2">
          <span className="whitespace-nowrap text-[11px] text-[#5a504a]">{copy.footer.studioSignupQuestion}</span>
          <Link
            href="/register"
            className="rounded-sm border border-[var(--footer-accent)]/30 px-2 py-0.5 text-[11px] whitespace-nowrap text-[var(--footer-accent)] transition-colors hover:bg-[var(--footer-accent)]/5"
          >
            {copy.footer.studioSignupButton}
          </Link>
        </div>
      </div>
    </footer>
  )
}
