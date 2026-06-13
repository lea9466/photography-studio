import { THEME_LABELS, usesFullBleedHero, type ThemeStyle } from '@/lib/theme-styles'

export type OrientationHint = 'רוחבי' | 'עומד'

export type ThemeImageHints = {
  logo: OrientationHint
  desktop: OrientationHint
  mobile: OrientationHint
  galleryCover: OrientationHint
}

export function getThemeImageHints(theme: ThemeStyle): ThemeImageHints {
  const fullBleed = usesFullBleedHero(theme)
  return {
    logo: 'רוחבי',
    desktop: fullBleed ? 'רוחבי' : 'עומד',
    mobile: 'עומד',
    galleryCover: 'עומד',
  }
}

export function formatThemeImageHints(theme: ThemeStyle): string {
  const hints = getThemeImageHints(theme)
  const themeName = THEME_LABELS[theme]
  if (usesFullBleedHero(theme)) {
    return `ערכת ${themeName}: בראש האתר — רקע מסך מלא רוחבי (דסקטופ). מובייל — תמונה עומדת נפרדת. בסקשן אודות — תמונה עומדת נפרדת. לוגו — ${hints.logo}.`
  }
  return `ערכת ${themeName}: Hero — תמונת פורטרט בראש. מובייל — ${hints.mobile}. אודות — תמונה עומדת נפרדת מתחת. לוגו — ${hints.logo}.`
}

/** מידות מומלצות להעלאה — גובה התצוגה נגזר מ-16:9 ב-CSS (ראו globals.css --hero-media-height) */
export const HERO_DESKTOP_RECOMMENDED = '1920×1080 (16:9)'
export const HERO_MOBILE_RECOMMENDED = '1080×1440 (3:4)'

export function heroDesktopUploadDescription(theme: ThemeStyle): string {
  if (usesFullBleedHero(theme)) {
    return `רקע רוחב מלא בכניסה לאתר — מומלץ ${HERO_DESKTOP_RECOMMENDED}. מוצגת ברוחב מלא בגובה יחסי (לא מעוכת).`
  }
  return 'תמונת פורטרט גדולה בראש האתר — עומדת (4:5). לא מוצגת בסקשן אודות.'
}

export function heroMobileUploadDescription(theme: ThemeStyle): string {
  if (usesFullBleedHero(theme)) {
    return `תמונה נפרדת למובייל — מומלץ ${HERO_MOBILE_RECOMMENDED}.`
  }
  return `תמונת Hero למובייל — מומלץ ${HERO_MOBILE_RECOMMENDED}.`
}

export const ABOUT_IMAGE_RECOMMENDED = '1080×1350 (4:5)'

export function aboutImageUploadDescription(): string {
  return `תמונה בסקשן "אודות" — מתחת ל-Hero. מומלץ ${ABOUT_IMAGE_RECOMMENDED}, עומדת.`
}

