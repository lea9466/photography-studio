import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPublicPackages } from '@/lib/actions/package.actions'
import { signStoragePaths } from '@/lib/storage'
import { PackageCard } from '@/components/dashboard/PackageCard'

type PortfolioPageProps = {
  params: Promise<{ slug: string }>
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('galleries')
    .select('id, title, user_id')
    .eq('slug', slug)
    .eq('gallery_type', 'portfolio')
    .single()

  type GalleryRow = { id: string; title: string; user_id: string }
  const gallery = data as GalleryRow | null
  if (!gallery) notFound()

  const admin = createAdminClient()
  const { data: user } = await admin
    .from('users')
    .select('studio_name, logo_url')
    .eq('id', gallery.user_id)
    .single()

  const profile = user as { studio_name: string | null; logo_url: string | null } | null

  const { data: photos } = await admin
    .from('photos')
    .select('id, preview_url')
    .eq('gallery_id', gallery.id)
    .eq('is_visible_to_client', true)
    .order('sort_order')

  const previewPaths = ((photos ?? []) as { id: string; preview_url: string | null }[]).map(
    (photo) => photo.preview_url
  )
  const signedUrls = await signStoragePaths('previews', previewPaths)

  const signed = ((photos ?? []) as { id: string; preview_url: string | null }[]).map(
    (photo) => ({
      ...photo,
      url: photo.preview_url ? signedUrls[photo.preview_url] ?? null : null,
    })
  )

  const packages = await fetchPublicPackages(gallery.user_id)

  return (
    <div className="min-h-screen" dir="rtl">
      <header className="border-b border-[--border] px-4 py-8 text-center">
        <p className="text-sm text-[--muted]">
          {profile?.studio_name ?? 'Portfolio'}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{gallery.title}</h1>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-12">
        {packages.length > 0 ? (
          <section>
            <h2 className="mb-6 text-2xl font-semibold">חבילות צילום</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          {packages.length > 0 ? (
            <h2 className="mb-6 text-2xl font-semibold">תיק עבודות</h2>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {signed.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-[--border]"
            >
              {photo.url ? (
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : null}
            </div>
          ))}
        </div>
        </section>
      </main>
    </div>
  )
}
