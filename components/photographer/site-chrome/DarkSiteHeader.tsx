'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { homepageSectionHref } from '@/lib/photographer-site-paths'
import { getBrandingPreviewUrl } from '@/lib/branding-preview-url'
import { getSiteChromeCopy, portfolioNavLabel, type SiteLanguage } from '@/lib/site-language'
import { DarkBrandLastWord } from '../themes/dark/DarkBrandLastWord'

// Mirrors gallerySectionId('dark') in lib/photographer-site-chrome.ts — not
// exported from there, and this header currently only covers the dark theme.
const DARK_GALLERY_SECTION_ID = 'gallery'

export type DarkSiteHeaderProps = {
  studioName: string
  logoUrl: string | null
  shouldColorLogo: boolean
  primaryColor: string
  /** Brand-selected fonts — not rendered by this component; carried here so
   * DarkPageChrome (the only thing that reads headerProps besides
   * <DarkSiteHeader> itself) can load the right Google Font and set
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
 * Dark's logo — same masking approach as ClassicLogo, but the old renderer's
 * `.bold-nav .bold-nav-logo:not(.brand-logo-colorable) { filter:
 * brightness(0) invert(1) !important; }` inverts every non-colorable logo to
 * white ALWAYS (not just pre-scroll like classic) — the dark nav's
 * background is always dark, transparent or solid, so the logo never needs
 * to switch back to its natural colors.
 */
function DarkLogo({
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
    return (
      <span className="font-headline-sm text-headline-sm tracking-tighter text-[#F5F5F0]">
        <DarkBrandLastWord text={studioName} accentColor={primaryColor} />
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

  // Non-colorable logo: always inverted to white, matching the source's
  // `:not(.brand-logo-colorable)` rule (which never toggles off in dark).
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={logoUrl}
      alt={studioName}
      className="h-10 w-auto object-contain"
      style={{ filter: 'brightness(0) invert(1)' }}
    />
  )
}

export function DarkSiteHeader(props: DarkSiteHeaderProps) {
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
  // Unlike classic, dark's nav text stays white (#F5F5F0) at every scroll
  // position — only the background/blur/border toggle on scroll (see
  // `.bold-nav` rules in lib/homepage-themes/dark.ts: no
  // `:not(.nav-scrolled)` text-color override exists for dark). So there's
  // no transparentAtTop-vs-solid text-color branching to track here.
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40)
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
        : homepageSectionHref(homepagePath, DARK_GALLERY_SECTION_ID),
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
        className={`fixed top-0 z-50 w-full transition-all duration-700 ${
          // Bumped taller again (py-3/py-5 -> py-6/py-10) per Lea's reference
          // screenshots of the real production header (2026-08-24) — the
          // source's own literal py-sm/py-md values (12px/20px) only produce
          // a ~64-80px header (logo h-10=40px + padding), well short of what
          // her screenshots show, so this is a deliberate size increase
          // beyond source rather than a restored "real" value.
          scrolled
            ? 'border-b border-white/10 bg-[#121217]/90 py-6 shadow-sm backdrop-blur-md'
            : 'border-none bg-transparent py-10'
        }`}
        style={{ '--nav-accent': primaryColor } as React.CSSProperties}
      >
        {/* `px-8` (32px) matches `.site-nav-inner`'s `px-lg` (spacing.lg = 32px) —
            was `px-6` (24px). */}
        <div className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between px-8 rtl:flex-row-reverse">
          <Link href={homepagePath} className="flex items-center gap-2">
            <DarkLogo
              logoUrl={logoUrl}
              studioName={studioName}
              shouldColorLogo={shouldColorLogo}
              primaryColor={primaryColor}
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="p-2 text-[#F5F5F0] transition-colors md:hidden"
            aria-label="תפריט"
          >
            {mobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
          <div className="hidden flex-row items-center gap-8 md:flex">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="text-sm tracking-wide text-[#F5F5F0] transition-colors hover:text-[var(--nav-accent)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      {mobileOpen ? (
        <div className="fixed top-16 right-0 left-0 z-40 border-b border-white/10 bg-[#121217]/95 backdrop-blur-sm md:hidden">
          <div className="flex flex-col gap-4 px-6 py-4">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-lg text-[#F5F5F0] transition-colors hover:text-[var(--nav-accent)]"
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
