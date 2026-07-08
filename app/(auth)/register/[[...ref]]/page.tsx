import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { AuthForm } from '@/components/auth/AuthForm'
import { MarketingSeoFeatures } from '@/components/marketing/MarketingSeoFeatures'
import { Button } from '@/components/ui/button'
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
    <div className="flex w-full max-w-xl flex-col items-center gap-10 text-center">
      <p className="sr-only">{MARKETING_H1}</p>
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <Button asChild variant="outline" className="w-full">
          <Link
            href="https://studio-galleries.com/lea-studio"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            צפייה באתר דוגמא
          </Link>
        </Button>
        <AuthForm mode="register" action={registerAction} />
      </div>
      <MarketingSeoFeatures compact />
    </div>
  )
}
