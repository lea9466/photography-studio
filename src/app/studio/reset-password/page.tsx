import StudioResetPasswordForm from '@/components/studio/StudioResetPasswordForm'
import { getAuthUser, getPhotographerSession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export default async function StudioResetPasswordPage() {
  const user = await getAuthUser()
  const session = user ? await getPhotographerSession() : null

  return (
    <main className="texture-grain mx-auto max-w-5xl px-6 py-16 pb-24 text-right md:px-10">
      <StudioResetPasswordForm sessionValid={!!session} />
    </main>
  )
}
