'use server'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createPaymentService } from '@/lib/payments/server'
import { getPaymentReturnUrl } from '@/lib/payments/http'
import {
  fetchGalleryPassBundleByCode,
  fetchGalleryPassBundleById,
} from '@/lib/gallery-pass/loader'
import type { GalleryPassBundle } from '@/lib/gallery-pass/types'
import {
  createClientGallery,
  type CreateClientGalleryInput,
} from '@/lib/actions/gallery.actions'

/**
 * Client-facing Server Actions return { ok, error } rather than throwing — Next
 * hides thrown messages in prod (see project memory). The happy path hands back
 * the SUMIT checkout URL for the client to redirect to.
 */
type GalleryPassCheckoutResult =
  | { ok: true; checkoutUrl: string; galleryId: string }
  | { ok: false; error: string }

async function buildGalleryPassCheckout(
  userId: string,
  galleryId: string,
  bundle: GalleryPassBundle
): Promise<GalleryPassCheckoutResult> {
  try {
    const session = await createPaymentService().createGalleryPassCheckout({
      userId,
      galleryId,
      itemName: `פאס גלריה · ${bundle.name}`,
      amountAgorot: bundle.amount_agorot,
      currency: bundle.currency,
      successUrl: getPaymentReturnUrl(
        `/dashboard/galleries/${galleryId}/photos?checkout=success`
      ),
      cancelUrl: getPaymentReturnUrl(
        `/dashboard/galleries/${galleryId}?checkout=cancelled`
      ),
    })
    if (!session.url) return { ok: false, error: 'יצירת התשלום נכשלה' }
    return { ok: true, checkoutUrl: session.url, galleryId }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'יצירת התשלום נכשלה',
    }
  }
}

/**
 * Pay-per-gallery creation: makes the client gallery as an unpaid draft with
 * the chosen bundle's cap/validity snapshot onto it, then returns a SUMIT
 * one-time checkout URL. Uploads and send-to-client stay blocked until the
 * return handler confirms the charge (sets pass_purchased_at).
 */
export async function createClientGalleryWithPass(
  input: CreateClientGalleryInput & { bundleCode: string }
): Promise<GalleryPassCheckoutResult> {
  let userId: string
  try {
    ;({ userId } = await requireDashboardContext())
  } catch {
    return { ok: false, error: 'נדרשת התחברות' }
  }

  const { bundleCode, ...galleryInput } = input
  const bundle = await fetchGalleryPassBundleByCode(bundleCode)
  if (!bundle) return { ok: false, error: 'הבאנדל שנבחר אינו זמין' }

  let galleryId: string
  try {
    const created = await createClientGallery({
      ...galleryInput,
      // Never auto-send at creation for a pass gallery — the client window
      // only starts once she deliberately sends, after uploading.
      sendToClient: false,
      passBundle: {
        id: bundle.id,
        photoCap: bundle.photo_cap,
        validityDays: bundle.validity_days,
      },
    })
    galleryId = created.id
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'יצירת הגלריה נכשלה',
    }
  }

  return buildGalleryPassCheckout(userId, galleryId, bundle)
}

/**
 * Re-opens checkout for a gallery whose pass was selected but never paid (the
 * photographer closed the SUMIT page). Surfaced as a "complete payment" button
 * on the gallery when pass_bundle_id is set and pass_purchased_at is null.
 */
export async function retryGalleryPassCheckout(
  galleryId: string
): Promise<GalleryPassCheckoutResult> {
  let userId: string
  let supabase: Awaited<ReturnType<typeof requireDashboardContext>>['supabase']
  try {
    ;({ userId, supabase } = await requireDashboardContext())
  } catch {
    return { ok: false, error: 'נדרשת התחברות' }
  }

  const { data } = await supabase
    .from('galleries')
    .select('id, pass_bundle_id, pass_purchased_at')
    .eq('id', galleryId)
    .eq('user_id', userId)
    .maybeSingle()
  const gallery = data as
    | { id: string; pass_bundle_id: string | null; pass_purchased_at: string | null }
    | null

  if (!gallery || !gallery.pass_bundle_id) {
    return { ok: false, error: 'לגלריה זו אין פאס ממתין לתשלום' }
  }
  if (gallery.pass_purchased_at) {
    return { ok: false, error: 'הפאס של הגלריה כבר שולם' }
  }

  const bundle = await fetchGalleryPassBundleById(gallery.pass_bundle_id)
  if (!bundle) return { ok: false, error: 'הבאנדל שנבחר אינו זמין' }

  return buildGalleryPassCheckout(userId, galleryId, bundle)
}
