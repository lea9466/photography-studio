'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { homepageSectionHref } from '@/lib/photographer-site-paths'
import { getBrandingPreviewUrl } from '@/lib/branding-preview-url'
import { getSiteChromeCopy, portfolioNavLabel, type SiteLanguage } from '@/lib/site-language'

// Mirrors gallerySectionId('classic') in lib/photographer-site-chrome.ts —
// not exported from there, and this header currently only covers the
// classic theme (see the Phase 1/2 header-unification plan).
const CLASSIC_GALLERY_SECTION_ID = 'galleries'

export type ClassicSiteHeaderProps = {
  studioName: string
  logoUrl: string | null
  shouldColorLogo: boolean
  primaryColor: string
  /** Brand-selected fonts — not rendered by this component; carried here so
   * ClassicPageChrome (the only thing that reads headerProps besides
   * <ClassicSiteHeader> itself) can load the right Google Font and set
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

function ClassicLogo({
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
  // Coloring only makes sense (and is only offered in settings) for SVG
  // logos — masking a PNG would silhouette it against its alpha channel
  // instead of showing it in its own colors. Mirrors the isSvg check in
  // generateLogoColoringScript.
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
    return <span className="text-lg font-medium tracking-tight">{studioName}</span>
  }

  if (maskUrl) {
    // CSS mask-image treats mask pixel access like canvas tainting — it
    // silently renders empty (no console error) unless the source is
    // same-origin/CORS-approved. logoUrl points at the R2/CDN origin, so
    // mask against the app's own branding-preview proxy instead of the raw
    // URL (mirrors generateLogoColoringScript's approach for the HTML-string
    // renderers). No intrinsic size to resolve h-10/w-auto against on a
    // masked <span>, so the aspect-ratio is set explicitly once the real
    // image dimensions are known — falls back to a plausible default width
    // for the one frame before that resolves.
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

export function ClassicSiteHeader(props: ClassicSiteHeaderProps) {
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

  // Pages with a hero image directly behind the nav (home, a single blog
  // post) start transparent with white text, then turn solid+dark once
  // scrolled. Pages with no hero (portfolio, blog list, before/after) start
  // solid+dark from the first frame — white text would be unreadable there.
  // Determined from the current route rather than passed in, so the header
  // stays a single persistent instance across client-side navigation
  // instead of every route needing to tell it which mode to render in.
  const pathname = usePathname()
  const isBlogPostPage = Boolean(blogPath) && pathname?.startsWith(`${blogPath}/`) && pathname !== `${blogPath}/`
  const transparentAtTop = pathname === homepagePath || isBlogPostPage

  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(!transparentAtTop)

  // The header persists across navigation now instead of remounting fresh
  // per page, so a menu left open has to be closed explicitly on route
  // change — otherwise it stays open (with a stale scroll-locked page
  // behind it) after a link inside it is clicked.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    // The header stays mounted across client-side navigation, so this must
    // actively reset `scrolled` on every route change — not just on first
    // mount (useState's initializer only ever runs once) — otherwise a
    // studio landing mid-scroll on a solid-nav page and then navigating to
    // the transparent-nav homepage would keep the previous page's nav
    // color until the next scroll event fires.
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
        : homepageSectionHref(homepagePath, CLASSIC_GALLERY_SECTION_ID),
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
  const textColorClass = isSolid ? 'text-[#2d2825]' : 'text-white'

  // Mirrors the real (desktop) vertical padding from lib/photographer-site-chrome.ts:
  // the nav's own py-md/py-sm (navInitialClasses/generateSiteNavScrollScript's
  // classic case) STACKS with the constant py-md on .site-nav-inner
  // (generateSiteNav's classic branch) — two nested elements, both padded —
  // so the real total is md+md=8 (py-8) unscrolled and sm+md=6 (py-6)
  // scrolled, converting spacing tokens per convention (xs/sm/md/lg/xl/xxl ->
  // 1/2/4/6/12/20). On mobile that inner padding is forced to a flat 1rem
  // (generateSiteNavMobileStyles' `.site-nav-inner { padding: 1rem }`, with
  // the nav's own py-md/py-sm zeroed by `!important`), hence the unscrolled
  // py-4/scrolled py-4 base before the md: breakpoint kicks in.
  return (
    <>
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-700 ${
          isSolid
            ? 'border-b border-black/5 bg-[#FAFAF8]/90 py-4 shadow-sm backdrop-blur-md md:py-6'
            : 'border-none bg-transparent py-4 md:py-8'
        }`}
        style={{ '--nav-accent': primaryColor } as React.CSSProperties}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between px-6 rtl:flex-row-reverse">
          <Link href={homepagePath} className="flex items-center gap-2">
            <ClassicLogo
              logoUrl={logoUrl}
              studioName={studioName}
              shouldColorLogo={shouldColorLogo}
              primaryColor={primaryColor}
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`p-2 transition-colors md:hidden ${textColorClass}`}
            aria-label="תפריט"
          >
            {mobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
          <div className="hidden flex-row items-center gap-8 md:flex">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-sm tracking-wide transition-colors hover:text-[var(--nav-accent)] ${textColorClass}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      {mobileOpen ? (
        <div className="fixed top-16 right-0 left-0 z-40 border-b border-black/5 bg-[#FAFAF8]/95 backdrop-blur-sm md:hidden">
          <div className="flex flex-col gap-4 px-6 py-4">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-lg text-[#1c1917] transition-colors hover:text-[var(--nav-accent)]"
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
