'use server'

import { requestClientCodeReset } from '@/lib/password-reset'

export type ForgotCodeResult = { ok: boolean; message: string }

export async function clientForgotCodeAction(
  photographerSlug: string,
  photographerId: string,
  studioName: string,
  _prev: ForgotCodeResult,
  formData: FormData
): Promise<ForgotCodeResult> {
  const email = String(formData.get('email') ?? '').trim()

  return requestClientCodeReset({
    email,
    photographerId,
    photographerSlug,
    studioName,
  })
}
