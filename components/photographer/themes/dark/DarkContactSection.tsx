'use client'

import type { CSSProperties } from 'react'
import { resolveContactSectionCopy } from '@/lib/contact-section-copy'
import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { DarkSectionEyebrow } from './DarkSectionEyebrow'
import { DarkContactForm, type DarkContactFormValues } from './DarkContactForm'
import styles from './DarkContactSection.module.css'

export type DarkContactSectionProps = {
  title: string | null
  subtitle: string | null
  accentColor: string
  language: SiteLanguage
  phone: string | null
  email: string | null
  address: string | null
  contactDesktopUrl: string | null
  contactMobileUrl: string | null
  onSubmit?: (values: DarkContactFormValues) => void
}

/**
 * Dark theme's contact section — 1:1 port of the `id="contact"` block in
 * lib/homepage-themes/dark.ts (~line 1511): centered eyebrow+title+subtitle,
 * the underline-field form, and a row of icon+label+value contact details
 * below it (`generateBoldContactDetailsHTML()` /
 * `.bold-contact-details*` in shared-styles.ts). Structurally different from
 * classic's side-by-side info-column layout.
 *
 * When a contact background image is configured, the details row moves to
 * its own solid-background block AFTER the whole bg-image block (matching
 * `hasContactBg ? '' : generateBoldContactDetailsHTML()` inside the content
 * div, plus a separate `.bold-contact-details-block` sibling after it) —
 * without a bg image, the details render inline right under the form.
 */
export function DarkContactSection(props: DarkContactSectionProps) {
  const { title, subtitle, accentColor, language, phone, email, address, contactDesktopUrl, contactMobileUrl, onSubmit } =
    props

  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const copy = resolveContactSectionCopy('dark', title, subtitle, language)
  const homepageCopy = getHomepageCopy(language)

  const studioPhone = phone?.trim() || null
  const studioPhoneHref = studioPhone ? studioPhone.replace(/[^\d+]/g, '') : ''
  const studioAddress = address?.trim() || null
  const contactEmail = email?.trim() || null

  const hasContactBg = Boolean(contactDesktopUrl || contactMobileUrl)
  const desktopBg = contactDesktopUrl || contactMobileUrl
  const mobileBg = contactMobileUrl || contactDesktopUrl

  const detailItems = [
    studioPhone
      ? {
          key: 'phone',
          icon: 'call',
          label: homepageCopy.contactDetails.phone,
          value: studioPhone,
          href: `tel:${studioPhoneHref}`,
          dir: 'ltr' as const,
        }
      : null,
    contactEmail
      ? {
          key: 'email',
          icon: 'mail',
          label: homepageCopy.contactDetails.email,
          value: contactEmail,
          href: `mailto:${contactEmail}`,
          dir: undefined,
        }
      : null,
    studioAddress
      ? {
          key: 'address',
          icon: 'location_on',
          label: homepageCopy.contactDetails.location,
          value: studioAddress,
          href: null,
          dir: undefined,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  const detailsBlock =
    detailItems.length > 0 ? (
      <div className={styles.details} style={{ '--dark-contact-details-accent': accentColor } as CSSProperties}>
        <div className={styles.detailsRow}>
          {detailItems.map((item) => (
            <div key={item.key} className={styles.detailItem}>
              <span className={`material-symbols-outlined ${styles.detailIcon}`} style={{ color: accentColor }}>
                {item.icon}
              </span>
              <span className={styles.detailLabel}>{item.label}</span>
              {item.href ? (
                <a href={item.href} className={styles.detailValue} dir={item.dir}>
                  {item.value}
                </a>
              ) : (
                <span className={styles.detailValue}>{item.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    ) : null

  return (
    <section
      ref={ref}
      id="contact"
      className={`reveal ${revealed ? 'active' : ''} ${styles.section} w-full`}
    >
      <div className={`${hasContactBg ? styles.hasBg : ''} ${styles.formBlock}`}>
        {hasContactBg ? (
          <>
            <div className={`${styles.bg} ${styles.bgDesktop}`} style={{ backgroundImage: `url('${desktopBg}')` }} />
            <div className={`${styles.bg} ${styles.bgMobile}`} style={{ backgroundImage: `url('${mobileBg}')` }} />
            <div className={styles.bgOverlay} />
          </>
        ) : null}

        <div className={`${styles.content} mx-auto max-w-4xl text-center`}>
          <DarkSectionEyebrow accentColor={accentColor} align="center">
            CONTACT
          </DarkSectionEyebrow>
          <h2 className={styles.title}>{copy.title}</h2>
          <p className={styles.subtitle}>{copy.subtitle}</p>

          <div className={styles.formWrap}>
            <DarkContactForm accentColor={accentColor} language={language} onSubmit={onSubmit} />
          </div>

          {!hasContactBg ? detailsBlock : null}
        </div>
      </div>

      {hasContactBg ? <div className={styles.detailsBlockWrap}>{detailsBlock}</div> : null}
    </section>
  )
}
