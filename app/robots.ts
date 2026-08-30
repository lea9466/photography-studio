import { headers } from 'next/headers'
import type { MetadataRoute } from 'next'
import { isKnownAppHost } from '@/lib/domains/custom-domain-lookup'

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://studio-galleries.com').replace(/\/$/, '')

export default async function robots(): Promise<MetadataRoute.Robots> {
  // On a photographer's connected custom domain, point at its OWN sitemap
  // (see app/sitemap.ts's buildCustomDomainSitemap) rather than the main
  // app's — that sitemap wouldn't contain this domain's URLs at all.
  const host = (await headers()).get('host')?.split(':')[0]?.toLowerCase() ?? null
  const sitemapBaseUrl = host && !isKnownAppHost(host) ? `https://${host}` : BASE_URL

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/login', '/register', '/auth/', '/manage'],
    },
    sitemap: `${sitemapBaseUrl}/sitemap.xml`,
  }
}
