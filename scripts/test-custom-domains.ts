import assert from 'node:assert/strict'
import { test } from 'node:test'
import { connectCustomDomainSchema, isApexHostname } from '../lib/validations/domain'
import {
  isBrowserOnlyReservedPath,
  isPassthroughCustomDomainPath,
  resolveCustomDomainRewrite,
} from '../lib/domains/rewrite'
import { VercelClient } from '../lib/vercel/client'
import { VercelError } from '../lib/vercel/errors'
import { buildCanonicalUrl, buildPublicOpenGraph } from '../lib/seo/public-metadata'
import { buildPhotographerLocalBusinessJsonLd } from '../lib/seo/local-business-schema'
import { sanitizeCustomDomainHostname } from '../lib/domains/custom-domain-lookup'
import {
  resolveValidatedBlogPath,
  resolveValidatedGalleryPath,
  resolveValidatedPortfolioPath,
  resolveValidatedPostPath,
} from '../lib/seo/sitemap-validation'
import { buildPhotographerDiscoverySitemapEntries } from '../lib/seo/photographer-discovery'

test('connectCustomDomainSchema accepts a valid subdomain', () => {
  const result = connectCustomDomainSchema.parse({ hostname: 'www.johnphoto.com' })
  assert.equal(result.hostname, 'www.johnphoto.com')
})

test('connectCustomDomainSchema lowercases and strips a pasted https:// URL with a path', () => {
  const result = connectCustomDomainSchema.parse({ hostname: 'HTTPS://Gallery.JohnPhoto.com/some/path' })
  assert.equal(result.hostname, 'gallery.johnphoto.com')
})

test('connectCustomDomainSchema accepts a bare apex domain as-is (A-record flow)', () => {
  const result = connectCustomDomainSchema.parse({ hostname: 'johnphoto.com' })
  assert.equal(result.hostname, 'johnphoto.com')
})

test('isApexHostname distinguishes a root domain from a subdomain', () => {
  assert.equal(isApexHostname('johnphoto.com'), true)
  assert.equal(isApexHostname('www.johnphoto.com'), false)
})

test('connectCustomDomainSchema rejects the app\'s own *.vercel.app suffix', () => {
  assert.throws(() => connectCustomDomainSchema.parse({ hostname: 'preview.vercel.app' }))
})

test('connectCustomDomainSchema rejects invalid characters', () => {
  assert.throws(() => connectCustomDomainSchema.parse({ hostname: 'www.john photo!.com' }))
})

test('resolveCustomDomainRewrite maps known public paths to the slug', () => {
  assert.equal(resolveCustomDomainRewrite('/', 'john'), '/john')
  assert.equal(resolveCustomDomainRewrite('/portfolio', 'john'), '/john/portfolio')
  assert.equal(resolveCustomDomainRewrite('/blog', 'john'), '/john/blog')
  assert.equal(resolveCustomDomainRewrite('/blog/hello-world', 'john'), '/john/blog/hello-world')
  assert.equal(resolveCustomDomainRewrite('/before-after', 'john'), '/john/before-after')
  assert.equal(resolveCustomDomainRewrite('/seo-map', 'john'), '/john/seo-map')
})

test('resolveCustomDomainRewrite maps an individual gallery link to /{slug}/gallery/{id}', () => {
  assert.equal(
    resolveCustomDomainRewrite('/gallery/8673d1a0-7d3a-493a-b38f-816044140026', 'john'),
    '/john/gallery/8673d1a0-7d3a-493a-b38f-816044140026'
  )
})

test('resolveCustomDomainRewrite returns null for unrecognized paths (404, not a silent fallback)', () => {
  assert.equal(resolveCustomDomainRewrite('/some/random/path', 'john'), null)
  assert.equal(resolveCustomDomainRewrite('/blog/a/b', 'john'), null)
  assert.equal(resolveCustomDomainRewrite('/gallery/a/b', 'john'), null)
})

test('isPassthroughCustomDomainPath allows Next internals and API routes through unchanged', () => {
  assert.equal(isPassthroughCustomDomainPath('/api/contact'), true)
  assert.equal(isPassthroughCustomDomainPath('/_next/static/chunk.js'), true)
  assert.equal(isPassthroughCustomDomainPath('/favicon.ico'), true)
  assert.equal(isPassthroughCustomDomainPath('/'), false)
})

