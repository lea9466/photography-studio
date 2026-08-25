'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { homepageSectionHref } from '@/lib/photographer-site-paths'
import { getBrandingPreviewUrl } from '@/lib/branding-preview-url'
import { getSiteChromeCopy, portfolioNavLabel, type SiteLanguage } from '@/lib/site-language'

// Mirrors gallerySectionId('elegant') in lib/photographer-site-chrome.ts — not
// exported from there, and this header currently only covers the elegant theme.
const ELEGANT_GALLERY_SECTION_ID = 'gallery'

export type ElegantSiteHeaderProps = {
  studioName: string
  logoUrl: string | null
  shouldColorLogo: boolean
  primaryColor: string
  /** Brand-selected fonts — not rendered by this component; carried here so
   * ElegantPageChrome (the only thing that reads headerProps besides
   * <ElegantSiteHeader> itself) can load the right Google Font and set
   * --headline-font/--about-title-font without a separate prop threaded
   * through every page shell. See lib/fonts.ts. */
  headingFont: string | null
  aboutTitleFont: string | null
  homepagePath: string
  hasFaq: boolean
  hasPackages: boolean
  hasBlog: boolean
  blogPath?: string | null
  hasPhotoEditComparisons: boolean
  beforeAfterPath?: string | null
  galleryLayoutMode: 'separated' | 'portfolio'
  portfolioPath?: string | null
  language: SiteLanguage
}

/**
 * Elegant's logo — same masking approach as ClassicLogo/DarkLogo, but no
 * forced color inversion for the non-colorable case: unlike dark's
 * `:not(.brand-logo-colorable) { filter: brightness(0) invert(1) }` rule
 * (dark's nav bg is always dark, so a plain logo always needs to be forced
 * white), elegant's `logoBlock()` in lib/photographer-site-chrome.ts never
 * applies any such filter — a plain (uncolored) logo just renders in its own
 * natural colors, same as classic.
 */
