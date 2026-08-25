import type { SiteLanguage } from '@/lib/site-language'
import { ClassicHero } from './ClassicHero'
import { ClassicAbout } from './ClassicAbout'
import { ClassicGalleriesSection } from './ClassicGalleriesSection'
import { ClassicRecentPhotosSection } from './ClassicRecentPhotosSection'
import { ClassicPostsSection } from './ClassicPostsSection'
import type { ClassicHomepagePost } from './ClassicPostCard'
import { ClassicPackagesSection } from './ClassicPackagesSection'
import type { ClassicPackage } from './ClassicPackageCard'
import { ClassicTestimonialsSection } from './ClassicTestimonialsSection'
import type { ClassicTestimonial } from './ClassicTestimonialCard'
import { ClassicFaqSection } from './ClassicFaqSection'
import { ClassicContactSection } from './ClassicContactSection'
import type { ClassicContactFormValues } from './ClassicContactForm'
import type { GalleryGridItem } from '../shared/GalleryGrid'
import type { RecentPhotosGridItem } from '../shared/RecentPhotosGrid'
import { ScrollToInitialSection } from '../shared/ScrollToInitialSection'
import './classic-theme.css'

export type ClassicHomePageProps = {
  studioName: string
  photographerName: string
  logoUrl: string | null
  accentColor: string
  language: SiteLanguage
  blogPath?: string | null
  portfolioPath?: string | null
  galleryLayoutMode: 'separated' | 'portfolio'

  heroDesktopImages: string[]
  heroMobileImages: string[]
  heroVideoUrl?: string | null

  aboutText: string | null
  aboutTitle: string | null
  aboutSubtitle: string | null
  aboutDescription: string | null
  aboutImageUrl: string | null
  statsClients: number
  statsProjects: number
  statsYears: number

  galleriesTitle: string
  galleries: GalleryGridItem[]
  recentPhotosTitle: string
  recentPhotosGalleries: RecentPhotosGridItem[]

  postsTitle: string
  posts: ClassicHomepagePost[]

  packagesTitle: string
  packagesSubtitle: string
  packages: ClassicPackage[]

  testimonialsTitle: string
  testimonials: ClassicTestimonial[]
  /** Mirrors `photographer.testimonial_layout_type` — see ClassicTestimonialsSection. */
  testimonialLayoutType?: 'carousel' | 'marquee'

  faqItems: unknown
  faqSectionImageUrl: string | null

  phone: string | null
  email: string | null
  address: string | null
  contactTitle: string | null
  contactSubtitle: string | null
  contactDesktopUrl: string | null
  contactMobileUrl: string | null
  onContactSubmit?: (values: ClassicContactFormValues) => void

  /** Defaults to the real production route (`/public-gallery/{id}`) — override for previews/tests. */
  hrefForGallery?: (galleryId: string) => string
  /** Defaults to `{blogPath}/{id}` (matches buildPostCanonicalPath) — override for previews/tests. */
  hrefForPost?: (postId: string) => string
}

/**
 * Full classic-theme homepage, assembled from every section built this
 * session — the real integration point a page.tsx route will eventually
 * call with real photographer/gallery/package/testimonial data (today it's
 * exercised by a mock-data preview route only, see
 * app/dev-preview/classic/page.tsx).
 *
 * Rendered inside app/dev-preview/classic/layout.tsx, which owns the
 * `.theme-classic` wrapper (matching the old renderer's `<body
 * class="theme-classic ...">` — it's what scopes classic-theme.css's
 * `--headline-font` token and `.reveal`/`.stagger-item` rules) plus the
 * persistent ClassicSiteHeader/ClassicSiteFooter — this component renders
 * only its own `<main>` content now, not the site chrome.
 */
export function ClassicHomePage(props: ClassicHomePageProps) {
  const {
    studioName,
    photographerName,
    logoUrl,
    accentColor,
    language,
    blogPath,
    portfolioPath,
    galleryLayoutMode,
    heroDesktopImages,
    heroMobileImages,
    heroVideoUrl,
    aboutText,
    aboutTitle,
    aboutSubtitle,
    aboutDescription,
    aboutImageUrl,
    statsClients,
    statsProjects,
    statsYears,
    galleriesTitle,
    galleries,
    recentPhotosTitle,
    recentPhotosGalleries,
    postsTitle,
    posts,
    packagesTitle,
    packagesSubtitle,
    packages,
    testimonialsTitle,
    testimonials,
    testimonialLayoutType,
    faqItems,
    faqSectionImageUrl,
    phone,
    email,
    address,
    contactTitle,
    contactSubtitle,
    contactDesktopUrl,
    contactMobileUrl,
    onContactSubmit,
    hrefForGallery = (id) => `/public-gallery/${id}`,
    hrefForPost = (id) => `${blogPath ?? '/blog'}/${id}`,
  } = props

  const isPortfolioMode = galleryLayoutMode === 'portfolio'
  // Mirrors heroGalleryAnchor's classic branch in
  // lib/homepage-themes/generate-homepage-html.ts.
  const heroGalleryAnchor = isPortfolioMode ? '#recent-photos' : '#galleries'
  const portfolioHref = isPortfolioMode ? (portfolioPath ?? null) : null

  return (
    <>
      <ScrollToInitialSection />
      <main>
        <ClassicHero
          studioName={studioName}
          photographerName={photographerName}
          aboutText={aboutText}
          accentColor={accentColor}
          desktopImages={heroDesktopImages}
          mobileImages={heroMobileImages}
          heroVideoUrl={heroVideoUrl}
          galleryAnchorHref={heroGalleryAnchor}
          language={language}
        />

        <ClassicAbout
          title={aboutTitle}
          subtitle={aboutSubtitle}
          description={aboutDescription}
          accentColor={accentColor}
          photographerName={photographerName}
          imageUrl={aboutImageUrl}
          statsClients={statsClients}
          statsProjects={statsProjects}
          statsYears={statsYears}
          language={language}
        />

        {!isPortfolioMode ? (
          <ClassicGalleriesSection
            title={galleriesTitle}
            galleries={galleries}
            accentColor={accentColor}
            language={language}
            hrefForGallery={hrefForGallery}
          />
        ) : null}

        <ClassicRecentPhotosSection
          title={recentPhotosTitle}
          galleries={recentPhotosGalleries}
          accentColor={accentColor}
          language={language}
          portfolioHref={portfolioHref}
        />

        <ClassicPostsSection
          title={postsTitle}
          posts={posts}
          accentColor={accentColor}
          blogHref={blogPath ?? '#'}
          language={language}
          hrefForPost={hrefForPost}
        />

        {packages.length > 0 ? (
          <ClassicPackagesSection
            title={packagesTitle}
            subtitle={packagesSubtitle}
            packages={packages}
            accentColor={accentColor}
            language={language}
          />
        ) : null}

        <ClassicTestimonialsSection
          title={testimonialsTitle}
          testimonials={testimonials}
          accentColor={accentColor}
          logoUrl={logoUrl}
          language={language}
          layoutType={testimonialLayoutType}
        />

        <ClassicFaqSection
          faqItems={faqItems}
          faqSectionImageUrl={faqSectionImageUrl}
          accentColor={accentColor}
          language={language}
        />

        <ClassicContactSection
          title={contactTitle}
          subtitle={contactSubtitle}
          accentColor={accentColor}
          language={language}
          phone={phone}
          email={email}
          address={address}
          contactDesktopUrl={contactDesktopUrl}
          contactMobileUrl={contactMobileUrl}
          onSubmit={onContactSubmit}
        />
      </main>
    </>
  )
}
