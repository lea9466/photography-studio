import { redirect } from 'next/navigation'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { SubscriptionPanel } from '@/components/dashboard/SubscriptionPanel'
import { SubscriptionPlanBadge } from '@/components/dashboard/SubscriptionPlanBadge'

export default async function SubscriptionPage() {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context

  const { data: profile } = await supabase
    .from('users')
    .select('trial_end_date, referral_code, slug')
    .eq('id', userId)
    .single()

  const row = profile as {
    trial_end_date: string
    referral_code: string | null
    slug: string | null
  } | null

  const referralCode = row?.referral_code || row?.slug
  if (!row?.trial_end_date || !referralCode) {
    redirect('/dashboard/galleries')
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6 p-6 md:p-10">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">מינוי</h1>
          <SubscriptionPlanBadge plan="free" />
        </div>
        <p className="mt-1 text-sm text-[--muted]">
          מעקב אחר תקופת הניסיון ושיתוף עם חברות צלמות
        </p>
      </div>
      <SubscriptionPanel
        trialEndDate={row.trial_end_date}
        referralCode={referralCode}
      />
    </div>
  )
}
