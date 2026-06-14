import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MarketingHome } from '@/components/marketing/MarketingHome'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <MarketingHome />
}
