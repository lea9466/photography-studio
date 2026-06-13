import ForgotCodeForm from '@/components/client/ForgotCodeForm'
import { fetchPhotographerBySlug } from '@/lib/db'
import { getSiteSettings } from '@/lib/site-settings'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ClientForgotCodePage({
  params,
}: {
  params: Promise<{ photographer_slug: string }>
}) {
  const { photographer_slug } = await params
  const photographer = await fetchPhotographerBySlug(photographer_slug)
  if (!photographer) notFound()

  const settings = await getSiteSettings(photographer_slug)
  const studioName =
    settings?.business_name?.trim() ||
    photographer.display_name?.trim() ||
    'הסטודיו'

  return (
    <main className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-6xl text-right">
        <h1 className="font-heading mb-10 text-center text-4xl text-[var(--color-paris-deep)] md:text-5xl">
          אזור לקוח
        </h1>
        <ForgotCodeForm
          photographerSlug={photographer_slug}
          photographerId={photographer.id}
          studioName={studioName}
        />
      </div>
    </main>
  )
}
