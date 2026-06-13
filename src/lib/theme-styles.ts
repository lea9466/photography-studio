import type { CSSProperties } from 'react'

export type ThemeStyle = 'minimalist' | 'cinematic' | 'warm' | 'creative'

export const THEME_STYLES: ThemeStyle[] = [
  'minimalist',
  'cinematic',
  'warm',
  'creative',
]

export const THEME_LABELS: Record<ThemeStyle, string> = {
  minimalist: 'מינימליסטי',
  cinematic: 'קולנועי',
  warm: 'חם',
  creative: 'יצירתי',
}

export const THEME_MANAGED_PROPS = [
  '--bg-primary',
  '--text-primary',
  '--color-brand',
  '--color-accent',
  '--color-rose',
  '--color-champagne',
  '--color-card',
  '--color-muted',
  '--color-muted-foreground',
  '--color-border',
  '--color-secondary',
  '--gradient-soft',
  '--font-family',
  '--font-display',
  '--img-radius',
] as const

type ThemeVars = Record<(typeof THEME_MANAGED_PROPS)[number], string>

const THEME_CSS_VARS: Record<ThemeStyle, ThemeVars> = {
  minimalist: {
    '--bg-primary': 'oklch(1 0 0)',
    '--text-primary': 'oklch(0.22 0.005 280)',
    '--color-brand': 'oklch(0.22 0.005 280)',
    '--color-accent': 'oklch(0.22 0.005 280)',
    '--color-rose': 'oklch(0.22 0.005 280)',
    '--color-champagne': 'oklch(0.96 0.002 280)',
    '--color-card': 'oklch(1 0 0)',
    '--color-muted': 'oklch(0.96 0.002 280)',
    '--color-muted-foreground': 'oklch(0.52 0.005 280)',
    '--color-border': 'oklch(0.88 0.003 280)',
    '--color-secondary': 'oklch(0.96 0.002 280)',
    '--gradient-soft':
      'linear-gradient(135deg, oklch(1 0 0), oklch(0.94 0.002 280))',
    '--font-family': "'Heebo', system-ui, sans-serif",
    '--font-display': "'Frank Ruhl Libre', 'Cormorant Garamond', serif",
    '--img-radius': '0px',
  },
  cinematic: {
    '--bg-primary': 'oklch(0.14 0.005 280)',
    '--text-primary': 'oklch(0.96 0.005 80)',
    '--color-brand': 'oklch(0.65 0.22 25)',
    '--color-accent': 'oklch(0.65 0.22 25)',
    '--color-rose': 'oklch(0.62 0.22 25)',
    '--color-champagne': 'oklch(0.28 0.01 280)',
    '--color-card': 'oklch(0.19 0.008 280)',
    '--color-muted': 'oklch(0.17 0.008 280)',
    '--color-muted-foreground': 'oklch(0.68 0.012 80)',
    '--color-border': 'oklch(0.28 0.01 280)',
    '--color-secondary': 'oklch(0.17 0.008 280)',
    '--gradient-soft':
      'linear-gradient(135deg, oklch(0.19 0.008 280), oklch(0.14 0.005 280))',
    '--font-family': "'Heebo', system-ui, sans-serif",
    '--font-display': "'Playfair Display', serif",
    '--img-radius': '0px',
  },
  warm: {
    '--bg-primary': 'oklch(0.985 0.008 75)',
    '--text-primary': 'oklch(0.32 0.04 40)',
    '--color-brand': 'oklch(0.58 0.07 55)',
    '--color-accent': 'oklch(0.58 0.07 55)',
    '--color-rose': 'oklch(0.78 0.06 45)',
    '--color-champagne': 'oklch(0.88 0.04 75)',
    '--color-card': 'oklch(0.99 0.006 75)',
    '--color-muted': 'oklch(0.96 0.012 75)',
    '--color-muted-foreground': 'oklch(0.5 0.03 45)',
    '--color-border': 'oklch(0.9 0.018 60)',
    '--color-secondary': 'oklch(0.97 0.01 75)',
    '--gradient-soft':
      'linear-gradient(135deg, oklch(0.985 0.008 75), oklch(0.94 0.02 70))',
    '--font-family': "'Heebo', system-ui, sans-serif",
    '--font-display': "'DM Serif Display', serif",
    '--img-radius': '28px',
  },
  creative: {
    '--bg-primary': 'oklch(0.97 0.005 90)',
    '--text-primary': 'oklch(0.16 0.01 280)',
    '--color-brand': 'oklch(0.16 0.01 280)',
    '--color-accent': 'oklch(0.85 0.2 95)',
    '--color-rose': 'oklch(0.55 0.25 300)',
    '--color-champagne': 'oklch(0.96 0.01 90)',
    '--color-card': 'oklch(1 0 0)',
    '--color-muted': 'oklch(0.96 0.006 90)',
    '--color-muted-foreground': 'oklch(0.48 0.02 280)',
    '--color-border': 'oklch(0.16 0.01 280)',
    '--color-secondary': 'oklch(0.96 0.006 90)',
    '--gradient-soft':
      'linear-gradient(135deg, oklch(0.97 0.005 90), oklch(0.94 0.01 90))',
    '--font-family': "'Space Grotesk', system-ui, sans-serif",
    '--font-display': "'Space Grotesk', sans-serif",
    '--img-radius': '0px',
  },
}

