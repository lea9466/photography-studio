import { getDashboardContext } from '@/lib/auth/dashboard-context'

export type DashboardProfile = {
  name: string | null
  studio_name: string | null
  slug: string | null
  logo_url: string | null
  accent_color: string | null
  should_color_logo: boolean
  trial_end_date: string
  referral_code: string | null
  show_referral_popup: boolean
  show_welcome_popup: boolean
  created_at: string
}

function defaultTrialEndDate(createdAt: string) {
  const end = new Date(createdAt)
  end.setMonth(end.getMonth() + 1)
  return end.toISOString()
}

export async function getDashboardProfile(): Promise<DashboardProfile | null> {
  const context = await getDashboardContext()
  if (!context) return null

  const { supabase, userId } = context

  const fullSelect =
    'name, studio_name, slug, logo_url, accent_color, should_color_logo, trial_end_date, referral_code, show_referral_popup, show_welcome_popup, created_at'

  const { data: full, error: fullError } = await supabase
    .from('users')
    .select(fullSelect)
    .eq('id', userId)
    .single()

  if (!fullError && full) {
    const row = full as DashboardProfile
    return {
      ...row,
      trial_end_date: row.trial_end_date || defaultTrialEndDate(row.created_at),
      show_referral_popup: row.show_referral_popup ?? false,
      show_welcome_popup: row.show_welcome_popup ?? false,
    }
  }

  const { data: basic, error: basicError } = await supabase
    .from('users')
    .select(
      'name, studio_name, slug, logo_url, accent_color, should_color_logo, created_at'
    )
    .eq('id', userId)
    .single()

  if (basicError || !basic) return null

  const row = basic as Omit<
    DashboardProfile,
    'trial_end_date' | 'referral_code' | 'show_referral_popup' | 'show_welcome_popup'
  >

  return {
    ...row,
    trial_end_date: defaultTrialEndDate(row.created_at),
    referral_code: row.slug,
    show_referral_popup: false,
    show_welcome_popup: false,
  }
}
