import type { Metadata } from 'next'
import { buildCanonicalUrl } from '@/lib/seo/public-metadata'

export const MARKETING_SEO_TITLE =
  'סטודיו גלריה | בניית אתר לצלמות בקלות, גלריות תמונות דיגיטליות ותיק עבודות מעוצב'

export const MARKETING_SEO_DESCRIPTION =
  'מחפשת בניית אתר לצלמת בקלות ובחינם? הקימי אתר תדמית מקצועי ב-10 דקות! מערכת מתקדמת לניהול גלריות ציבוריות ופרטיות, שיתוף תמונות עם לקוחות, בחירת תמונות לעיבוד באיכות שיא והגנה מלאה בסימני מים.'

export const MARKETING_SEO_KEYWORDS = [
  'בניית אתר לצלמת',
  'בניית אתר בחינם',
  'בניית אתר בקלות',
  'מערכת גלריות לצלמות',
  'אתר פורטפוליו לצלמים',
  'תיק עבודות לצלמת',
  'שיתוף תמונות עם לקוחות',
  'גלריה דיגיטלית לצלמים',
  'בחירת תמונות לעיבוד',
  'ניהול סטודיו לצילום',
  'גלריית תמונות עם סימן מים',
] as const

export const MARKETING_H1 =
  'בניית אתר לצלמות ב-10 דקות ומערכת גלריות דיגיטליות חכמה'

export const MARKETING_FEATURES = [
  {
    title: 'אתר תדמית מושלם ב-10 דקות',
    description:
      'סקשן ראשי, אודות, חבילות צילום, שאלות ותשובות וטופס קשר למייל — הכל מוכן להצגה מקצועית.',
  },
  {
    title: 'תיק עבודות וגלריות ציבוריות',
    description: 'תצוגת גריד מודרנית ולייטבוקס מלא ואיכותי להצגת העבודות שלך בצורה מרשימה.',
  },
  {
    title: 'הגנה מתקדמת על זכויות יוצרים',
    description: 'החלת סימן מים אוטומטי בלחיצת כפתור ישירות מהדפדפן — הגנה על התמונות שלך.',
  },
  {
    title: 'מערכת גלריות פרטיות וניהול לקוחות',
    description:
      'בקרוב! סביבה מאובטחת לבחירת תמונות לעיבוד ולאלבום בצורה קלה ומהירה.',
  },
] as const

export function buildMarketingMetadata(options?: {
  title?: string
  canonicalPath?: string
}): Metadata {
  const title = options?.title ?? MARKETING_SEO_TITLE
  const canonicalPath = options?.canonicalPath ?? '/'

  return {
    title,
    description: MARKETING_SEO_DESCRIPTION,
    keywords: [...MARKETING_SEO_KEYWORDS],
    alternates: {
      canonical: buildCanonicalUrl(canonicalPath),
    },
    openGraph: {
      title,
      description: MARKETING_SEO_DESCRIPTION,
      type: 'website',
      locale: 'he_IL',
      url: buildCanonicalUrl(canonicalPath),
    },
  }
}
