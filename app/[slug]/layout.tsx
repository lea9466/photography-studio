import type { ReactNode } from 'react'
import { SiteGateScreen } from '@/components/site-gate/SiteGateScreen'
import { resolvePublicSiteGateBySlug } from '@/lib/site-access/public-gate'

type PhotographerSiteLayoutProps = {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export default async function PhotographerSiteLayout({
  children,
  params,
}: PhotographerSiteLayoutProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const gate = await resolvePublicSiteGateBySlug(decodedSlug)

  if (gate) {
    return (
      <SiteGateScreen
        mode={gate.mode}
        studioName={gate.studioName}
        siteLanguage={gate.siteLanguage}
      />
    )
  }

  return children
}
