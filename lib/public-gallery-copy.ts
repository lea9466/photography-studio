import type { SiteLanguage } from '@/lib/site-language'

export function formatGalleryMetaLine(
  photoCount: number,
  galleryDate: string,
  language: SiteLanguage
): string {
  const photosLabel =
    language === 'en'
      ? `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`
      : `${photoCount} תמונות`
  return `${photosLabel} • ${galleryDate}`
}

export function getPublicGalleryPageTitleSuffix(language: SiteLanguage): string {
  return language === 'en' ? 'Gallery' : 'גלריה'
}

export function getPublicGalleryContactLabel(language: SiteLanguage): string {
  return language === 'en' ? 'Contact' : 'יצירת קשר'
}

export function getPublicGalleryLightboxCopy(language: SiteLanguage) {
  return language === 'en'
    ? { close: 'Close', prev: 'Previous photo', next: 'Next photo' }
    : { close: 'סגור', prev: 'תמונה קודמת', next: 'תמונה הבאה' }
}

export function getPublicGalleryDefaultCta(language: SiteLanguage) {
  return language === 'en'
    ? {
        title: 'Ready to create something extraordinary?',
        description:
          'We are available for special projects. Let\u2019s plan your next story together.',
      }
    : {
        title: 'מוכנים ליצור משהו יוצא דופן?',
        description:
          'אנחנו זמינים לצילום פרויקטים מיוחדים. בואו נתכנן יחד את הסיפור הבא שלכם.',
      }
}
