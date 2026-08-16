import Link from 'next/link'
import { Heart, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MARKETING_H1, MARKETING_SEO_DESCRIPTION } from '@/lib/seo/marketing-metadata'

const GRID_TONES = [
  'from-amber-200 to-rose-300',
  'from-stone-300 to-stone-400',
  'from-rose-200 to-orange-200',
  'from-violet-300 to-fuchsia-300',
  'from-neutral-800 to-neutral-600',
  'from-amber-100 to-amber-200',
]

const TRUST_ITEMS = ['בלי כרטיס אשראי', 'אתר מוכן תוך 10 דקות', 'תמיכה בעברית']

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-40 sm:pt-48">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-32 right-1/2 h-[32rem] w-[32rem] translate-x-1/3 rounded-full bg-violet-400/25 blur-[110px]" />
        <div className="absolute top-10 left-1/2 h-[26rem] w-[26rem] -translate-x-1/3 rounded-full bg-rose-300/20 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] bg-[size:28px_28px] opacity-[0.35]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-fade-in text-center lg:text-right">
          <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-medium text-violet-700 lg:mx-0">
            <Sparkles className="h-3.5 w-3.5" />
            הפלטפורמה המובילה לצלמות בעברית
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            בניית אתר לצלמות{' '}
            <span className="bg-gradient-to-l from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              ב-10 דקות
            </span>
            <br />
            ומערכת גלריות דיגיטליות חכמה
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[--muted] lg:mx-0">
            {MARKETING_SEO_DESCRIPTION}
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-lg shadow-violet-900/25 hover:shadow-xl hover:shadow-violet-900/30"
            >
              <Link href="/register">התחילי בחינם — בניית אתר לצלמת</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#contact">יצירת קשר</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[--muted] lg:justify-start">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-float-up [animation-delay:150ms]">
          <div className="relative mx-auto max-w-md rotate-2 rounded-2xl border border-[--border] bg-[--background] p-3 shadow-2xl shadow-black/10 transition-transform duration-500 hover:rotate-0">
            <div className="flex items-center gap-1.5 px-2 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="mr-3 h-5 flex-1 rounded-full bg-[--border]/60" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GRID_TONES.map((tone, i) => (
                <div
                  key={tone}
                  className={`aspect-square rounded-lg bg-gradient-to-br ${tone} ${i === 0 ? 'col-span-2 row-span-2 aspect-auto' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="absolute -bottom-4 -left-2 flex items-center gap-2 rounded-xl border border-[--border] bg-[--background] px-4 py-3 shadow-xl shadow-black/10 animate-float-up [animation-delay:400ms] sm:-left-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <Heart className="h-4 w-4" fill="currentColor" />
            </span>
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">לקוח בחר 24 תמונות</p>
              <p className="text-xs text-[--muted]">לאלבום ועיבוד</p>
            </div>
          </div>

          <div className="absolute -top-5 -right-3 flex items-center gap-1.5 rounded-full border border-[--border] bg-[--background] px-3 py-2 shadow-xl shadow-black/10 animate-float-up [animation-delay:600ms] sm:-right-6">
            <Star className="h-4 w-4 text-amber-400" fill="currentColor" />
            <span className="text-xs font-medium">גלריה פרטית מוגנת</span>
          </div>
        </div>
      </div>
    </section>
  )
}
