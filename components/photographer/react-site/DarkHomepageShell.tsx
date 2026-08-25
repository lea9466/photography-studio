'use client'

import { toast } from 'sonner'
import { submitContactInquiry } from '@/lib/actions/contact.actions'
import { DarkPageChrome } from './DarkPageChrome'
import type { DarkSiteHeaderProps } from '@/components/photographer/site-chrome/DarkSiteHeader'
import type { DarkSiteFooterProps } from '@/components/photographer/site-chrome/DarkSiteFooter'
import { DarkHomePage, type DarkHomePageProps } from '@/components/photographer/themes/dark/DarkHomePage'

export type DarkHomepageShellProps = {
  photographerId: string
  headerProps: DarkSiteHeaderProps
  footerProps: DarkSiteFooterProps
  homePageProps: Omit<DarkHomePageProps, 'onContactSubmit'>
}

/** Dark-theme counterpart of ClassicHomepageShell.tsx — same Phase-0 role. */
export function DarkHomepageShell({ photographerId, headerProps, footerProps, homePageProps }: DarkHomepageShellProps) {
  const handleContactSubmit = async (values: {
    name: string
    phone: string
    email: string
    subject: string
    message: string
  }) => {
    try {
      await submitContactInquiry({
        photographerId,
        name: values.name,
        email: values.email,
        phone: values.phone,
        subject: values.subject,
        message: values.message,
      })
      toast.success(homePageProps.language === 'en' ? 'Message sent!' : 'ההודעה נשלחה בהצלחה!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בשליחת ההודעה')
    }
  }

  return (
    <DarkPageChrome language={homePageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <DarkHomePage {...homePageProps} onContactSubmit={handleContactSubmit} />
    </DarkPageChrome>
  )
}
