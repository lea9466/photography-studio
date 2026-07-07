import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { buildMarketingMetadata } from '@/lib/seo/marketing-metadata'
import './globals.css'

export const metadata: Metadata = buildMarketingMetadata()

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
