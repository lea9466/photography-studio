function getSecret() {
  const value = process.env.GALLERY_SESSION_SECRET?.trim()
  if (value) return value

  if (process.env.NODE_ENV === 'production') {
    return ''
  }

  return 'dev-admin-secret'
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

async function sign(value: string, secret: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyAdminSessionTokenEdge(
  raw: string | undefined | null
) {
  if (!raw) return false

  const secret = getSecret()
  if (!secret) return false

  const lastColon = raw.lastIndexOf(':')
  if (lastColon <= 0) return false

  const sig = raw.slice(lastColon + 1)
  const payload = raw.slice(0, lastColon)
  const expected = await sign(payload, secret)
  if (!timingSafeEqual(expected, sig)) return false

  const sep = payload.indexOf(':')
  if (sep <= 0) return false

  const exp = Number(payload.slice(sep + 1))
  return Number.isFinite(exp) && Date.now() <= exp
}
