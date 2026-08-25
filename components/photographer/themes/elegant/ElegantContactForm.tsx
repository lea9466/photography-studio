'use client'

import type { CSSProperties, FormEvent } from 'react'
import { contactLtrFieldClass, contactTextAlignClass, getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './ElegantContactForm.module.css'

export type ElegantContactFormValues = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  privacyConsent: boolean
}

export type ElegantContactFormProps = {
  accentColor: string
  language: SiteLanguage
  /**
   * Visual-only: the old renderer posted this to contactFormSubmitScript's
   * endpoint. Wiring the actual API call is out of scope here (same call as
   * ClassicContactForm.tsx) — the caller receives the raw field values and
   * decides what to do with them.
   */
  onSubmit?: (values: ElegantContactFormValues) => void
}

/**
 * Elegant theme's contact form — 1:1 port of the `#email ? <form>...` branch
 * inside the `id="contact"` section in lib/homepage-themes/elegant.ts
 * (line ~1255): name/email/phone/subject in a 2-column grid, a full-width
 * message textarea, the shared privacy-consent checkbox
 * (generateContactPrivacyConsentHTML('elegant', ...)), then a centered
 * submit button. Unlike classic's contact form, elegant has no separate
 * "phoneContact" field — subject replaces it in the grid, phone gets its own
 * slot next to email.
 */
export function ElegantContactForm({ accentColor, language, onSubmit }: ElegantContactFormProps) {
  const copy = getHomepageCopy(language)
  const contactAlign = contactTextAlignClass(language)
  const contactLtrAlign = contactLtrFieldClass(language)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onSubmit?.({
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      subject: String(formData.get('subject') ?? ''),
      message: String(formData.get('message') ?? ''),
      privacyConsent: formData.get('privacy_consent') === 'on',
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.form} grid grid-cols-1 gap-10 md:grid-cols-2`}
      style={{ '--elegant-contact-accent': accentColor } as CSSProperties}
    >
      <div className={styles.field}>
        <label className={styles.label}>{copy.contactForm.fullName}</label>
        <input
          name="name"
          required
          type="text"
          placeholder={copy.contactForm.placeholders.name}
          className={`${styles.input} ${contactAlign}`}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>{copy.contactForm.email}</label>
        <input
          name="email"
          required
          type="email"
          dir="ltr"
          placeholder={copy.contactForm.placeholders.email}
          className={`${styles.input} ${contactLtrAlign}`}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>{copy.contactForm.phone}</label>
        <input
          name="phone"
          type="tel"
          dir="ltr"
          placeholder={copy.contactForm.placeholders.phone}
          className={`${styles.input} ${contactLtrAlign}`}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>{copy.contactForm.subject}</label>
        <input
          name="subject"
          type="text"
          placeholder={copy.contactForm.placeholders.subject}
          className={`${styles.input} ${contactAlign}`}
        />
      </div>

      <div className={`${styles.field} md:col-span-2`}>
        <label className={styles.label}>{copy.contactForm.message}</label>
        <textarea
          name="message"
          required
          placeholder={copy.contactForm.placeholders.messageHelp}
          className={`${styles.input} ${styles.textarea} ${contactAlign}`}
        />
      </div>

      <div className={`${styles.privacyConsent} md:col-span-2`}>
        <input
          type="checkbox"
          name="privacy_consent"
          id="elegant-contact-privacy-consent"
          required
          className={styles.privacyCheckbox}
          style={{ accentColor }}
        />
        <p className={styles.privacyText}>
          <label htmlFor="elegant-contact-privacy-consent" className={styles.privacyLabel}>
            {copy.contactForm.privacyBefore}
          </label>
          <a href="/privacy" className={styles.privacyLink}>
            {copy.contactForm.privacyLink}
          </a>
          .
        </p>
      </div>

      <div className={`${styles.submitWrap} md:col-span-2`}>
        <button type="submit" className={styles.submit} style={{ backgroundColor: accentColor }}>
          {copy.contactForm.submit}
        </button>
      </div>
    </form>
  )
}
