import type { SiteLanguage } from '@/lib/site-language'
import type { PostsDisplayStyle } from '@/lib/types/posts-display-style'
import { DarkHero } from './DarkHero'
import { DarkAbout } from './DarkAbout'
import { DarkGalleriesSection } from './DarkGalleriesSection'
import { DarkRecentPhotosSection } from './DarkRecentPhotosSection'
import { DarkPostsSection } from './DarkPostsSection'
import type { DarkHomepagePost } from './DarkPostCard'
import { DarkPackagesSection } from './DarkPackagesSection'
import type { DarkPackage } from './DarkPackageCard'
import { DarkTestimonialsSection } from './DarkTestimonialsSection'
import type { DarkTestimonial } from './DarkTestimonialCard'
import { DarkFaqSection } from './DarkFaqSection'
import { DarkMarqueeStrip } from './DarkMarqueeStrip'
import { DarkContactSection } from './DarkContactSection'
import type { DarkContactFormValues } from './DarkContactForm'
import type { GalleryGridItem } from '../shared/GalleryGrid'
import type { RecentPhotosGridItem } from '../shared/RecentPhotosGrid'
import { ScrollToInitialSection } from '../shared/ScrollToInitialSection'
import './dark-theme.css'

export type DarkHomePageProps = {
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
  posts: DarkHomepagePost[]

  packagesTitle: string
  packagesSubtitle: string
  packages: DarkPackage[]

  testimonialsTitle: string
  testimonials: DarkTestimonial[]
  /** Mirrors `photographer.testimonial_layout_type` — see ClassicTestimonialsSection. */
  testimonialLayoutType?: 'carousel' | 'marquee'

  faqItems: unknown

  phone: string | null
  email: string | null
  address: string | null
  contactTitle: string | null
  contactSubtitle: string | null
  contactDesktopUrl: string | null
  contactMobileUrl: string | null
  onContactSubmit?: (values: DarkContactFormValues) => void

  /** Defaults to the real production route (`/public-gallery/{id}`) — override for previews/tests. */
  hrefForGallery?: (galleryId: string) => string
  /** Defaults to `{blogPath}/{id}` (matches buildPostCanonicalPath) — override for previews/tests. */
  hrefForPost?: (postId: string) => string
}

/**
 * Full dark-theme homepage, assembled from every section built this session
 * — mirrors ClassicHomePage's role as the real integration point a
 * page.tsx route will eventually call with real photographer/gallery/
 * package/testimonial data (today it's exercised by a mock-data preview
 * route only, see app/dev-preview/dark/page.tsx).
 *
 * Section order matches lib/homepage-themes/dark.ts's `generateDarkHomepageHTML`
 * top to bottom: hero, about, gallery (skipped in portfolio mode), recent-photos,
 * posts, packages, testimonials, faq, marquee strip, contact.
 *
 * The marquee strip (`studioName • Fashion Editorial • Glamour Reality •
 * ...`, dark.ts line ~1483) was originally left out as decorative filler
 * unrelated to real studio data — see DarkMarqueeStrip.tsx for the real
 * component now built for it, after Lea confirmed it's a real part of the
 * production design and asked for it to be added.
 *
 * Header/Footer are no longer rendered here — this component renders only
 * its own `<main>` content. `app/dev-preview/dark/layout.tsx` mounts
 * DarkSiteHeader/DarkSiteFooter (and the `.theme-dark` wrapper that used to
 * live here, matching the old renderer's `<html class="dark"> <body
 * class="theme-bold ...">` — it scopes dark-theme.css's tokens/reveal rules)
 * ONCE for every dark preview route, so they persist as a single instance
 * across client-side navigation instead of remounting per page.
 */
export function DarkHomePage(props: DarkHomePageProps) {
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
  // Mirrors heroGalleryAnchor's dark branch ('#gallery') in
  // lib/homepage-themes/generate-homepage-html.ts.
  const heroGalleryAnchor = isPortfolioMode ? '#recent-photos' : '#gallery'
  const portfolioHref = isPortfolioMode ? (portfolioPath ?? null) : null

  return (
    <>
      <ScrollToInitialSection />
      <main>
        <DarkHero
        studioName={studioName}
        aboutText={aboutText}
        accentColor={accentColor}
        desktopImages={heroDesktopImages}
        mobileImages={heroMobileImages}
        heroVideoUrl={heroVideoUrl}
        galleryAnchorHref={heroGalleryAnchor}
        language={language}
      />

      <DarkAbout
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
        <DarkGalleriesSection
          title={galleriesTitle}
          galleries={galleries}
          accentColor={accentColor}
          language={language}
          hrefForGallery={hrefForGallery}
        />
      ) : null}

      <DarkRecentPhotosSection
        title={recentPhotosTitle}
        galleries={recentPhotosGalleries}
        accentColor={accentColor}
        language={language}
        portfolioHref={portfolioHref}
      />

      <DarkPostsSection
        title={postsTitle}
        displayStyle={postsDisplayStyle}
        posts={posts}
        accentColor={accentColor}
        blogHref={blogPath ?? '#'}
        language={language}
        hrefForPost={hrefForPost}
      />

      {packages.length > 0 ? (
        <DarkPackagesSection
          title={packagesTitle}
          subtitle={packagesSubtitle}
          packages={packages}
          accentColor={accentColor}
          language={language}
        />
      ) : null}

      <DarkTestimonialsSection
        title={testimonialsTitle}
        testimonials={testimonials}
        accentColor={accentColor}
        logoUrl={logoUrl}
        language={language}
        layoutType={testimonialLayoutType}
      />

      <DarkFaqSection faqItems={faqItems} accentColor={accentColor} language={language} />

      <DarkMarqueeStrip studioName={studioName} />

      <DarkContactSection
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
