import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'
import { normalizeBeforeAfterDisplayStyle } from '@/lib/types/before-after-display-style'

/** See build-homepage-view-model.ts for the hard rule this file follows too. */
export type BeforeAfterViewModelInput = {
  photographer: {
    studio_name: string | null
    name: string | null
    logo_url: string | null
    should_color_logo: boolean | null
    accent_color: string | null
    heading_font: string | null
    about_title_font: string | null
    site_language: string | null
    gallery_layout_mode: string | null
    before_after_display_style: string | null
  }
  items: Array<{
    id: string
    title: string | null
    description: string | null
    originalImageUrl: string
    editedImageUrl: string
  }>
  homepagePath: string
  blogPath: string
  portfolioPath: string
  beforeAfterPath: string
  hasFaq: boolean
  hasPackages: boolean
  hasBlog: boolean
}

export type BeforeAfterViewModel = {
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
  hasPhotoEditComparisons: true

  pageTitle: string
  intro: string
  displayStyle: 'development' | 'split_slider'
  items: Array<{
    id: string
    title: string | null
    description: string | null
    originalImageUrl: string
    editedImageUrl: string
  }>
}

export function buildBeforeAfterViewModel(input: BeforeAfterViewModelInput): BeforeAfterViewModel {
  const p = input.photographer
  const language = resolveSiteLanguage(p.site_language)
  const displayStyle = normalizeBeforeAfterDisplayStyle(p.before_after_display_style)
  const pageTitle = language === 'en' ? 'Before & After Editing' : 'לפני ואחרי עיבוד'
  const intro =
    language === 'en'
      ? displayStyle === 'split_slider'
        ? 'Drag the divider to compare the original image with the final result.'
        : 'Move the lens and discover the path from the original image to the final result.'
      : displayStyle === 'split_slider'
        ? 'גררו את המחיצה והשוו בין התמונה המקורית לבין התוצאה הסופית.'
        : 'הזיזו את העדשה וגלו את הדרך מהתמונה המקורית אל התוצאה הסופית.'

  return {
    studioName: p.studio_name || p.name || '',
    logoUrl: p.logo_url,
    shouldColorLogo: Boolean(p.should_color_logo),
    accentColor: p.accent_color || '#7c3aed',
    headingFont: p.heading_font ?? null,
    aboutTitleFont: p.about_title_font ?? null,
    language,
    homepagePath: input.homepagePath,
    blogPath: input.blogPath,
    portfolioPath: input.portfolioPath,
    beforeAfterPath: input.beforeAfterPath,
    galleryLayoutMode: p.gallery_layout_mode === 'portfolio' ? 'portfolio' : 'separated',
    hasFaq: input.hasFaq,
    hasPackages: input.hasPackages,
    hasBlog: input.hasBlog,
    hasPhotoEditComparisons: true,

    pageTitle,
    intro,
    displayStyle,
    items: input.items,
  }
}
