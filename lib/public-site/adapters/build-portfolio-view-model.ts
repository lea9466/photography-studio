import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'
import { resolvePortfolioGalleriesSectionTitle } from '@/lib/galleries-section-copy'

/** See build-homepage-view-model.ts for the hard rule this file follows too:
 * no Supabase/query/R2 imports — only reshapes values app/[slug]/portfolio/page.tsx
 * has already entitlement-gated and URL-resolved by the time it's called. */
export type PortfolioViewModelInput = {
  photographer: {
    studio_name: string | null
    name: string | null
    logo_url: string | null
    should_color_logo: boolean | null
    accent_color: string | null
    heading_font: string | null
    about_title_font: string | null
    site_language: string | null
    galleries_title: string | null
    contact_card_title: string | null
    contact_card_description: string | null
    gallery_layout_mode: string | null
  }
  photos: Array<{
    id: string
    url: string
    galleryId: string
    galleryName: string
    width?: number | null
    height?: number | null
  }>
  galleryNames: string[]
  homepagePath: string
  portfolioPath: string
  blogPath: string
  beforeAfterPath: string
  hasFaq: boolean
  hasPackages: boolean
  hasBlog: boolean
  hasPhotoEditComparisons: boolean
}

export type PortfolioViewModel = {
  studioName: string
  logoUrl: string | null
  shouldColorLogo: boolean
  accentColor: string
  headingFont: string | null
  aboutTitleFont: string | null
  language: SiteLanguage
  homepagePath: string
  portfolioPath: string
  blogPath: string
  beforeAfterPath: string
  galleryLayoutMode: 'separated' | 'portfolio'
  hasFaq: boolean
  hasPackages: boolean
  hasBlog: boolean
  hasPhotoEditComparisons: boolean

  pageTitle: string
  sectionTitle: string | null
  photos: Array<{
    id: string
    url: string
    galleryId: string
    galleryName: string
    width?: number | null
    height?: number | null
  }>
  galleryNames: string[]
  contactCardTitle: string | null
  contactCardDescription: string | null
}

export function buildPortfolioViewModel(input: PortfolioViewModelInput): PortfolioViewModel {
  const p = input.photographer

  return {
    studioName: p.studio_name || p.name || '',
    logoUrl: p.logo_url,
    shouldColorLogo: Boolean(p.should_color_logo),
    accentColor: p.accent_color || '#7c3aed',
    headingFont: p.heading_font ?? null,
    aboutTitleFont: p.about_title_font ?? null,
    language: resolveSiteLanguage(p.site_language),
    homepagePath: input.homepagePath,
    portfolioPath: input.portfolioPath,
    blogPath: input.blogPath,
    beforeAfterPath: input.beforeAfterPath,
    galleryLayoutMode: p.gallery_layout_mode === 'portfolio' ? 'portfolio' : 'separated',
    hasFaq: input.hasFaq,
    hasPackages: input.hasPackages,
    hasBlog: input.hasBlog,
    hasPhotoEditComparisons: input.hasPhotoEditComparisons,

    pageTitle: 'תיק עבודות',
    sectionTitle: resolvePortfolioGalleriesSectionTitle(p.galleries_title),
    photos: input.photos,
    galleryNames: input.galleryNames,
    contactCardTitle: p.contact_card_title,
    contactCardDescription: p.contact_card_description,
  }
}
