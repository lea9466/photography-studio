/**
 * Theme-independent hero layouts. `hero_settings` on `users` stores the
 * chosen layout + options as JSON; NULL means "the theme's own built-in
 * hero", which is how every site rendered before this feature existed.
 *
 * Every layout and every non-default option is gated by a free/PRO tier that
 * the platform admin edits in /manage (`hero_option_tiers`). The gate is
 * applied twice, like hero_video: on save (a free studio can't store a PRO
 * hero) and at render (a studio no longer allowed everything her saved hero
 * uses gets the theme's own hero back).
 *
 * Pure module — no server imports — so the dashboard editor, the public site
 * and the tests all share the same rules.
 */

export const HERO_LAYOUT_IDS = ['cinema', 'split', 'frame', 'arch', 'trio', 'mag', 'film', 'pano'] as const

export type HeroLayoutId = (typeof HERO_LAYOUT_IDS)[number]

export const HERO_LAYOUT_LABELS: Record<HeroLayoutId, { name: string; description: string }> = {
  cinema: { name: 'קולנועי ממורכז', description: 'תמונה מלאה ושם גדול במרכז' },
  split: { name: 'חצוי', description: 'טקסט בצד אחד, תמונה בצד השני' },
  frame: { name: 'פספרטו', description: 'תמונה ממוסגרת עם שוליים' },
  arch: { name: 'חלון קשת', description: 'תמונה בקשת ותמונה עגולה קטנה' },
  trio: { name: 'שלישייה', description: 'שלוש תמונות ההירו זו לצד זו' },
  mag: { name: 'מגזין', description: 'שם ענק ותמונה רחבה מתחתיו' },
  film: { name: 'רצועת תמונות', description: 'שורת תמונות שזזה מתחת לכותרת' },
  pano: { name: 'פנורמה', description: 'פס תמונה רחב בין הכותרת לטקסט' },
}

/** Layouts whose photo layer can stay still while the page scrolls over it. */
export const PINNABLE_HERO_LAYOUTS: ReadonlySet<HeroLayoutId> = new Set(['cinema', 'pano'])

/** Layouts where the text sits on the photo (so the darkening + scroll cue apply). */
export const TEXT_ON_PHOTO_HERO_LAYOUTS: ReadonlySet<HeroLayoutId> = new Set(['cinema'])

export const HERO_TRANSITIONS = ['fade', 'zoom', 'cut'] as const
export type HeroTransition = (typeof HERO_TRANSITIONS)[number]

export const HERO_TITLE_SIZES = ['sm', 'md', 'lg'] as const
export type HeroTitleSize = (typeof HERO_TITLE_SIZES)[number]

export const HERO_SPEED_SECONDS = [3, 5, 8] as const
export type HeroSpeedSeconds = (typeof HERO_SPEED_SECONDS)[number]

export type HeroSettings = {
  layout: HeroLayoutId
  pinOnScroll: boolean
  transition: HeroTransition
  speedSeconds: HeroSpeedSeconds
  titleSize: HeroTitleSize
  /** 0–100, step 5 — how dark the photo is under text-on-photo layouts. */
  shade: number
  showEyebrow: boolean
  showSecondaryCta: boolean
  showScrollCue: boolean
}

export type HeroOptions = Omit<HeroSettings, 'layout'>

export const DEFAULT_HERO_OPTIONS: HeroOptions = {
  pinOnScroll: false,
  transition: 'fade',
  speedSeconds: 5,
  titleSize: 'md',
  shade: 50,
  showEyebrow: true,
  showSecondaryCta: true,
  showScrollCue: true,
}

const KNOWN_LAYOUTS = new Set<string>(HERO_LAYOUT_IDS)

function pick<T extends string | number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

/**
 * Tolerant parser for whatever is in the DB column (or sent by the editor).
 * Unknown layout ⇒ null (theme hero); unknown/missing options ⇒ defaults.
 */
