import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'
import { MarketingSeoFeatures } from '@/components/marketing/MarketingSeoFeatures'
import { signUp, type AuthActionState } from '@/lib/actions/auth.actions'
import { buildMarketingMetadata, MARKETING_H1 } from '@/lib/seo/marketing-metadata'

export const metadata: Metadata = buildMarketingMetadata({
  title: 'הרשמה חינם | סטודיו גלריה — בניית אתר לצלמות וגלריות דיגיטליות',
  canonicalPath: '/register',
})

function parseReferralParam(ref?: string[]): string | undefined {
  const value = ref?.[0]?.trim()
  return value ? decodeURIComponent(value) : undefined
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref?: string[] }>
  searchParams: Promise<{ ref?: string }>
}) {
  const [{ ref: refSegments }, { ref: legacyRef }] = await Promise.all([
    params,
    searchParams,
  ])

  if (legacyRef?.trim() && !refSegments?.length) {
    redirect(`/register/${encodeURIComponent(legacyRef.trim())}`)
  }

  const referralCode = parseReferralParam(refSegments)

  async function registerAction(
    prevState: AuthActionState,
    formData: FormData
  ): Promise<AuthActionState> {
    'use server'
    return signUp(prevState, formData, referralCode)
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <p className="sr-only">{MARKETING_H1}</p>
      <AuthForm mode="register" action={registerAction} />
      <MarketingSeoFeatures compact />
    </div>
  )
}
