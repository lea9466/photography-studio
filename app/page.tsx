import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MVP_DEFAULT_DASHBOARD_PATH } from '@/lib/types/app.types'
import { NovaHome } from '@/components/marketing/nova/NovaHome'
import { buildMarketingMetadata } from '@/lib/seo/marketing-metadata'

export const metadata: Metadata = buildMarketingMetadata()

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(MVP_DEFAULT_DASHBOARD_PATH)
  }

  return <NovaHome />
}
