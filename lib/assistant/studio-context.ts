import type { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { parseFaqItems, type FaqItem } from '@/lib/faq'

type DashboardSupabaseClient = Awaited<ReturnType<typeof requireDashboardContext>>['supabase']

export type AssistantProfileSnapshot = {
  studio_name: string | null
  slug: string | null
  selected_theme: string | null
  about_title: string | null
  about_subtitle: string | null
  about_description: string | null
  about_text: string | null
  phone: string | null
  email: string | null
  contact_title: string | null
  contact_subtitle: string | null
  hero_desktop_url: string | null
  hero_video_url: string | null
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
}

export type AssistantTestimonialSummary = {
  id: string
  title: string
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

export type AssistantStudioContext = {
  profile: AssistantProfileSnapshot
  packages: AssistantPackageSummary[]
  posts: AssistantPostSummary[]
  testimonials: AssistantTestimonialSummary[]
  faqItems: FaqItem[]
  missing: AssistantMissingFlags
  toneSamples: AssistantToneSample[]
}

const PROFILE_COLUMNS =
  'studio_name, slug, selected_theme, about_title, about_subtitle, about_description, about_text, phone, email, contact_title, contact_subtitle, hero_desktop_url, hero_video_url, faq_items'

export async function getAssistantStudioContext(
  userId: string,
  supabase: DashboardSupabaseClient
): Promise<AssistantStudioContext> {
  const [{ data: profileRow }, { data: packages }, { data: posts }, { data: testimonials }] = await Promise.all([
    supabase.from('users').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle(),
    supabase
      .from('photography_packages')
      .select('id, name, price_amount, duration_text, includes')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .limit(20),
    supabase
      .from('posts')
      .select('id, title, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('testimonials').select('id, title, content').eq('user_id', userId).limit(20),
  ])

  const profileData = (profileRow ?? {}) as unknown as AssistantProfileSnapshot & { faq_items?: unknown }
  const { faq_items: rawFaqItems, ...profile } = profileData
  const faqItems = parseFaqItems(rawFaqItems)
  const packageRows = (packages ?? []) as AssistantPackageSummary[]
  const postRows = (posts ?? []) as { id: string; title: string; content: string }[]
  const testimonialRows = (testimonials ?? []) as { id: string; title: string; content: string }[]

  const missing: AssistantMissingFlags = {
    slug: !profile.slug?.trim(),
    about: !profile.about_description?.trim() && !profile.about_text?.trim(),
    packages: packageRows.length === 0,
    hero: !profile.hero_desktop_url?.trim() && !profile.hero_video_url?.trim(),
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
    packages: packageRows,
    posts: postRows.map((post) => ({ id: post.id, title: post.title })),
    testimonials: testimonialRows.map((t) => ({ id: t.id, title: t.title })),
    faqItems,
    missing,
    toneSamples,
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
