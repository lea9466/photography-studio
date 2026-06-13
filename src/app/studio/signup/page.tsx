import { redirect } from 'next/navigation'
import { StudioSignupForm } from '@/components/studio/StudioAuthForm'
import { getAuthUser, getPhotographerSession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ email?: string; linked?: string }>
}

export default async function StudioSignupPage({ searchParams }: PageProps) {
  const session = await getPhotographerSession()
  if (session) {
    redirect('/admin')
  }

  const user = await getAuthUser()
  const { email, linked } = await searchParams
  const linkedHint = linked === '1' || Boolean(user)

  return (
    <main className="texture-grain mx-auto max-w-5xl px-6 py-16 pb-24 text-right md:px-10">
      <StudioSignupForm
        defaultEmail={email ?? user?.email ?? ''}
        linkedHint={linkedHint}
        passwordOptional={Boolean(user)}
      />
    </main>
  )
}
