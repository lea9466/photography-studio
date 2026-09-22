import Image from 'next/image'
import { FALLBACK_STUDIO_NAME } from '@/lib/branding/studio-name-fallback'
import type { ClientPageHeroStyle } from '@/lib/branding/client-page-hero-style'

type ClientGalleryHeroProps = {
  title: string
  studioName: string | null
  /** The studio's logo, already resolved to a URL. */
  logoUrl: string | null
  /** The gallery's standalone cover, already resolved to a URL. */
  coverUrl: string | null
  /** The studio's chosen hero layout — see lib/branding/client-page-hero-style.ts. */
  heroStyle: ClientPageHeroStyle
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

const HERO_HEIGHT_CLASS = 'h-[56vh] max-h-[600px] min-h-[320px]'

function CenteredHero({ title, studioName, logoUrl, coverUrl }: Omit<ClientGalleryHeroProps, 'heroStyle'>) {
  const name = studioName ?? FALLBACK_STUDIO_NAME
  return (
    <header className={`relative isolate w-full overflow-hidden ${HERO_HEIGHT_CLASS}`}>
      <HeroBackdrop
        coverUrl={coverUrl}
        gradient="bg-gradient-to-b from-black/35 via-transparent to-black/55"
      />
      {logoUrl ? (
        <div className="absolute inset-x-0 top-6 flex justify-center sm:top-8">
          <LogoChip logoUrl={logoUrl} size="sm" />
        </div>
      ) : null}
      <div
        className={`absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 px-4 text-center sm:bottom-12 ${
          coverUrl ? 'text-white' : 'text-accent-fg'
        }`}
      >
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
        <span aria-hidden className="h-[3px] w-9 rounded-full bg-current opacity-80" />
        <p className="text-sm font-medium tracking-wide opacity-90 sm:text-base">{name}</p>
      </div>
    </header>
  )
}

function BottomRightHero({ title, studioName, logoUrl, coverUrl }: Omit<ClientGalleryHeroProps, 'heroStyle'>) {
  const name = studioName ?? FALLBACK_STUDIO_NAME
  return (
    <header className={`relative isolate w-full overflow-hidden ${HERO_HEIGHT_CLASS}`}>
      <HeroBackdrop coverUrl={coverUrl} gradient="bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div
        className={`absolute inset-x-0 bottom-8 flex flex-col items-end gap-2.5 px-5 text-end sm:bottom-10 sm:px-10 ${
          coverUrl ? 'text-white' : 'text-accent-fg'
        }`}
      >
        {logoUrl ? <LogoChip logoUrl={logoUrl} size="sm" /> : null}
        <p className="text-sm font-medium opacity-85">{name}</p>
        <h1 className="max-w-md text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">{title}</h1>
      </div>
    </header>
  )
}

function BelowPhotoHero({ title, studioName, logoUrl, coverUrl }: Omit<ClientGalleryHeroProps, 'heroStyle'>) {
  const name = studioName ?? FALLBACK_STUDIO_NAME
  return (
    <header className="w-full">
      <div className={`relative w-full overflow-hidden ${coverUrl ? HERO_HEIGHT_CLASS : 'h-40 sm:h-52'}`}>
        <HeroBackdrop
          coverUrl={coverUrl}
          gradient="bg-gradient-to-b from-black/15 via-transparent to-black/30"
        />
      </div>
      {/* Unlike the other two layouts, this text always sits on the page's own
          background below the image block — never on the accent block itself
          (that's only the placeholder above, with or without a cover) — so it
          always needs text-foreground, never text-accent-fg. */}
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center text-foreground sm:py-10">
        {logoUrl ? <LogoChip logoUrl={logoUrl} /> : null}
        <p className="text-sm font-medium tracking-wide opacity-90 sm:text-base">{name}</p>
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">{title}</h1>
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
 * always reads on the fallback block.
 */
export function ClientGalleryHero({ heroStyle, ...props }: ClientGalleryHeroProps) {
  if (heroStyle === 'bottom_right') return <BottomRightHero {...props} />
  if (heroStyle === 'below_photo') return <BelowPhotoHero {...props} />
  return <CenteredHero {...props} />
}
