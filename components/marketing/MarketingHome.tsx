import { Nav } from '@/components/marketing/Nav'
import { Hero } from '@/components/marketing/Hero'
import { ContactForm } from '@/components/marketing/ContactForm'
import { CTABanner } from '@/components/marketing/CTABanner'
import { Footer } from '@/components/marketing/Footer'
import { MarketingSeoFeatures } from '@/components/marketing/MarketingSeoFeatures'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function MarketingHome() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <MarketingSeoFeatures />

      <section className="mx-auto max-w-6xl px-4 py-16" id="galleries">
        <h2 className="mb-6 text-2xl font-semibold">גלריות דיגיטליות לצלמים</h2>
        <p className="mb-4 max-w-3xl leading-relaxed text-[--muted]">
          שתפי גלריות ציבוריות ופרטיות עם לקוחות, הציגי תיק עבודות מעוצב ונהלי את כל
          תהליך בחירת התמונות לעיבוד — בממשק אחד נוח בעברית.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" id="about">
        <h2 className="mb-6 text-2xl font-semibold"><span className="text-[--primary]">About</span> · קצת עליי</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['בחירת לקוח', '❤️ לאלבום ו-✨ לעיבוד — עם הגבלות וסיום בחירה'],
            ['מסירה מעובדת', 'העלאת finals והורדה ללקוח כשמוכן'],
            ['תיק עבודות', 'גלריות portfolio ציבוריות לתדמית'],
          ].map(([title, desc]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[--muted]">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-[--border] bg-[--background] px-4 py-16" id="pricing">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-semibold">חבילות צילום</h2>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Starter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[--muted]">
              <p>גלריות ללא הגבלה</p>
              <p>העלאת אלפי תמונות</p>
              <p>מיילים ללקוחות</p>
              <p className="pt-2 text-2xl font-semibold text-[--foreground]">
                בקרוב
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-4 py-16" id="contact">
        <h2 className="mb-6 text-2xl font-semibold text-center">יצירת קשר</h2>
        <ContactForm />
      </section>

      <CTABanner />
      <Footer />
    </main>
  )
}
