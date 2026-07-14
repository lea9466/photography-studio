import type { NextConfig } from 'next'

// Intermediate hardening headers — NOT a full CSP. `script-src`/`style-src`
// deliberately are NOT restricted here: the public `/[slug]` homepage (see
// components/photographer/PhotographerHomepage.tsx) relies on numerous
// inline <script>/<style> blocks plus an external https://cdn.tailwindcss.com
// script and Google Fonts stylesheets, and the dashboard relies on inline
// `style={{...}}` attributes throughout. A `'self'`-only (or no
// 'unsafe-inline') policy for those directives would break real,
// load-bearing functionality today. Enabling them safely requires a
// nonce-based CSP (threaded through middleware + every script/style
// injection point) — a separate, larger change, not implemented here.
// The directives below have no such conflict: nothing in this app uses
// <object>/<embed>/<base>, and nothing legitimately needs to embed this
// site in a third-party iframe.
const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'albums.studio-galleries.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    middlewareClientMaxBodySize: '50mb',
  },
}

export default nextConfig
