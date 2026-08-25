'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { homepageSectionHref } from '@/lib/photographer-site-paths'
import { getBrandingPreviewUrl } from '@/lib/branding-preview-url'
import { getSiteChromeCopy, portfolioNavLabel, type SiteLanguage } from '@/lib/site-language'

// Mirrors gallerySectionId('modern') in lib/photographer-site-chrome.ts — not
// exported from there. Modern's gallery section renders with id="portfolio"
// (see ModernGalleriesSection.tsx), unlike classic's id="galleries" — this
// header currently only covers the modern theme, same "Phase 1/2" caveat
// ClassicSiteHeader.tsx documents.
const MODERN_GALLERY_SECTION_ID = 'portfolio'

export type ModernSiteHeaderProps = {
  studioName: string
  logoUrl: string | null
  shouldColorLogo: boolean
  primaryColor: string
  /** Brand-selected fonts — not rendered by this component; carried here so
   * ModernPageChrome (the only thing that reads headerProps besides
   * <ModernSiteHeader> itself) can load the right Google Font and set
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

function ModernLogo({
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
  // Same SVG-only coloring rule/approach as ClassicLogo (ClassicSiteHeader.tsx)
  // — masking only makes sense for SVG logos, and the mask must point at a
  // same-origin proxy URL or the browser silently drops it (CORS-tainted mask
  // pixels), never a console error. See that component's doc comment for the
  // full rationale; kept identical here rather than shared, since the two
  // headers are still fully independent components per-theme.
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
    return <span className="text-lg font-bold tracking-tight">{studioName}</span>
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
 * Modern-theme persistent site header — same overall mechanics as
 * ClassicSiteHeader.tsx (transparent-over-hero → solid-on-scroll nav,
 * `usePathname`-derived transparency instead of a prop since this component
 * stays mounted across client-side navigation, mobile-menu/scroll state reset
 * on route change), with modern's own palette: nav links render in the
 * accent color once solid (not just on hover — mirrors
 * `.modern-nav.nav-scrolled .modern-nav-link { color: primaryColor }` in
 * lib/photographer-site-chrome.ts) instead of classic's gray→accent-on-hover.
 */
export function ModernSiteHeader(props: ModernSiteHeaderProps) {
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
  const isBlogPostPage = Boolean(blogPath) && pathname?.startsWith(`${blogPath}/`) && pathname !== `${blogPath}/`
  const transparentAtTop = pathname === homepagePath || isBlogPostPage

  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(!transparentAtTop)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!transparentAtTop) {
      setScrolled(true)
      return
    }
    function onScroll() {
      setScrolled(window.scrollY > 40)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparentAtTop])

  const copy = getSiteChromeCopy(language)
  const useHrefForGallery = galleryLayoutMode === 'portfolio' && Boolean(portfolioPath)

  const items: { key: string; label: string; href: string }[] = [
    { key: 'home', label: copy.nav.home, href: homepagePath },
    {
      key: 'gallery',
      label: portfolioNavLabel(language, galleryLayoutMode),
      href: useHrefForGallery
        ? (portfolioPath as string)
        : homepageSectionHref(homepagePath, MODERN_GALLERY_SECTION_ID),
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

  const isSolid = !transparentAtTop || scrolled
  const brandColorClass = isSolid ? 'text-[#0f172a]' : 'text-white'
  const linkColorClass = isSolid
    ? 'text-[var(--nav-accent)] hover:opacity-80'
    : 'text-white hover:text-white/75'

  return (
    <>
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-700 ${
          // Bumped taller (py-3/py-4 -> py-6/py-10) per Lea's reference
          // screenshots of the real production header (2026-08-24) — the
          // source's own literal py-sm/py-md values only produce a ~72-80px
          // header (logo h-10=40px + padding), well short of what her
          // screenshots show, so this is a deliberate size increase beyond
          // source rather than a restored "real" value.
          isSolid
            ? 'border-b border-black/5 bg-[#F8FAFC]/90 py-6 shadow-sm backdrop-blur-md'
            : 'border-none bg-transparent py-10'
        }`}
        style={{ '--nav-accent': primaryColor } as React.CSSProperties}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between px-6 rtl:flex-row-reverse">
          <Link href={homepagePath} className={`flex items-center gap-2 ${brandColorClass}`}>
            <ModernLogo
              logoUrl={logoUrl}
              studioName={studioName}
              shouldColorLogo={shouldColorLogo}
              primaryColor={primaryColor}
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`p-2 transition-colors md:hidden ${brandColorClass}`}
            aria-label="תפריט"
          >
            {mobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
          <div className="hidden flex-row items-center gap-8 md:flex">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-sm font-medium tracking-wide transition-colors ${linkColorClass}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      {mobileOpen ? (
        <div className="fixed top-16 right-0 left-0 z-40 border-b border-black/5 bg-[#F8FAFC]/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-4 px-6 py-4">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-lg font-medium text-[#0f172a] transition-colors hover:text-[var(--nav-accent)]"
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
