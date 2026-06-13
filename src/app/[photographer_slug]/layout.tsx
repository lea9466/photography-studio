import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ThemeBodyInjector from '@/components/ThemeBodyInjector'
import { SignupWelcomeBanner } from '@/components/studio/SignupWelcomeBanner'
import { getPhotographerSession } from '@/lib/auth-helpers'
import { clientBelongsToPhotographer } from '@/lib/client-db'
import { getClientSession } from '@/lib/client-session'
import { fetchPhotographerBySlug } from '@/lib/db'
import { getSiteSettings } from '@/lib/site-settings'
import { parseThemeStyle } from '@/lib/theme-styles'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ photographer_slug: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ photographer_slug: string }>
}): Promise<Metadata> {
  const { photographer_slug } = await params
  const settings = await getSiteSettings(photographer_slug)
  const title = settings?.business_name?.trim() || 'סטודיו צילום'
  const tagline = settings?.tagline?.trim()
  return {
    title,
    ...(tagline ? { description: tagline } : {}),
  }
}

export default async function PhotographerLayout({
  children,
  params,
}: LayoutProps) {
  const { photographer_slug } = await params
  const photographer = await fetchPhotographerBySlug(photographer_slug)
  if (!photographer) notFound()

  const [settings, session, clientId] = await Promise.all([
    getSiteSettings(photographer_slug),
    getPhotographerSession(),
    getClientSession(),
  ])
  const brandName = settings?.business_name?.trim() || 'סטודיו צילום'
  const logoUrl = settings?.logo_url?.trim() || null
  const isOwner = session?.photographer.slug === photographer_slug

  const isClient =
    !isOwner && clientId
      ? await clientBelongsToPhotographer(clientId, photographer.id)
      : false
  const viewer = isOwner ? ('admin' as const) : isClient ? ('client' as const) : null

  const themeStyle = parseThemeStyle(settings?.theme_style)

  return (
    <div>
      <ThemeBodyInjector
        theme={themeStyle}
        photographerSlug={photographer_slug}
        primaryColor={settings?.primary_color}
        secondaryColor={settings?.secondary_color}
      />
      <Navbar
        brandName={brandName}
        logoUrl={logoUrl}
        photographerSlug={photographer_slug}
        photographerId={photographer.id}
        themeStyle={themeStyle}
        viewer={viewer}
      />
      <Suspense fallback={null}>
        <SignupWelcomeBanner isOwner={isOwner} />
      </Suspense>
      {children}
    </div>
  )
}
