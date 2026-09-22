import Image from 'next/image'
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
 * Hollow, glowing letterforms in the studio's own accent colour — a
 * transparent fill with a coloured outline and a soft layered glow, instead
 * of a solid-coloured fill. Works on any background (photo or solid block):
 * the glow itself is what reads, not a colour contrast against what's behind
 * it. `strokeWidth` scales with the text size (thicker for a big title,
 * thinner for the small studio-name line) so the outline stays proportionate.
 */
function glowTextStyle(strokeWidth: string, fontFamily: string | null): React.CSSProperties {
  return {
    color: 'transparent',
    WebkitTextStroke: `${strokeWidth} var(--client-accent)`,
    textShadow:
      '0 0 6px var(--client-accent), 0 0 16px var(--client-accent), 0 0 34px var(--client-accent)',
    ...(fontFamily ? { fontFamily } : {}),
  }
}

function CenteredHero({
  title,
  studioName,
  logoUrl,
  coverUrl,
  fontFamily,
}: Omit<ClientGalleryHeroProps, 'heroStyle' | 'headingFont'> & { fontFamily: string | null }) {
  const name = studioName ?? FALLBACK_STUDIO_NAME
  return (
    <header className={`relative isolate w-full overflow-hidden ${HERO_HEIGHT_CLASS}`}>
      <HeroBackdrop
        coverUrl={coverUrl}
        gradient="bg-gradient-to-b from-black/5 via-transparent to-black/25"
      />
      {logoUrl ? (
        <div className="absolute inset-x-0 top-6 flex justify-center sm:top-8">
          <LogoChip logoUrl={logoUrl} size="sm" />
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 px-4 text-center sm:bottom-12">
        <h1
          className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
          style={glowTextStyle('1.5px', fontFamily)}
        >
          {title}
        </h1>
        <span aria-hidden className="h-[3px] w-9 rounded-full bg-[var(--client-accent)] opacity-80" />
        <p
          className="text-sm font-semibold tracking-wide sm:text-base"
          style={glowTextStyle('0.8px', fontFamily)}
        >
          {name}
        </p>
      </div>
    </header>
  )
}

function BottomRightHero({
  title,
  studioName,
  logoUrl,
  coverUrl,
  fontFamily,
}: Omit<ClientGalleryHeroProps, 'heroStyle' | 'headingFont'> & { fontFamily: string | null }) {
  const name = studioName ?? FALLBACK_STUDIO_NAME
  return (
    <header className={`relative isolate w-full overflow-hidden ${HERO_HEIGHT_CLASS}`}>
      <HeroBackdrop coverUrl={coverUrl} gradient="bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-end gap-2.5 px-5 text-end sm:bottom-10 sm:px-10">
        {logoUrl ? <LogoChip logoUrl={logoUrl} size="sm" /> : null}
        <p className="text-sm font-semibold" style={glowTextStyle('0.7px', fontFamily)}>
          {name}
        </p>
        <h1
          className="max-w-md text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl"
          style={glowTextStyle('1.3px', fontFamily)}
        >
          {title}
        </h1>
      </div>
    </header>
  )
}

function BelowPhotoHero({
  title,
  studioName,
  logoUrl,
  coverUrl,
  fontFamily,
}: Omit<ClientGalleryHeroProps, 'heroStyle' | 'headingFont'> & { fontFamily: string | null }) {
  const name = studioName ?? FALLBACK_STUDIO_NAME
  return (
    <header className="w-full">
      <div className={`relative w-full overflow-hidden ${coverUrl ? HERO_HEIGHT_CLASS : 'h-40 sm:h-52'}`}>
        <HeroBackdrop coverUrl={coverUrl} />
      </div>
      {/* This text always sits on the page's own background below the image
          block — never on the accent block itself (that's only the placeholder
          above, with or without a cover) — so the glow reads the same either way. */}
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:py-10">
        {logoUrl ? <LogoChip logoUrl={logoUrl} /> : null}
        <p className="text-sm font-semibold tracking-wide sm:text-base" style={glowTextStyle('0.8px', fontFamily)}>
          {name}
        </p>
        <h1
          className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl"
          style={glowTextStyle('1.4px', fontFamily)}
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
 * `--client-accent-fg` variables ClientGalleryView sets on its root; the title
 * and studio name are hollow, glowing text in that same colour (see
 * glowTextStyle) rather than a solid fill, so they read on any backdrop.
 */
export function ClientGalleryHero({ heroStyle, headingFont, ...props }: ClientGalleryHeroProps) {
  const fontFamily = headingFont ? toCssFontStack(headingFont) : null
  if (heroStyle === 'bottom_right') return <BottomRightHero {...props} fontFamily={fontFamily} />
  if (heroStyle === 'below_photo') return <BelowPhotoHero {...props} fontFamily={fontFamily} />
  return <CenteredHero {...props} fontFamily={fontFamily} />
}
