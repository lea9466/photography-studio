import { createAdminClient } from '@/lib/supabase/admin'

export async function resolveReferrerId(ref: string): Promise<string | null> {
  const code = ref.trim()
  if (!code) return null

  const admin = createAdminClient()

  const { data: byCode } = await admin
    .from('users')
    .select('id')
    .eq('referral_code', code)
    .maybeSingle()

  if (byCode) return (byCode as { id: string }).id

  const { data: bySlug } = await admin
    .from('users')
    .select('id')
    .eq('slug', code)
    .maybeSingle()

  return (bySlug as { id: string } | null)?.id ?? null
}

export async function applyReferralOnSignup(userId: string, ref: string) {
  const referrerId = await resolveReferrerId(ref)
  if (!referrerId || referrerId === userId) return

  const admin = createAdminClient()
  await admin
    .from('users')
    .update({ referred_by_user_id: referrerId } as never)
    .eq('id', userId)
    .is('referred_by_user_id', null)
}

export async function processReferralBonusIfEligible(userId: string) {
  const admin = createAdminClient()

  const { count } = await admin
    .from('galleries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count !== 2) return

  const { data: profile } = await admin
    .from('users')
    .select('referred_by_user_id, has_triggered_referral_bonus')
    .eq('id', userId)
    .single()

  const row = profile as {
    referred_by_user_id: string | null
    has_triggered_referral_bonus: boolean
  } | null

  if (!row?.referred_by_user_id || row.has_triggered_referral_bonus) return

  const { data: referrer } = await admin
    .from('users')
    .select('trial_end_date')
    .eq('id', row.referred_by_user_id)
    .single()

  const currentEnd = new Date(
    (referrer as { trial_end_date: string } | null)?.trial_end_date ?? Date.now()
  )
  currentEnd.setDate(currentEnd.getDate() + 30)

  await admin
    .from('users')
    .update({
      trial_end_date: currentEnd.toISOString(),
      show_referral_popup: true,
    } as never)
    .eq('id', row.referred_by_user_id)

  await admin
    .from('users')
    .update({ has_triggered_referral_bonus: true } as never)
    .eq('id', userId)
}
