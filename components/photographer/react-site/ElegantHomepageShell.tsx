'use client'

import { toast } from 'sonner'
import { submitContactInquiry } from '@/lib/actions/contact.actions'
import { ElegantPageChrome } from './ElegantPageChrome'
import type { ElegantSiteHeaderProps } from '@/components/photographer/site-chrome/ElegantSiteHeader'
import type { ElegantSiteFooterProps } from '@/components/photographer/site-chrome/ElegantSiteFooter'
import { ElegantHomePage, type ElegantHomePageProps } from '@/components/photographer/themes/elegant/ElegantHomePage'
import type { ElegantContactFormValues } from '@/components/photographer/themes/elegant/ElegantContactForm'

export type ElegantHomepageShellProps = {
  photographerId: string
  headerProps: ElegantSiteHeaderProps
  footerProps: ElegantSiteFooterProps
  homePageProps: Omit<ElegantHomePageProps, 'onContactSubmit'>
}

/** Elegant-theme counterpart of ClassicHomepageShell.tsx / DarkHomepageShell.tsx — same Phase-0 role. */
export function ElegantHomepageShell({ photographerId, headerProps, footerProps, homePageProps }: ElegantHomepageShellProps) {
  const handleContactSubmit = async (values: ElegantContactFormValues) => {
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
    <ElegantPageChrome language={homePageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ElegantHomePage {...homePageProps} onContactSubmit={handleContactSubmit} />
    </ElegantPageChrome>
  )
}
