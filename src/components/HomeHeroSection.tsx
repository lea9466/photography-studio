import Image from 'next/image'
import Link from 'next/link'
import { tenantHashPath } from '@/lib/tenant-paths'
import { usesFullBleedHero, type ThemeStyle } from '@/lib/theme-styles'

type Props = {
  themeStyle: ThemeStyle
  photographerSlug: string
  displayName: string
  tagline: string
  aboutText: string
  heroPortrait: string
  heroTriptych: readonly [string, string, string]
  customHeroUrl: string | null
  customHeroUrlMobile: string | null
  totalClients: string
  marqueeItems: string[]
}

function HeroCopy({
  tagline,
  displayName,
  aboutText,
  photographerSlug,
  compact = false,
}: {
  tagline: string
  displayName: string
  aboutText: string
  photographerSlug: string
  compact?: boolean
}) {
  return (
    <>
      {tagline ? (
        <p
          className={`theme-label animate-float-up text-[11px] uppercase tracking-[0.5em] ${compact ? 'mb-6' : 'mb-8'}`}
        >
          {tagline}
        </p>
      ) : (
        <p
          className={`theme-label animate-float-up text-[11px] uppercase tracking-[0.5em] ${compact ? 'mb-6' : 'mb-8'}`}
        >
          Photography Studio
        </p>
      )}

      <h1
        className={`animate-float-up delay-1 font-display leading-[0.9] ${compact ? 'text-5xl md:text-7xl lg:text-8xl' : 'text-6xl md:text-8xl lg:text-[9rem]'}`}
      >
        {displayName.split(' ').length > 1 ? (
          <>
            {displayName.split(' ')[0]}
            <br />
            <span className="mt-3 block font-light italic opacity-80">
              {displayName.split(' ').slice(1).join(' ')}
            </span>
          </>
        ) : (
          <>
            {displayName}
            <span className="relative mt-2 inline-block">
              <span className="theme-underline absolute -bottom-3 right-0 h-[6px] w-28 rounded-full" />
            </span>
          </>
        )}
      </h1>

      {aboutText ? (
        <p
          className={`animate-float-up delay-2 mt-10 max-w-md font-light leading-loose text-foreground/70 md:mt-12 ${compact ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`}
        >
          {aboutText.length > 180 ? `${aboutText.slice(0, 180)}…` : aboutText}
        </p>
      ) : null}

      <div className="animate-float-up delay-3 mt-10 flex flex-wrap gap-5 md:mt-12">
        <Link
          href={tenantHashPath(photographerSlug, '#contact')}
          className="theme-cta-primary theme-shaped bg-foreground px-10 py-4 text-xs uppercase tracking-[0.3em] text-background shadow-[0_30px_60px_-30px_oklch(0.3_0.05_40/0.4)] transition-all duration-500 hover:bg-foreground/85"
        >
          יצירת קשר
        </Link>
        <Link
          href={tenantHashPath(photographerSlug, '#galleries')}
          className="theme-cta-secondary theme-cta-pill border border-foreground/25 px-10 py-4 text-xs uppercase tracking-[0.3em] backdrop-blur-sm transition-all duration-500 hover:bg-foreground/10"
        >
          לצפייה ←
        </Link>
      </div>
    </>
  )
}

function FullBleedHeroCopy({
  tagline,
  displayName,
  aboutText,
  photographerSlug,
}: {
  tagline: string
  displayName: string
  aboutText: string
  photographerSlug: string
}) {
  const nameParts = displayName.split(' ')
  const firstName = nameParts[0] ?? displayName
  const restName = nameParts.slice(1).join(' ')

  return (
    <>
      <p className="animate-float-up mb-5 text-[10px] uppercase tracking-[0.5em] text-white/90">
        {tagline || 'Photography Studio'}
      </p>

      <h1 className="animate-float-up delay-1 font-display text-5xl leading-[0.95] text-white md:text-6xl lg:text-7xl">
        {firstName}
        {restName ? (
          <>
            <br />
            <span className="mt-2 block italic opacity-90">{restName}</span>
          </>
        ) : null}
      </h1>

      {aboutText ? (
        <p className="animate-float-up delay-2 mt-6 text-sm text-white/85 md:text-base">
          {aboutText.length > 160 ? `${aboutText.slice(0, 160)}…` : aboutText}
        </p>
      ) : null}

      <div className="animate-float-up delay-3 mt-8 flex flex-wrap gap-4">
        <Link
          href={tenantHashPath(photographerSlug, '#galleries')}
          className="theme-cta-primary bg-white px-8 py-3.5 text-xs uppercase tracking-[0.3em] text-black transition-all duration-500 hover:bg-white/90"
        >
          לצפייה ←
        </Link>
        <Link
          href={tenantHashPath(photographerSlug, '#contact')}
          className="theme-cta-secondary border border-white/40 px-8 py-3.5 text-xs uppercase tracking-[0.3em] text-white transition-all duration-500 hover:bg-white/10"
        >
          יצירת קשר
        </Link>
      </div>
    </>
  )
}

