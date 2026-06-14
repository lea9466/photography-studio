import { Nav } from '@/components/marketing/Nav'
import { Hero } from '@/components/marketing/Hero'
import { ContactForm } from '@/components/marketing/ContactForm'
import { CTABanner } from '@/components/marketing/CTABanner'
import { Footer } from '@/components/marketing/Footer'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function MarketingHome() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-16" id="about">
        <h2 className="mb-6 text-2xl font-semibold">למה Studio Gallery?</h2>
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

      <section className="border-y border-[--border] bg-[--background] px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-semibold">מחירים</h2>
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
        <ContactForm />
      </section>

      <CTABanner />
      <Footer />
    </div>
  )
}
