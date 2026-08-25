import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'

/** See build-homepage-view-model.ts for the hard rule this file follows too. */
export type BlogPostViewModelInput = {
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
  }
  post: {
    id: string
    title: string
    subtitle: string | null
    content: string
    date: string
    coverUrl: string | null
    images: string[]
  }
  postPath: string
  prevPost: { id: string; title: string; coverUrl: string | null; postPath: string } | null
  nextPost: { id: string; title: string; coverUrl: string | null; postPath: string } | null
  homepagePath: string
  blogPath: string
  portfolioPath: string
  beforeAfterPath: string
  hasFaq: boolean
  hasPackages: boolean
  hasPhotoEditComparisons: boolean
}

export type BlogPostViewModel = {
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
  hasBlog: true
  hasPhotoEditComparisons: boolean

  post: {
    id: string
    title: string
    subtitle: string | null
    content: string
    date: string
    coverUrl: string | null
    images: string[]
  }
  postPath: string
  prevPost: { id: string; title: string; coverUrl: string | null; href: string } | null
  nextPost: { id: string; title: string; coverUrl: string | null; href: string } | null
}

export function buildBlogPostViewModel(input: BlogPostViewModelInput): BlogPostViewModel {
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
    blogPath: input.blogPath,
    portfolioPath: input.portfolioPath,
    beforeAfterPath: input.beforeAfterPath,
    galleryLayoutMode: p.gallery_layout_mode === 'portfolio' ? 'portfolio' : 'separated',
    hasFaq: input.hasFaq,
    hasPackages: input.hasPackages,
    hasBlog: true,
    hasPhotoEditComparisons: input.hasPhotoEditComparisons,

    post: input.post,
    postPath: input.postPath,
    prevPost: input.prevPost
      ? {
          id: input.prevPost.id,
          title: input.prevPost.title,
          coverUrl: input.prevPost.coverUrl,
          href: input.prevPost.postPath,
        }
      : null,
    nextPost: input.nextPost
      ? {
          id: input.nextPost.id,
          title: input.nextPost.title,
          coverUrl: input.nextPost.coverUrl,
          href: input.nextPost.postPath,
        }
      : null,
  }
}
