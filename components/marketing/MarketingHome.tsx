import Link from 'next/link'
import { Check, Lock, Globe } from 'lucide-react'
import { Nav } from '@/components/marketing/Nav'
import { Hero } from '@/components/marketing/Hero'
import { ContactForm } from '@/components/marketing/ContactForm'
import { CTABanner } from '@/components/marketing/CTABanner'
import { Footer } from '@/components/marketing/Footer'
import { MarketingSeoFeatures } from '@/components/marketing/MarketingSeoFeatures'
import { ExampleSiteShowcase } from '@/components/marketing/ExampleSiteShowcase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Reveal } from '@/components/marketing/Reveal'
import { getMarketingProPricing } from '@/lib/payments/marketing-pricing'

const FREE_FEATURES = ['סקשן הירו ואודות', 'גלריה ציבורית אחת', 'טופס יצירת קשר', 'מופיעים בחיפוש בגוגל']

const PRO_FEATURES_HE = [
  'כל מודולי אתר התדמית — בלוג, המלצות, חבילות, לפני/אחרי, שאלות ותשובות',
  'עד 4 גלריות ציבוריות',
  'וידאו רקע בהירו',
]

const PLUS_FEATURES_HE = [
  'כל מה שיש בחבילת Pro',
  'אתר ציבורי מלא ללא הגבלת גלריות',
  'ניהול גלריות פרטיות מלא ללקוחות',
  'בחירת תמונות ללקוח — לאלבום ולעיבוד',
]

export async function MarketingHome() {
  const pricing = await getMarketingProPricing()

  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <MarketingSeoFeatures />
      <ExampleSiteShowcase />

      <section className="border-y border-[--border] bg-[--foreground]/[0.02] px-4 py-20" id="galleries">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <Reveal className="order-2 text-right lg:order-1">
            <h2 className="text-3xl font-bold tracking-tight">גלריות דיגיטליות לצלמים</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-[--muted]">
              שתפי גלריות ציבוריות ופרטיות עם לקוחות, הציגי תיק עבודות מעוצב ונהלי את כל
              תהליך בחירת התמונות לעיבוד — בממשק אחד נוח בעברית.
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center justify-start gap-2.5 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <Globe className="h-4 w-4" />
                </span>
                גלריית פורטפוליו ציבורית שפתוחה לכולם, לחיזוק התדמית
              </li>
              <li className="flex items-center justify-start gap-2.5 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <Lock className="h-4 w-4" />
                </span>
                גלריות פרטיות מוגנות בסיסמה, ייעודיות לכל לקוח
              </li>
            </ul>
            <Button
              className="mt-8 bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-sm shadow-violet-900/20"
              asChild
            >
              <Link href="/register">להקמת הגלריה הראשונה שלך</Link>
            </Button>
          </Reveal>

          <Reveal className="order-1 lg:order-2" delayMs={150}>
            <div className="relative mx-auto max-w-sm -rotate-1 rounded-2xl border border-[--border] bg-[--background] p-3 shadow-xl shadow-black/10">
              <div className="grid grid-cols-3 gap-2">
                {[
                  'from-stone-300 to-stone-400',
                  'from-rose-200 to-orange-200',
                  'from-violet-300 to-fuchsia-300',
                  'from-amber-200 to-rose-300',
                  'from-neutral-700 to-neutral-500',
                  'from-amber-100 to-amber-200',
                  'from-fuchsia-200 to-rose-200',
                  'from-stone-200 to-stone-300',
                  'from-violet-200 to-sky-200',
                ].map((tone, i) => (
                  <div key={i} className={`aspect-square rounded-md bg-gradient-to-br ${tone}`} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 hover:opacity-100">
                <span className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-neutral-900 shadow-lg">
                  <Lock className="h-4 w-4 text-violet-600" />
                  גלריה פרטית ללקוח
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-[--border] px-4 py-20" id="pricing">
        <div
          className="pointer-events-none absolute -top-24 right-1/2 h-96 w-96 translate-x-1/2 rounded-full bg-violet-400/10 blur-[100px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight">חבילות שימוש</h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[--muted]">
              כל צלמת מתחילה עם חודש ראשון חינם ברמת Pro — אין צורך בכרטיס אשראי.
            </p>
          </Reveal>

          <div className="mt-12 grid items-start gap-6 text-right lg:grid-cols-3">
            <Reveal>
              <Card className="shadow-sm">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold">חינם</h3>
                  <p className="mt-1 text-sm text-[--muted]">אתר תדמית בסיסי, לתמיד</p>
                  <p className="mt-6 text-3xl font-bold">₪0</p>
                  <ul className="mt-6 space-y-3">
                    {FREE_FEATURES.map((item) => (
                      <li key={item} className="flex items-center justify-start gap-2.5 text-sm text-[--muted]">
                        <Check className="h-4 w-4 shrink-0 text-[--muted]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="mt-8 w-full" asChild>
                    <Link href="/register">התחילי בחינם</Link>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal delayMs={100}>
              <Card className="relative border-violet-300 shadow-xl shadow-violet-900/10 lg:-translate-y-3">
                <span className="absolute -top-3 right-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                  החודש הראשון חינם
                </span>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Pro</h3>
                    {pricing.monthlyBadge ? (
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                        {pricing.monthlyBadge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[--muted]">כל הכלים לניהול סטודיו מקצועי</p>
                  <p className="mt-6 flex items-baseline gap-2">
                    <span className="text-3xl font-bold">₪{pricing.monthlyPrice}</span>
                    <span className="text-sm text-[--muted]">לחודש</span>
                    {pricing.monthlyCompareAt ? (
                      <span className="text-sm text-[--muted] line-through">₪{pricing.monthlyCompareAt}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-[--muted]">
                    או ₪{pricing.yearlyPrice} לשנה
                    {pricing.yearlyCompareAt ? ` במקום ₪${pricing.yearlyCompareAt}` : ''}
                    {pricing.yearlyBadge ? ` — ${pricing.yearlyBadge}` : ''}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {PRO_FEATURES_HE.map((item) => (
                      <li key={item} className="flex items-start justify-start gap-2.5 text-sm text-[--muted]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-sm shadow-violet-900/20"
                    asChild
                  >
                    <Link href="/register">התחילי עכשיו בחינם</Link>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal delayMs={200}>
              <Card className="border-dashed opacity-80 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Plus</h3>
                    <span className="rounded-full bg-[--foreground]/5 px-2.5 py-1 text-[11px] font-semibold text-[--muted]">
                      בקרוב
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[--muted]">אתר ציבורי מלא + ניהול גלריות פרטיות</p>
                  <p className="mt-6 text-3xl font-bold text-[--muted]">בקרוב</p>
                  <ul className="mt-6 space-y-3">
                    {PLUS_FEATURES_HE.map((item) => (
                      <li key={item} className="flex items-start justify-start gap-2.5 text-sm text-[--muted]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[--muted]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="mt-8 w-full" disabled>
                    זמין בקרוב
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 py-20" id="contact">
        <div
          className="pointer-events-none absolute top-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-400/10 blur-[100px]"
          aria-hidden
        />
        <Reveal className="relative mx-auto max-w-xl">
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight">יצירת קשר</h2>
          <p className="mb-8 text-center text-[--muted]">יש שאלה, בקשה לפיצ׳ר או תקלה? נשמח לשמוע.</p>
          <ContactForm />
        </Reveal>
      </section>

      <CTABanner />
      <Footer />
    </main>
  )
}
