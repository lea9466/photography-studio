'use client'

import { toast } from 'sonner'
import { submitContactInquiry } from '@/lib/actions/contact.actions'
import { ModernPageChrome } from './ModernPageChrome'
import type { ModernSiteHeaderProps } from '@/components/photographer/site-chrome/ModernSiteHeader'
import type { ModernSiteFooterProps } from '@/components/photographer/site-chrome/ModernSiteFooter'
import { ModernHomePage, type ModernHomePageProps } from '@/components/photographer/themes/modern/ModernHomePage'
import type { ModernContactFormValues } from '@/components/photographer/themes/modern/ModernContactForm'

export type ModernHomepageShellProps = {
  photographerId: string
  headerProps: ModernSiteHeaderProps
  footerProps: ModernSiteFooterProps
  homePageProps: Omit<ModernHomePageProps, 'onContactSubmit'>
}

/** Modern-theme counterpart of ClassicHomepageShell.tsx / DarkHomepageShell.tsx — same Phase-0 role. */
export function ModernHomepageShell({ photographerId, headerProps, footerProps, homePageProps }: ModernHomepageShellProps) {
  const handleContactSubmit = async (values: ModernContactFormValues) => {
    try {
      await submitContactInquiry({
        photographerId,
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
      })
      toast.success(homePageProps.language === 'en' ? 'Message sent!' : 'ההודעה נשלחה בהצלחה!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בשליחת ההודעה')
    }
  }

  return (
    <ModernPageChrome language={homePageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ModernHomePage {...homePageProps} onContactSubmit={handleContactSubmit} />
    </ModernPageChrome>
  )
}
