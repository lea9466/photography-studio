import { MARKETING_FEATURES } from '@/lib/seo/marketing-metadata'

type MarketingSeoFeaturesProps = {
  compact?: boolean
}

export function MarketingSeoFeatures({ compact = false }: MarketingSeoFeaturesProps) {
  return (
    <section
      className={compact ? 'text-right' : 'mx-auto max-w-6xl px-4 py-16'}
      aria-labelledby={compact ? 'register-seo-features' : 'marketing-seo-features'}
    >
      <h2
        id={compact ? 'register-seo-features' : 'marketing-seo-features'}
        className={
          compact
            ? 'mb-4 text-lg font-semibold text-[--foreground]'
            : 'mb-3 text-2xl font-semibold text-[--foreground]'
        }
      >
        {compact ? 'למה סטודיו גלריה?' : 'כל מה שצלמת צריכה — במקום אחד'}
      </h2>
      {!compact ? (
        <p className="mb-8 max-w-3xl text-[--muted] leading-relaxed">
          פלטפורמה בעברית לבניית אתר תדמית, ניהול גלריות דיגיטליות ושיתוף תמונות עם לקוחות —
          בלי קוד ובלי מעצב.
        </p>
      ) : null}
      <ul className={compact ? 'space-y-4' : 'grid gap-6 sm:grid-cols-2'}>
        {MARKETING_FEATURES.map((feature) => (
          <li
            key={feature.title}
            className={
              compact
                ? 'rounded-lg border border-[--border] bg-[--background] p-4'
                : 'rounded-xl border border-[--border] bg-[--background] p-6'
            }
          >
            <h3 className="text-base font-semibold text-[--foreground]">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[--muted]">{feature.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
