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
const BASE_CSP = "object-src 'none'; base-uri 'self'; frame-ancestors 'self'"

// Stricter policy for /dashboard, where SumitCardForm renders the card inputs
// in our own DOM (SUMIT PaymentsJS). Any script running on that page could
// read them, so only scripts from our origin and SUMIT may load there.
// - 'unsafe-inline': Next.js App Router injects inline bootstrap scripts; a
//   nonce-based policy would remove it (see note above).
// - https://app.sumit.co.il: payments.js. It posts the card to
//   https://api.sumit.co.il via XHR (connect-src, not restricted here).
// - browser-image-compression (useWebWorker) spawns a blob: worker that
//   importScripts() its own build from jsDelivr. Allowed by exact package path
//   only; if the package is upgraded, update the version in this URL.
// - 'unsafe-eval' only in development (React dev tooling / HMR).
// Next.js: when two header rules match a path and set the same key, the later
// rule wins, so this policy repeats BASE_CSP instead of adding to it.
const DASHBOARD_SCRIPT_SRC = [
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : []),
  'https://app.sumit.co.il',
  'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/',
].join(' ')

const DASHBOARD_CSP = `${BASE_CSP}; script-src ${DASHBOARD_SCRIPT_SRC}; worker-src 'self' blob:`

const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: BASE_CSP,
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
      {
        source: '/dashboard/:path*',
        headers: [{ key: 'Content-Security-Policy', value: DASHBOARD_CSP }],
      },
    ]
  },
  images: {
    // Previews are already compressed client-side before R2 upload.
    // Skip Vercel Image Optimization so browsers fetch R2 URLs directly.
    unoptimized: true,
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
