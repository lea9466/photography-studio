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

  let studios
  let loadError: string | null = null

  try {
    studios = await fetchAdminStudios()
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : 'טעינת הסטודיואים נכשלה. נסי לרענן את הדף.'
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[--background] p-6">
        <div className="max-w-md rounded-xl border border-[--border] bg-[--card] p-6 text-center">
          <h1 className="text-lg font-semibold">שגיאה בטעינת הנתונים</h1>
          <p className="mt-2 text-sm text-[--muted-foreground]">{loadError}</p>
          <a
            href="/manage"
            className="mt-4 inline-flex rounded-md bg-[--primary] px-4 py-2 text-sm text-[--primary-foreground]"
          >
            נסי שוב
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[--background] p-6">
      <div className="mx-auto flex max-w-6xl justify-center">
        <AdminStudioList studios={studios!} appBaseUrl={appBaseUrl} />
      </div>
    </main>
  )
}
