import { Nav } from '@/components/marketing/Nav'
import { Hero } from '@/components/marketing/Hero'
import { ContactForm } from '@/components/marketing/ContactForm'
import { CTABanner } from '@/components/marketing/CTABanner'
import { Footer } from '@/components/marketing/Footer'
import { PrivateGalleriesZone } from '@/components/marketing/PrivateGalleriesZone'
import { PublicSiteZone } from '@/components/marketing/PublicSiteZone'
import { StatsStrip } from '@/components/marketing/StatsStrip'
import { Reveal } from '@/components/marketing/Reveal'
import { getMarketingProPricing } from '@/lib/payments/marketing-pricing'
import { getMarketingStats, type MarketingStat } from '@/lib/marketing/marketing-stats'

function pickStat(stats: MarketingStat[], key: MarketingStat['key']) {
  return stats.find((stat) => stat.key === key)
}

// The page is two unrelated products, each in its own zone: the public site
// (#site) and private client galleries (#private). Keep them separate — shared
// content is limited to the hero chooser, the studios counter, contact, and
// the closing banner.
export async function MarketingHome() {
  const [pricing, stats] = await Promise.all([getMarketingProPricing(), getMarketingStats()])
  const studios = pickStat(stats, 'studios')

  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <StatsStrip stats={studios ? [studios] : []} />

      {/* Unused file (superseded by components/marketing/nova/) — patched
          just enough to keep tsc/build green after marketing-stats.ts was
          simplified to a single combined 'galleries' stat for Nova. */}
      <PublicSiteZone pricing={pricing} showcaseStat={pickStat(stats, 'galleries')} />
      <PrivateGalleriesZone clientStat={pickStat(stats, 'galleries')} />

      <section className="relative overflow-hidden px-4 py-20" id="contact">
        <Reveal className="relative mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2">
          <div className="text-right">
            <h2 className="text-3xl font-bold tracking-tight">יצירת קשר</h2>
            <p className="mt-3 max-w-md leading-relaxed text-neutral-600">
              יש שאלה, בקשה לפיצ׳ר או תקלה? נשמח לשמוע.
            </p>
          </div>
          <ContactForm />
        </Reveal>
      </section>

      <CTABanner />
      <Footer />
    </main>
  )
}
