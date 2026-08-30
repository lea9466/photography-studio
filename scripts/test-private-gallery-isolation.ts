import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  decidePrivateGalleryRouting,
  getPrivateGalleryHost,
  isAllowedOnPrivateGalleryHost,
} from '../lib/private-gallery/isolation'
import { isKnownAppHost } from '../lib/domains/custom-domain-lookup'
import { resolveGalleryAccessMode } from '../lib/gallery-access'

/**
 * Locks the isolation the private-gallery subdomain was promised (in writing)
 * to a content-filter provider: that host serves ONLY the gallery routes,
 * everything else 404s, and old `/g/` links on the main domain hand off to
 * it. Runs standalone (`tsx --test scripts/test-private-gallery-isolation.ts`)
 * — the decision logic is a pure function, no Edge runtime needed.
 */

const APP_URL = 'https://studio-galleries.com'
const PRIVATE_URL = 'https://private.studio-galleries.com'
const PRIVATE_HOST = 'private.studio-galleries.com'
const APP_HOST = 'studio-galleries.com'

const ENV_KEYS = ['NEXT_PUBLIC_PRIVATE_GALLERY_URL', 'NEXT_PUBLIC_APP_URL'] as const

function withEnv(
  vars: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>,
  fn: () => void
) {
  const saved = ENV_KEYS.map((key) => [key, process.env[key]] as const)
  try {
    for (const key of ENV_KEYS) {
      const value = key in vars ? vars[key] : undefined
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    fn()
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

// ===== getPrivateGalleryHost: when is the isolation active? =====

test('getPrivateGalleryHost is null when the env var is unset (feature dormant)', () => {
  withEnv({ NEXT_PUBLIC_APP_URL: APP_URL }, () => {
    assert.equal(getPrivateGalleryHost(), null)
  })
})

test('getPrivateGalleryHost returns the configured host once set', () => {
  withEnv({ NEXT_PUBLIC_APP_URL: APP_URL, NEXT_PUBLIC_PRIVATE_GALLERY_URL: PRIVATE_URL }, () => {
    assert.equal(getPrivateGalleryHost(), PRIVATE_HOST)
  })
})

test('getPrivateGalleryHost refuses to activate when pointed at the app\'s own host', () => {
  withEnv(
    { NEXT_PUBLIC_APP_URL: APP_URL, NEXT_PUBLIC_PRIVATE_GALLERY_URL: APP_URL },
    () => {
      assert.equal(getPrivateGalleryHost(), null)
    }
  )
})

test('getPrivateGalleryHost is null for a malformed env value', () => {
  withEnv(
    { NEXT_PUBLIC_APP_URL: APP_URL, NEXT_PUBLIC_PRIVATE_GALLERY_URL: 'not a url' },
    () => {
      assert.equal(getPrivateGalleryHost(), null)
    }
  )
})

test('getPrivateGalleryHost still resolves when NEXT_PUBLIC_APP_URL is unset', () => {
  withEnv({ NEXT_PUBLIC_PRIVATE_GALLERY_URL: PRIVATE_URL }, () => {
    assert.equal(getPrivateGalleryHost(), PRIVATE_HOST)
  })
})

// ===== isAllowedOnPrivateGalleryHost: the allowlist =====

test('isAllowedOnPrivateGalleryHost allows the gallery routes and app internals', () => {
  for (const pathname of [
    '/g/abc-123',
    '/g/',
    '/_next/static/chunks/main.js',
    '/_next/data/build/g/abc.json',
    '/_next/image?url=x',
    '/favicon.ico',
    '/api/gallery-media',
  ]) {
    assert.equal(isAllowedOnPrivateGalleryHost(pathname), true, pathname)
  }
})

test('isAllowedOnPrivateGalleryHost blocks everything else', () => {
  for (const pathname of [
    '/',
    '/g',
    '/dashboard',
    '/dashboard/galleries',
    '/login',
    '/register',
    '/manage',
    '/lea-studio',
    '/lea-studio/gallery/abc',
    '/portfolio/some-slug',
    '/blog',
    '/api/contact-inquiry',
  ]) {
    assert.equal(isAllowedOnPrivateGalleryHost(pathname), false, pathname)
  }
})

test('isAllowedOnPrivateGalleryHost matches /api/gallery-media exactly, not as a prefix', () => {
  assert.equal(isAllowedOnPrivateGalleryHost('/api/gallery-media'), true)
  assert.equal(isAllowedOnPrivateGalleryHost('/api/gallery-media-export'), false)
  assert.equal(isAllowedOnPrivateGalleryHost('/api/gallery-media/anything'), false)
})

// ===== decidePrivateGalleryRouting: the middleware decision =====

test('decidePrivateGalleryRouting is always passthrough while no private host is configured', () => {
  for (const pathname of ['/', '/g/abc', '/dashboard']) {
    assert.deepEqual(decidePrivateGalleryRouting('anything', pathname, null), {
      action: 'passthrough',
    })
  }
})

test('decidePrivateGalleryRouting passes allowlisted paths through on the private host', () => {
  assert.deepEqual(decidePrivateGalleryRouting(PRIVATE_HOST, '/g/abc', PRIVATE_HOST), {
    action: 'passthrough',
  })
  assert.deepEqual(
    decidePrivateGalleryRouting(PRIVATE_HOST, '/_next/static/x.js', PRIVATE_HOST),
    { action: 'passthrough' }
  )
})

test('decidePrivateGalleryRouting blocks (404) a non-allowlisted path on the private host', () => {
  for (const pathname of ['/', '/dashboard', '/login', '/lea-studio', '/api/contact-inquiry']) {
    assert.deepEqual(
      decidePrivateGalleryRouting(PRIVATE_HOST, pathname, PRIVATE_HOST),
      { action: 'block' },
      pathname
    )
  }
})

test('decidePrivateGalleryRouting redirects a /g/ link opened on the main domain to the private host', () => {
  assert.deepEqual(decidePrivateGalleryRouting(APP_HOST, '/g/abc-123', PRIVATE_HOST), {
    action: 'redirect',
    host: PRIVATE_HOST,
  })
})

test('decidePrivateGalleryRouting leaves every other main-domain path alone', () => {
  for (const pathname of ['/', '/lea-studio', '/lea-studio/gallery/abc', '/dashboard']) {
    assert.deepEqual(
      decidePrivateGalleryRouting(APP_HOST, pathname, PRIVATE_HOST),
      { action: 'passthrough' },
      pathname
    )
  }
})

test('decidePrivateGalleryRouting redirects a /g/ link even when the Host header is missing', () => {
  assert.deepEqual(decidePrivateGalleryRouting(null, '/g/abc', PRIVATE_HOST), {
    action: 'redirect',
    host: PRIVATE_HOST,
  })
})

// ===== isKnownAppHost: the private host is never a tenant custom domain =====

test('isKnownAppHost recognizes the private gallery host, the app host, localhost and vercel previews', () => {
  withEnv(
    { NEXT_PUBLIC_APP_URL: APP_URL, NEXT_PUBLIC_PRIVATE_GALLERY_URL: PRIVATE_URL },
    () => {
      assert.equal(isKnownAppHost(PRIVATE_HOST), true)
      assert.equal(isKnownAppHost(APP_HOST), true)
      assert.equal(isKnownAppHost('localhost'), true)
      assert.equal(isKnownAppHost('some-preview.vercel.app'), true)
      assert.equal(isKnownAppHost('johnphoto.com'), false)
    }
  )
})

// ===== resolveGalleryAccessMode: UUID alone is never authorization =====

test('resolveGalleryAccessMode grants public access to a public gallery', () => {
  assert.equal(
    resolveGalleryAccessMode({ isPublic: true, hasSessionForGallery: false }),
    'public'
  )
})

test('resolveGalleryAccessMode grants session access only with a matching session', () => {
  assert.equal(
    resolveGalleryAccessMode({ isPublic: false, hasSessionForGallery: true }),
    'session'
  )
})

test('resolveGalleryAccessMode denies a private gallery with no session', () => {
  assert.equal(
    resolveGalleryAccessMode({ isPublic: false, hasSessionForGallery: false }),
    null
  )
})

test('resolveGalleryAccessMode: public wins even if a stale session is also present', () => {
  assert.equal(
    resolveGalleryAccessMode({ isPublic: true, hasSessionForGallery: true }),
    'public'
  )
})
