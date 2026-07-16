import type { SiteLanguage } from '@/lib/site-language'

export const RECENT_PHOTOS_SECTION_DEFAULTS: Record<string, string> = {
  elegant: 'תמונות אחרונות',
  modern: 'תמונות אחרונות',
  classic: 'תמונות אחרונות',
  dark: 'תמונות אחרונות',
}

export const RECENT_PHOTOS_SECTION_DEFAULTS_EN: Record<string, string> = {
  elegant: 'Recent Photos',
  modern: 'Recent Photos',
  classic: 'Recent Photos',
  dark: 'Recent Photos',
}

export function resolveRecentPhotosSectionTitle(
  theme: string,
  recentPhotosTitle?: string | null,
  language: SiteLanguage = 'he',
) {
  const defaults =
    language === 'en'
      ? RECENT_PHOTOS_SECTION_DEFAULTS_EN
      : RECENT_PHOTOS_SECTION_DEFAULTS
  const fallback = defaults[theme] ?? defaults.elegant

  return recentPhotosTitle?.trim() || fallback
}
