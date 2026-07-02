import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 pb-20 text-center">
      <div
        className="absolute inset-0 bg-[--foreground]/5"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-3xl animate-fade-in">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          ניהול גלריות לצלמות — מקצה לקצה
        </h1>
        <p className="mt-6 text-lg text-[--muted]">
          העלאה, בחירת לקוח, עיבוד, מסירה — הכל במקום אחד
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/register">התחילי בחינם</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#contact">יצירת קשר</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
