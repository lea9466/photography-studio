import { Images, FileText, LayoutTemplate, ShieldCheck, Users } from 'lucide-react'
import { MARKETING_FEATURES } from '@/lib/seo/marketing-metadata'

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
          : 'mx-auto max-w-6xl px-4 py-16'
      }
      aria-labelledby={compact ? 'register-seo-features' : 'marketing-seo-features'}
    >
      <h2
        id={compact ? 'register-seo-features' : 'marketing-seo-features'}
        className={
          compact
            ? 'mb-6 text-lg font-semibold text-[--foreground]'
            : 'mb-3 text-2xl font-semibold text-[--foreground]'
        }
      >
        {compact ? (
          <>
            למה{' '}
            <span className="text-[--client-accent]">לבחור בנו</span>
            ?
          </>
        ) : (
          'כל מה שצלמת צריכה — במקום אחד'
        )}
      </h2>
      {!compact ? (
        <p className="mb-8 max-w-3xl text-[--muted] leading-relaxed">
          פלטפורמה בעברית לבניית אתר תדמית, ניהול גלריות דיגיטליות ושיתוף תמונות עם לקוחות —
          בלי קוד ובלי מעצב.
        </p>
      ) : null}
      <ul className={compact ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-6 sm:grid-cols-2'}>
        {MARKETING_FEATURES.map((feature, index) => {
          const compactIcon = COMPACT_FEATURE_ICONS[index]
          const Icon = compactIcon?.icon

          return (
            <li
              key={feature.title}
              className={
                compact
                  ? 'flex flex-col items-center rounded-xl border border-[--border] bg-[--background] p-5 text-center'
                  : 'rounded-xl border border-[--border] bg-[--background] p-6'
              }
            >
              {compact && Icon ? (
                <div
                  className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${compactIcon.iconBg}`}
                  aria-hidden="true"
                >
                  <Icon className={`h-5 w-5 ${compactIcon.iconColor}`} />
                </div>
              ) : null}
              <h3 className="text-base font-semibold text-[--foreground]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[--muted]">{feature.description}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
