'use client'

import { toast } from 'sonner'
import { submitContactInquiry } from '@/lib/actions/contact.actions'
import { ClassicPageChrome } from './ClassicPageChrome'
import type { ClassicSiteHeaderProps } from '@/components/photographer/site-chrome/ClassicSiteHeader'
import type { ClassicSiteFooterProps } from '@/components/photographer/site-chrome/ClassicSiteFooter'
import { ClassicHomePage, type ClassicHomePageProps } from '@/components/photographer/themes/classic/ClassicHomePage'

export type ClassicHomepageShellProps = {
  photographerId: string
  headerProps: ClassicSiteHeaderProps
  footerProps: ClassicSiteFooterProps
  homePageProps: Omit<ClassicHomePageProps, 'onContactSubmit'>
}

/**
 * Phase 0 of the React public-site rollout — same role as
 * DarkHomepageShell.tsx/ElegantHomepageShell.tsx/ModernHomepageShell.tsx,
 * delegating fonts/header/footer/dir-fix to ClassicPageChrome instead of
 * duplicating them inline (this used to duplicate ClassicPageChrome's JSX
 * verbatim, which is how it silently fell out of sync and kept loading only
 * the theme's default fonts instead of the studio's brand-selected one after
 * that logic moved into ClassicPageChrome).
 */
export function ClassicHomepageShell({
  photographerId,
  headerProps,
  footerProps,
  homePageProps,
}: ClassicHomepageShellProps) {
  const handleContactSubmit = async (values: {
    name: string
    phone: string
    email: string
    message: string
  }) => {
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
    <ClassicPageChrome language={homePageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ClassicHomePage {...homePageProps} onContactSubmit={handleContactSubmit} />
    </ClassicPageChrome>
  )
}
