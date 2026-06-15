import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchPackages } from '@/lib/actions/package.actions'
import { PackagesManager } from '@/components/dashboard/PackagesManager'

export default async function PackagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const packages = await fetchPackages()

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">חבילות צילום</h1>
        <p className="mt-1 text-sm text-[--muted]">
          הגדירי חבילות עם מחיר ורשימת &quot;מה כלול&quot; — יוצגו בדף הציבורי
        </p>
      </div>
      <PackagesManager initialPackages={packages} />
    </div>
  )
}