function HeroMarquee({ marqueeItems }: { marqueeItems: string[] }) {
  return (
    <div className="relative mt-24 overflow-hidden border-y border-border/50 bg-background/40 py-6 backdrop-blur-sm">
      <div className="animate-marquee flex gap-16 whitespace-nowrap font-display text-2xl text-foreground/70 md:text-3xl">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="flex items-center gap-16">
            {marqueeItems.map((item, j) => (
              <span key={`${i}-${j}`} className="flex items-center gap-16">
                <span className={j % 2 === 0 ? 'italic' : ''}>{item}</span>
                <span className="theme-label">✦</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

function FullBleedHero({
  heroTriptych,
  customHeroUrl,
  customHeroUrlMobile,
  totalClients,
  tagline,
  displayName,
  aboutText,
  photographerSlug,
  marqueeItems,
}: Props) {
  const useTriptychDesktop = !customHeroUrl
  const useTriptychMobile = !customHeroUrlMobile

  return (
    <>
      <section
        id="home"
        className="theme-hero-fullbleed relative h-screen w-full overflow-hidden"
      >
        <div className="theme-hero-fullbleed-media">
          {useTriptychDesktop ? (
            <div className="hidden h-full w-full grid-cols-3 md:grid">
              {heroTriptych.map((src, index) => (
                <div key={src} className="relative h-full overflow-hidden">
                  <Image
                    src={src}
                    alt=""
                    fill
                    priority={index === 0}
                    className="object-cover object-center"
                    sizes="33vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <Image
              src={customHeroUrl}
              alt=""
              fill
              priority
              className="theme-hero-fullbleed-desktop-img hidden object-cover object-center md:block"
              sizes="100vw"
            />
          )}

          {useTriptychMobile ? (
            <div className="grid h-full w-full grid-cols-1 md:hidden">
              {heroTriptych.map((src, index) => (
                <div
                  key={`mobile-${src}`}
                  className="relative min-h-[34vh] overflow-hidden"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    priority={index === 0}
                    className="object-cover object-center"
                    sizes="100vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <Image
              src={customHeroUrlMobile}
              alt=""
              fill
              priority
              className="object-cover object-center md:hidden"
              sizes="100vw"
            />
          )}
        </div>

        <div className="theme-hero-fullbleed-overlay" aria-hidden />

        <div className="absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 md:flex lg:left-10">
          <span className="hero-vertical-text text-[11px] uppercase tracking-[0.55em] text-white/75">
            Memories captured in light
          </span>
        </div>

        <div className="absolute bottom-10 right-4 z-10 w-[calc(100%-2rem)] max-w-md md:bottom-16 md:right-16 lg:right-24">
          <div className="theme-hero-fullbleed-panel animate-float-up relative border border-white/20 bg-white/5 px-8 py-9 backdrop-blur-[3px] delay-2 md:px-10 md:py-11">
            <FullBleedHeroCopy
              tagline={tagline}
              displayName={displayName}
              aboutText={aboutText}
              photographerSlug={photographerSlug}
            />
            {totalClients !== '0' ? (
              <div className="animate-float-up delay-4 mt-10 inline-flex items-center gap-6 border-t border-white/20 pt-8">
                <div className="font-display text-4xl text-white">{totalClients}+</div>
                <div className="text-[10px] uppercase leading-relaxed tracking-[0.3em] text-white/70">
                  לקוחות מרוצים
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <HeroMarquee marqueeItems={marqueeItems} />
    </>
  )
}

function PortraitHero({
  heroPortrait,
  heroImageMobile,
  totalClients,
  tagline,
  displayName,
  aboutText,
  photographerSlug,
  marqueeItems,
}: Props & { heroImageMobile: string }) {
  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden pt-28 pb-20 md:pt-36"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImageMobile})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-12 lg:gap-16">
        <div className="relative order-2 lg:order-1 lg:col-span-6">
          <HeroCopy
            tagline={tagline}
            displayName={displayName}
            aboutText={aboutText}
            photographerSlug={photographerSlug}
          />
        </div>

        <div className="theme-hero-img theme-shaped relative order-1 animate-float-up delay-2 lg:order-2 lg:col-span-6">
          <div className="group relative block aspect-[4/5] w-full overflow-hidden shadow-[0_50px_120px_-40px_oklch(0.3_0.05_40/0.35)]">
            <Image
              src={heroPortrait}
              alt={displayName}
              fill
              priority
              className="scale-105 object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div
              className="absolute -bottom-12 -right-12 -z-10 h-56 w-56 rounded-full blur-2xl"
              style={{
                background: 'color-mix(in oklab, var(--color-rose) 50%, transparent)',
              }}
              aria-hidden
            />
          </div>

          {totalClients !== '0' ? (
            <div className="absolute -bottom-8 -left-4 hidden animate-float-up border border-border/60 bg-background px-8 py-7 shadow-[0_30px_60px_-30px_oklch(0.3_0.05_40/0.35)] delay-4 sm:block md:-left-10">
              <div className="font-display text-4xl text-foreground">+{totalClients}</div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                לקוחות מרוצים
              </div>
            </div>
          ) : null}

          <div className="absolute -right-10 top-1/2 hidden origin-center -rotate-90 xl:block">
            <span className="text-[10px] uppercase tracking-[0.8em] text-muted-foreground/60">
              MEMORIES CAPTURED IN LIGHT
            </span>
          </div>
        </div>
      </div>

      <HeroMarquee marqueeItems={marqueeItems} />
    </section>
  )
}

export default function HomeHeroSection(props: Props & { heroImageMobile: string }) {
  if (usesFullBleedHero(props.themeStyle)) {
    return <FullBleedHero {...props} />
  }

  return <PortraitHero {...props} />
}
