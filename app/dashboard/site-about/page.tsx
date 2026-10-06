import { redirect } from 'next/navigation'

import { User } from 'lucide-react'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'

import { ProfileForm } from '@/components/dashboard/ProfileForm'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { loadSiteProfile } from '@/lib/queries/site-profile'

export default async function SiteAboutSectionPage() {
  let context

  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context

  const [entitlements, profile] = await Promise.all([
    getStudioEntitlements(userId),
    loadSiteProfile(supabase, userId),
  ])

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="relative flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <User className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                סקשן אודות
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                התמונה, הכותרות, הטקסט והנתונים של סקשן האודות בדף הבית. כל שינוי שתשמרי יתעדכן באתר הציבורי.
              </p>
            </div>
          </div>
        </div>

        <ProfileForm view="about" profile={profile} isPro={entitlements.isPro} />
      </div>
    </div>
  )
}
