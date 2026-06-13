import { unstable_noStore as noStore } from 'next/cache'
import {
  resolveAboutHeadlineLine1,
  resolveAboutHeadlineLine2,
  resolveAboutQuote,
} from '@/lib/about-headline'
import {
  DEFAULT_ABOUT_IMAGE,
  DEFAULT_HERO_MOBILE,
  DEFAULT_HERO_PORTRAIT,
  DEFAULT_HERO_TRIPTYCH,
} from '@/lib/demo-hero-images'
import { getFeaturedPhotos, type FeaturedImage } from '@/lib/gallery'
import type { SiteSettings } from '@/lib/site-settings'
import { getSiteSettings } from '@/lib/site-settings'

export type HomeContent = {
  settings: SiteSettings | null
  featuredPhotos: FeaturedImage[]
  businessName: string
  tagline: string
  aboutText: string
  aboutHeadlineLine1: string
  aboutHeadlineLine2: string
  aboutQuote: string
  heroImage: string
  heroImageDesktop: string
  heroImageMobile: string
  heroPortrait: string
  heroTriptych: readonly [string, string, string]
  aboutImage: string | null
  yearsExperience: string
  totalClients: string
  totalProjects: string
  phone: string
  email: string
  whatsapp: string
}

function formatStat(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '0'
  return value > 0 ? `${value}+` : String(value)
}

export async function getHomeContent(
  photographerSlug: string,
  photographerId?: string
): Promise<HomeContent> {
  noStore()

  const [settings, featuredPhotos] = await Promise.all([
    getSiteSettings(photographerSlug),
    getFeaturedPhotos(6, photographerId),
  ])

  const heroFromDb = settings?.hero_image_url?.trim()
  const heroMobileFromDb = settings?.hero_image_url_mobile?.trim()
  const aboutFromDb = settings?.about_image_url?.trim()
  const heroPortrait = heroFromDb || DEFAULT_HERO_PORTRAIT
  const heroImageDesktop = heroPortrait
  const heroImageMobile = heroMobileFromDb || DEFAULT_HERO_MOBILE
  const heroImage = heroPortrait
  const heroTriptych = DEFAULT_HERO_TRIPTYCH

  const aboutImage =
    aboutFromDb ||
    featuredPhotos[0]?.src ||
    DEFAULT_ABOUT_IMAGE ||
    null

  const businessName = settings?.business_name?.trim() ?? ''

  return {
    settings,
    featuredPhotos,
    businessName,
    tagline: settings?.tagline?.trim() ?? '',
    aboutText: settings?.about_text?.trim() ?? '',
    aboutHeadlineLine1: resolveAboutHeadlineLine1(
      settings?.about_headline_line1,
      businessName
    ),
    aboutHeadlineLine2: resolveAboutHeadlineLine2(settings?.about_headline_line2),
    aboutQuote: resolveAboutQuote(settings?.about_quote),
    heroImage,
    heroImageDesktop,
    heroImageMobile,
    heroPortrait,
    heroTriptych,
    aboutImage,
    yearsExperience: formatStat(settings?.years_experience),
    totalClients: formatStat(settings?.total_clients),
    totalProjects: formatStat(settings?.total_projects),
    phone: settings?.phone?.trim() ?? '',
    email: settings?.email?.trim() ?? '',
    whatsapp: settings?.whatsapp?.trim() ?? '',
  }
}
