import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { FALLBACK_STUDIO_NAME } from '@/lib/branding/studio-name-fallback'
import type { ClientPageHeroStyle } from '@/lib/branding/client-page-hero-style'
import { toCssFontStack } from '@/lib/fonts'

type ClientGalleryHeroProps = {
  title: string
  studioName: string | null
  /** The studio's logo, already resolved to a URL. */
  logoUrl: string | null
  /** The gallery's standalone cover, already resolved to a URL. */
  coverUrl: string | null
  /** The studio's chosen hero layout — see lib/branding/client-page-hero-style.ts. */
  heroStyle: ClientPageHeroStyle
  /** Whitelisted font name (her public-site heading font), or null for the page default. */
  headingFont: string | null
  /** A small "visit my site" badge — opt-in, null unless she turned it on and has a public site. */
  siteLink: { studioName: string; url: string } | null
}

/**
 * Small opt-in badge, top-left of the cover photo, linking out to the
 * studio's own public site. White chip (legible on any photo or the accent
 * fallback block) with the arrow pulsing gently to draw the eye without being
 * obnoxious. Must sit inside a `relative`-positioned ancestor sized to the
 * photo area — each hero layout places it accordingly.
 */
function SiteLinkBadge({ siteLink }: { siteLink: { studioName: string; url: string } }) {
  return (
    <a
      href={siteLink.url}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-accent shadow-sm transition hover:bg-white sm:left-6 sm:top-6"
    >
      <ArrowUpRight className="h-3.5 w-3.5 animate-pulse-soft" aria-hidden />
      {siteLink.studioName}
    </a>
  )
}

