import Link from 'next/link'
import type { PackagesRow } from '@/lib/database.types'
import { tenantHashPath, tenantPath } from '@/lib/tenant-paths'

function formatPrice(price: number | null): string {
  if (price == null) return 'לפי בקשה'
  return `₪${price.toLocaleString('he-IL')}`
}

export default function HomePricingSection({
  packages,
  photographerSlug,
}: {
  packages: PackagesRow[]
  photographerSlug: string
}) {
  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 overflow-hidden px-6 py-32 md:scroll-mt-28 md:py-44"
      dir="rtl"
      aria-labelledby="pricing-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-20 grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="theme-label mb-6 text-[11px] uppercase tracking-[0.5em]">
              Investment · השקעה ברגע
            </p>
            <h2
              id="pricing-heading"
              className="font-display text-5xl leading-[1] md:text-7xl"
            >
              חבילות <span className="font-light italic">מותאמות</span>
              <br />
              <span className="font-light italic">לסיפור</span> שלכם.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="max-w-md leading-loose text-foreground/70 lg:mr-auto">
              בחרו את החבילה שמתאימה לכם — ונתאים אותה בדיוק לצרכים שלכם.
              כולן כוללות ייעוץ אישי לפני הסשן ועריכה ידנית של כל פריים.
            </p>
          </div>
        </div>

        {packages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            המחירון מתעדכן.{' '}
            <Link
              href={tenantHashPath(photographerSlug, '#contact')}
              className="theme-label underline-offset-2 hover:underline"
            >
              צרו קשר
            </Link>{' '}
            לקבלת הצעת מחיר.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            {packages.map((pkg) => {
              const featured = Boolean(pkg.is_featured)
              return (
                <div
                  key={pkg.id}
                  className={`theme-pricing-card theme-shaped group relative p-10 transition-all duration-700 hover:-translate-y-2 lg:p-12 ${
                    featured
                      ? 'bg-foreground text-background shadow-[0_40px_100px_-40px_oklch(0.35_0.05_40/0.6)] md:-translate-y-4'
                      : 'border border-border bg-card hover:border-foreground/30 hover:shadow-[0_30px_80px_-50px_oklch(0.35_0.05_40/0.35)]'
                  }`}
                >
                  {featured ? (
                    <div
                      className="absolute -top-3 right-10 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.3em]"
                      style={{
                        background: 'var(--color-rose)',
                        color: 'oklch(0.25 0.04 40)',
                      }}
                    >
                      הכי מבוקש
                    </div>
                  ) : null}

                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-3xl">
                      {pkg.title?.trim() || 'חבילה'}
                    </h3>
                  </div>

                  {pkg.description?.trim() ? (
                    <p
                      className={`mt-2 font-display text-lg italic ${
                        featured ? 'opacity-75' : 'text-muted-foreground'
                      }`}
                    >
                      {pkg.description}
                    </p>
                  ) : null}

                  <div
                    className={`my-8 h-px ${featured ? 'bg-background/15' : 'bg-border'}`}
                  />

                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-6xl">
                      {formatPrice(pkg.price)}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-[11px] uppercase tracking-[0.3em] ${
                      featured ? 'opacity-60' : 'text-muted-foreground'
                    }`}
                  >
                    החל מ-
                  </p>

                  {pkg.features?.length ? (
                    <ul className="mt-10 space-y-4">
                      {pkg.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm leading-relaxed"
                        >
                          <span
                            className="mt-2 h-1 w-1 flex-shrink-0 rounded-full"
                            style={{
                              background: featured
                                ? 'var(--color-rose)'
                                : 'var(--color-accent)',
                            }}
                          />
                          <span className={featured ? 'opacity-90' : 'text-foreground/80'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <Link
                    href={`${tenantPath(photographerSlug)}?package=${encodeURIComponent(pkg.id)}#contact`}
                    className={`theme-cta-primary mt-12 inline-flex w-full items-center justify-between px-6 py-4 text-xs uppercase tracking-[0.3em] transition-all duration-500 ${
                      featured
                        ? 'bg-background text-foreground hover:bg-background/90'
                        : 'border border-foreground/30 hover:bg-foreground hover:text-background'
                    }`}
                  >
                    <span>הזמנת סשן</span>
                    <span className="transition-transform duration-500 group-hover:-translate-x-1">
                      ←
                    </span>
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-16 text-center font-display text-sm italic text-muted-foreground">
          כל המחירים כוללים מע&quot;מ · ניתן להתאים חבילה אישית בשיחה
        </p>
      </div>
    </section>
  )
}
