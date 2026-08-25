import type { ClassicHomePageProps } from '@/components/photographer/themes/classic/ClassicHomePage'
import type { ClassicPortfolioPageProps } from '@/components/photographer/themes/classic/ClassicPortfolioPage'
import type { ClassicBlogListPageProps } from '@/components/photographer/themes/classic/ClassicBlogListPage'
import type { ClassicBlogPostPageProps } from '@/components/photographer/themes/classic/ClassicBlogPostPage'
import type { ClassicBeforeAfterPageProps } from '@/components/photographer/themes/classic/ClassicBeforeAfterPage'
import type { ClassicGalleryDetailPageProps } from '@/components/photographer/themes/classic/ClassicGalleryDetailPage'
import type { ClassicSiteHeaderProps } from '@/components/photographer/site-chrome/ClassicSiteHeader'
import type { ClassicSiteFooterProps } from '@/components/photographer/site-chrome/ClassicSiteFooter'
import type { HomepageViewModel } from '../build-homepage-view-model'
import type { PortfolioViewModel } from '../build-portfolio-view-model'
import type { BlogListViewModel } from '../build-blog-list-view-model'
import type { BlogPostViewModel } from '../build-blog-post-view-model'
import type { BeforeAfterViewModel } from '../build-before-after-view-model'
import type { GalleryDetailViewModel } from '../build-gallery-detail-view-model'
import type { SiteLanguage } from '@/lib/site-language'
import { resolveGalleriesSectionTitle } from '@/lib/galleries-section-copy'
import { resolveRecentPhotosSectionTitle } from '@/lib/recent-photos-section-copy'
import { resolvePostsPageTitle } from '@/lib/posts-section-copy'
import { resolvePackagesSectionCopy } from '@/lib/packages-section-copy'
import { resolveTestimonialsSectionTitle } from '@/lib/testimonials-section-copy'
import { resolveContactSectionCopy } from '@/lib/contact-section-copy'

const THEME = 'classic'

/** The subset of any page's view model the header/footer chrome actually
 * needs — every page-specific view model (HomepageViewModel,
 * PortfolioViewModel, etc.) satisfies this structurally, so
 * toClassicSiteHeaderProps/FooterProps work for all of them without a
 * separate shaper per page type. */
type ClassicChromeViewModel = {
  studioName: string
  logoUrl: string | null
  shouldColorLogo: boolean
  accentColor: string
  headingFont: string | null
  aboutTitleFont: string | null
  language: SiteLanguage
  homepagePath: string
  hasFaq: boolean
  hasPackages: boolean
  hasBlog: boolean
  blogPath: string
  hasPhotoEditComparisons: boolean
  beforeAfterPath: string
  galleryLayoutMode: 'separated' | 'portfolio'
  portfolioPath: string
}

/**
 * Thin, theme-specific shaper: HomepageViewModel -> classic's exact prop
 * names. `onContactSubmit`/`hrefForGallery`/`hrefForPost` are intentionally
 * left out here — the shell component supplies those (they're behavior, not
 * data reshaping).
 */
