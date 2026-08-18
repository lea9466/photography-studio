import type { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { parseFaqItems, type FaqItem } from '@/lib/faq'
import { getBrandingPreviewUrl } from '@/lib/branding-preview-url'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import type { EntitlementSource, ProFeature, StudioLimits } from '@/lib/subscriptions/types'

const HERO_SLOT_COUNT = 3

type DashboardSupabaseClient = Awaited<ReturnType<typeof requireDashboardContext>>['supabase']

export type AssistantProfileSnapshot = {
  name: string | null
  studio_name: string | null
  slug: string | null
  address: string | null
  selected_theme: string | null
  accent_color: string | null
  heading_font: string | null
  about_title_font: string | null
  logo_url: string | null
  should_color_logo: boolean | null
  site_language: 'he' | 'en' | null
  about_title: string | null
  about_subtitle: string | null
  about_description: string | null
  about_text: string | null
  about_image_url: string | null
  stat_projects: number | null
  stat_clients: number | null
  stat_experience_years: number | null
  phone: string | null
  email: string | null
  contact_title: string | null
  contact_subtitle: string | null
  contact_card_title: string | null
  contact_card_description: string | null
  packages_title: string | null
  packages_subtitle: string | null
  testimonials_title: string | null
  galleries_title: string | null
  recent_photos_title: string | null
  posts_page_title: string | null
  hero_desktop_url: string | null
  hero_type: 'images' | 'video' | null
  hero_video_url: string | null
  is_under_construction: boolean | null
  is_site_unavailable: boolean | null
}

export type AssistantPackageSummary = {
  id: string
  name: string
  price_amount: number
  duration_text: string | null
  includes: string[]
}

export type AssistantPostSummary = {
  id: string
  title: string
  subtitle: string | null
  content: string
}

export type AssistantTestimonialSummary = {
  id: string
  title: string
  content: string
  shoot_type: string | null
}

export type AssistantMissingFlags = {
  slug: boolean
  about: boolean
  packages: boolean
  hero: boolean
  testimonials: boolean
}

export type AssistantToneSample = {
  source: 'package' | 'post' | 'testimonial'
  text: string
}

// Never includes billing details (price, payment method, invoices, provider
// customer ids) — only what plan tier the studio is on and what it unlocks.
// trialEndDate is populated only when source === 'trial'.
export type AssistantSubscriptionSnapshot = {
  tier: 'free' | 'pro'
  source: EntitlementSource
  trialEndDate: string | null
  limits: StudioLimits
  features: Record<ProFeature, boolean>
}

export type AssistantStudioContext = {
  profile: AssistantProfileSnapshot
  /** 3 fixed desktop hero slots — resolved preview URL, or null when a slot is empty. */
  heroDesktopSlots: (string | null)[]
  packages: AssistantPackageSummary[]
  posts: AssistantPostSummary[]
  testimonials: AssistantTestimonialSummary[]
  faqItems: FaqItem[]
  missing: AssistantMissingFlags
  toneSamples: AssistantToneSample[]
  subscription: AssistantSubscriptionSnapshot
}

const PROFILE_COLUMNS =
  'name, studio_name, slug, address, selected_theme, accent_color, heading_font, about_title_font, logo_url, should_color_logo, site_language, about_title, about_subtitle, about_description, about_text, about_image_url, stat_projects, stat_clients, stat_experience_years, phone, email, contact_title, contact_subtitle, contact_card_title, contact_card_description, packages_title, packages_subtitle, testimonials_title, galleries_title, recent_photos_title, posts_page_title, hero_desktop_url, hero_desktop_urls, hero_type, hero_video_url, is_under_construction, is_site_unavailable, faq_items, trial_end_date'

function normalizeHeroSlots(urls: string[] | null | undefined): (string | null)[] {
  const slots: (string | null)[] = [null, null, null]
  ;(urls ?? []).slice(0, HERO_SLOT_COUNT).forEach((value, index) => {
    if (value?.trim()) slots[index] = getBrandingPreviewUrl(value)
  })
  return slots
}

export async function getAssistantStudioContext(
  userId: string,
  supabase: DashboardSupabaseClient
): Promise<AssistantStudioContext> {
  const [{ data: profileRow }, { data: packages }, { data: posts }, { data: testimonials }, entitlements] =
    await Promise.all([
      supabase.from('users').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle(),
      supabase
        .from('photography_packages')
        .select('id, name, price_amount, duration_text, includes')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .limit(20),
      supabase
        .from('posts')
        .select('id, title, subtitle, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('testimonials').select('id, title, content, shoot_type').eq('user_id', userId).limit(20),
      getStudioEntitlements(userId),
    ])

  const profileData = (profileRow ?? {}) as unknown as AssistantProfileSnapshot & {
    faq_items?: unknown
    hero_desktop_urls?: string[]
    trial_end_date?: string | null
  }
  const {
    faq_items: rawFaqItems,
    hero_desktop_urls: rawHeroDesktopUrls,
    trial_end_date: trialEndDate,
    ...profile
  } = profileData

  const subscription: AssistantSubscriptionSnapshot = {
    tier: entitlements.tier,
    source: entitlements.source,
    trialEndDate: entitlements.source === 'trial' ? (trialEndDate ?? null) : null,
    limits: entitlements.limits,
    features: entitlements.features,
  }
  const faqItems = parseFaqItems(rawFaqItems)
  const heroDesktopSlots = normalizeHeroSlots(rawHeroDesktopUrls)
  const packageRows = (packages ?? []) as AssistantPackageSummary[]
  const postRows = (posts ?? []) as { id: string; title: string; subtitle: string | null; content: string }[]
  const testimonialRows = (testimonials ?? []) as {
    id: string
    title: string
    content: string
    shoot_type: string | null
  }[]

  const missing: AssistantMissingFlags = {
    slug: !profile.slug?.trim(),
    about: !profile.about_description?.trim() && !profile.about_text?.trim(),
    packages: packageRows.length === 0,
    hero: heroDesktopSlots.every((slot) => !slot) && !profile.hero_video_url?.trim(),
    testimonials: testimonialRows.length === 0,
  }

  const toneSamples: AssistantToneSample[] = []
  for (const pkg of packageRows.slice(0, 2)) {
    const includesText = (pkg.includes ?? []).join(', ')
    if (pkg.name) toneSamples.push({ source: 'package', text: `${pkg.name}: ${includesText}` })
  }
  for (const post of postRows.slice(0, 1)) {
    toneSamples.push({ source: 'post', text: `${post.title} — ${post.content.slice(0, 300)}` })
  }
  for (const testimonial of testimonialRows.slice(0, 2)) {
    toneSamples.push({ source: 'testimonial', text: testimonial.content.slice(0, 300) })
  }

  return {
    profile,
    heroDesktopSlots,
    packages: packageRows,
    posts: postRows,
    testimonials: testimonialRows,
    faqItems,
    missing,
    toneSamples,
    subscription,
  }
}

export async function getAssistantMissingFlags(
  userId: string,
  supabase: DashboardSupabaseClient
): Promise<AssistantMissingFlags> {
  const { missing } = await getAssistantStudioContext(userId, supabase)
  return missing
}

export function hasAnyMissingContent(missing: AssistantMissingFlags): boolean {
  return missing.slug || missing.about || missing.packages || missing.hero || missing.testimonials
}
