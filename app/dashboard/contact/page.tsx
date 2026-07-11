import { redirect } from 'next/navigation'
import { Mail } from 'lucide-react'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { DashboardContactForm } from '@/components/dashboard/DashboardContactForm'

export default async function ContactPage() {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase, actorEmail } = context

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, studio_name')
    .eq('id', userId)
    .maybeSingle<{ name: string | null; email: string | null; studio_name: string | null }>()

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <Mail className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                יצירת קשר
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                הערות, דיווח על באגים ובקשות פיצ׳רים — נשמח לשמוע מכן הצלמות
              </p>
            </div>
          </div>
        </div>
        <DashboardContactForm
          defaultName={profile?.name ?? ''}
          defaultEmail={profile?.email ?? actorEmail ?? ''}
          defaultStudio={profile?.studio_name ?? ''}
        />
      </div>
    </div>
  )
}
