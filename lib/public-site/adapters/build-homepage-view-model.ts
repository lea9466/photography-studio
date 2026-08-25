import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'

/**
 * Everything `app/[slug]/page.tsx` already computes today (real Supabase
 * data, already entitlement-gated, already resolved to signed/public R2
 * URLs) — see the approved integration plan's Phase 0 field-mapping table.
 *
 * HARD RULE: this file (and build-homepage-view-model.ts below) must never
 * import Supabase/query code and must never call resolveMediaUrl/
 * signStoragePaths/resolveBrandingPath itself. It only reshapes values that
 * are already gated and resolved by the time page.tsx computes them — that's
 * what makes entitlement gating and R2-secret handling safe by construction.
 */
export type HomepageViewModelInput = {
  photographer: {
    id: string
    name: string | null
    studio_name: string | null
    slug: string
    logo_url: string | null
    should_color_logo: boolean | null
    accent_color: string | null
    heading_font: string | null
    about_title_font: string | null
    site_language: string | null
    gallery_layout_mode: string | null
    hero_desktop_urls: string[] | null
    hero_mobile_urls: string[] | null
    hero_video_url: string | null
    about_text: string | null
    about_title: string | null
    about_subtitle: string | null
    about_description: string | null
    about_image_url: string | null
    stat_clients: number | null
    stat_projects: number | null
    stat_experience_years: number | null
    galleries_title: string | null
    recent_photos_title: string | null
    posts_page_title: string | null
    packages_title: string | null
    packages_subtitle: string | null
    testimonials_title: string | null
    testimonial_layout_type: string | null
    faq_items: unknown
    faq_section_image_url: string | null
    phone: string | null
    email: string | null
    address: string | null
    contact_title: string | null
    contact_subtitle: string | null
    contact_desktop_url: string | null
    contact_mobile_url: string | null
  }
  galleries: Array<{
    id: string
    title: string
    created_at: string
    preview_url: string | null
    photo_pool?: string[] | null
  }>
  packages: Array<{
    id: string
    name: string
    price_amount: number
    duration_text: string | null
    includes: string[] | null
    is_featured: boolean | null
  }>
  testimonials: Array<{
    id: string
    title: string
    content: string
    shoot_type: string | null
    review_date: string | null
    created_at: string
    image_url: string | null
  }>
  posts: Array<{
    id: string
    title: string
    content: string
    date: string
    coverUrl: string | null
  }>
  homepagePath: string
  blogPath: string
  portfolioPath: string
  beforeAfterPath: string
  hasFaq: boolean
  postCount: number
  photoEditComparisonsCount: number
}

export type HomepageViewModel = {
  photographerId: string
  studioName: string
  photographerName: string
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
  hasPhotoEditComparisons: boolean

  heroDesktopImages: string[]
  heroMobileImages: string[]
  heroVideoUrl: string | null

  /** Short hero-tagline text (Classic/Dark/Elegant's hero blurb) — a
   * distinct DB field from aboutDescription (the fuller About-section body),
   * not a duplicate/fallback of it. See lib/homepage-themes/*.ts's
   * aboutTextHtml (hero) vs aboutDescription (About section) split. */
  aboutText: string | null
  aboutTitle: string | null
  aboutSubtitle: string | null
  aboutDescription: string | null
  aboutImageUrl: string | null
  statsClients: number
  statsProjects: number
  statsYears: number

  /** Raw DB value — theme+language-aware default fallback happens in the
   * per-theme shaper (resolveGalleriesSectionTitle etc.), not here, since
   * this core builder is deliberately theme-agnostic. */
  galleriesTitle: string | null
  galleries: Array<{ id: string; title: string; createdAt: string; previewUrl: string | null }>
  recentPhotosTitle: string | null
  recentPhotosGalleries: Array<{ id: string; title: string; photoPool: string[] | null }>

  postsTitle: string | null
  posts: Array<{ id: string; title: string; content: string; date: string; coverUrl: string | null }>

  packagesTitle: string | null
  packagesSubtitle: string | null
  packages: Array<{
    id: string
    name: string
    priceAmount: number
    durationText: string | null
    includes: string[]
    isFeatured: boolean
  }>

  testimonialsTitle: string | null
  testimonials: Array<{
    id: string
    title: string
    content: string
    shootType: string | null
    reviewDate: string | null
    createdAt: string
    imageUrl: string | null
  }>
  testimonialLayoutType: 'carousel' | 'marquee'

  faqItems: unknown
  faqSectionImageUrl: string | null

  phone: string | null
  email: string | null
  address: string | null
  contactTitle: string | null
  contactSubtitle: string | null
  contactDesktopUrl: string | null
  contactMobileUrl: string | null
}

export function buildHomepageViewModel(input: HomepageViewModelInput): HomepageViewModel {
  const p = input.photographer

  return {
    photographerId: p.id,
    studioName: p.studio_name || p.name || '',
    photographerName: p.name || p.studio_name || '',
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
    hasPackages: input.packages.length > 0,
    hasBlog: input.postCount > 0,
    hasPhotoEditComparisons: input.photoEditComparisonsCount > 0,

    heroDesktopImages: p.hero_desktop_urls ?? [],
    heroMobileImages: p.hero_mobile_urls ?? [],
    heroVideoUrl: p.hero_video_url,

    aboutText: p.about_text,
    aboutTitle: p.about_title,
    aboutSubtitle: p.about_subtitle,
    aboutDescription: p.about_description,
    aboutImageUrl: p.about_image_url,
    statsClients: p.stat_clients ?? 0,
    statsProjects: p.stat_projects ?? 0,
    statsYears: p.stat_experience_years ?? 0,

    galleriesTitle: p.galleries_title,
    galleries: input.galleries.map((g) => ({
      id: g.id,
      title: g.title,
      createdAt: g.created_at,
      previewUrl: g.preview_url,
    })),
    recentPhotosTitle: p.recent_photos_title,
    recentPhotosGalleries: input.galleries.map((g) => ({
      id: g.id,
      title: g.title,
      photoPool: g.photo_pool ?? null,
    })),

    postsTitle: p.posts_page_title,
    posts: input.posts,

    packagesTitle: p.packages_title,
    packagesSubtitle: p.packages_subtitle,
    packages: input.packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      priceAmount: pkg.price_amount,
      durationText: pkg.duration_text,
      includes: pkg.includes ?? [],
      isFeatured: Boolean(pkg.is_featured),
    })),

    testimonialsTitle: p.testimonials_title,
    testimonials: input.testimonials.map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      shootType: t.shoot_type,
      reviewDate: t.review_date,
      createdAt: t.created_at,
      imageUrl: t.image_url,
    })),
    testimonialLayoutType: p.testimonial_layout_type === 'marquee' ? 'marquee' : 'carousel',

    faqItems: p.faq_items,
    faqSectionImageUrl: p.faq_section_image_url,

    phone: p.phone,
    email: p.email,
    address: p.address,
    contactTitle: p.contact_title,
    contactSubtitle: p.contact_subtitle,
    contactDesktopUrl: p.contact_desktop_url,
    contactMobileUrl: p.contact_mobile_url,
  }
}
