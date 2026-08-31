import type { SiteLanguage } from '@/lib/site-language'
import type { PostsDisplayStyle } from '@/lib/types/posts-display-style'
import { ModernHero } from './ModernHero'
import { ModernAboutStatement } from './ModernAboutStatement'
import { ModernAbout } from './ModernAbout'
import { ModernGalleriesSection } from './ModernGalleriesSection'
import { ModernRecentPhotosSection } from './ModernRecentPhotosSection'
import { ModernPostsSection, type ModernHomepagePost } from './ModernPostsSection'
import { ModernPackagesSection } from './ModernPackagesSection'
import type { ModernPackage } from './ModernPackageCard'
import { ModernTestimonialsSection } from './ModernTestimonialsSection'
import type { ModernTestimonial } from './ModernTestimonialCard'
import { ModernFaqSection } from './ModernFaqSection'
import { ModernContactSection } from './ModernContactSection'
import type { ModernContactFormValues } from './ModernContactForm'
import type { GalleryGridItem } from '../shared/GalleryGrid'
import type { RecentPhotosGridItem } from '../shared/RecentPhotosGrid'
import { ScrollToInitialSection } from '../shared/ScrollToInitialSection'
import './modern-theme.css'

export type ModernHomePageProps = {
  /** Accepted for parity with ClassicHomePage's prop shape (a real page.tsx
   * passes the same photographer row to whichever theme is active) — unused
   * in modern's own markup, since ModernHero/ModernAbout never render the
   * photographer's name (unlike classic's ClassicHero/ClassicAbout). */
  photographerName: string
  /** Still used within this page's own content (ModernTestimonialsSection's
   * thumb-photo fallback) — only studioName/shouldColorLogo/homepagePath/
   * beforeAfterPath were header/footer-only and moved to the shared
   * app/dev-preview/modern/layout.tsx that now renders ModernSiteHeader/
   * ModernSiteFooter around this page. */
  logoUrl: string | null
  accentColor: string
  language: SiteLanguage
  blogPath?: string | null
  portfolioPath?: string | null
  galleryLayoutMode: 'separated' | 'portfolio'

  heroDesktopImages: string[]
  heroMobileImages: string[]
  heroVideoUrl?: string | null

  /** Feeds the new ModernAboutStatement section (see that file's doc comment)
   * — not part of the old renderer's modern branch, unlike every other
   * aboutXxx field here. */
  aboutText: string | null
  /** Also new — feeds ModernAboutStatement's portrait, alongside aboutText.
   * Modern never showed the about photo before (unlike classic/dark/elegant's
   * About sections). */
  aboutImageUrl: string | null
  /** Overrides the default two-line hollow title — matches aboutTitle in the old renderer. */
  aboutTitle: string | null
  /** Accepted for prop-shape parity with the other themes (a real page.tsx
   * passes the same photographer row to whichever theme is active) — modern
   * deliberately doesn't render it anywhere: its hero shows only the dedicated
   * about_text blurb, not the About-section subtitle. */
  aboutSubtitle: string | null
  aboutDescription: string | null
  statsClients: number
  statsProjects: number
  statsYears: number

  galleriesTitle: string
  galleries: GalleryGridItem[]
  recentPhotosTitle: string
  recentPhotosGalleries: RecentPhotosGridItem[]

  postsTitle: string
  postsDisplayStyle: PostsDisplayStyle
  posts: ModernHomepagePost[]

  packagesTitle: string
  packagesSubtitle: string
  packages: ModernPackage[]

  testimonialsTitle: string
  testimonials: ModernTestimonial[]
  /** Mirrors `photographer.testimonial_layout_type` — see ClassicTestimonialsSection. */
  testimonialLayoutType?: 'carousel' | 'marquee' | 'flip-cards'

  faqItems: unknown

  phone: string | null
  email: string | null
  address: string | null
  contactTitle: string | null
  contactSubtitle: string | null
  contactDesktopUrl: string | null
  contactMobileUrl: string | null
  onContactSubmit?: (values: ModernContactFormValues) => void

  /** Defaults to the real production route (`/public-gallery/{id}`) — override for previews/tests. */
  hrefForGallery?: (galleryId: string) => string
  /** Defaults to `{blogPath}/{id}` (matches buildPostCanonicalPath) — override for previews/tests. */
  hrefForPost?: (postId: string) => string
}

