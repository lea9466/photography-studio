import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'

/** See build-homepage-view-model.ts for the hard rule this file follows too. */
export type GalleryDetailViewModelInput = {
  photographer: {
    studio_name: string | null
    logo_url: string | null
    should_color_logo: boolean | null
    accent_color: string | null
    heading_font: string | null
    about_title_font: string | null
    site_language: string | null
    gallery_layout_mode: string | null
    contact_card_title: string | null
    contact_card_description: string | null
  }
  gallery: {
    title: string
    photoCount: number
    galleryDate: string
    photos: Array<{ id: string; url: string | null }>
  }
  homepagePath: string
  blogPath: string
  portfolioPath: string
  beforeAfterPath: string
  hasFaq: boolean
  hasPackages: boolean
  hasBlog: boolean
  hasPhotoEditComparisons: boolean
}

export type GalleryDetailViewModel = {
  studioName: string
  logoUrl: string | null
  shouldColorLogo: boolean
  accentColor: string
  headingFont: string | null
  aboutTitleFont: string | null
  language: SiteLanguage
  homepagePath: string
  blogPath: string
  portfolioPath: string
  beforeAfterPath: string
  galleryLayoutMode: 'separated' | 'portfolio'
  hasFaq: boolean
  hasPackages: boolean
  hasBlog: boolean
  hasPhotoEditComparisons: boolean

  title: string
  photoCount: number
  galleryDate: string
  photos: Array<{ id: string; url: string }>
  contactCardTitle: string | null
  contactCardDescription: string | null
}

export function buildGalleryDetailViewModel(input: GalleryDetailViewModelInput): GalleryDetailViewModel {
  const p = input.photographer

  return {
    studioName: p.studio_name || '',
    logoUrl: p.logo_url,
    shouldColorLogo: Boolean(p.should_color_logo),
    accentColor: p.accent_color || '#7c3aed',
    headingFont: p.heading_font ?? null,
    aboutTitleFont: p.about_title_font ?? null,
    language: resolveSiteLanguage(p.site_language),
    homepagePath: input.homepagePath,
    blogPath: input.blogPath,
    portfolioPath: input.portfolioPath,
    beforeAfterPath: input.beforeAfterPath,
    galleryLayoutMode: p.gallery_layout_mode === 'portfolio' ? 'portfolio' : 'separated',
    hasFaq: input.hasFaq,
    hasPackages: input.hasPackages,
    hasBlog: input.hasBlog,
    hasPhotoEditComparisons: input.hasPhotoEditComparisons,

    title: input.gallery.title,
    photoCount: input.gallery.photoCount,
    galleryDate: input.gallery.galleryDate,
    photos: input.gallery.photos
      .filter((photo): photo is { id: string; url: string } => Boolean(photo.url))
      .map((photo) => ({ id: photo.id, url: photo.url })),
    contactCardTitle: p.contact_card_title,
    contactCardDescription: p.contact_card_description,
  }
}
