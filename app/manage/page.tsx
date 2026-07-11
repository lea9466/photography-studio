import type { Metadata } from 'next'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { AdminStudioList } from '@/components/admin/AdminStudioList'
import { fetchAdminStudios } from '@/lib/actions/admin.actions'
import { isAdminAuthenticated } from '@/lib/admin/session'

export const metadata: Metadata = {
  title: 'ניהול מערכת',
  robots: { index: false, follow: false },
}

const pageShellClass =
  'min-h-screen bg-slate-100/90 bg-[radial-gradient(ellipse_at_top,_rgba(148,163,184,0.18),_transparent_55%)]'

export default async function ManagePage() {
  const authenticated = await isAdminAuthenticated()
  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    ''
  )

  if (!authenticated) {
    return (
      <main className={`${pageShellClass} flex items-center justify-center px-4 py-8`}>
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
      <main className={`${pageShellClass} flex items-center justify-center px-4 py-8`}>
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-center shadow-md">
          <div className="bg-slate-800 px-6 py-4">
            <h1 className="text-lg font-semibold text-white">שגיאה בטעינת הנתונים</h1>
          </div>
          <div className="bg-slate-50/70 p-6">
            <p className="text-sm text-slate-600">{loadError}</p>
            <a
              href="/manage"
              className="mt-4 inline-flex rounded-xl border border-sky-300 bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600"
            >
              נסי שוב
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`${pageShellClass} px-4 py-8 sm:px-6`}>
      <div className="mx-auto flex max-w-7xl justify-center">
        <AdminStudioList studios={studios!} appBaseUrl={appBaseUrl} />
      </div>
    </main>
  )
}
