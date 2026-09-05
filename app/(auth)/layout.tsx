import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'STG',
  description: 'מערכת ניהול גלריות לצלמות',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center animate-fade-in">
        <p className="text-xl font-semibold tracking-tight">STG</p>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.3em] text-[--muted]">Studio Gallery</p>
        <p className="mt-1 text-sm text-[--muted]">המרחב הדיגיטלי לצלמות</p>
      </div>
      {children}
    </div>
  )
}
