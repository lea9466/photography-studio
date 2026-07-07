import type { Metadata } from 'next'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { AdminStudioList } from '@/components/admin/AdminStudioList'
import { fetchAdminStudios } from '@/lib/actions/admin.actions'
import { isAdminAuthenticated } from '@/lib/admin/session'

export const metadata: Metadata = {
  title: 'ניהול מערכת',
  robots: { index: false, follow: false },
}

export default async function ManagePage() {
  const authenticated = await isAdminAuthenticated()
  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    ''
  )

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[--background] p-6">
        <AdminLoginForm />
      </main>
    )
  }

  const studios = await fetchAdminStudios()

  return (
    <main className="min-h-screen bg-[--background] p-6">
      <div className="mx-auto flex max-w-6xl justify-center">
        <AdminStudioList studios={studios} appBaseUrl={appBaseUrl} />
      </div>
    </main>
  )
}