export function normalizeHeroSettings(raw: unknown): HeroSettings | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  if (typeof value.layout !== 'string' || !KNOWN_LAYOUTS.has(value.layout)) return null

  const shade = typeof value.shade === 'number' && Number.isFinite(value.shade)
    ? Math.min(100, Math.max(0, Math.round(value.shade / 5) * 5))
    : DEFAULT_HERO_OPTIONS.shade

  return {
    layout: value.layout as HeroLayoutId,
    pinOnScroll: value.pinOnScroll === true,
    transition: pick(value.transition, HERO_TRANSITIONS, DEFAULT_HERO_OPTIONS.transition),
    speedSeconds: pick(value.speedSeconds, HERO_SPEED_SECONDS, DEFAULT_HERO_OPTIONS.speedSeconds),
    titleSize: pick(value.titleSize, HERO_TITLE_SIZES, DEFAULT_HERO_OPTIONS.titleSize),
    shade,
    showEyebrow: value.showEyebrow !== false,
    showSecondaryCta: value.showSecondaryCta !== false,
    showScrollCue: value.showScrollCue !== false,
  }
}

/**
 * Whether the homepage hero starts with a photo right behind the site nav —
 * true for every theme's own hero and for the full-bleed cinema layout. The
 * other layouts open on the theme background, so the nav must start solid.
 */
export function heroHasPhotoBehindNav(settings: HeroSettings | null): boolean {
  return !settings || settings.layout === 'cinema'
}

/* ---------- Free / PRO gating ---------- */

export const HERO_FEATURE_KEYS = [
  'pin_on_scroll',
  'transition',
  'speed',
  'title_size',
  'shade',
  'hide_eyebrow',
  'hide_secondary_cta',
  'hide_scroll_cue',
] as const

export type HeroFeatureKey = (typeof HERO_FEATURE_KEYS)[number]
export type HeroLayoutOptionKey = `layout:${HeroLayoutId}`
export type HeroOptionKey = HeroLayoutOptionKey | HeroFeatureKey
export type HeroOptionTier = 'free' | 'pro'
export type HeroOptionTiers = Record<HeroOptionKey, HeroOptionTier>

export const layoutOptionKey = (layout: HeroLayoutId): HeroLayoutOptionKey => `layout:${layout}`

export const HERO_OPTION_KEYS: readonly HeroOptionKey[] = [
  ...HERO_LAYOUT_IDS.map(layoutOptionKey),
  ...HERO_FEATURE_KEYS,
]

export const HERO_FEATURE_LABELS: Record<HeroFeatureKey, { name: string; description: string }> = {
  pin_on_scroll: { name: 'תמונה קבועה בגלילה', description: 'התמונה נשארת במקום ושאר העמוד מחליק מעליה' },
  transition: { name: 'סגנון מעבר בין תמונות', description: 'זום איטי או חיתוך חד במקום עמעום' },
  speed: { name: 'קצב החלפת התמונות', description: 'כל 3 או 8 שניות במקום 5' },
  title_size: { name: 'גודל הכותרת', description: 'כותרת קטנה או גדולה מהרגיל' },
  shade: { name: 'הכהיית התמונה מתחת לטקסט', description: 'בפריסות שבהן הטקסט יושב על התמונה' },
  hide_eyebrow: { name: 'הסתרת שם הצלמת מעל הכותרת', description: 'ברירת המחדל: מוצג' },
  hide_secondary_cta: { name: 'הסתרת הכפתור השני', description: 'ברירת המחדל: מוצג' },
  hide_scroll_cue: { name: 'הסתרת סימן "גללו"', description: 'בפריסות שבהן הטקסט יושב על התמונה' },
}

