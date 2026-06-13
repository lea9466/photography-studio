import Image from 'next/image'
import {
  AboutHeadlineLine1,
  AboutHeadlineLine2,
} from '@/components/HomeAboutHeadline'
import HomeContactSection from '@/components/HomeContactSection'
import HomeHeroSection from '@/components/HomeHeroSection'
import HomePricingSection from '@/components/HomePricingSection'
import HomeTestimonialsSection from '@/components/HomeTestimonialsSection'
import PublicGalleriesSection from '@/components/PublicGalleriesSection'
import { fetchActivePackages, fetchPhotographerBySlug } from '@/lib/db'
import { getHomeContent } from '@/lib/home-content'
import { fetchPublicGalleryCards } from '@/lib/public-galleries'
import { fetchApprovedTestimonials } from '@/lib/testimonials-db'
import { parseThemeStyle, usesFullBleedHero } from '@/lib/theme-styles'
import { notFound } from 'next/navigation'

const MARQUEE_DEFAULT = [
  'ניו בורן',
  'צילומי חוץ',
  'סמאש קייק',
  'בת מצווה',
  'חלאקה',
  'פורטרט',
]

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ photographer_slug: string }>
  searchParams: Promise<{ package?: string; source?: string }>
}) {
  const { photographer_slug } = await params
  const photographer = await fetchPhotographerBySlug(photographer_slug)
  if (!photographer) notFound()

  const { package: packageId, source: sourceParam } = await searchParams

  const [homeContent, galleries, testimonials, packages] = await Promise.all([
    getHomeContent(photographer_slug, photographer.id),
    fetchPublicGalleryCards(12, photographer.id),
    fetchApprovedTestimonials(12, photographer.id),
    fetchActivePackages(photographer.id),
  ])

  const selectedPackage = packageId
    ? packages.find((pkg) => pkg.id === packageId) ?? null
    : null

  const {
    settings,
    businessName,
    tagline,
    aboutText,
    aboutHeadlineLine1,
    aboutHeadlineLine2,
    aboutQuote,
    heroImageMobile,
    heroPortrait,
    heroTriptych,
    aboutImage,
    yearsExperience,
    totalClients,
    totalProjects,
  } = homeContent

  const displayName = businessName || 'סטודיו צילום'
  const themeStyle = parseThemeStyle(settings?.theme_style)
  const customHeroUrl = settings?.hero_image_url?.trim() || null
  const customHeroUrlMobile = settings?.hero_image_url_mobile?.trim() || null
  const marqueeItems =
    galleries.length > 0
      ? galleries.slice(0, 6).map((g) => g.title)
      : MARQUEE_DEFAULT

  const stats = [
    { num: yearsExperience, label: 'שנות ניסיון' },
    { num: totalProjects, label: 'תיקי צילום' },
    { num: totalClients, label: 'לקוחות מרוצים' },
  ]

  return (
    <main
      className={`min-h-screen text-foreground ${usesFullBleedHero(themeStyle) ? '' : 'bg-background'}`}
      dir="rtl"
    >
      <HomeHeroSection
        themeStyle={themeStyle}
        photographerSlug={photographer_slug}
        displayName={displayName}
        tagline={tagline}
        aboutText={aboutText}
        heroPortrait={heroPortrait}
        heroTriptych={heroTriptych}
        heroImageMobile={heroImageMobile}
        customHeroUrl={customHeroUrl}
        customHeroUrlMobile={customHeroUrlMobile}
        totalClients={totalClients}
        marqueeItems={marqueeItems}
      />

      {/* About */}
      <section
        id="about"
        className="relative scroll-mt-24 overflow-hidden bg-background px-6 py-32 md:scroll-mt-28 md:py-44"
      >
        <div
          className="animate-blob absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full opacity-50 blur-[120px]"
          style={{
            background: 'color-mix(in oklab, var(--color-rose) 60%, transparent)',
          }}
          aria-hidden
        />
        <div
          className="animate-blob absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full opacity-40 blur-[120px]"
          style={{
            background: 'color-mix(in oklab, var(--color-champagne) 70%, transparent)',
            animationDelay: '4s',
          }}
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20">
          {aboutImage ? (
            <div className="theme-section-img theme-shaped relative lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden shadow-[0_50px_120px_-50px_oklch(0.35_0.05_40/0.4)]">
                <Image
                  src={aboutImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
              </div>
              <div className="theme-shaped absolute -bottom-10 -right-6 max-w-[260px] border border-border/60 bg-background/95 px-8 py-6 shadow-[0_30px_60px_-30px_oklch(0.35_0.05_40/0.4)] backdrop-blur-sm md:-right-12">
                <p className="font-display text-2xl italic leading-tight text-foreground">
                  &ldquo;
                  {aboutQuote.split('\n').map((line, index) => (
                    <span key={index}>
                      {index > 0 ? <br /> : null}
                      {line}
                    </span>
                  ))}
                  &rdquo;
                </p>
                <div className="mt-4 h-px w-10 bg-foreground/40" />
                <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  — {displayName.split(' ')[0] || displayName}
                </p>
              </div>
            </div>
          ) : null}

          <div className={aboutImage ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <p className="theme-label mb-6 text-[11px] uppercase tracking-[0.5em]">
              About · קצת עליי
            </p>
            <h2 className="font-display text-5xl leading-[1] text-foreground md:text-7xl">
              <AboutHeadlineLine1 text={aboutHeadlineLine1} />
              <AboutHeadlineLine2 text={aboutHeadlineLine2} />
            </h2>

            {aboutText ? (
              <div className="mt-10 max-w-xl space-y-5 text-lg leading-loose text-foreground/75">
                {aboutText.split('\n').filter(Boolean).map((para, i) => (
                  <p key={i} className={i > 0 ? 'text-foreground/65' : undefined}>
                    {para}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="mt-14 grid max-w-xl grid-cols-3 gap-4">
              {stats.map((s, i) => (
                <div key={s.label} className="group relative">
                  {i > 0 ? (
                    <div className="absolute right-0 top-1 h-12 w-px bg-border/80" />
                  ) : null}
                  <div className="pr-4">
                    <div className="font-display text-4xl text-foreground transition-transform duration-700 group-hover:-translate-y-1 md:text-5xl">
                      {s.num}
                    </div>
                    <div className="mt-3 text-[10px] uppercase leading-relaxed tracking-[0.3em] text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublicGalleriesSection
        galleries={galleries}
        photographerSlug={photographer_slug}
        sectionId="galleries"
      />

      <HomeTestimonialsSection testimonials={testimonials} />

      <HomePricingSection packages={packages} photographerSlug={photographer_slug} />

      <HomeContactSection
        settings={settings}
        selectedPackage={selectedPackage}
        sourceParam={sourceParam}
        businessName={displayName}
      />

      <footer className="border-t border-border bg-background px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="font-display text-lg text-foreground">{displayName}</div>
          <div className="text-xs uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} · כל הזכויות שמורות
          </div>
        </div>
      </footer>
    </main>
  )
}
