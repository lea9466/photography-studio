import assert from 'node:assert/strict'
import { test } from 'node:test'
import { connectCustomDomainSchema } from '../lib/validations/domain'
import {
  isBrowserOnlyReservedPath,
  isPassthroughCustomDomainPath,
  resolveCustomDomainRewrite,
} from '../lib/domains/rewrite'
import { VercelClient } from '../lib/vercel/client'
import { VercelError } from '../lib/vercel/errors'

test('connectCustomDomainSchema accepts a valid subdomain', () => {
  const result = connectCustomDomainSchema.parse({ hostname: 'www.johnphoto.com' })
  assert.equal(result.hostname, 'www.johnphoto.com')
})

test('connectCustomDomainSchema lowercases and strips a pasted https:// URL with a path', () => {
  const result = connectCustomDomainSchema.parse({ hostname: 'HTTPS://Gallery.JohnPhoto.com/some/path' })
  assert.equal(result.hostname, 'gallery.johnphoto.com')
})

test('connectCustomDomainSchema rejects a bare apex domain (v1 requires a subdomain)', () => {
  assert.throws(() => connectCustomDomainSchema.parse({ hostname: 'johnphoto.com' }))
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

test('resolveCustomDomainRewrite returns null for unrecognized paths (404, not a silent fallback)', () => {
  assert.equal(resolveCustomDomainRewrite('/some/random/path', 'john'), null)
  assert.equal(resolveCustomDomainRewrite('/blog/a/b', 'john'), null)
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
