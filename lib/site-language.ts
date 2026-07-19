export type SiteLanguage = 'he' | 'en'

export function resolveSiteLanguage(value: string | null | undefined): SiteLanguage {
  return value === 'en' ? 'en' : 'he'
}

export function isSiteLtr(language: SiteLanguage): boolean {
  return language === 'en'
}

export function siteHtmlAttrs(language: SiteLanguage): string {
  return language === 'en' ? 'dir="ltr" lang="en"' : 'dir="rtl" lang="he"'
}

export function contentDirAttr(language: SiteLanguage): string {
  return language === 'en' ? 'dir="ltr"' : 'dir="rtl"'
}

export function formatSiteDate(value: string, language: SiteLanguage): string {
  const locale = language === 'en' ? 'en-US' : 'he-IL'
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function galleryCardArrow(language: SiteLanguage): string {
  return language === 'en' ? '→' : '←'
}

type NavTarget = 'home' | 'gallery' | 'blog' | 'beforeAfter' | 'pricing' | 'faq' | 'contact'

export type SiteChromeCopy = {
  nav: Record<NavTarget, string>
  footer: {
    terms: string
    privacy: string
    accessibility: string
    rights: string
    studioSignupQuestion: string
    studioSignupButton: string
    modernTagline: string
  }
  viewAllPhotos: string
  viewAllPosts: string
  gallerySeriesLabel: string
  galleryViewCta: string
}

const HEBREW_CHROME: SiteChromeCopy = {
  nav: {
    home: 'בית',
    gallery: 'גלריות',
    blog: 'בלוג',
    beforeAfter: 'לפני ואחרי עיבוד',
    pricing: 'חבילות צילום',
    faq: 'שאלות נפוצות',
    contact: 'יצירת קשר',
  },
  footer: {
    terms: 'תקנון',
    privacy: 'פרטיות',
    accessibility: 'הצהרת נגישות',
    rights: 'כל הזכויות שמורות.',
    studioSignupQuestion: 'אהבתם את הסטודיו?',
    studioSignupButton: 'לפתיחת סטודיו משלכם',
    modernTagline: 'צילום אמנותי למותגים ואנשים.',
  },
  viewAllPhotos: 'לכל התמונות',
  viewAllPosts: 'לכל הפוסטים',
  gallerySeriesLabel: 'סדרה',
  galleryViewCta: 'לצפייה בגלריה',
}

const ENGLISH_CHROME: SiteChromeCopy = {
  nav: {
    home: 'Home',
    gallery: 'Galleries',
    blog: 'Blog',
    beforeAfter: 'Before & After',
    pricing: 'Packages',
    faq: 'FAQ',
    contact: 'Contact',
  },
  footer: {
    terms: 'Terms',
    privacy: 'Privacy',
    accessibility: 'Accessibility',
    rights: 'All rights reserved.',
    studioSignupQuestion: 'Love this studio?',
    studioSignupButton: 'Open your own studio',
    modernTagline: 'Art photography for brands and people.',
  },
  viewAllPhotos: 'View All',
  viewAllPosts: 'All Posts',
  gallerySeriesLabel: 'Series',
  galleryViewCta: 'View Gallery',
}

export function getSiteChromeCopy(language: SiteLanguage): SiteChromeCopy {
  return language === 'en' ? ENGLISH_CHROME : HEBREW_CHROME
}

export function portfolioNavLabel(
  language: SiteLanguage,
  layoutMode: 'separated' | 'portfolio'
): string {
  const copy = getSiteChromeCopy(language)
  if (layoutMode === 'portfolio') {
    return language === 'en' ? 'Portfolio' : 'תיק עבודות'
  }
  return copy.nav.gallery
}
