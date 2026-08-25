import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'

/** See build-homepage-view-model.ts for the hard rule this file follows too
 * (also applies to the theme-agnostic note below: `postsPageTitle` is kept
 * raw here and resolved to its themed default in the per-theme shaper, not
 * hardcoded to one theme in this shared builder). */
export type BlogListViewModelInput = {
  photographer: {
    studio_name: string | null
    name: string | null
    logo_url: string | null
    should_color_logo: boolean | null
    accent_color: string | null
    heading_font: string | null
    about_title_font: string | null
    site_language: string | null
    posts_page_title: string | null
    gallery_layout_mode: string | null
  }
  posts: Array<{ id: string; title: string; content: string; date: string; coverUrl: string | null }>
  homepagePath: string
  blogPath: string
  portfolioPath: string
  beforeAfterPath: string
  hasFaq: boolean
  hasPackages: boolean
  hasPhotoEditComparisons: boolean
}

export type BlogListViewModel = {
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

  /** Raw DB value — theme-aware default fallback happens in the per-theme
   * shaper (resolvePostsPageTitle), not here. */
  postsPageTitle: string | null
  posts: Array<{ id: string; title: string; date: string; excerpt: string; coverUrl: string | null }>
}

export function buildBlogListViewModel(input: BlogListViewModelInput): BlogListViewModel {
  const p = input.photographer
  const language = resolveSiteLanguage(p.site_language)

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
    hasBlog: true,
    hasPhotoEditComparisons: input.hasPhotoEditComparisons,

    postsPageTitle: p.posts_page_title,
    posts: input.posts.map((post) => ({
      id: post.id,
      title: post.title,
      date: post.date,
      excerpt: post.content,
      coverUrl: post.coverUrl,
    })),
  }
}