/**
 * Full modern-theme homepage, assembled from every section built this
 * session — mirrors ClassicHomePage.tsx's composition/prop shape exactly
 * (same integration point a real page.tsx route will eventually call with
 * real photographer/gallery/package/testimonial data; today only exercised
 * by app/dev-preview/modern/page.tsx's mock-data preview route).
 *
 * Unlike classic, modern has no separate "aboutImageUrl"/photographer-photo
 * prop — the old renderer merges hero+about into one full-screen section
 * (ModernHero.tsx) with a film-belt background instead of a portrait, and
 * ModernAbout.tsx is only the three stat cards below it (see that
 * component's doc comment). `faqSectionImageUrl` is likewise omitted —
 * modern's FAQ never uses the "magazine" image layout (see
 * ModernFaqSection.tsx's doc comment).
 *
 * `.theme-modern` on the root matches the old renderer's `<body
 * class="theme-modern ...">` — scopes modern-theme.css's `--headline-font`
 * token and `.stagger-reveal`/`.animate-reveal` rules to this tree only, same
 * pattern as ClassicHomePage.tsx's `.theme-classic`.
 */
export function ModernHomePage(props: ModernHomePageProps) {
  const {
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
    aboutImageUrl,
    aboutTitle,
    aboutDescription,
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
  // Mirrors heroGalleryAnchor's modern branch in
  // lib/homepage-themes/generate-homepage-html.ts: '#recent-photos' in
  // portfolio mode, else '#portfolio' (modern's gallery section id — not
  // '#galleries', that's classic's).
  const heroGalleryAnchor = isPortfolioMode ? '#recent-photos' : '#portfolio'
  const portfolioHref = isPortfolioMode ? (portfolioPath ?? null) : null

  // Some studios saved the same text in both the hero blurb (about_text) and
  // the Our Story body (about_description). Show it once (in the hero) and drop
  // the duplicate section instead of repeating the identical paragraph.
  const aboutStatementText =
    aboutDescription && aboutText && aboutDescription.trim() === aboutText.trim()
      ? null
      : aboutDescription

  return (
    <>
      <ScrollToInitialSection />
      <main>
        <ModernHero
          title={aboutTitle}
          // Only the dedicated about_text blurb — the About-section subtitle
          // (about_subtitle) is intentionally NOT pulled in here, so an empty
          // about_text leaves the hero without a paragraph instead of falling
          // back to About-section copy. aboutDescription lives in
          // ModernAboutStatement below, same as the other themes' About sections.
          description={aboutText}
          accentColor={accentColor}
          desktopImages={heroDesktopImages}
          mobileImages={heroMobileImages}
          heroVideoUrl={heroVideoUrl}
          galleryAnchorHref={heroGalleryAnchor}
          language={language}
        />

        <ModernAbout
          accentColor={accentColor}
          statsClients={statsClients}
          statsProjects={statsProjects}
          statsYears={statsYears}
          language={language}
        />

        <ModernAboutStatement
          text={aboutStatementText}
          imageUrl={aboutImageUrl}
          accentColor={accentColor}
          language={language}
        />

        {!isPortfolioMode ? (
          <ModernGalleriesSection
            title={galleriesTitle}
            galleries={galleries}
            accentColor={accentColor}
            language={language}
            hrefForGallery={hrefForGallery}
          />
        ) : null}

        <ModernRecentPhotosSection
          title={recentPhotosTitle}
          galleries={recentPhotosGalleries}
          accentColor={accentColor}
          language={language}
          portfolioHref={portfolioHref}
        />

        <ModernPostsSection
          title={postsTitle}
          displayStyle={postsDisplayStyle}
          posts={posts}
          accentColor={accentColor}
          blogHref={blogPath ?? '#'}
          language={language}
          hrefForPost={hrefForPost}
        />

        {packages.length > 0 ? (
          <ModernPackagesSection
            title={packagesTitle}
            subtitle={packagesSubtitle}
            packages={packages}
            accentColor={accentColor}
            language={language}
          />
        ) : null}

        <ModernTestimonialsSection
          title={testimonialsTitle}
          testimonials={testimonials}
          accentColor={accentColor}
          logoUrl={logoUrl}
          language={language}
          layoutType={testimonialLayoutType}
        />

        <ModernFaqSection faqItems={faqItems} accentColor={accentColor} language={language} />

        <ModernContactSection
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
