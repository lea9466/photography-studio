import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/AuthForm'
import { MarketingSeoFeatures } from '@/components/marketing/MarketingSeoFeatures'
import { signUp } from '@/lib/actions/auth.actions'
import { buildMarketingMetadata, MARKETING_H1 } from '@/lib/seo/marketing-metadata'

export const metadata: Metadata = buildMarketingMetadata({
  title: 'הרשמה חינם | סטודיו גלריה — בניית אתר לצלמות וגלריות דיגיטליות',
  canonicalPath: '/register',
})

export default function RegisterPage() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <p className="sr-only">{MARKETING_H1}</p>
      <AuthForm mode="register" action={signUp} />
      <MarketingSeoFeatures compact />
    </div>
  )
}
