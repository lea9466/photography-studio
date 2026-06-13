import { redirect } from 'next/navigation'
import PlatformForgotPasswordForm from '@/components/platform/PlatformForgotPasswordForm'
import { getPlatformAdminSession } from '@/lib/platform-session'

export const dynamic = 'force-dynamic'

export default async function PlatformForgotPasswordPage() {
  const session = await getPlatformAdminSession()
  if (session) redirect('/platform')
  return (
    <main className="texture-grain mx-auto max-w-5xl px-6 py-16 pb-24 text-right md:px-10">
      <PlatformForgotPasswordForm />
    </main>
  )
}