/** A logo chip that reads on both a photo and the solid accent fallback block. */
function LogoChip({ logoUrl, size = 'md' }: { logoUrl: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl bg-white/95 shadow-sm ${
        size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2'
      }`}
    >
      <Image
        src={logoUrl}
        alt=""
        width={240}
        height={96}
        className={`w-auto max-w-[160px] object-contain ${size === 'sm' ? 'h-8' : 'h-12 sm:h-14'}`}
      />
    </span>
  )
}

/** Full-bleed cover photo (or the accent-coloured fallback block) behind everything else. */
function HeroBackdrop({
  coverUrl,
  gradient,
}: {
  coverUrl: string | null
  /** Tailwind gradient classes drawn over the photo for text legibility — omitted when there's no photo. */
  gradient?: string
}) {
  if (!coverUrl) {
    return <div aria-hidden className="absolute inset-0 bg-accent" />
  }
  return (
    <>
      <Image src={coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
      {gradient ? <div aria-hidden className={`absolute inset-0 ${gradient}`} /> : null}
    </>
  )
}

const HERO_HEIGHT_CLASS = 'h-[78vh] max-h-[760px] min-h-[420px]'

/**
 * Tried a hollow/glowing (transparent fill + coloured outline + shadow) text
 * treatment here — illegible on a busy or light photo (the outline has no
 * solid body to read against), reverted. Solid fill + a plain drop-shadow for
 * legibility on a photo is the tried-and-tested approach; only the font
 * changes with `fontFamily`.
 */
function heroTextStyle(fontFamily: string | null): React.CSSProperties {
  return fontFamily ? { fontFamily } : {}
}

type HeroBodyProps = Omit<ClientGalleryHeroProps, 'heroStyle' | 'headingFont'> & {
  fontFamily: string | null
}

function CenteredHero({ title, studioName, logoUrl, coverUrl, fontFamily, siteLink }: HeroBodyProps) {
  const name = studioName ?? FALLBACK_STUDIO_NAME
  return (
    <header className={`relative isolate w-full overflow-hidden ${HERO_HEIGHT_CLASS}`}>
      <HeroBackdrop
        coverUrl={coverUrl}
        gradient="bg-gradient-to-b from-black/5 via-transparent to-black/25"
      />
      {siteLink ? <SiteLinkBadge siteLink={siteLink} /> : null}
      <div
        className={`absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 px-4 text-center sm:bottom-12 ${
          coverUrl ? 'text-white' : 'text-accent-fg'
        }`}
      >
        {logoUrl ? <LogoChip logoUrl={logoUrl} size="sm" /> : null}
        <h1
          className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl"
          style={heroTextStyle(fontFamily)}
        >
          {title}
        </h1>
        <span aria-hidden className="h-[3px] w-9 rounded-full bg-[var(--client-accent)] opacity-80" />
        <p className="text-sm font-medium tracking-wide opacity-90 sm:text-base" style={heroTextStyle(fontFamily)}>
          {name}
        </p>
      </div>
    </header>
  )
}

function BottomRightHero({ title, studioName, logoUrl, coverUrl, fontFamily, siteLink }: HeroBodyProps) {
  const name = studioName ?? FALLBACK_STUDIO_NAME
  return (
    <header className={`relative isolate w-full overflow-hidden ${HERO_HEIGHT_CLASS}`}>
      <HeroBackdrop coverUrl={coverUrl} gradient="bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
      {siteLink ? <SiteLinkBadge siteLink={siteLink} /> : null}
      <div
        className={`absolute inset-x-0 bottom-8 flex flex-col items-end gap-2.5 px-5 text-end sm:bottom-10 sm:px-10 ${
          coverUrl ? 'text-white' : 'text-accent-fg'
        }`}
      >
        {logoUrl ? <LogoChip logoUrl={logoUrl} size="sm" /> : null}
        <p className="text-sm font-medium opacity-85" style={heroTextStyle(fontFamily)}>
          {name}
        </p>
        <h1
          className="max-w-md text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl"
          style={heroTextStyle(fontFamily)}
        >
          {title}
        </h1>
      </div>
    </header>
  )
}

function BelowPhotoHero({ title, studioName, logoUrl, coverUrl, fontFamily, siteLink }: HeroBodyProps) {
  const name = studioName ?? FALLBACK_STUDIO_NAME
  return (
    <header className="w-full">
      <div className={`relative w-full overflow-hidden ${coverUrl ? HERO_HEIGHT_CLASS : 'h-40 sm:h-52'}`}>
        <HeroBackdrop coverUrl={coverUrl} />
        {siteLink ? <SiteLinkBadge siteLink={siteLink} /> : null}
      </div>
      {/* This text always sits on the page's own background below the image
          block — never on the accent block itself (that's only the placeholder
          above, with or without a cover) — so it always needs text-foreground. */}
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center text-foreground sm:py-10">
        {logoUrl ? <LogoChip logoUrl={logoUrl} /> : null}
        <p className="text-sm font-medium tracking-wide opacity-90 sm:text-base" style={heroTextStyle(fontFamily)}>
          {name}
        </p>
        <h1
          className="text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl"
          style={heroTextStyle(fontFamily)}
        >
          {title}
        </h1>
      </div>
    </header>
  )
}

/**
 * Top of the client-facing gallery page — one of three studio-wide layouts (see
 * lib/branding/client-page-hero-style.ts). Each falls back to a solid block in
 * the studio's accent colour when the gallery has no cover, so every gallery
 * looks branded even without one. The accent comes from the `--client-accent` /
 * `--client-accent-fg` variables ClientGalleryView sets on its root, so text
 * always reads on the fallback block; the title and studio name also pick up
 * the studio's own heading font (headingFont) when she has one set.
 */
export function ClientGalleryHero({ heroStyle, headingFont, ...props }: ClientGalleryHeroProps) {
  const fontFamily = headingFont ? toCssFontStack(headingFont) : null
  if (heroStyle === 'bottom_right') return <BottomRightHero {...props} fontFamily={fontFamily} />
  if (heroStyle === 'below_photo') return <BelowPhotoHero {...props} fontFamily={fontFamily} />
  return <CenteredHero {...props} fontFamily={fontFamily} />
}
