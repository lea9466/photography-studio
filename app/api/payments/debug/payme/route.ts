import { NextRequest, NextResponse } from 'next/server'
import { PaymentError } from '@/lib/payments/errors'
import { paymentErrorResponse } from '@/lib/payments/http'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const env = process.env.PAYME_ENV?.trim().toLowerCase() || 'sandbox'
    if (env !== 'sandbox') {
      throw new PaymentError('provider_not_configured')
    }

    const rawBody = new Uint8Array(await request.arrayBuffer())
    const contentType = request.headers.get('content-type') ?? ''
    const method = request.method

    const payload = rawBody.byteLength === 0
      ? {}
      : (() => {
          const text = new TextDecoder('utf-8').decode(rawBody)
          try {
            return JSON.parse(text)
          } catch {
            const params = new URLSearchParams(text)
            const out: Record<string, unknown> = {}
            for (const [key, value] of params.entries()) {
              out[key] = value
            }
            return out
          }
        })()

    const fieldNames = Object.keys(payload).filter((key) => typeof key === 'string')

    return NextResponse.json({
      ok: true,
      mode: 'sandbox-only-debug',
      method,
      contentType,
      fieldNames,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return paymentErrorResponse(error)
  }
}
