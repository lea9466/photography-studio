import PlatformResetPasswordForm from '@/components/platform/PlatformResetPasswordForm'
import { getPlatformAdminSession } from '@/lib/platform-session'

export const dynamic = 'force-dynamic'

export default async function PlatformResetPasswordPage() {
  const session = await getPlatformAdminSession()

  return (
    <main className="texture-grain mx-auto max-w-5xl px-6 py-16 pb-24 text-right md:px-10">
      <PlatformResetPasswordForm sessionValid={!!session} />
    </main>
  )
}
