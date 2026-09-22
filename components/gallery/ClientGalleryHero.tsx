import Image from 'next/image'
import { FALLBACK_STUDIO_NAME } from '@/lib/branding/studio-name-fallback'

type ClientGalleryHeroProps = {
  title: string
  studioName: string | null
  /** The studio's logo, already resolved to a URL. */
  logoUrl: string | null
  /** The gallery's standalone cover, already resolved to a URL. */
  coverUrl: string | null
}

/**
 * Top of the client-facing gallery page. With a cover it is a large full-width
 * image under a dark gradient; without one it is a solid block in the studio's
 * accent colour, so a gallery with no cover still looks branded.
 *
 * The accent comes from the `--client-accent` / `--client-accent-fg` variables
 * that ClientGalleryView sets on its root, so the text always reads on the block.
 */
export function ClientGalleryHero({
  title,
  studioName,
  logoUrl,
  coverUrl,
}: ClientGalleryHeroProps) {
  const name = studioName ?? FALLBACK_STUDIO_NAME

  return (
    <header
      className={`relative isolate flex w-full justify-center overflow-hidden text-center ${
        coverUrl
          ? 'h-[56vh] max-h-[600px] min-h-[320px] items-end'
          : 'items-center bg-accent py-14 sm:py-20'
      }`}
    >
      {coverUrl ? (
        <>
          <Image src={coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10"
          />
        </>
      ) : null}

      <div
        className={`relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-4 ${
          coverUrl ? 'pb-10 text-white sm:pb-14' : 'text-accent-fg'
        }`}
      >
        {logoUrl ? (
          // A white chip keeps a logo of any colour legible on top of a photo or the accent block.
          <span className="rounded-2xl bg-white/95 px-4 py-2 shadow-sm">
            <Image
              src={logoUrl}
              alt=""
              width={240}
              height={96}
              className="h-12 w-auto max-w-[200px] object-contain sm:h-14"
            />
          </span>
        ) : null}
        <p className="text-sm font-medium tracking-wide opacity-90 sm:text-base">{name}</p>
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
      </div>
    </header>
  )
}
