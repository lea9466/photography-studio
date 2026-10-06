import { redirect } from 'next/navigation'
import { ArrowUpDown, EyeOff, LayoutList, Lock, MousePointerClick } from 'lucide-react'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { fetchHomepageSections } from '@/lib/actions/site-settings.actions'
import { loadSectionPreviewData } from '@/lib/public-site/homepage-section-previews'
import { HomepageSectionsOrderSetting } from '@/components/dashboard/HomepageSectionsOrderSetting'

const STEPS = [
  {
    icon: MousePointerClick,
    title: 'תפסי וגררי',
    body: 'לחצי על הידית בצד ימין של סקשן וגררי אותו למעלה או למטה. כך את קובעת מה המבקרים רואים קודם.',
  },
  {
    icon: EyeOff,
    title: 'הסתירי מה שלא צריך',
    body: 'סקשן שלא מתאים לך? לחצי "מוצג" והוא יוסתר מהאתר. התוכן שלו נשמר, ואפשר להחזיר אותו בכל רגע.',
  },
  {
    icon: ArrowUpDown,
    title: 'זה מתעדכן מיד',
    body: 'אין כפתור שמירה. כל שינוי נשמר ומופיע באתר הציבורי מיד, בכל ארבעת עיצובי האתר.',
  },
]

const GOOD_TO_KNOW = [
  'הסידור חל על דף הבית בלבד. דף הבלוג, תיק העבודות ולפני/אחרי נשארים כמו שהם.',
  'סקשן מוסתר נעלם גם מתפריט הניווט העליון. אם הסתרת את "שאלות נפוצות", לא יופיע קישור אליהן.',
  'סקשן ריק לא מוצג בכל מקרה, גם כשהוא מסומן "מוצג". למשל חבילות כשלא הוגדרה אף חבילה, או שאלות נפוצות בלי שאלות.',
  'הסקשן הראשי (התמונה הגדולה בראש הדף) וצור קשר (בסוף) נעולים במקומם, כדי שהאתר תמיד יפתח ויסתיים נכון.',
  'מי שלא שינתה כלום רואה את הסדר הרגיל: אודות, גלריות, תמונות אחרונות, בלוג, חבילות, המלצות ושאלות נפוצות.',
]

export default async function HomepageLayoutPage() {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const [layout, preview] = await Promise.all([
    fetchHomepageSections(),
    loadSectionPreviewData(context.supabase, context.userId),
  ])

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="relative flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <LayoutList className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                סדר דף הבית
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                דף הבית של האתר בנוי מסקשנים, כמו אודות, גלריות והמלצות. כאן את בוחרת באיזה סדר
                הם יופיעים ואילו מהם יוצגו בכלל.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <div
              key={title}
              className="space-y-3 rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7D3A52]/[0.08] text-[#7D3A52]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-[#7D3A52]">שלב {index + 1}</span>
              </div>
              <h2 className="text-base font-semibold text-[--foreground]">{title}</h2>
              <p className="text-sm leading-relaxed text-[--muted]">{body}</p>
            </div>
          ))}
        </div>

        <HomepageSectionsOrderSetting
          key={layout.map((section) => section.id + ':' + section.visible).join(',')}
          initialLayout={layout}
          preview={preview}
        />

        <section className="space-y-4 rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 md:p-8">
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-[#7D3A52]" />
            <h2 className="text-base font-semibold text-[--foreground]">טוב לדעת</h2>
          </div>
          <ul className="space-y-2.5 text-sm leading-relaxed text-[--muted]">
            {GOOD_TO_KNOW.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7D3A52]/50" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
