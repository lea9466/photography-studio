'use server'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPaymentService } from '@/lib/payments/server'
import { getPaymentReturnUrl } from '@/lib/payments/http'
import { fetchGalleryPassBundleByCode } from '@/lib/gallery-pass/loader'
import { fetchAvailableGalleryPassCredits } from '@/lib/gallery-pass/credits'

/**
 * Client-facing Server Actions return { ok, error } rather than throwing — Next
 * hides thrown messages in prod (see project memory). The happy path hands back
 * the SUMIT checkout URL for the client to redirect to.
 */
type GalleryPassCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string }

async function buildCreditCheckout(
  userId: string,
  credit: {
    id: string
    bundle_name: string
    amount_agorot: number
    currency: string
  }
): Promise<GalleryPassCheckoutResult> {
  try {
    const session = await createPaymentService().createGalleryPassCheckout({
      userId,
      creditId: credit.id,
      itemName: `פאס גלריה · ${credit.bundle_name}`,
      amountAgorot: credit.amount_agorot,
      currency: credit.currency,
      // Back to the new-client-gallery flow — she now holds a paid credit, so
      // the wizard renders normally with no payment step.
      successUrl: getPaymentReturnUrl('/dashboard/galleries/new?kind=client&checkout=success'),
      cancelUrl: getPaymentReturnUrl('/dashboard/private-galleries?checkout=cancelled'),
    })
    if (!session.url) return { ok: false, error: 'יצירת התשלום נכשלה' }
    return { ok: true, checkoutUrl: session.url }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'יצירת התשלום נכשלה',
    }
  }
}

/** The photographer's bought-but-unused gallery passes, for a dashboard hint. */
export async function listAvailableGalleryPassCredits(): Promise<
  { id: string; photoCap: number; validityDays: number }[]
> {
  try {
    const { userId } = await requireDashboardContext()
    const credits = await fetchAvailableGalleryPassCredits(userId)
    return credits.map((c) => ({
      id: c.id,
      photoCap: c.photo_cap,
      validityDays: c.validity_days,
    }))
  } catch {
    return []
  }
}

/**
 * Buy a gallery-pass bundle as a standalone credit. Creates a `pending` credit
 * row and returns a SUMIT one-time checkout URL; the return handler promotes it
 * to `paid`. The credit is consumed later, when she creates a client gallery.
 */
export async function purchaseGalleryPassCredit(
  bundleCode: string
): Promise<GalleryPassCheckoutResult> {
  let userId: string
  try {
    const ctx = await requireDashboardContext()
    if (ctx.isImpersonating) {
      return { ok: false, error: 'לא ניתן לבצע רכישה במצב התחזות' }
    }
    userId = ctx.userId
  } catch {
    return { ok: false, error: 'נדרשת התחברות' }
  }

  const bundle = await fetchGalleryPassBundleByCode(bundleCode)
  if (!bundle) return { ok: false, error: 'הבאנדל שנבחר אינו זמין' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('gallery_pass_credits')
    .insert({
      user_id: userId,
      bundle_id: bundle.id,
      bundle_code: bundle.code,
      photo_cap: bundle.photo_cap,
      validity_days: bundle.validity_days,
      amount_agorot: bundle.amount_agorot,
      currency: bundle.currency,
      status: 'pending',
    } as never)
    .select('id')
    .single()

  const credit = data as { id: string } | null
  if (error || !credit) {
    return { ok: false, error: error?.message ?? 'יצירת הרכישה נכשלה' }
  }

  return buildCreditCheckout(userId, {
    id: credit.id,
    bundle_name: bundle.name,
    amount_agorot: bundle.amount_agorot,
    currency: bundle.currency,
  })
}

/**
 * Re-open checkout for a credit whose payment was never completed (she closed
 * the SUMIT page). Surfaced from the "purchase pending" state on the buy panel.
 */
export async function retryGalleryPassCreditCheckout(
  creditId: string
): Promise<GalleryPassCheckoutResult> {
  let userId: string
  try {
    const ctx = await requireDashboardContext()
    if (ctx.isImpersonating) {
      return { ok: false, error: 'לא ניתן לבצע רכישה במצב התחזות' }
    }
    userId = ctx.userId
  } catch {
    return { ok: false, error: 'נדרשת התחברות' }
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('gallery_pass_credits')
    .select('id, user_id, bundle_code, amount_agorot, currency, status')
    .eq('id', creditId)
    .maybeSingle()
  const credit = data as
    | {
        id: string
        user_id: string
        bundle_code: string
        amount_agorot: number
        currency: string
        status: 'pending' | 'paid' | 'consumed'
      }
    | null

  if (!credit || credit.user_id !== userId) {
    return { ok: false, error: 'הרכישה לא נמצאה' }
  }
  if (credit.status !== 'pending') {
    return { ok: false, error: 'הרכישה כבר הושלמה' }
  }

  const bundle = await fetchGalleryPassBundleByCode(credit.bundle_code)
  return buildCreditCheckout(userId, {
    id: credit.id,
    bundle_name: bundle?.name ?? 'גלריה בודדת',
    amount_agorot: credit.amount_agorot,
    currency: credit.currency,
  })
}
