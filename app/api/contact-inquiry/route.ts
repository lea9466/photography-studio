import { NextResponse } from 'next/server'
import { submitContactInquiry } from '@/lib/actions/contact.actions'

// A plain text contact form (name/email/phone/subject/message) has no
// legitimate reason to ever approach this size — reject oversized bodies
// as an application-level decision instead of relying only on whatever
// default limit the hosting platform happens to enforce.
const MAX_BODY_BYTES = 20 * 1024 // 20KB

export async function POST(request: Request) {
  try {
    // Fast path: reject without reading the body at all when the client
    // reports its size upfront via Content-Length.
    const contentLength = request.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'הבקשה גדולה מהמותר' }, { status: 413 })
    }

    // Fallback: Content-Length can be absent (e.g. chunked transfer-encoding)
    // or spoofed, so also enforce the cap on the actual bytes received
    // before handing them to JSON.parse.
    const rawBody = await request.text()
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'הבקשה גדולה מהמותר' }, { status: 413 })
    }

    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
    }

    await submitContactInquiry({
      photographerId: String(body.photographerId ?? ''),
      name: String(body.name ?? ''),
      email: String(body.email ?? ''),
      phone: body.phone ? String(body.phone) : undefined,
      subject: body.subject ? String(body.subject) : undefined,
      message: String(body.message ?? ''),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'שגיאה בשליחה' },
      { status: 400 }
    )
  }
}
