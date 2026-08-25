'use client'

import { toast } from 'sonner'
import { submitContactInquiry } from '@/lib/actions/contact.actions'
import { DarkHomePage, type DarkHomePageProps } from '@/components/photographer/themes/dark/DarkHomePage'

export type DarkHomepageShellProps = {
  photographerId: string
  homePageProps: Omit<DarkHomePageProps, 'onContactSubmit'>
  /** Plain string, not a function — see ClassicHomepageShell.tsx's doc
   * comment (RSC serialization boundary). */
  hrefForGalleryBase: string
}

/** Dark-theme counterpart of ClassicHomepageShell.tsx — see that file's doc
 * comment for why header/footer moved out of here into the shared layout. */
export function DarkHomepageShell({ photographerId, homePageProps, hrefForGalleryBase }: DarkHomepageShellProps) {
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
    <DarkHomePage
      {...homePageProps}
      onContactSubmit={handleContactSubmit}
      hrefForGallery={(id) => `${hrefForGalleryBase}/gallery/${id}`}
    />
  )
}
