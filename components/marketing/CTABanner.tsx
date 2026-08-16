import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/marketing/Reveal'

export function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-violet-800 to-fuchsia-900 px-4 py-20 text-center text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:26px_26px] opacity-[0.06]"
        aria-hidden
      />
      <Reveal className="relative mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight">מוכנה לאתר הצילום שלך?</h2>
        <p className="mx-auto mt-3 max-w-md text-violet-100">
          הצטרפי לצלמות שכבר בונות תדמית מקצועית ומנהלות גלריות דיגיטליות בעברית — התחילי בחינם.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 bg-white text-violet-800 shadow-lg shadow-black/20 hover:bg-violet-50 hover:scale-[1.02]"
        >
          <Link href="/register">לפתיחת הסטודיו שלך</Link>
        </Button>
      </Reveal>
    </section>
  )
}
