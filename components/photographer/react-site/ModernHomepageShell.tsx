'use client'

import { toast } from 'sonner'
import { submitContactInquiry } from '@/lib/actions/contact.actions'
import { ModernHomePage, type ModernHomePageProps } from '@/components/photographer/themes/modern/ModernHomePage'
import type { ModernContactFormValues } from '@/components/photographer/themes/modern/ModernContactForm'

export type ModernHomepageShellProps = {
  photographerId: string
  homePageProps: Omit<ModernHomePageProps, 'onContactSubmit'>
  /** Overrides the component's own default (which still points at the
   * pre-migration /public-gallery/[id] path) — see
   * app/[slug]/gallery/[id]/page.tsx's doc comment. */
  hrefForGallery: (id: string) => string
}

/** Modern-theme counterpart of ClassicHomepageShell.tsx — see that file's
 * doc comment for why header/footer moved out of here into the shared layout. */
export function ModernHomepageShell({ photographerId, homePageProps, hrefForGallery }: ModernHomepageShellProps) {
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
    <ModernHomePage {...homePageProps} onContactSubmit={handleContactSubmit} hrefForGallery={hrefForGallery} />
  )
}
