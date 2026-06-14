import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTABanner() {
  return (
    <section className="bg-[--accent] px-4 py-16 text-center text-[--background]">
      <div className="mx-auto max-w-2xl animate-fade-in">
        <h2 className="text-2xl font-semibold">אהבתם את המערכת?</h2>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="mt-6 border-[--background] text-[--background] hover:scale-[1.02] hover:bg-transparent"
        >
          <Link href="/register">לפתיחת סטודיו משלכם</Link>
        </Button>
      </div>
    </section>
  )
}
