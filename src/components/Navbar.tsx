'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import HeaderCodeLogin from '@/components/HeaderCodeLogin'
import SiteLogo from '@/components/SiteLogo'
import { tenantHashPath, tenantPath } from '@/lib/tenant-paths'
import { usesFullBleedHero, type ThemeStyle } from '@/lib/theme-styles'

const HEADER_REVEAL_DISTANCE = 140

function isNavLinkActive(pathname: string, href: string, currentHash: string): boolean {
  const hashIndex = href.indexOf('#')
  if (hashIndex !== -1) {
    const path = href.slice(0, hashIndex) || '/'
    const linkHash = href.slice(hashIndex) || '#home'
    return pathname === path && currentHash === linkHash
  }
  return pathname === href
}

function buildLinks(slug: string) {
  return [
    { href: tenantHashPath(slug, '#galleries'), label: 'גלריות' },
    { href: tenantHashPath(slug, '#pricing'), label: 'מחירון' },
    { href: tenantHashPath(slug, '#about'), label: 'אודות' },
    { href: tenantHashPath(slug, '#contact'), label: 'יצירת קשר' },
  ]
}

function NavLink({
  href,
  label,
  onClick,
  className = '',
}: {
  href: string
  label: string
  onClick?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const [currentHash, setCurrentHash] = useState('')

  useEffect(() => {
    const sync = () => setCurrentHash(window.location.hash || '#home')
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [pathname])

  const isActive = isNavLinkActive(pathname, href, currentHash)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative text-sm tracking-wide transition-colors after:absolute after:-bottom-1 after:right-0 after:h-px after:bg-accent after:transition-all after:duration-500 hover:text-foreground ${
        className.includes('nav-link-light')
          ? 'text-white/85 hover:text-white after:bg-white/85'
          : 'hover:text-foreground'
      } ${
        isActive
          ? className.includes('nav-link-light')
            ? 'text-white after:w-full'
            : 'text-foreground after:w-full'
          : className.includes('nav-link-light')
            ? 'after:w-0 hover:after:w-full'
            : 'text-foreground/80 after:w-0 hover:after:w-full'
      } ${className}`}
    >
      {label}
    </Link>
  )
}

export type NavbarViewer = 'admin' | 'client' | null

function AccountButton({
  viewer,
  photographerSlug,
  photographerId,
  onClick,
}: {
  viewer: NavbarViewer
  photographerSlug: string
  photographerId: string
  onClick?: () => void
}) {
  if (!viewer) {
    return (
      <HeaderCodeLogin
        photographerSlug={photographerSlug}
        photographerId={photographerId}
      />
    )
  }

  const href = viewer === 'admin' ? '/admin' : tenantPath(photographerSlug, '/client')
  const label = viewer === 'admin' ? 'ניהול' : 'אזור אישי'

  return (
    <Link
      href={href}
      onClick={onClick}
      className="theme-cta-pill rounded-full border border-foreground/30 px-5 py-2 text-sm transition-all duration-500 hover:bg-foreground hover:text-background"
    >
      {label}
    </Link>
  )
}

export default function Navbar({
  brandName,
  logoUrl,
  photographerSlug,
  photographerId,
  themeStyle,
  viewer = null,
}: {
  brandName: string
  logoUrl?: string | null
  photographerSlug: string
  photographerId: string
  themeStyle: ThemeStyle
  viewer?: NavbarViewer
}) {
  const pathname = usePathname()
  const homePath = tenantPath(photographerSlug)
  const isHomePage =
    pathname === homePath || pathname === `${homePath}/`
  const scrollRevealHeader = usesFullBleedHero(themeStyle) && isHomePage

  const links = useMemo(() => buildLinks(photographerSlug), [photographerSlug])
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeMenu])

  useEffect(() => {
    closeMenu()
  }, [pathname, closeMenu])

  const revealMode = scrollRevealHeader && !menuOpen
  const atTop = revealMode && scrollY < 1
  const scrolled = scrollY > 30
  const navOverHero = revealMode && atTop
  const revealMix = Math.min(
    92,
    Math.round((scrollY / HEADER_REVEAL_DISTANCE) * 92)
  )
  const revealBlur = scrollY < 1 ? 0 : Math.round((scrollY / HEADER_REVEAL_DISTANCE) * 20)

  const headerStyle = revealMode
    ? atTop
      ? {
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderBottom: 'none',
          boxShadow: 'none',
        }
      : {
          backgroundColor: `color-mix(in oklch, var(--bg-primary) ${revealMix}%, transparent)`,
          backdropFilter: revealBlur > 0 ? `blur(${revealBlur}px)` : 'none',
          WebkitBackdropFilter: revealBlur > 0 ? `blur(${revealBlur}px)` : 'none',
          borderBottomWidth: scrollY > 80 ? '1px' : '0',
          borderBottomStyle: 'solid' as const,
          borderBottomColor:
            scrollY > 80
              ? 'color-mix(in oklch, var(--color-border) 55%, transparent)'
              : 'transparent',
          boxShadow: 'none',
        }
    : undefined

  return (
    <>
      <header
        style={headerStyle}
        className={`fixed inset-x-0 top-0 z-50 transition-[padding,background-color,border-color] duration-500 ${
          navOverHero ? 'nav-over-hero' : ''
        } ${
          menuOpen
            ? 'border-b border-border/60 bg-background/90 py-3 backdrop-blur-xl'
            : revealMode
              ? atTop
                ? 'header-reveal-top py-6'
                : scrollY > 70
                  ? 'border-b border-border/60 bg-background/80 py-3 backdrop-blur-xl'
                  : 'py-6'
              : scrolled
                ? 'border-b border-border/60 bg-background/80 py-3 backdrop-blur-xl'
                : 'bg-transparent py-6'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-baseline gap-2">
            <SiteLogo
              src={logoUrl}
              alt={brandName}
              brandName={brandName}
              variant="header"
              href={tenantPath(photographerSlug)}
              className={`font-display text-xl tracking-wide transition-colors duration-500 ${
                navOverHero ? 'nav-brand-text text-white' : 'text-foreground'
              }`}
            />
            <span
              className={`hidden text-[10px] uppercase tracking-[0.35em] sm:inline ${
                navOverHero ? 'nav-brand-text text-white/80' : 'text-muted-foreground'
              }`}
            >
              · צילום
            </span>
          </div>

          <nav className="hidden items-center gap-9 md:flex">
            {links.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                className={navOverHero ? 'nav-link-light' : ''}
              />
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <AccountButton
              viewer={viewer}
              photographerSlug={photographerSlug}
              photographerId={photographerId}
            />
            <Link
              href={tenantHashPath(photographerSlug, '#contact')}
              className={`theme-cta-pill theme-cta-primary inline-flex items-center rounded-full border px-5 py-2 text-sm transition-all duration-500 hover:bg-foreground hover:text-background ${
                navOverHero
                  ? 'nav-cta-light border-white/45 text-white hover:border-white hover:bg-white hover:text-black'
                  : 'border-foreground/30'
              }`}
            >
              קביעת סשן
            </Link>
          </div>

          <button
            type="button"
            className={`relative z-[60] flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:border-foreground/40 md:hidden ${
              revealMode && atTop
                ? 'border-white/30 bg-transparent'
                : 'border-border/60 bg-background/80'
            }`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'סגירת תפריט' : 'פתיחת תפריט'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'סגור' : 'תפריט'}</span>
            <span className="relative block h-4 w-5">
              <span
                className={`absolute right-0 block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ease-in-out ${
                  menuOpen ? 'top-2 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute right-0 top-1.5 block h-0.5 w-5 rounded-full bg-foreground/60 transition-all duration-300 ease-in-out ${
                  menuOpen ? 'scale-0 opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute right-0 block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ease-in-out ${
                  menuOpen ? 'top-2 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 md:hidden ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-foreground/20 backdrop-blur-sm transition-opacity duration-500 ease-out ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="סגירת תפריט"
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />

        <div
          className={`absolute top-0 right-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-border/60 bg-background/98 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-1 flex-col px-8 pb-10 pt-24">
            <ul className="flex flex-col gap-7">
              {links.map(({ href, label }, i) => (
                <li
                  key={href}
                  className={`transition-all duration-500 ease-out ${
                    menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
                  }`}
                  style={{ transitionDelay: menuOpen ? `${80 + i * 50}ms` : '0ms' }}
                >
                  <NavLink
                    href={href}
                    label={label}
                    onClick={closeMenu}
                    className="text-lg"
                  />
                </li>
              ))}
            </ul>
            <div className="mt-auto space-y-6 pt-12">
              <div onClick={closeMenu}>
                <AccountButton
                  viewer={viewer}
                  photographerSlug={photographerSlug}
                  photographerId={photographerId}
                  onClick={closeMenu}
                />
              </div>
              <div className="flex justify-end">
                <SiteLogo
                  src={logoUrl}
                  alt={brandName}
                  brandName={brandName}
                  variant="inline"
                  className="opacity-80"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
