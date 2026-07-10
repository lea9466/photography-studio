import { redirect } from 'next/navigation'
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
    <div className="animate-fade-in space-y-6 p-6 md:p-10 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">יצירת קשר</h1>
        <p className="mt-1 text-sm text-[--muted]">
          הערות, דיווח על באגים ובקשות פיצ׳רים — נשמח לשמוע מכן הצלמות
        </p>
      </div>
      <DashboardContactForm
        defaultName={profile?.name ?? ''}
        defaultEmail={profile?.email ?? actorEmail ?? ''}
        defaultStudio={profile?.studio_name ?? ''}
      />
    </div>
  )
}