/** צבעי ברירת מחדל לכל ערכת עיצוב — מוצעים ביצירת צלם חדש */
export const THEME_DEFAULT_COLORS: Record<
  ThemeStyle,
  { primary: string; secondary: string }
> = {
  minimalist: { primary: '#1a1a1a', secondary: '#f5f5f5' },
  cinematic: { primary: '#d94a3d', secondary: '#2a2a2e' },
  warm: { primary: '#a8836a', secondary: '#e8d9c6' },
  creative: { primary: '#5b3df5', secondary: '#fde047' },
}

export type PhotographerColors = {
  primaryColor?: string | null
  secondaryColor?: string | null
}

function isValidCssColor(value: string | undefined | null): value is string {
  if (!value?.trim()) return false
  return (
    /^#[0-9a-fA-F]{3,8}$/.test(value.trim()) ||
    value.trim().startsWith('oklch(') ||
    value.trim().startsWith('rgb')
  )
}

function applyPhotographerColors(
  vars: ThemeVars,
  colors?: PhotographerColors
): ThemeVars {
  const next = { ...vars }
  const primary = colors?.primaryColor?.trim()
  const secondary = colors?.secondaryColor?.trim()
  const bg = next['--bg-primary']

  if (isValidCssColor(primary)) {
    next['--color-brand'] = primary
    next['--color-accent'] = primary
    next['--color-rose'] = primary
  }

  if (isValidCssColor(secondary)) {
    next['--color-champagne'] = secondary
    next['--color-secondary'] = `color-mix(in oklab, ${secondary} 28%, ${bg})`
    next['--gradient-soft'] =
      `linear-gradient(135deg, color-mix(in oklab, ${primary ?? secondary} 10%, ${bg}), color-mix(in oklab, ${secondary} 22%, ${bg}))`
  } else if (isValidCssColor(primary)) {
    next['--gradient-soft'] =
      `linear-gradient(135deg, color-mix(in oklab, ${primary} 8%, ${bg}), color-mix(in oklab, ${primary} 18%, ${bg}))`
  }

  return next
}

/** ערכות עם רקע Hero מלא (טריפטיכון + טקסט מעל) */
export const FULL_BLEED_HERO_THEMES: ThemeStyle[] = ['cinematic', 'warm']

/** ערכות עם תמונת פורטרט בצד (כמו efrat) */
export const PORTRAIT_HERO_THEMES: ThemeStyle[] = ['minimalist', 'creative']

export function usesFullBleedHero(theme: ThemeStyle): boolean {
  return FULL_BLEED_HERO_THEMES.includes(theme)
}

export function parseThemeStyle(value: string | null | undefined): ThemeStyle {
  if (value && value in THEME_CSS_VARS) {
    return value as ThemeStyle
  }
  return 'warm'
}

export function getThemeCssVars(
  theme: ThemeStyle,
  colors?: PhotographerColors
): CSSProperties {
  const vars = applyPhotographerColors(THEME_CSS_VARS[theme], colors)
  return { ...vars } as CSSProperties
}

/** משתני ערכת עיצוב + רקע, טקסט וגופן לתגית body */
export function getThemeBodyStyle(
  theme: ThemeStyle,
  colors?: PhotographerColors
): CSSProperties {
  const vars = applyPhotographerColors(THEME_CSS_VARS[theme], colors)
  return {
    ...vars,
    backgroundColor: vars['--bg-primary'],
    color: vars['--text-primary'],
    fontFamily: vars['--font-family'],
  } as CSSProperties
}
