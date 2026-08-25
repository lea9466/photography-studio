import type { ModernHomePageProps } from '@/components/photographer/themes/modern/ModernHomePage'
import type { ModernPortfolioPageProps } from '@/components/photographer/themes/modern/ModernPortfolioPage'
import type { ModernBlogListPageProps } from '@/components/photographer/themes/modern/ModernBlogListPage'
import type { ModernBlogPostPageProps } from '@/components/photographer/themes/modern/ModernBlogPostPage'
import type { ModernBeforeAfterPageProps } from '@/components/photographer/themes/modern/ModernBeforeAfterPage'
import type { ModernGalleryDetailPageProps } from '@/components/photographer/themes/modern/ModernGalleryDetailPage'
import type { ModernSiteHeaderProps } from '@/components/photographer/site-chrome/ModernSiteHeader'
import type { ModernSiteFooterProps } from '@/components/photographer/site-chrome/ModernSiteFooter'
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

const THEME = 'modern'

/** Same shape as classic.ts's ClassicChromeViewModel — every page-specific
 * view model satisfies this structurally. */
type ModernChromeViewModel = {
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

export function toModernHomePageProps(
  vm: HomepageViewModel
): Omit<ModernHomePageProps, 'onContactSubmit' | 'hrefForGallery' | 'hrefForPost'> {
  const packagesCopy = resolvePackagesSectionCopy(THEME, vm.packagesTitle, vm.packagesSubtitle, vm.language)
  const contactCopy = resolveContactSectionCopy(THEME, vm.contactTitle, vm.contactSubtitle, vm.language)

  return {
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

    // ModernHomePageProps has no aboutImageUrl at all — modern's about section
    // never shows a background image (confirmed by reading the type), unlike
    // classic/elegant/dark.
    aboutText: vm.aboutText,
    aboutImageUrl: vm.aboutImageUrl,
    aboutTitle: vm.aboutTitle,
    aboutSubtitle: vm.aboutSubtitle,
    aboutDescription: vm.aboutDescription,
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

    // ModernHomePageProps has no faqSectionImageUrl either — same reasoning
    // as Dark's shaper.
    faqItems: vm.faqItems,

    phone: vm.phone,
    email: vm.email,
    address: vm.address,
    contactTitle: contactCopy.title,
    contactSubtitle: contactCopy.subtitle,
    contactDesktopUrl: vm.contactDesktopUrl,
    contactMobileUrl: vm.contactMobileUrl,
  }
}

export function toModernSiteHeaderProps(vm: ModernChromeViewModel): ModernSiteHeaderProps {
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

export function toModernSiteFooterProps(vm: ModernChromeViewModel): ModernSiteFooterProps {
  return {
    studioName: vm.studioName,
    logoUrl: vm.logoUrl,
    primaryColor: vm.accentColor,
    language: vm.language,
  }
}

export function toModernPortfolioPageProps(vm: PortfolioViewModel): ModernPortfolioPageProps {
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

export function toModernBlogListPageProps(
  vm: BlogListViewModel
): Omit<ModernBlogListPageProps, 'hrefForPost'> {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    pageTitle: resolvePostsPageTitle(THEME, vm.postsPageTitle, vm.language),
    displayStyle: vm.postsDisplayStyle,
    posts: vm.posts,
  }
}

export function toModernBlogPostPageProps(vm: BlogPostViewModel): ModernBlogPostPageProps {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    post: vm.post,
    postPath: vm.postPath,
    prevPost: vm.prevPost,
    nextPost: vm.nextPost,
  }
}

export function toModernBeforeAfterPageProps(vm: BeforeAfterViewModel): ModernBeforeAfterPageProps {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    pageTitle: vm.pageTitle,
    intro: vm.intro,
    displayStyle: vm.displayStyle,
    items: vm.items,
  }
}

export function toModernGalleryDetailPageProps(vm: GalleryDetailViewModel): ModernGalleryDetailPageProps {
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
