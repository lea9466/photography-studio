import { redirect } from 'next/navigation'
import PlatformDashboard from '@/components/platform/PlatformDashboard'
import {
  getPlatformAdminSession,
  isPlatformAdminConfigured,
} from '@/lib/platform-session'
import { fetchPlatformOverview } from '@/lib/platform-db'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function PlatformPage() {
  const user = await getPlatformAdminSession()
  if (!user) redirect('/platform/login')

  const configured = !!getAdminClient()
  const overview = configured
    ? await fetchPlatformOverview()
    : {
        photographerCount: 0,
        totalAlbums: 0,
        totalImages: 0,
        photographers: [],
      }

  const adminThemeReset = {
    '--color-paris-blue': '#4a7c9b',
    '--color-accent': '#4a7c9b',
  } as React.CSSProperties

  return (
    <main
      style={adminThemeReset}
      className="texture-grain mx-auto max-w-5xl px-6 py-10 pb-20 text-right md:px-10"
    >
      <header className="mb-10">
        <h1 className="font-heading text-4xl text-[var(--color-paris-deep)] md:text-5xl">
          ניהול פלטפורמה
        </h1>
        <p className="mt-3 text-sm tracking-wide text-[var(--color-paris-deep)]/60">
          סקירת כל הצלמים · גלריות · תמונות
        </p>
      </header>

      {!configured ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {adminConfigError()}
        </p>
      ) : !(await isPlatformAdminConfigured()) ? (
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          אין מנהל פלטפורמה ב-DB — צרו משתמש Supabase Auth עם role = platform_admin
          בטבלת users.
        </p>
      ) : null}

      <PlatformDashboard overview={overview} />
    </main>
  )
}
