import Link from 'next/link'
import type { ComponentProps } from 'react'

/**
 * next/link for the public photographer sites, with prefetch OFF by default.
 *
 * Public pages (/[slug], /portfolio/[slug], ...) render dynamically on every
 * request, so each viewport prefetch of a <Link> is a full server render that
 * the visitor usually never opens. Vercel request logs (Nov 2026) showed about
 * half of public-page function invocations were prefetches. Client-side
 * navigation on click still works; the page just loads on click instead of
 * ahead of time. Pass prefetch={true} explicitly to opt a link back in. If these
 * pages ever become ISR-cached, prefetch is cheap again and this default can go.
 */
export default function PublicLink({ prefetch = false, ...props }: ComponentProps<typeof Link>) {
  return <Link prefetch={prefetch} {...props} />
}
