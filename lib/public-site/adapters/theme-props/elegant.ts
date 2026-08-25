import type { ElegantHomePageProps } from '@/components/photographer/themes/elegant/ElegantHomePage'
import type { ElegantPortfolioPageProps } from '@/components/photographer/themes/elegant/ElegantPortfolioPage'
import type { ElegantBlogListPageProps } from '@/components/photographer/themes/elegant/ElegantBlogListPage'
import type { ElegantBlogPostPageProps } from '@/components/photographer/themes/elegant/ElegantBlogPostPage'
import type { ElegantBeforeAfterPageProps } from '@/components/photographer/themes/elegant/ElegantBeforeAfterPage'
import type { ElegantGalleryDetailPageProps } from '@/components/photographer/themes/elegant/ElegantGalleryDetailPage'
import type { ElegantSiteHeaderProps } from '@/components/photographer/site-chrome/ElegantSiteHeader'
import type { ElegantSiteFooterProps } from '@/components/photographer/site-chrome/ElegantSiteFooter'
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

const THEME = 'elegant'

/** Same shape as classic.ts's ClassicChromeViewModel — every page-specific
 * view model satisfies this structurally. */
type ElegantChromeViewModel = {
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

export function toElegantHomePageProps(
  vm: HomepageViewModel
): Omit<ElegantHomePageProps, 'onContactSubmit' | 'hrefForGallery' | 'hrefForPost'> {
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

export function toElegantSiteHeaderProps(vm: ElegantChromeViewModel): ElegantSiteHeaderProps {
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

export function toElegantSiteFooterProps(vm: ElegantChromeViewModel): ElegantSiteFooterProps {
  return {
    studioName: vm.studioName,
    logoUrl: vm.logoUrl,
    primaryColor: vm.accentColor,
    language: vm.language,
  }
}

export function toElegantPortfolioPageProps(vm: PortfolioViewModel): ElegantPortfolioPageProps {
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

export function toElegantBlogListPageProps(
  vm: BlogListViewModel
): Omit<ElegantBlogListPageProps, 'hrefForPost'> {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    pageTitle: resolvePostsPageTitle(THEME, vm.postsPageTitle, vm.language),
    posts: vm.posts,
  }
}

export function toElegantBlogPostPageProps(vm: BlogPostViewModel): ElegantBlogPostPageProps {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    post: vm.post,
    postPath: vm.postPath,
    prevPost: vm.prevPost,
    nextPost: vm.nextPost,
  }
}

export function toElegantBeforeAfterPageProps(vm: BeforeAfterViewModel): ElegantBeforeAfterPageProps {
  return {
    accentColor: vm.accentColor,
    language: vm.language,
    pageTitle: vm.pageTitle,
    intro: vm.intro,
    displayStyle: vm.displayStyle,
    items: vm.items,
  }
}

export function toElegantGalleryDetailPageProps(vm: GalleryDetailViewModel): ElegantGalleryDetailPageProps {
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
