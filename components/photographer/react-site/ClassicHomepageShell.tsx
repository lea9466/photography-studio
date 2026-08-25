'use client'

import { toast } from 'sonner'
import { submitContactInquiry } from '@/lib/actions/contact.actions'
import { ClassicHomePage, type ClassicHomePageProps } from '@/components/photographer/themes/classic/ClassicHomePage'

export type ClassicHomepageShellProps = {
  photographerId: string
  homePageProps: Omit<ClassicHomePageProps, 'onContactSubmit'>
  /** Plain string, not a function — a Server Component can't pass a function
   * prop across to this Client Component (RSC serialization boundary; only
   * 'use server' actions can cross it). The gallery href is built locally
   * below instead. Overrides the component's own default, which still
   * points at the pre-migration /public-gallery/[id] path — see
   * app/[slug]/gallery/[id]/page.tsx's doc comment. */
  hrefForGalleryBase: string
}

/**
 * Wires the contact-form submit handler for classic's homepage — that's the
 * one piece of real logic left here. Header/footer/fonts now come from
 * app/[slug]/layout.tsx's shared chrome instead of being rendered per-page
 * (see that file's doc comment); this used to also render ClassicPageChrome
 * itself, which meant every page under the slug re-rendered its own
 * header/footer instance with its own independently-computed nav data —
 * exactly how the entitlement-gating bug (hasFaq/hasPackages/etc. drifting
 * out of sync between pages) was possible in the first place.
 */
export function ClassicHomepageShell({
  photographerId,
  homePageProps,
  hrefForGalleryBase,
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
    <ClassicHomePage
      {...homePageProps}
      onContactSubmit={handleContactSubmit}
      hrefForGallery={(id) => `${hrefForGalleryBase}/gallery/${id}`}
    />
  )
}
