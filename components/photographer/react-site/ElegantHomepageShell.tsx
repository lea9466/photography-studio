'use client'

import { toast } from 'sonner'
import { submitContactInquiry } from '@/lib/actions/contact.actions'
import { ElegantHomePage, type ElegantHomePageProps } from '@/components/photographer/themes/elegant/ElegantHomePage'
import type { ElegantContactFormValues } from '@/components/photographer/themes/elegant/ElegantContactForm'

export type ElegantHomepageShellProps = {
  photographerId: string
  homePageProps: Omit<ElegantHomePageProps, 'onContactSubmit'>
  /** Overrides the component's own default (which still points at the
   * pre-migration /public-gallery/[id] path) — see
   * app/[slug]/gallery/[id]/page.tsx's doc comment. */
  hrefForGallery: (id: string) => string
}

/** Elegant-theme counterpart of ClassicHomepageShell.tsx — see that file's
 * doc comment for why header/footer moved out of here into the shared layout. */
export function ElegantHomepageShell({ photographerId, homePageProps, hrefForGallery }: ElegantHomepageShellProps) {
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
    <ElegantHomePage {...homePageProps} onContactSubmit={handleContactSubmit} hrefForGallery={hrefForGallery} />
  )
}
