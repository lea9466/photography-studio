import { Images, FileText, LayoutTemplate, ShieldCheck, Users } from 'lucide-react'
import { MARKETING_FEATURES } from '@/lib/seo/marketing-metadata'
import { Reveal } from '@/components/marketing/Reveal'

type MarketingSeoFeaturesProps = {
  compact?: boolean
}

const COMPACT_FEATURE_ICONS = [
  { icon: LayoutTemplate, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  { icon: Images, iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  { icon: FileText, iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
  { icon: ShieldCheck, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { icon: Users, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
] as const

export function MarketingSeoFeatures({ compact = false }: MarketingSeoFeaturesProps) {
  return (
    <section
      className={
        compact
          ? 'mx-auto w-full text-center'
          : 'mx-auto max-w-7xl px-4 py-20 text-center'
      }
      aria-labelledby={compact ? 'register-seo-features' : 'marketing-seo-features'}
    >
      <Reveal>
        <h2
          id={compact ? 'register-seo-features' : 'marketing-seo-features'}
          className={
            compact
              ? 'mb-6 text-lg font-semibold text-[--foreground]'
              : 'text-3xl font-bold tracking-tight text-[--foreground]'
          }
        >
          {compact ? (
            <>
              למה{' '}
              <span className="text-[--client-accent]">לבחור בנו</span>
              ?
            </>
          ) : (
            <>
              כל מה שצלמת צריכה —{' '}
              <span className="bg-gradient-to-l from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                במקום אחד
              </span>
            </>
          )}
        </h2>
        {!compact ? (
          <p className="mx-auto mb-12 mt-4 max-w-2xl leading-relaxed text-[--muted]">
            פלטפורמה בעברית לבניית אתר תדמית, ניהול גלריות דיגיטליות ושיתוף תמונות עם לקוחות —
            בלי קוד ובלי מעצב.
          </p>
        ) : null}
      </Reveal>
      <ul className={compact ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-5'}>
        {MARKETING_FEATURES.map((feature, index) => {
          const compactIcon = COMPACT_FEATURE_ICONS[index]
          const Icon = compactIcon?.icon

          return (
            <Reveal
              key={feature.title}
              as="li"
              delayMs={index * 80}
              className={
                compact
                  ? 'flex flex-col items-center rounded-xl border border-[--border] bg-[--background] p-5 text-center'
                  : 'group flex flex-col items-center rounded-2xl border border-[--border] bg-[--background] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-900/5'
              }
            >
              {Icon ? (
                <div
                  className={`mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full ${compactIcon.iconBg}`}
                  aria-hidden="true"
                >
                  <Icon className={`h-5 w-5 ${compactIcon.iconColor}`} />
                </div>
              ) : null}
              <h3 className="text-base font-semibold text-[--foreground]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[--muted]">{feature.description}</p>
            </Reveal>
          )
        })}
      </ul>
    </section>
  )
}
