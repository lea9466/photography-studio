import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPublicPackages } from '@/lib/actions/package.actions'
import { signStoragePaths } from '@/lib/storage'
import { resolveMediaUrl } from '@/lib/r2/storage'
import { PackageCard } from '@/components/dashboard/PackageCard'
import {
  buildCanonicalUrl,
  buildPublicOpenGraph,
  resolveGalleryShareImage,
} from '@/lib/seo/public-metadata'

type PortfolioPageProps = {
  params: Promise<{ slug: string }>
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('galleries')
    .select('id, title, user_id, is_public')
    .eq('slug', slug)
    .eq('gallery_type', 'portfolio')
    .eq('is_public', true)
    .single()

  type GalleryRow = { id: string; title: string; user_id: string; is_public: boolean }
  const gallery = data as GalleryRow | null
  if (!gallery) notFound()

  const admin = createAdminClient()
  const { data: user } = await admin
    .from('users')
    .select('studio_name, logo_url, accent_color, selected_theme, hero_desktop_url, hero_mobile_url, about_text, about_image_url, stat_projects, stat_clients, stat_experience_years')
    .eq('id', gallery.user_id)
    .single()

  const profile = user as {
    studio_name: string | null
    logo_url: string | null
    accent_color: string | null
    selected_theme: string | null
    hero_desktop_url: string | null
    hero_mobile_url: string | null
    about_text: string | null
    about_image_url: string | null
    stat_projects: number | null
    stat_clients: number | null
    stat_experience_years: number | null
  } | null

  const accentColor = profile?.accent_color ?? '#7c3aed'
  const selectedTheme = profile?.selected_theme ?? 'classic'
  const heroPath = profile?.hero_desktop_url || profile?.hero_mobile_url
  const heroImageUrl = heroPath ? await resolveMediaUrl('branding', heroPath) : null
  const logoImageUrl = profile?.logo_url ? await resolveMediaUrl('branding', profile.logo_url) : null
  const aboutImageUrl = profile?.about_image_url ? await resolveMediaUrl('branding', profile.about_image_url) : null
  const statProjects = profile?.stat_projects ?? 0
  const statClients = profile?.stat_clients ?? 0
  const statExperienceYears = profile?.stat_experience_years ?? 0

  // Smart fallback logic: prefer edited photos for public display
  const { data: editedPhotos } = await admin
    .from('edited_photos')
    .select('photo_id, final_url')
    .eq('gallery_id', gallery.id)

  let photosToDisplay: { id: string; preview_url: string | null }[] = []
  let bucket: 'previews' | 'edited' = 'previews'

  if (editedPhotos && editedPhotos.length > 0) {
    // Use edited photos if available (protects client raw files)
    photosToDisplay = editedPhotos.map((ep) => ({
      id: ep.photo_id,
      preview_url: ep.final_url,
    }))
    bucket = 'edited'
  } else {
    // Fall back to all photos if no edited photos exist (portfolio showcase)
    const { data: regularPhotos } = await admin
      .from('photos')
      .select('id, preview_url')
      .eq('gallery_id', gallery.id)
      .eq('is_visible_to_client', true)
      .order('sort_order')
    
    photosToDisplay = (regularPhotos ?? []) as { id: string; preview_url: string | null }[]
  }

  const previewPaths = photosToDisplay.map((photo) => photo.preview_url)
  const signedUrls = await signStoragePaths(bucket, previewPaths, gallery.id)

  const signed = photosToDisplay.map(
    (photo) => ({
      ...photo,
      url: photo.preview_url ? signedUrls[photo.preview_url] ?? null : null,
    })
  )

  const packages = await fetchPublicPackages(gallery.user_id)

  return (
    <div
      className="min-h-screen"
      dir="rtl"
      data-theme={selectedTheme}
      style={{ '--client-accent': accentColor } as React.CSSProperties}
    >
      {/* Hero Section */}
      {heroImageUrl && (
        <div className="relative h-64 w-full overflow-hidden sm:h-96 lg:h-[500px]">
          <Image
            src={heroImageUrl}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center text-white">
              {logoImageUrl && (
                <div className="mb-4 flex justify-center">
                  <Image
                    src={logoImageUrl}
                    alt="Logo"
                    width={120}
                    height={120}
                    className="h-20 w-20 rounded-full object-contain"
                  />
                </div>
              )}
              <p className="text-lg font-medium">
                {profile?.studio_name ?? 'Portfolio'}
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl lg:text-5xl">
                {gallery.title}
              </h1>
            </div>
          </div>
        </div>
      )}

      <header className={`border-b border-[--border] px-4 py-8 text-center ${heroImageUrl ? 'hidden' : ''}`}>
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

        {/* About Section */}
        {(profile?.about_text || aboutImageUrl || statProjects > 0 || statClients > 0 || statExperienceYears > 0) && (
          <section className="mx-auto max-w-5xl px-4 py-8">
            <div className="grid gap-8 md:grid-cols-2">
              {aboutImageUrl && (
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={aboutImageUrl}
                    alt="About"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
              <div className={`flex flex-col justify-center ${aboutImageUrl ? '' : 'md:col-span-2'}`}>
                {profile?.about_text && (
                  <div className="mb-6">
                    <h2 className="mb-3 text-2xl font-semibold">אודות</h2>
                    <p className="text-sm leading-relaxed text-[--muted] whitespace-pre-line">
                      {profile.about_text}
                    </p>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-3">
                  {statProjects > 0 && (
                    <div className="rounded-lg border border-[--border] p-4 text-center">
                      <p className="text-3xl font-semibold" style={{ color: 'var(--client-accent)' }}>
                        {statProjects}
                      </p>
                      <p className="mt-1 text-sm text-[--muted]">פרויקטים</p>
                    </div>
                  )}
                  {statClients > 0 && (
                    <div className="rounded-lg border border-[--border] p-4 text-center">
                      <p className="text-3xl font-semibold" style={{ color: 'var(--client-accent)' }}>
                        {statClients}
                      </p>
                      <p className="mt-1 text-sm text-[--muted]">לקוחות</p>
                    </div>
                  )}
                  {statExperienceYears > 0 && (
                    <div className="rounded-lg border border-[--border] p-4 text-center">
                      <p className="text-3xl font-semibold" style={{ color: 'var(--client-accent)' }}>
                        {statExperienceYears}
                      </p>
                      <p className="mt-1 text-sm text-[--muted]">שנות ניסיון</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export async function generateMetadata({ params }: PortfolioPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('galleries')
    .select('id, title, is_public, user_id, cover_image')
    .eq('slug', slug)
    .eq('gallery_type', 'portfolio')
    .eq('is_public', true)
    .single()

  type GalleryRow = {
    id: string
    title: string
    is_public: boolean
    user_id: string
    cover_image: string | null
  }
  const gallery = data as GalleryRow | null

  if (!gallery) {
    return {
      title: 'גלריה לא נמצאה',
    }
  }

  const admin = createAdminClient()
  const { data: user } = await admin
    .from('users')
    .select('studio_name')
    .eq('id', gallery.user_id)
    .single()

  type UserRow = { studio_name: string | null }
  const profile = user as UserRow | null
  const studioName = profile?.studio_name || 'Studio Gallery'
  const title = `${gallery.title} | ${studioName}`
  const description = `תיק עבודות מאת ${studioName}`
  const canonicalPath = `/portfolio/${slug}`
  const shareImage = await resolveGalleryShareImage(gallery.id, gallery.cover_image)

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonicalUrl(canonicalPath),
    },
    openGraph: buildPublicOpenGraph({
      title,
      description,
      canonicalPath,
      imageUrl: shareImage,
    }),
  }
}
