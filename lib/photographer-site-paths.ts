import { getPublicSitePath } from '@/lib/queries/public-photographer'

export type PhotographerSiteTheme = 'elegant' | 'modern' | 'classic' | 'bold'

export function normalizeSiteTheme(theme: string | null | undefined): PhotographerSiteTheme {
  if (theme === 'modern' || theme === 'classic' || theme === 'bold' || theme === 'dark') {
    return theme === 'dark' ? 'bold' : theme
  }
  return 'elegant'
}

export function resolveHomepagePath(slug: string | null | undefined, studioName: string | null | undefined) {
  return getPublicSitePath(slug, studioName) ?? '/'
}

export function getSiteSectionIds(theme: PhotographerSiteTheme) {
  if (theme === 'modern') {
    return { home: '', gallery: 'portfolio', pricing: 'pricing', contact: 'contact' }
  }
  if (theme === 'classic') {
    return { home: '', gallery: 'galleries', pricing: 'pricing', contact: 'contact' }
  }
  return { home: '', gallery: 'gallery', pricing: 'pricing', contact: 'contact' }
}

export function homepageSectionHref(homepagePath: string, sectionId: string) {
  if (!sectionId) return homepagePath
  return `${homepagePath}#${sectionId}`
}
