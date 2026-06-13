import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import PageWrapper from '@/components/PageWrapper'
import './globals.css'

export const dynamic = 'force-dynamic'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'סטודיו צילום',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <PageWrapper>{children}</PageWrapper>
      </body>
    </html>
  )
}