test('isBrowserOnlyReservedPath redirects dashboard/auth/admin routes to the main host', () => {
  assert.equal(isBrowserOnlyReservedPath('/dashboard/settings'), true)
  assert.equal(isBrowserOnlyReservedPath('/login'), true)
  assert.equal(isBrowserOnlyReservedPath('/manage'), true)
  assert.equal(isBrowserOnlyReservedPath('/portfolio'), false)
})

test('VercelClient retries on 5xx then succeeds', async () => {
  process.env.VERCEL_API_TOKEN = 'test-token'
  process.env.VERCEL_PROJECT_ID = 'prj_1'
  delete process.env.VERCEL_TEAM_ID

  let calls = 0
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    calls += 1
    if (calls < 3) return new Response('server error', { status: 502 })
    return new Response(JSON.stringify({ name: 'www.johnphoto.com', verified: true }), { status: 200 })
  }) as typeof fetch

  try {
    const client = new VercelClient()
    const result = await client.get<{ verified: boolean }>('/v9/projects/prj_1/domains/www.johnphoto.com')
    assert.equal(result.verified, true)
    assert.equal(calls, 3)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('VercelClient throws VercelError on a non-2xx response, without retrying a 4xx', async () => {
  process.env.VERCEL_API_TOKEN = 'test-token'
  process.env.VERCEL_PROJECT_ID = 'prj_1'
  delete process.env.VERCEL_TEAM_ID

  let calls = 0
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    calls += 1
    return new Response(JSON.stringify({ error: { code: 'domain_already_in_use', message: 'taken' } }), {
      status: 409,
    })
  }) as typeof fetch

  try {
    const client = new VercelClient()
    await assert.rejects(
      () => client.postJson('/v10/projects/prj_1/domains', { name: 'x' }),
      (error: unknown) => error instanceof VercelError && error.code === 'domain_taken'
    )
    assert.equal(calls, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('VercelClient appends teamId as a query param when configured', async () => {
  process.env.VERCEL_API_TOKEN = 'test-token'
  process.env.VERCEL_PROJECT_ID = 'prj_1'
  process.env.VERCEL_TEAM_ID = 'team_1'

  let capturedUrl = ''
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (url: string) => {
    capturedUrl = url
    return new Response(JSON.stringify({ name: 'www.johnphoto.com', verified: true }), { status: 200 })
  }) as typeof fetch

  try {
    const client = new VercelClient()
    await client.get('/v9/projects/prj_1/domains/www.johnphoto.com')
    assert.match(capturedUrl, /[?&]teamId=team_1(&|$)/)
  } finally {
    globalThis.fetch = originalFetch
    delete process.env.VERCEL_TEAM_ID
  }
})

test('buildCanonicalUrl defaults to the app base URL when no baseUrl is given', () => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://studio-galleries.com'
  assert.equal(buildCanonicalUrl('/lea-studio/blog'), 'https://studio-galleries.com/lea-studio/blog')
})

test('buildCanonicalUrl uses baseUrl to point at a photographer\'s own domain instead', () => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://studio-galleries.com'
  assert.equal(buildCanonicalUrl('/blog', 'https://johnphoto.com'), 'https://johnphoto.com/blog')
})

test('buildCanonicalUrl normalizes an empty path to the domain root, not a blank or double-slash URL', () => {
  assert.equal(buildCanonicalUrl('', 'https://johnphoto.com'), 'https://johnphoto.com/')
})

test('buildCanonicalUrl never produces a double slash when concatenating base + path', () => {
  const url = buildCanonicalUrl('/blog', 'https://johnphoto.com')
  assert.doesNotMatch(url.replace('https://', ''), /\/\//)
})

test('buildPublicOpenGraph threads baseUrl through to the og:url it builds', () => {
  const og = buildPublicOpenGraph({
    title: 'title',
    description: 'description',
    canonicalPath: '/blog',
    baseUrl: 'https://johnphoto.com',
  })
  assert.equal(og?.url, 'https://johnphoto.com/blog')
})

test('buildPhotographerLocalBusinessJsonLd threads baseUrl through to its url field', () => {
  const jsonLd = buildPhotographerLocalBusinessJsonLd({
    name: 'John',
    studioName: 'John Photo',
    canonicalPath: '/',
    baseUrl: 'https://johnphoto.com',
  })
  assert.equal(jsonLd.url, 'https://johnphoto.com/')
})

test('buildPhotographerLocalBusinessJsonLd falls back to the app domain when baseUrl is omitted', () => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://studio-galleries.com'
  const jsonLd = buildPhotographerLocalBusinessJsonLd({
    name: 'John',
    studioName: 'John Photo',
    canonicalPath: '/lea-studio',
  })
  assert.equal(jsonLd.url, 'https://studio-galleries.com/lea-studio')
})

