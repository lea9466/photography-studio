#!/usr/bin/env node
/** HTTP probe: private /g/{id} without session must not expose signed photo URLs. */

const studioRes = await fetch('http://127.0.0.1:3000/lea-studio')
const html = await studioRes.text()
console.log('studio status', studioRes.status)

const ids = [...html.matchAll(/\/g\/([0-9a-f-]{36})/gi)].map((m) => m[1])
const unique = [...new Set(ids)]
console.log('gallery ids from studio page', unique.slice(0, 8))

if (unique.length === 0) {
  // Fallback: random uuid — expect notFound or password UX, never signed urls
  unique.push('00000000-0000-0000-0000-000000000000')
}

for (const id of unique.slice(0, 3)) {
  const res = await fetch(`http://127.0.0.1:3000/g/${id}`)
  const body = await res.text()
  const hasPasswordGate = /type=["']password["']|סיסמ|password/i.test(body)
  const hasSignedUrls = /X-Amz-Signature|preview_signed_url|lightbox_signed_url/i.test(body)
  const isPublicClientView = /ClientGalleryView|data-gallery/i.test(body) && !hasPasswordGate
  console.log({
    id,
    status: res.status,
    hasPasswordGate,
    hasSignedUrls,
    exposedWithoutAuth: hasSignedUrls && !hasPasswordGate,
    title: body.match(/<title>[^<]+/)?.[0],
  })
}
