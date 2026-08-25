'use client'

import { resolveContactSectionCopy } from '@/lib/contact-section-copy'
import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { ElegantSectionHeading } from './ElegantSectionHeading'
import { ElegantContactForm, type ElegantContactFormValues } from './ElegantContactForm'
import styles from './ElegantContactSection.module.css'

export type ElegantContactSectionProps = {
  title: string | null
  subtitle: string | null
  accentColor: string
  language: SiteLanguage
  phone: string | null
  email: string | null
  address: string | null
  contactDesktopUrl: string | null
  contactMobileUrl: string | null
  onSubmit?: (values: ElegantContactFormValues) => void
}

/**
 * Elegant theme's contact section — 1:1 port of the `id="contact"` block in
 * lib/homepage-themes/elegant.ts (line ~1237): dark (#1c1b1b) background,
 * centered header, the form (or a "no email configured" message when
 * `email` is unset — `homepageCopy.contactForm.noEmail`), and a details row
 * below (phone/email/address) ported from generateContactDetailsHTML('elegant')
 * (lib/homepage-themes/generate-homepage-html.ts) — icon + label + value per
 * item, `.elegant-contact-details*` tokens ported into this file's
 * module.css (they lived in elegant.ts's own <style> block, not
 * elegant-theme.css's shared tokens).
 *
 * The optional contact background image (`hasContactBg`) fades to the same
 * #1c1b1b as the section itself — same `sectionBgLayers`/`contactBgLayers`
 * mechanism as classic, just with elegant's own fade color.
 */
export function ElegantContactSection(props: ElegantContactSectionProps) {
  const {
    title,
    subtitle,
    accentColor,
    language,
    phone,
    email,
    address,
    contactDesktopUrl,
    contactMobileUrl,
    onSubmit,
  } = props

  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const copy = resolveContactSectionCopy('elegant', title, subtitle, language)
  const homepageCopy = getHomepageCopy(language)

  const studioPhone = phone?.trim() || null
  const studioPhoneHref = studioPhone ? studioPhone.replace(/[^\d+]/g, '') : ''
  const studioAddress = address?.trim() || null
  const contactEmail = email?.trim() || null

  const hasContactBg = Boolean(contactDesktopUrl || contactMobileUrl)
  const desktopBg = contactDesktopUrl || contactMobileUrl
  const mobileBg = contactMobileUrl || contactDesktopUrl

  const hasDetails = Boolean(studioPhone || contactEmail || studioAddress)

  return (
    <section
      ref={ref}
      id="contact"
      className={`${styles.section} reveal-on-scroll ${revealed ? 'active' : ''} ${hasContactBg ? styles.hasBg : ''}`}
    >
      <div className={`${styles.formArea} ${hasContactBg ? styles.formAreaWithBg : ''}`}>
        {hasContactBg ? (
          <>
            <div className={`${styles.bg} ${styles.bgDesktop}`} style={{ backgroundImage: `url('${desktopBg}')` }} />
            <div className={`${styles.bg} ${styles.bgMobile}`} style={{ backgroundImage: `url('${mobileBg}')` }} />
            <div className={styles.bgOverlay} />
          </>
        ) : null}

        <div className={styles.content}>
          <div className={styles.header}>
            <ElegantSectionHeading title={copy.title} watermark="CONTACT" accentColor={accentColor} align="center" onDark />
            <p className={styles.subtitle}>{copy.subtitle}</p>
          </div>

          {contactEmail ? (
            <ElegantContactForm accentColor={accentColor} language={language} onSubmit={onSubmit} />
          ) : (
            <p className={styles.noEmail}>{homepageCopy.contactForm.noEmail}</p>
          )}
        </div>
      </div>

      {hasDetails ? (
        <div className={`${styles.detailsArea} ${hasContactBg ? styles.detailsAreaWithBg : ''}`}>
          <div className={styles.details}>
            {studioPhone ? (
              <div className={styles.detailItem}>
                <span className={`material-symbols-outlined ${styles.detailIcon}`} style={{ color: accentColor }}>
                  call
                </span>
                <span className={styles.detailLabel}>{homepageCopy.contactDetails.phone}</span>
                <a href={`tel:${studioPhoneHref}`} className={styles.detailValue} dir="ltr">
                  {studioPhone}
                </a>
              </div>
            ) : null}

            {contactEmail ? (
              <div className={styles.detailItem}>
                <span className={`material-symbols-outlined ${styles.detailIcon}`} style={{ color: accentColor }}>
                  mail
                </span>
                <span className={styles.detailLabel}>{homepageCopy.contactDetails.email}</span>
                <a href={`mailto:${contactEmail}`} className={styles.detailValue}>
                  {contactEmail}
                </a>
              </div>
            ) : null}

            {studioAddress ? (
              <div className={styles.detailItem}>
                <span className={`material-symbols-outlined ${styles.detailIcon}`} style={{ color: accentColor }}>
                  location_on
                </span>
                <span className={styles.detailLabel}>{homepageCopy.contactDetails.location}</span>
                <span className={styles.detailValue}>{studioAddress}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
