import { redirect } from 'next/navigation'
import { tenantHashPath } from '@/lib/tenant-paths'

export default async function PricingPage({
  params,
}: {
  params: Promise<{ photographer_slug: string }>
}) {
  const { photographer_slug } = await params
  redirect(tenantHashPath(photographer_slug, '#pricing'))
}
