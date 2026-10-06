import type { Metadata } from 'next'
import Script from 'next/script'
import { Toaster } from 'sonner'
import { CookieNotice } from '@/components/shared/CookieNotice'
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
        <CookieNotice />
        <Script
          src="https://cdn.enable.co.il/licenses/enable-L56422aatiwwzrpt-1026-83947/init.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