function ElegantLogo({
  logoUrl,
  studioName,
  shouldColorLogo,
  primaryColor,
}: {
  logoUrl: string | null
  studioName: string
  shouldColorLogo: boolean
  primaryColor: string
}) {
  const isSvg = logoUrl ? logoUrl.toLowerCase().includes('.svg') || logoUrl.includes('image/svg+xml') : false
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)

  const maskUrl =
    logoUrl && shouldColorLogo && isSvg ? (getBrandingPreviewUrl(logoUrl) ?? logoUrl) : null

  useEffect(() => {
    if (!maskUrl) {
      setNaturalSize(null)
      return
    }
    let cancelled = false
    const probe = new window.Image()
    probe.onload = () => {
      if (!cancelled) setNaturalSize({ width: probe.naturalWidth || 1, height: probe.naturalHeight || 1 })
    }
    probe.src = maskUrl
    return () => {
      cancelled = true
    }
  }, [maskUrl])

  if (!logoUrl) {
    // Matches generateSiteNav's elegant branch's text fallback:
    // `font-display text-xl uppercase tracking-[0.2em] font-medium text-on-surface`.
    return (
      <span
        className="font-display text-xl font-medium tracking-[0.2em] text-[#1c1b1b] uppercase"
        style={{ fontFamily: 'var(--headline-font, "Playfair Display", serif)' }}
      >
        {studioName}
      </span>
    )
  }

  if (maskUrl) {
    return (
      <span
        role="img"
        aria-label={studioName}
        className="inline-block h-10"
        style={{
          aspectRatio: naturalSize ? `${naturalSize.width} / ${naturalSize.height}` : undefined,
          width: naturalSize ? undefined : 120,
          backgroundColor: primaryColor,
          WebkitMaskImage: `url(${maskUrl})`,
          maskImage: `url(${maskUrl})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={logoUrl} alt={studioName} className="h-10 w-auto object-contain" />
}

/**
 * Elegant theme's persistent site header — 1:1 port of `generateSiteNav`'s
 * `case 'elegant':` branch (lib/photographer-site-chrome.ts, ~line 255) plus
 * its scroll behavior (`generateSiteNavScrollScript`'s elegant branch,
 * ~line 523).
 *
 * Unlike ClassicSiteHeader, elegant's nav text color never switches between a
 * transparent-at-top "white" mode and a scrolled "dark" mode — the source
 * only ever uses `text-on-surface-variant`/`text-on-surface` (dark, muted
 * tones), on every page, regardless of route or scroll position. Only the
 * nav's background/blur/shadow toggle on scroll (`nav-scrolled` +
 * `bg-white/80 backdrop-blur-lg shadow-sm`), always starting fully
 * transparent — there's no per-page `transparentAtTop` branch in the source
 * (unlike classic/dark, `navInitialClasses`'s switch has no `case 'elegant'`,
 * so it always falls to the `bg-transparent` default). So this header has no
 * `transparentAtTop`/`isBlogPostPage` logic at all — same behavior on every
 * route.
 *
 * Vertical padding is split across two elements in the source, and both
 * layers have to be reproduced or the header renders too short: the `<nav>`
 * itself only ever carries 'py-md'/'py-4' (both 16px — spacing.md === "16px"
 * in elegant's Tailwind config, lib/homepage-themes/elegant.ts), toggled to
 * `padding: 0 !important` below the 768px breakpoint by
 * `generateSiteNavMobileStyles()`; the REST of the padding always lives on
 * the nested `.site-nav-inner` div, which carries its own unconditional
 * 16px top/bottom (`py-md` on desktop, an explicit `1rem` override on
 * mobile — same value either way). So total vertical padding is 32px on
 * desktop (16 nav + 16 inner, same in both scrolled/unscrolled states) but
 * only 16px on mobile (0 nav + 16 inner) — hence `py-0 md:py-4` on the
 * `<nav>` plus an unconditional `py-4` on the inner flex row below.
 */
export function ElegantSiteHeader(props: ElegantSiteHeaderProps) {
  const {
    studioName,
    logoUrl,
    shouldColorLogo,
    primaryColor,
    homepagePath,
    hasFaq,
    hasPackages,
    hasBlog,
    blogPath,
    hasPhotoEditComparisons,
    beforeAfterPath,
    galleryLayoutMode,
    portfolioPath,
    language,
  } = props

  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const copy = getSiteChromeCopy(language)
  const useHrefForGallery = galleryLayoutMode === 'portfolio' && Boolean(portfolioPath)

  const items: { key: string; label: string; href: string }[] = [
    { key: 'home', label: copy.nav.home, href: homepagePath },
    {
      key: 'gallery',
      label: portfolioNavLabel(language, galleryLayoutMode),
      href: useHrefForGallery
        ? (portfolioPath as string)
        : homepageSectionHref(homepagePath, ELEGANT_GALLERY_SECTION_ID),
    },
  ]
  if (hasPackages) {
    items.push({ key: 'pricing', label: copy.nav.pricing, href: homepageSectionHref(homepagePath, 'pricing') })
  }
  if (hasFaq) {
    items.push({ key: 'faq', label: copy.nav.faq, href: homepageSectionHref(homepagePath, 'faq') })
  }
  if (hasBlog && blogPath) {
    items.push({ key: 'blog', label: copy.nav.blog, href: blogPath })
  }
  if (hasPhotoEditComparisons && beforeAfterPath) {
    items.push({ key: 'beforeAfter', label: copy.nav.beforeAfter, href: beforeAfterPath })
  }
  items.push({ key: 'contact', label: copy.nav.contact, href: homepageSectionHref(homepagePath, 'contact') })

  return (
    <>
      <nav
        className={`fixed top-0 z-50 w-full py-0 transition-all duration-500 md:py-4 ${
          scrolled
            ? 'border-b border-black/5 bg-white/80 shadow-sm backdrop-blur-lg'
            : 'border-none bg-transparent'
        }`}
        style={{ '--nav-accent': primaryColor } as React.CSSProperties}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between px-6 py-4 rtl:flex-row-reverse">
          <Link href={homepagePath} className="flex items-center gap-2">
            <ElegantLogo
              logoUrl={logoUrl}
              studioName={studioName}
              shouldColorLogo={shouldColorLogo}
              primaryColor={primaryColor}
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="p-2 text-[#1c1b1b] transition-colors hover:text-[var(--nav-accent)] md:hidden"
            aria-label="תפריט"
          >
            {mobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
          <div className="hidden flex-row items-center gap-8 md:flex">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="text-sm tracking-widest text-[#464742] uppercase transition-colors hover:text-[var(--nav-accent)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      {mobileOpen ? (
        <div className="fixed top-16 right-0 left-0 z-40 border-b border-[#0F0F0D]/10 bg-white/95 backdrop-blur-sm md:hidden">
          <div className="flex flex-col gap-4 px-6 py-4">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-lg tracking-widest text-[#1c1b1b] uppercase transition-colors hover:text-[var(--nav-accent)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