test('sanitizeCustomDomainHostname passes through an already-clean hostname', () => {
  assert.equal(sanitizeCustomDomainHostname('www.johnphoto.com'), 'www.johnphoto.com')
})

test('sanitizeCustomDomainHostname strips a stray https:// prefix', () => {
  assert.equal(sanitizeCustomDomainHostname('https://www.johnphoto.com'), 'www.johnphoto.com')
})

test('sanitizeCustomDomainHostname strips trailing slashes', () => {
  assert.equal(sanitizeCustomDomainHostname('www.johnphoto.com/'), 'www.johnphoto.com')
  assert.equal(sanitizeCustomDomainHostname('www.johnphoto.com//'), 'www.johnphoto.com')
})

test('sanitizeCustomDomainHostname strips both a protocol and trailing slash together', () => {
  assert.equal(sanitizeCustomDomainHostname('HTTP://www.johnphoto.com/'), 'www.johnphoto.com')
})

// Passing '' as studioPath (a connected custom domain's root-relative base —
// see app/sitemap.ts) must build a root-relative path, NOT be treated the
// same as "no path at all" the way a falsy check would. Each of these
// mirrors a real bug found and fixed while wiring the per-domain sitemap.

test('resolveValidatedGalleryPath treats an explicit "" studioPath as root-relative, not "no path"', () => {
  const gallery = { id: 'g1', slug: null, gallery_type: 'regular', is_public: true }
  assert.equal(resolveValidatedGalleryPath(gallery, ''), '/gallery/g1')
  assert.equal(resolveValidatedGalleryPath(gallery), '/public-gallery/g1')
})

test('resolveValidatedPostPath treats an explicit "" studioPath as root-relative, not "no path"', () => {
  assert.equal(resolveValidatedPostPath('', 'p1'), '/blog/p1')
  assert.equal(resolveValidatedPostPath(null, 'p1'), null)
})

test('resolveValidatedBlogPath treats an explicit "" studioPath as root-relative, not "no path"', () => {
  assert.equal(resolveValidatedBlogPath(''), '/blog')
  assert.equal(resolveValidatedBlogPath(null), null)
})

test('resolveValidatedPortfolioPath treats an explicit "" studioPath as root-relative, not "no path"', () => {
  const photographer = { id: 'u1', slug: 'john', studio_name: 'John', gallery_layout_mode: 'portfolio' }
  assert.equal(resolveValidatedPortfolioPath(photographer, ''), '/portfolio')
  assert.equal(resolveValidatedPortfolioPath(photographer, null), null)
})

test('buildPhotographerDiscoverySitemapEntries with studioPathOverride builds a root-relative sitemap for a custom domain', () => {
  const photographer = {
    id: 'u1',
    slug: 'john',
    studio_name: 'John Photo',
    gallery_layout_mode: 'portfolio',
    created_at: '2026-01-01T00:00:00.000Z',
  }
  const galleries = [{ id: 'g1', slug: null, gallery_type: 'regular', is_public: true, title: 'Wedding', created_at: null }]
  const posts = [{ id: 'p1', title: 'Hello', subtitle: null, content: 'x', created_at: '2026-01-02T00:00:00.000Z' }]

  const entries = buildPhotographerDiscoverySitemapEntries({
    photographer,
    galleries,
    posts,
    studioPathOverride: '',
  })
  const paths = entries.map((entry) => entry.path)

  assert.ok(paths.includes(''), 'homepage should be root-relative (bare origin, equivalent to https://host/)')
  assert.ok(paths.includes('/gallery/g1'), 'gallery link should be root-relative, not //gallery/g1')
  assert.ok(paths.includes('/blog'), 'blog index should be root-relative')
  assert.ok(paths.includes('/blog/p1'), 'post link should be root-relative')
  assert.ok(paths.includes('/portfolio'), 'portfolio link should be root-relative')
  assert.ok(
    paths.every((path) => !path.startsWith('//')),
    `no entry should be double-slashed: ${JSON.stringify(paths)}`
  )
})