export function toClassicHomePageProps(
  vm: HomepageViewModel
): Omit<ClassicHomePageProps, 'onContactSubmit' | 'hrefForGallery' | 'hrefForPost'> {
  const packagesCopy = resolvePackagesSectionCopy(THEME, vm.packagesTitle, vm.packagesSubtitle, vm.language)
  const contactCopy = resolveContactSectionCopy(THEME, vm.contactTitle, vm.contactSubtitle, vm.language)

  return {
    studioName: vm.studioName,
    photographerName: vm.photographerName,
    logoUrl: vm.logoUrl,
    accentColor: vm.accentColor,
    language: vm.language,
    blogPath: vm.blogPath,
    portfolioPath: vm.portfolioPath,
    galleryLayoutMode: vm.galleryLayoutMode,

    heroDesktopImages: vm.heroDesktopImages,
    heroMobileImages: vm.heroMobileImages,
    heroVideoUrl: vm.heroVideoUrl,

    aboutText: vm.aboutText,
    aboutTitle: vm.aboutTitle,
    aboutSubtitle: vm.aboutSubtitle,
    aboutDescription: vm.aboutDescription,
    aboutImageUrl: vm.aboutImageUrl,
    statsClients: vm.statsClients,
    statsProjects: vm.statsProjects,
    statsYears: vm.statsYears,

    galleriesTitle: resolveGalleriesSectionTitle(THEME, vm.galleriesTitle, vm.language),
    galleries: vm.galleries,
    recentPhotosTitle: resolveRecentPhotosSectionTitle(THEME, vm.recentPhotosTitle, vm.language),
    recentPhotosGalleries: vm.recentPhotosGalleries,

    postsTitle: resolvePostsPageTitle(THEME, vm.postsTitle, vm.language),
    posts: vm.posts,

    packagesTitle: packagesCopy.title,
    packagesSubtitle: packagesCopy.subtitle,
    packages: vm.packages,

    testimonialsTitle: resolveTestimonialsSectionTitle(THEME, vm.testimonialsTitle, vm.language),
    testimonials: vm.testimonials,
    testimonialLayoutType: vm.testimonialLayoutType,

    faqItems: vm.faqItems,
    faqSectionImageUrl: vm.faqSectionImageUrl,

    phone: vm.phone,
    email: vm.email,
    address: vm.address,
    contactTitle: contactCopy.title,
    contactSubtitle: contactCopy.subtitle,
    contactDesktopUrl: vm.contactDesktopUrl,
    contactMobileUrl: vm.contactMobileUrl,
  }
}

export function toClassicSiteHeaderProps(vm: ClassicChromeViewModel): ClassicSiteHeaderProps {
  return {
    studioName: vm.studioName,
    logoUrl: vm.logoUrl,
    shouldColorLogo: vm.shouldColorLogo,
    primaryColor: vm.accentColor,
    headingFont: vm.headingFont,
    aboutTitleFont: vm.aboutTitleFont,
    homepagePath: vm.homepagePath,
    hasFaq: vm.hasFaq,
    hasPackages: vm.hasPackages,
    hasBlog: vm.hasBlog,
    blogPath: vm.blogPath,
    hasPhotoEditComparisons: vm.hasPhotoEditComparisons,
    beforeAfterPath: vm.beforeAfterPath,
    galleryLayoutMode: vm.galleryLayoutMode,
    portfolioPath: vm.portfolioPath,
    language: vm.language,
  }
}

export function toClassicSiteFooterProps(vm: ClassicChromeViewModel): ClassicSiteFooterProps {
  return {
    studioName: vm.studioName,
    logoUrl: vm.logoUrl,
    primaryColor: vm.accentColor,
    language: vm.language,
  }
}

export function toClassicPortfolioPageProps(vm: PortfolioViewModel): ClassicPortfolioPageProps {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    homepagePath: vm.homepagePath,
    pageTitle: vm.pageTitle,
    sectionTitle: vm.sectionTitle,
    photos: vm.photos,
    galleryNames: vm.galleryNames,
    contactCardTitle: vm.contactCardTitle,
    contactCardDescription: vm.contactCardDescription,
  }
}

export function toClassicBlogListPageProps(
  vm: BlogListViewModel
): Omit<ClassicBlogListPageProps, 'hrefForPost'> {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    pageTitle: resolvePostsPageTitle(THEME, vm.postsPageTitle, vm.language),
    displayStyle: vm.postsDisplayStyle,
    posts: vm.posts,
  }
}

export function toClassicBlogPostPageProps(vm: BlogPostViewModel): ClassicBlogPostPageProps {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    post: vm.post,
    postPath: vm.postPath,
    prevPost: vm.prevPost,
    nextPost: vm.nextPost,
  }
}

export function toClassicBeforeAfterPageProps(vm: BeforeAfterViewModel): ClassicBeforeAfterPageProps {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    pageTitle: vm.pageTitle,
    intro: vm.intro,
    displayStyle: vm.displayStyle,
    items: vm.items,
  }
}

export function toClassicGalleryDetailPageProps(vm: GalleryDetailViewModel): ClassicGalleryDetailPageProps {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    homepagePath: vm.homepagePath,
    title: vm.title,
    photoCount: vm.photoCount,
    galleryDate: vm.galleryDate,
    photos: vm.photos,
    contactCardTitle: vm.contactCardTitle,
    contactCardDescription: vm.contactCardDescription,
  }
}
