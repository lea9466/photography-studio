import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { AuthForm } from '@/components/auth/AuthForm'
import { MarketingSeoFeatures } from '@/components/marketing/MarketingSeoFeatures'
import { PhotographerCard } from '@/components/auth/PhotographerCard'
import { Button } from '@/components/ui/button'
import { signUp, type AuthActionState } from '@/lib/actions/auth.actions'
import { getPublicStudios } from '@/lib/actions/public-studios.actions'
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
  const publicStudios = await getPublicStudios()

  async function registerAction(
    prevState: AuthActionState,
    formData: FormData
  ): Promise<AuthActionState> {
    'use server'
    return signUp(prevState, formData, referralCode)
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      <p className="sr-only">{MARKETING_H1}</p>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column */}
          <div className="flex flex-col items-center order-2 lg:order-1 min-w-0">
            <MarketingSeoFeatures compact />
            <div className="w-full max-w-md mt-8">
              <div className="mb-6">
                <Button asChild variant="outline" className="w-full">
                  <Link
                    href="https://studio-galleries.com/lea-studio"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 ml-2" />
                    צפייה באתר דוגמא
                  </Link>
                </Button>
              </div>
              <AuthForm mode="register" action={registerAction} />
            </div>
          </div>

          {/* Right Column - Public Studios */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 lg:p-8 order-1 lg:order-2 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              צלמות שכבר איתנו
            </h2>
            
            {publicStudios.length > 0 ? (
              <div className="space-y-3">
                {publicStudios.map((studio, index) => (
                  <PhotographerCard 
                    key={studio.id} 
                    studio={studio} 
                    isDemo={index === 0 && studio.slug === 'lea-studio'}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>עדיין אין סטודיו ציבוריים</p>
                <p className="text-sm mt-1">הירשמי והיי הראשונה!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
