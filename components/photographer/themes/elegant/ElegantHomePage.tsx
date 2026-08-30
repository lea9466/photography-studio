import type { SiteLanguage } from '@/lib/site-language'
import type { PostsDisplayStyle } from '@/lib/types/posts-display-style'
import { ElegantHero } from './ElegantHero'
import { ElegantAbout } from './ElegantAbout'
import { ElegantGalleriesSection } from './ElegantGalleriesSection'
import { ElegantRecentPhotosSection } from './ElegantRecentPhotosSection'
import { ElegantPostsSection, type ElegantHomepagePost } from './ElegantPostsSection'
import { ElegantPackagesSection } from './ElegantPackagesSection'
import type { ElegantPackage } from './ElegantPackageCard'
import { ElegantTestimonialsSection } from './ElegantTestimonialsSection'
import type { ElegantTestimonial } from './ElegantTestimonialCard'
import { ElegantFaqSection } from './ElegantFaqSection'
import { ElegantContactSection } from './ElegantContactSection'
import type { ElegantContactFormValues } from './ElegantContactForm'
import type { GalleryGridItem } from '../shared/GalleryGrid'
import type { RecentPhotosGridItem } from '../shared/RecentPhotosGrid'
import { ScrollToInitialSection } from '../shared/ScrollToInitialSection'
import './elegant-theme.css'

export type ElegantHomePageProps = {
  /** studioName/logoUrl/shouldColorLogo/homepagePath/beforeAfterPath were
   * header/footer-only and moved to the shared
   * app/dev-preview/elegant/layout.tsx that now renders
   * ElegantSiteHeader/ElegantSiteFooter around this page. studioName/logoUrl
   * are kept — still used within this page's own content (ElegantHero's
   * studioName, ElegantTestimonialsSection's logo fallback). */
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
  postsDisplayStyle: PostsDisplayStyle
  posts: ElegantHomepagePost[]

  packagesTitle: string
  packagesSubtitle: string
  packages: ElegantPackage[]

  testimonialsTitle: string
  testimonials: ElegantTestimonial[]
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
  onContactSubmit?: (values: ElegantContactFormValues) => void

  /** Defaults to the real production route (`/public-gallery/{id}`) — override for previews/tests. */
  hrefForGallery?: (galleryId: string) => string
  /** Defaults to `{blogPath}/{id}` (matches buildPostCanonicalPath) — override for previews/tests. */
  hrefForPost?: (postId: string) => string
}

/**
 * Full elegant-theme homepage, assembled from every section built this
 * session — the real integration point a page.tsx route will eventually
 * call with real photographer/gallery/package/testimonial data (today it's
 * exercised by a mock-data preview route only, see
 * app/dev-preview/elegant/page.tsx).
 *
 * `.theme-elegant` on the root matches the old renderer's `<body
 * class="theme-elegant ...">` — it's what scopes elegant-theme.css's
 * `--headline-font`/`--about-title-font` tokens and
 * `.reveal-on-scroll`/`.stagger-reveal`/`.image-reveal` rules to this tree
 * only, so a different theme rendered elsewhere on the same app can't
 * inherit elegant's fonts/reveal styling.
 *
 * Gallery anchor mirrors heroGalleryAnchor's elegant branch in
 * lib/homepage-themes/generate-homepage-html.ts: elegant's own gallery
 * section id is `gallery` (see gallerySectionId('elegant') in
 * lib/photographer-site-chrome.ts), not classic's `galleries`.
 */
export function ElegantHomePage(props: ElegantHomePageProps) {
  const {
    studioName,
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
    postsDisplayStyle,
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
  const heroGalleryAnchor = isPortfolioMode ? '#recent-photos' : '#gallery'
  const portfolioHref = isPortfolioMode ? (portfolioPath ?? null) : null

  return (
    <>
      <ScrollToInitialSection />
      <main>
        <ElegantHero
          studioName={studioName}
          aboutText={aboutText}
          accentColor={accentColor}
          desktopImages={heroDesktopImages}
          mobileImages={heroMobileImages}
          heroVideoUrl={heroVideoUrl}
          galleryAnchorHref={heroGalleryAnchor}
          language={language}
        />

        <ElegantAbout
          title={aboutTitle}
          subtitle={aboutSubtitle}
          description={aboutDescription}
          accentColor={accentColor}
          imageUrl={aboutImageUrl}
          statsClients={statsClients}
          statsProjects={statsProjects}
          statsYears={statsYears}
          galleryAnchorHref={heroGalleryAnchor}
          language={language}
        />

        {!isPortfolioMode ? (
          <ElegantGalleriesSection
            title={galleriesTitle}
            galleries={galleries}
            accentColor={accentColor}
            language={language}
            hrefForGallery={hrefForGallery}
          />
        ) : null}

        <ElegantRecentPhotosSection
          title={recentPhotosTitle}
          galleries={recentPhotosGalleries}
          accentColor={accentColor}
          language={language}
          portfolioHref={portfolioHref}
        />

        <ElegantPostsSection
          title={postsTitle}
          displayStyle={postsDisplayStyle}
          posts={posts}
          accentColor={accentColor}
          blogHref={blogPath ?? '#'}
          language={language}
          hrefForPost={hrefForPost}
        />

        {packages.length > 0 ? (
          <ElegantPackagesSection
            title={packagesTitle}
            subtitle={packagesSubtitle}
            packages={packages}
            accentColor={accentColor}
            language={language}
          />
        ) : null}

        <ElegantTestimonialsSection
          title={testimonialsTitle}
          testimonials={testimonials}
          accentColor={accentColor}
          logoUrl={logoUrl}
          language={language}
          layoutType={testimonialLayoutType}
        />

        <ElegantFaqSection
          faqItems={faqItems}
          faqSectionImageUrl={faqSectionImageUrl}
          accentColor={accentColor}
          language={language}
        />

        <ElegantContactSection
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
