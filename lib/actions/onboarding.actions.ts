'use server'

import { revalidatePath } from 'next/cache'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { findAvailableSlug } from '@/lib/onboarding/available-slug'
import { checkPersistentRateLimit } from '@/lib/rate-limit/persistent'
import { getAssistantProvider } from '@/lib/assistant/provider'
import { THEME_IDS } from '@/lib/dashboard/site-settings-help'

export async function dismissWelcomePopup() {
  const { userId, supabase } = await requireDashboardContext()

  await supabase
    .from('users')
    .update({ show_welcome_popup: false } as never)
    .eq('id', userId)

  revalidatePath('/dashboard', 'layout')
}

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 80
const MAX_ABOUT_LENGTH = 400
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

/** Live-preview helper: the slug this studio name would get right now. */
export async function previewOnboardingSlug(
  studioName: string
): Promise<ActionResult<{ slug: string }>> {
  try {
    const { userId } = await requireDashboardContext()
    const name = studioName.trim()
    if (name.length < MIN_NAME_LENGTH) return { ok: false, error: 'שם העסק קצר מדי' }

    const slug = await findAvailableSlug(createAdminClient(), name, userId)
    if (!slug) return { ok: false, error: 'לא הצלחנו ליצור כתובת פנויה, נסי שם אחר' }
    return { ok: true, slug }
  } catch {
    return { ok: false, error: 'שגיאה בבדיקת הכתובת' }
  }
}

export type SaveSiteOnboardingInput = {
  studioName: string
  aboutText?: string
  accentColor?: string | null
  selectedTheme?: string
}

/**
 * Saves the modal's fields. The slug is derived server-side from the studio
 * name (never taken from the client) and is only ever set once — an existing
 * slug is left alone, so renaming the studio never changes her public URL.
 */
export async function saveSiteOnboarding(
  input: SaveSiteOnboardingInput
): Promise<ActionResult<{ slug: string }>> {
  try {
    const { userId } = await requireDashboardContext()
    const studioName = input.studioName.trim()
    if (studioName.length < MIN_NAME_LENGTH || studioName.length > MAX_NAME_LENGTH) {
      return { ok: false, error: 'נא להזין שם עסק (2–80 תווים)' }
    }
    const aboutText = input.aboutText?.trim().slice(0, MAX_ABOUT_LENGTH)
    const accentColor = input.accentColor?.trim()
    if (accentColor && !HEX_COLOR.test(accentColor)) {
      return { ok: false, error: 'צבע לא תקין' }
    }

    const selectedTheme = input.selectedTheme?.trim()
    if (selectedTheme && !(THEME_IDS as readonly string[]).includes(selectedTheme)) {
      return { ok: false, error: 'עיצוב לא תקין' }
    }

    const admin = createAdminClient()
    const { data: current, error: readError } = await admin
      .from('users')
      .select('slug, about_title')
      .eq('id', userId)
      .maybeSingle()
    if (readError) return { ok: false, error: 'שגיאה בשמירה, נסי שוב' }

    const currentRow = current as { slug: string | null; about_title: string | null } | null
    let slug = currentRow?.slug?.trim() || null
    const update: Record<string, unknown> = {
      studio_name: studioName,
      show_welcome_popup: false,
    }
    if (!slug) {
      slug = await findAvailableSlug(admin, studioName, userId)
      if (!slug) return { ok: false, error: 'לא הצלחנו ליצור כתובת פנויה, נסי שם אחר' }
      update.slug = slug
    }
    if (aboutText !== undefined) update.about_text = aboutText || null
    if (accentColor) update.accent_color = accentColor
    if (selectedTheme) update.selected_theme = selectedTheme
    // Modern's hero headline is the about title and otherwise falls back to
    // generic copy, so seed it with the studio name (never overwriting hers).
    if (selectedTheme === 'modern' && !currentRow?.about_title?.trim()) {
      update.about_title = studioName
    }

    const { error } = await admin
      .from('users')
      .update(update as never)
      .eq('id', userId)
    if (error) {
      // 23505 = someone grabbed the same slug between the check and the write.
      if (error.code === '23505') return { ok: false, error: 'הכתובת נתפסה, נסי שוב' }
      return { ok: false, error: 'שגיאה בשמירה, נסי שוב' }
    }

    revalidatePath('/dashboard', 'layout')
    revalidatePath('/[slug]', 'page')
    return { ok: true, slug }
  } catch {
    return { ok: false, error: 'שגיאה בשמירה, נסי שוב' }
  }
}

/** "Private galleries only" — stop reopening the site setup on every entry. */
export async function skipSiteOnboarding(): Promise<ActionResult> {
  try {
    const { userId } = await requireDashboardContext()
    const admin = createAdminClient()

    const { error } = await admin
      .from('users')
      .update({ show_welcome_popup: false, site_onboarding_skipped: true } as never)
      .eq('id', userId)

    if (error) {
      // Migration not applied yet — still clear the first-entry flag.
      const fallback = await admin
        .from('users')
        .update({ show_welcome_popup: false } as never)
        .eq('id', userId)
      if (fallback.error) return { ok: false, error: 'שגיאה, נסי שוב' }
    }

    revalidatePath('/dashboard', 'layout')
    return { ok: true }
  } catch {
    return { ok: false, error: 'שגיאה, נסי שוב' }
  }
}

const ABOUT_SYSTEM_PROMPT = `את נועה, העוזרת של STG — פלטפורמה לצלמות. כתבי טקסט "אודות" קצר לאתר של צלמת.
כללים:
- עברית בלבד, בגוף ראשון רבים או יחיד, חם ומקצועי.
- 2 עד 3 משפטים קצרים, עד 300 תווים בסך הכול.
- אל תמציאי עובדות (שנות ניסיון, מיקום, פרסים, מספרי לקוחות). אפשר לדבר על תיעוד רגעים, רגש ואיכות.
- בלי כותרת, בלי מרכאות, בלי אימוג'ים, בלי הקדמות. החזירי רק את הטקסט עצמו.`

/** "Fill with Noa" — a short hero blurb generated from the studio name only. */
export async function generateOnboardingAbout(
  studioName: string
): Promise<ActionResult<{ text: string }>> {
  try {
    const { userId } = await requireDashboardContext()
    const name = studioName.trim().slice(0, MAX_NAME_LENGTH)
    if (name.length < MIN_NAME_LENGTH) {
      return { ok: false, error: 'קודם נזין שם עסק ואז נועה תכתוב אודות' }
    }

    const limit = await checkPersistentRateLimit(`onboarding-about:${userId}`, 8, 60 * 60)
    if (!limit.allowed) {
      return { ok: false, error: 'ניסית הרבה פעמים, אפשר לכתוב ידנית או לנסות שוב מאוחר יותר' }
    }

    const provider = getAssistantProvider()
    if (!provider.isConfigured()) {
      return { ok: false, error: 'נועה לא זמינה כרגע, אפשר לכתוב ידנית' }
    }

    let text = ''
    for await (const event of provider.streamChat({
      system: ABOUT_SYSTEM_PROMPT,
      tools: [],
      messages: [{ role: 'user', content: `שם העסק: ${name}` }],
    })) {
      if (event.type === 'text_delta') text += event.text
    }

    const cleaned = text.trim().replace(/^["'“”]+|["'“”]+$/g, '').slice(0, MAX_ABOUT_LENGTH)
    if (!cleaned) return { ok: false, error: 'נועה לא הצליחה לכתוב, נסי שוב' }
    return { ok: true, text: cleaned }
  } catch {
    return { ok: false, error: 'נועה לא זמינה כרגע, אפשר לכתוב ידנית' }
  }
}
