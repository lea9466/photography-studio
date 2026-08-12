import 'server-only'

import { NextResponse } from 'next/server'
import {
  isMissingBillingSchemaError,
  PaymentError,
  toPaymentError,
} from './errors'

export function paymentErrorResponse(error: unknown) {
  const safe = isMissingBillingSchemaError(error)
    ? new PaymentError('billing_not_initialized')
    : toPaymentError(error)
  if (safe.code === 'provider_unavailable' || safe.code === 'internal_error') {
    const underlying = error instanceof Error ? (error as Error & { cause?: unknown }) : null
    const causeText = underlying?.cause
      ? JSON.stringify(underlying.cause).slice(0, 1000)
      : error instanceof Error
        ? error.message
        : String(error)
    console.error('[payments] request failed', {
      code: safe.code,
      message: safe.message,
      cause: causeText,
    })
    const detail = safe.detail ?? causeText
    return NextResponse.json(
      { error: safe.message, code: safe.code, detail: detail.slice(0, 500) },
      { status: safe.status }
    )
  }

  return NextResponse.json(
    {
      error: safe.message,
      code: safe.code,
      ...(safe.detail ? { detail: safe.detail } : {}),
    },
    { status: safe.status }
  )
  return NextResponse.json(
    {
      error: safe.message,
      code: safe.code,
      ...(safe.detail ? { detail: safe.detail } : {}),
    },
    { status: safe.status }
  )
}

export function getPaymentReturnUrl(path: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new PaymentError('provider_not_configured')
    }
    return `http://localhost:3000${path}`
  }

  let base: URL
  try {
    base = new URL(configured)
  } catch {
    throw new PaymentError('provider_not_configured')
  }

  if (base.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new PaymentError('provider_not_configured')
  }

  return new URL(path, `${base.toString().replace(/\/$/, '')}/`).toString()
}

export async function readSmallJson(
  request: Request,
  maxBytes = 8 * 1024
): Promise<Record<string, unknown>> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > maxBytes) throw new PaymentError('invalid_request')

  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new PaymentError('invalid_request')
  }

  try {
    const value = JSON.parse(raw) as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new PaymentError('invalid_request')
    }
    return value as Record<string, unknown>
  } catch (error) {
    if (error instanceof PaymentError) throw error
    throw new PaymentError('invalid_request')
  }
}
