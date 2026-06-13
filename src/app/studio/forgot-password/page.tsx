import StudioForgotPasswordForm from '@/components/studio/StudioForgotPasswordForm'
import { getPhotographerSession } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StudioForgotPasswordPage() {
  const session = await getPhotographerSession()
  if (session) redirect('/admin')

  return (
    <main className="texture-grain mx-auto max-w-5xl px-6 py-16 pb-24 text-right md:px-10">
      <StudioForgotPasswordForm />
    </main>
  )
}