/** Code defaults — used for any key missing from `hero_option_tiers`. Matches the migration seed. */
export const DEFAULT_HERO_OPTION_TIERS: HeroOptionTiers = {
  'layout:cinema': 'free',
  'layout:split': 'free',
  'layout:frame': 'pro',
  'layout:arch': 'pro',
  'layout:trio': 'pro',
  'layout:mag': 'pro',
  'layout:film': 'pro',
  'layout:pano': 'pro',
  pin_on_scroll: 'pro',
  transition: 'pro',
  speed: 'free',
  title_size: 'pro',
  shade: 'pro',
  hide_eyebrow: 'free',
  hide_secondary_cta: 'free',
  hide_scroll_cue: 'free',
}

const KNOWN_OPTION_KEYS = new Set<string>(HERO_OPTION_KEYS)

export function isHeroOptionKey(value: unknown): value is HeroOptionKey {
  return typeof value === 'string' && KNOWN_OPTION_KEYS.has(value)
}

/** DB rows → full tier map; unknown keys and bad tiers are ignored. */
export function normalizeHeroOptionTiers(
  rows: ReadonlyArray<{ option_key: string; tier: string }> | null | undefined
): HeroOptionTiers {
  const tiers = { ...DEFAULT_HERO_OPTION_TIERS }
  for (const row of rows ?? []) {
    if (isHeroOptionKey(row.option_key) && (row.tier === 'free' || row.tier === 'pro')) {
      tiers[row.option_key] = row.tier
    }
  }
  return tiers
}

/** Whether an option has any effect on the given layout. */
export function heroFeatureApplies(key: HeroFeatureKey, layout: HeroLayoutId): boolean {
  if (key === 'pin_on_scroll') return PINNABLE_HERO_LAYOUTS.has(layout)
  if (key === 'shade' || key === 'hide_scroll_cue') return TEXT_ON_PHOTO_HERO_LAYOUTS.has(layout)
  return true
}

function heroFeatureChanged(key: HeroFeatureKey, settings: HeroSettings): boolean {
  const d = DEFAULT_HERO_OPTIONS
  switch (key) {
    case 'pin_on_scroll': return settings.pinOnScroll !== d.pinOnScroll
    case 'transition': return settings.transition !== d.transition
    case 'speed': return settings.speedSeconds !== d.speedSeconds
    case 'title_size': return settings.titleSize !== d.titleSize
    case 'shade': return settings.shade !== d.shade
    case 'hide_eyebrow': return settings.showEyebrow !== d.showEyebrow
    case 'hide_secondary_cta': return settings.showSecondaryCta !== d.showSecondaryCta
    case 'hide_scroll_cue': return settings.showScrollCue !== d.showScrollCue
  }
}

/** Every gated option the settings actually use: the layout itself + each changed option that applies to it. */
export function heroOptionsInUse(settings: HeroSettings): HeroOptionKey[] {
  return [
    layoutOptionKey(settings.layout),
    ...HERO_FEATURE_KEYS.filter((key) => heroFeatureApplies(key, settings.layout) && heroFeatureChanged(key, settings)),
  ]
}

export function proHeroOptionsInUse(settings: HeroSettings, tiers: HeroOptionTiers): HeroOptionKey[] {
  return heroOptionsInUse(settings).filter((key) => tiers[key] === 'pro')
}

/** Hebrew label of an option key, for "you picked PRO options: …" messages. */
export function heroOptionLabel(key: HeroOptionKey): string {
  if (key.startsWith('layout:')) return `פריסת ${HERO_LAYOUT_LABELS[key.slice(7) as HeroLayoutId].name}`
  return HERO_FEATURE_LABELS[key as HeroFeatureKey].name
}

/**
 * What the public site actually renders: the saved settings, or null (the
 * theme's own hero) when there are none or the studio isn't allowed every
 * option they use.
 */
export function resolveHeroSettingsForRender(
  raw: unknown,
  tiers: HeroOptionTiers,
  isPro: boolean
): HeroSettings | null {
  const settings = normalizeHeroSettings(raw)
  if (!settings) return null
  if (!isPro && proHeroOptionsInUse(settings, tiers).length > 0) return null
  return settings
}
