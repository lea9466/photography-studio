import { NextRequest, NextResponse } from 'next/server'
import { PaymentError } from '@/lib/payments/errors'
import { paymentErrorResponse } from '@/lib/payments/http'
import { createPaymentService } from '@/lib/payments/server'

export const runtime = 'nodejs'

const MAX_WEBHOOK_BYTES = 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
      throw new PaymentError('invalid_request')
    }

    const rawBody = new Uint8Array(await request.arrayBuffer())
    if (rawBody.byteLength === 0 || rawBody.byteLength > MAX_WEBHOOK_BYTES) {
      throw new PaymentError('invalid_request')
    }

    const result = await createPaymentService().processWebhook({
      providerName: 'payme',
      rawBody,
      headers: request.headers,
    })

    return NextResponse.json({ received: true, ...result })
  } catch (error) {
    return paymentErrorResponse(error)
  }
}
