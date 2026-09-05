import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Shared visual primitives for the two dashboard "אודות" guide pages
 * (private galleries / public site). Purely presentational, no state — safe
 * to render as server components. Anchored on the dashboard accent
 * (#7D3A52) with soft pastel tones for the concept cards and diagrams, per
 * Lea's brief: illustrated, icon-led, light on text.
 */

export const ABOUT_ACCENT = '#7D3A52'

export type AboutTone = 'plum' | 'rose' | 'amber' | 'sky' | 'violet' | 'emerald'

/** Full literal class strings per tone so Tailwind's scanner keeps them. */
export const ABOUT_TONE: Record<AboutTone, { surface: string; icon: string }> = {
  plum: {
    surface: 'border-[#7D3A52]/15 bg-[#7D3A52]/[0.05]',
    icon: 'bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/15',
  },
  rose: {
    surface: 'border-rose-200/70 bg-rose-50/70',
    icon: 'bg-rose-100 text-rose-600 ring-1 ring-rose-200/70',
  },
  amber: {
    surface: 'border-amber-200/70 bg-amber-50/70',
    icon: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200/70',
  },
  sky: {
    surface: 'border-sky-200/70 bg-sky-50/70',
    icon: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200/70',
  },
  violet: {
    surface: 'border-violet-200/70 bg-violet-50/70',
    icon: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200/70',
  },
  emerald: {
    surface: 'border-emerald-200/70 bg-emerald-50/70',
    icon: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/70',
  },
}

export function AboutPage({ children }: { children: ReactNode }) {
  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-8 md:px-10 md:py-12">
        {children}
      </div>
    </div>
  )
}

export function AboutHero({
  eyebrow,
  eyebrowIcon,
  title,
  lead,
  artwork,
}: {
  eyebrow: string
  eyebrowIcon: ReactNode
  title: string
  lead: string
  artwork?: ReactNode
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-[--border] bg-gradient-to-bl from-[#7D3A52]/[0.07] via-white to-sky-50/60 px-7 py-8 md:px-10 md:py-11">
      <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#7D3A52] ring-1 ring-[#7D3A52]/15">
            {eyebrowIcon}
            {eyebrow}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.9rem]">
            {title}
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-[--muted] md:text-[0.95rem]">
            {lead}
          </p>
        </div>
        {artwork ? <div className="shrink-0 self-center">{artwork}</div> : null}
      </div>
    </header>
  )
}

export function AboutSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[--foreground] md:text-xl">
          {icon ? <span className="text-[#7D3A52]">{icon}</span> : null}
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm leading-relaxed text-[--muted]">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function ConceptGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

export function ConceptCard({
  icon,
  tone = 'plum',
  title,
  children,
}: {
  icon: ReactNode
  tone?: AboutTone
  title: string
  children?: ReactNode
}) {
  const t = ABOUT_TONE[tone]
  return (
    <div className={cn('flex gap-4 rounded-2xl border p-4 md:p-5', t.surface)}>
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          t.icon
        )}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-[--foreground]">{title}</p>
        {children ? (
          <p className="text-sm leading-relaxed text-[--muted]">{children}</p>
        ) : null}
      </div>
    </div>
  )
}

export function Callout({
  icon,
  tone = 'sky',
  title,
  children,
}: {
  icon: ReactNode
  tone?: AboutTone
  title: string
  children: ReactNode
}) {
  const t = ABOUT_TONE[tone]
  return (
    <div className={cn('flex items-start gap-4 rounded-2xl border p-5', t.surface)}>
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          t.icon
        )}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-[--foreground]">{title}</p>
        <div className="text-sm leading-relaxed text-[--muted]">{children}</div>
      </div>
    </div>
  )
}

export function ChipRow({
  items,
}: {
  items: { icon: ReactNode; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-2 rounded-xl border border-[--border] bg-white px-3.5 py-2 text-sm font-medium text-[--foreground]"
        >
          <span className="text-[#7D3A52]">{item.icon}</span>
          {item.label}
        </span>
      ))}
    </div>
  )
}
