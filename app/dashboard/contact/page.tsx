import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardContactForm } from '@/components/dashboard/DashboardContactForm'

export default async function ContactPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, studio_name')
    .eq('id', user.id)
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
        defaultEmail={profile?.email ?? user.email ?? ''}
        defaultStudio={profile?.studio_name ?? ''}
      />
    </div>
  )
}
