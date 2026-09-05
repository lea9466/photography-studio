/**
 * Tone palette shared by the guide primitives — the dashboard "אודות" pages
 * and the marketing "איך זה עובד" section. Five fixed pastels plus one
 * `accent` tone whose hue follows the `variant`: burgundy in the dashboard,
 * violet on the marketing site.
 *
 * Every class is a literal string (incl. the arbitrary hex accents) so
 * Tailwind's scanner keeps them. Bare `[--var]` utilities are intentionally
 * avoided — this repo's Tailwind v4 build doesn't wrap them in `var()`.
 */

export type GuideTone = 'accent' | 'rose' | 'amber' | 'sky' | 'violet' | 'emerald'
export type GuideVariant = 'burgundy' | 'violet'

type ToneClasses = { surface: string; icon: string }

const PASTEL: Record<Exclude<GuideTone, 'accent'>, ToneClasses> = {
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

type AccentClasses = {
  hex: string
  /** `accent`-tone card (surface + icon box). */
  tone: ToneClasses
  /** Solid fill — the flow number badge. */
  solid: string
  /** Accent text / icon colour. */
  text: string
  /** 10% tint background. */
  soft: string
  /** 35% text — the flow connector chevron. */
  faint: string
  /** Gradient-from stop for the hero band. */
  gradientFrom: string
  /** 15% ring. */
  ring: string
}

const ACCENT: Record<GuideVariant, AccentClasses> = {
  burgundy: {
    hex: '#7D3A52',
    tone: {
      surface: 'border-[#7D3A52]/15 bg-[#7D3A52]/5',
      icon: 'bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/15',
    },
    solid: 'bg-[#7D3A52]',
    text: 'text-[#7D3A52]',
    soft: 'bg-[#7D3A52]/10',
    faint: 'text-[#7D3A52]/35',
    gradientFrom: 'from-[#7D3A52]/10',
    ring: 'ring-[#7D3A52]/15',
  },
  violet: {
    hex: '#7c3aed',
    tone: {
      surface: 'border-[#7c3aed]/15 bg-[#7c3aed]/5',
      icon: 'bg-[#7c3aed]/10 text-[#7c3aed] ring-1 ring-[#7c3aed]/15',
    },
    solid: 'bg-[#7c3aed]',
    text: 'text-[#7c3aed]',
    soft: 'bg-[#7c3aed]/10',
    faint: 'text-[#7c3aed]/35',
    gradientFrom: 'from-[#7c3aed]/10',
    ring: 'ring-[#7c3aed]/15',
  },
}

export function guideTones(variant: GuideVariant): Record<GuideTone, ToneClasses> {
  return { accent: ACCENT[variant].tone, ...PASTEL }
}

export function guideAccent(variant: GuideVariant): AccentClasses {
  return ACCENT[variant]
}
