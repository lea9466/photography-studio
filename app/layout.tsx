import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Studio Gallery',
  description: 'מערכת ניהול גלריות לצלמות',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
