import { redirect } from 'next/navigation'
import { tenantHashPath, tenantQueryHashPath } from '@/lib/tenant-paths'

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ photographer_slug: string }>
  searchParams: Promise<{ package?: string; source?: string }>
}) {
  const { photographer_slug } = await params
  const { package: packageId, source } = await searchParams

  if (packageId || source) {
    redirect(
      tenantQueryHashPath(
        photographer_slug,
        { package: packageId, source },
        '#contact'
      )
    )
  }

  redirect(tenantHashPath(photographer_slug, '#contact'))
}
