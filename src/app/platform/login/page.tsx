import { redirect } from 'next/navigation'
import PlatformLoginForm from '@/components/platform/PlatformLoginForm'
import { getPlatformAdminSession } from '@/lib/platform-session'

export const dynamic = 'force-dynamic'

export default async function PlatformLoginPage() {
  const user = await getPlatformAdminSession()
  if (user) redirect('/platform')

  return (
    <main className="texture-grain mx-auto max-w-5xl px-6 py-16 pb-24 text-right md:px-10">
      <PlatformLoginForm />
    </main>
  )
}
