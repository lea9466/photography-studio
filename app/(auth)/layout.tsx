import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Studio Gallery',
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
        <p className="text-lg font-semibold tracking-tight">Studio Gallery</p>
        <p className="text-sm text-[--muted]">Photo Workflow SaaS</p>
      </div>
      {children}
    </div>
  )
}
