import { SITE_SETTINGS_HELP } from '@/lib/dashboard/site-settings-help'

// Plain data mirror of components/dashboard/dashboard-nav-config.tsx's
// DASHBOARD_NAV_ITEMS (label + href only). Kept separate instead of
// importing that file directly because it's a 'use client' module with JSX
// icons — this file is server-only and just needs the two plain fields.
// Keep in sync if sidebar tabs are renamed/added/removed.
const DASHBOARD_TABS = [
  { label: 'לוח בקרה', href: '/dashboard' },
  { label: 'לקוחות', href: '/dashboard/clients' },
  { label: 'גלריות', href: '/dashboard/galleries' },
  { label: 'פוסטים', href: '/dashboard/posts' },
  { label: 'חבילות צילום', href: '/dashboard/packages' },
  { label: 'תגובות (המלצות לקוחות)', href: '/dashboard/reviews' },
  { label: 'לפני ואחרי עיבוד', href: '/dashboard/photo-edits' },
  { label: 'שאלות נפוצות', href: '/dashboard/faq' },
  { label: 'הגדרות אתר', href: '/dashboard/settings' },
  { label: 'מינוי', href: '/dashboard/subscription' },
  { label: 'יצירת קשר (פניות שהתקבלו)', href: '/dashboard/contact' },
  { label: 'אודות — גלריות פרטיות (מדריך מאויר)', href: '/dashboard/about/private-galleries' },
  { label: 'אודות — האתר הציבורי (מדריך מאויר)', href: '/dashboard/about/public-site' },
] as const

// Human labels for SITE_SETTINGS_HELP.fields keys — that object already has
// accurate "where does this show up" copy (the same text shown in the
// dashboard's own help tooltips), we just need a short display label per key.
const SETTINGS_FIELD_LABELS: Record<string, string> = {
  studioName: 'שם הסטודיו',
  slug: 'כתובת אתר (Slug)',
  email: 'אימייל',
  phone: 'טלפון',
  address: 'כתובת / אזור שירות',
  heroDesktop: 'תמונות הירו — דסקטופ',
  heroMobile: 'תמונות הירו — מובייל',
  aboutImage: 'תמונת אודות',
  contactBgDesktop: 'רקע סקשן יצירת קשר — דסקטופ',
  contactBgMobile: 'רקע סקשן יצירת קשר — מובייל',
  contactSectionTitle: 'כותרת סקשן יצירת קשר',
  contactSectionSubtitle: 'תת-כותרת סקשן יצירת קשר',
  packagesBgDesktop: 'רקע סקשן חבילות — דסקטופ',
  packagesBgMobile: 'רקע סקשן חבילות — מובייל',
  aboutText: 'טקסט קצר באזור ההירו',
  photographerName: 'שם הצלמ/ת',
  accentColor: 'צבע מותג',
  theme: 'ערכת עיצוב',
  headingFont: 'פונט כותרות',
  aboutTitleFont: 'פונט כותרת אודות',
  logo: 'לוגו',
  shouldColorLogo: 'צביעת הלוגו בצבע המותג',
  siteLanguage: 'שפת האתר',
  aboutTitle: 'כותרת אודות',
  aboutSubtitle: 'כותרת משנה באודות',
  aboutDescription: 'תיאור אודות',
  stats: 'שורת נתונים (סטטיסטיקות)',
  statClients: 'מספר לקוחות',
  statProjects: 'מספר פרויקטים',
  statExperience: 'שנות ניסיון',
  contactCardTitle: 'כותרת כרטיס יצירת קשר (בגלריה)',
  contactCardDescription: 'תיאור כרטיס יצירת קשר (בגלריה)',
}

export function formatNavigationReference(): string {
  const tabsList = DASHBOARD_TABS.map((tab) => `- "${tab.label}" → ${tab.href}`).join('\n')

  const settingsFieldsList = Object.entries(SITE_SETTINGS_HELP.fields)
    .map(([key, help]) => `- ${SETTINGS_FIELD_LABELS[key] ?? key}: ${help.where}`)
    .join('\n')

  return [
    'מפת ניווט של הדשבורד — לשימוש כשמסבירים איפה למצוא משהו או כשמתבקשים לתת קישור. הקישורים הם נתיבים יחסיים בתוך האתר עצמו (למשל /dashboard/reviews) — כתבי אותם בדיוק ככה בטקסט התשובה, לא כ-URL מלא ולא בפורמט markdown, כדי שיהפכו אוטומטית לקישור לחיצה בממשק. לעולם אל תמציאי נתיב שאינו ברשימה.',
    tabsList,
    '',
    'בתוך עמוד "הגדרות אתר" (/dashboard/settings) יש הרבה שדות בעמוד ארוך אחד שצריך לגלול אליו כדי למצוא — הנה איפה כל שדה מופיע בפועל באתר הציבורי, כדי שתוכלי להנחות בדיוק לאן לגלול:',
    settingsFieldsList,
  ].join('\n')
}
