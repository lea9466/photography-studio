/** The client-facing gallery page's hero layout — a studio-wide choice, saved on `users.client_page_hero_style`. */
export const CLIENT_PAGE_HERO_STYLES = ['centered', 'bottom_right', 'below_photo'] as const

export type ClientPageHeroStyle = (typeof CLIENT_PAGE_HERO_STYLES)[number]

export const DEFAULT_CLIENT_PAGE_HERO_STYLE: ClientPageHeroStyle = 'centered'

export const CLIENT_PAGE_HERO_STYLE_LABELS: Record<ClientPageHeroStyle, { name: string; description: string }> = {
  centered: {
    name: 'ממורכז',
    description: 'לוגו קטן למעלה, כותרת גדולה במרכז עם קו הדגשה בצבע שלך',
  },
  bottom_right: {
    name: 'אסימטרי למטה',
    description: 'הלוגו והשם נצמדים לפינה למטה, על גרדיאנט עדין',
  },
  below_photo: {
    name: 'טקסט מתחת לתמונה',
    description: 'התמונה נשארת נקייה, הלוגו והשם יושבים מתחתיה',
  },
}

export function isClientPageHeroStyle(value: unknown): value is ClientPageHeroStyle {
  return typeof value === 'string' && (CLIENT_PAGE_HERO_STYLES as readonly string[]).includes(value)
}

/** A saved value, or the default when it's null/invalid. */
export function resolveClientPageHeroStyle(value: string | null | undefined): ClientPageHeroStyle {
  return isClientPageHeroStyle(value) ? value : DEFAULT_CLIENT_PAGE_HERO_STYLE
}
