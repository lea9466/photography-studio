'use client'

import type { CSSProperties } from 'react'
import { resolveContactSectionCopy } from '@/lib/contact-section-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import { ModernContactForm, type ModernContactFormValues } from './ModernContactForm'
import styles from './ModernContactSection.module.css'

export type ModernContactSectionProps = {
  title: string | null
  subtitle: string | null
  accentColor: string
  language: SiteLanguage
  phone: string | null
  email: string | null
  address: string | null
  contactDesktopUrl: string | null
  contactMobileUrl: string | null
  onSubmit?: (values: ModernContactFormValues) => void
}

/**
 * Modern-theme contact section — 1:1 port of the `id="contact"` block in
 * lib/homepage-themes/modern.ts (~line 1128-1223): unlike classic/dark's
 * centered-header layout, modern renders one solid accent-colored card
 * (`.modern-contact-card`, `bg-primary rounded-2xl`) split into two columns
 * — an info column (eyebrow/title/subtitle + phone/email/address rows) and
 * the form itself — with no separate details-below-form block.
 *
 * When a contact background image is configured, the old renderer keeps the
 * same card but swaps its background for the photo
 * (`modern-contact-card--has-bg`) — confirmed by reading the real source
 * exactly (not guessed): `#contact.contact-section-has-bg
 * .contact-section-bg-overlay { background: transparent !important; }` — NO
 * color tint over the photo here (unlike `#pricing`'s own has-bg variant,
 * which does use a fade-to-page-background gradient). The image itself sits
 * at `opacity: 0.74` with no filter, and readability instead comes from a
 * `text-shadow` on the card's text (`.cardHasBg`'s `.title`/`.subtitle`/
 * `.detailRow` below) — ported in `ModernContactSection.module.css`.
 *
 * The has-bg photo is a `background-image` div (`background-size: cover`)
 * bounded by `.cardHasBg`'s own `min-height` (comfortably under one screen —
 * see ModernContactSection.module.css) rather than sized off the photo's own
 * natural aspect ratio — an earlier version of this file tried the
 * natural-height approach and it made the section far taller than a screen,
 * which Lea explicitly said looked wrong ("huge and ugly... shouldn't be
 * more than screen height, less than it").
 */
export function ModernContactSection(props: ModernContactSectionProps) {
  const { title, subtitle, accentColor, language, phone, email, address, contactDesktopUrl, contactMobileUrl, onSubmit } =
    props

  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const copy = resolveContactSectionCopy('modern', title, subtitle, language)

  const studioPhone = phone?.trim() || null
  const studioPhoneHref = studioPhone ? studioPhone.replace(/[^\d+]/g, '') : ''
  const studioAddress = address?.trim() || null
  // Matches modern.ts's literal fallback (`email || 'hello@studiogallery.co.il'`)
  // — the only theme whose old renderer hardcodes a placeholder email rather
  // than omitting the row entirely when none is configured.
  const contactEmail = email?.trim() || 'hello@studiogallery.co.il'

  const hasContactBg = Boolean(contactDesktopUrl || contactMobileUrl)
  const desktopBg = contactDesktopUrl || contactMobileUrl
  const mobileBg = contactMobileUrl || contactDesktopUrl

  return (
    <section
      ref={ref}
      id="contact"
      className={`${styles.section} stagger-reveal ${revealed ? 'is-visible' : ''} ${hasContactBg ? styles.sectionHasBg : ''}`}
    >
      <div
        className={`${styles.card} ${hasContactBg ? styles.cardHasBg : ''}`}
        style={{ '--modern-accent': accentColor, backgroundColor: hasContactBg ? undefined : accentColor } as CSSProperties}
      >
        {hasContactBg ? (
          <>
            <div className={`${styles.bg} ${styles.bgDesktop}`} style={{ backgroundImage: `url('${desktopBg}')` }} />
            <div className={`${styles.bg} ${styles.bgMobile}`} style={{ backgroundImage: `url('${mobileBg}')` }} />
            <div className={styles.bgOverlay} />
          </>
        ) : null}

        <div className={styles.grid}>
          <div className={styles.info}>
            <ModernSectionEyebrow onDark align="right">
              CONTACT
            </ModernSectionEyebrow>
            <h2 className={styles.title}>{copy.title}</h2>
            <p className={styles.subtitle}>{copy.subtitle}</p>

            <div className={styles.details}>
              {studioPhone ? (
                <a href={`tel:${studioPhoneHref}`} className={styles.detailRow}>
                  <span className={`material-symbols-outlined ${styles.detailIcon}`} aria-hidden="true">
                    call
                  </span>
                  {/* Only the digits themselves get dir="ltr" (correct
                      left-to-right number order) — the row's own flex
                      layout stays unforced so it lines up with the
                      mail/address rows below it, matching modern.ts's
                      markup (dir="ltr" sits on the inner <span>, not the
                      `.modern-contact-info-row` wrapper). */}
                  <span dir="ltr">{studioPhone}</span>
                </a>
              ) : null}
              <a href={`mailto:${contactEmail}`} className={styles.detailRow}>
                <span className={`material-symbols-outlined ${styles.detailIcon}`} aria-hidden="true">
                  mail
                </span>
                <span>{contactEmail}</span>
              </a>
              {studioAddress ? (
                <div className={styles.detailRow}>
                  <span className={`material-symbols-outlined ${styles.detailIcon}`} aria-hidden="true">
                    location_on
                  </span>
                  <span>{studioAddress}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.formWrap}>
            <ModernContactForm accentColor={accentColor} language={language} onSubmit={onSubmit} />
          </div>
        </div>
      </div>
    </section>
  )
}
