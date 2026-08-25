'use client'

import type { FormEvent } from 'react'
import { contactLtrFieldClass, contactTextAlignClass, getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './DarkContactForm.module.css'

export type DarkContactFormValues = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  privacyConsent: boolean
}

export type DarkContactFormProps = {
  accentColor: string
  language: SiteLanguage
  /**
   * Visual-only: the old renderer posted this to contactFormSubmitScript's
   * endpoint. Wiring the actual API call is out of scope here — the caller
   * receives the raw field values and decides what to do with them (same
   * contract as ClassicContactForm's onSubmit).
   */
  onSubmit?: (values: DarkContactFormValues) => void
}

/**
 * Dark theme's contact form — 1:1 port of the `<form>` inside the
 * `id="contact"` section in lib/homepage-themes/dark.ts (line ~1525): a
 * centered 2-column grid (name/email/phone/subject, message spans both
 * columns) with underline-only inputs, unlike classic's boxed/bordered card
 * form. Has a "subject" field classic's form doesn't.
 */
export function DarkContactForm({ accentColor, language, onSubmit }: DarkContactFormProps) {
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
      className={`${styles.form} grid grid-cols-1 gap-8 text-start rtl:text-right md:grid-cols-2`}
      style={{ '--dark-contact-accent': accentColor } as React.CSSProperties}
    >
      <div className={styles.field}>
        <input
          name="name"
          type="text"
          required
          placeholder={copy.contactForm.fullName}
          className={`${styles.input} ${contactAlign}`}
        />
      </div>
      <div className={styles.field}>
        <input
          name="email"
          type="email"
          required
          dir="ltr"
          placeholder={copy.contactForm.emailAddress}
          className={`${styles.input} ${contactLtrAlign}`}
        />
      </div>
      <div className={styles.field}>
        <input
          name="phone"
          type="tel"
          dir="ltr"
          placeholder={copy.contactForm.placeholders.phone}
          className={`${styles.input} ${contactLtrAlign}`}
        />
      </div>
      <div className={styles.field}>
        <input
          name="subject"
          type="text"
          placeholder={copy.contactForm.placeholders.subject}
          className={`${styles.input} ${contactAlign}`}
        />
      </div>

      <div className={`${styles.field} md:col-span-2`}>
        <textarea
          name="message"
          required
          placeholder={copy.contactForm.yourMessage}
          className={`${styles.input} ${styles.textarea} ${contactAlign}`}
        />
      </div>

      <div className={`${styles.privacyConsent} md:col-span-2`}>
        <input
          type="checkbox"
          name="privacy_consent"
          id="dark-contact-privacy-consent"
          required
          className={styles.privacyCheckbox}
          style={{ accentColor }}
        />
        <p className={styles.privacyText}>
          <label htmlFor="dark-contact-privacy-consent" className="cursor-pointer">
            {copy.contactForm.privacyBefore}
          </label>{' '}
          <a href="/privacy" className={styles.privacyLink}>
            {copy.contactForm.privacyLink}
          </a>
          .
        </p>
      </div>

      <div className={`${styles.submitRow} md:col-span-2`}>
        <button type="submit" className={styles.submit} style={{ backgroundColor: accentColor }}>
          {copy.contactForm.submit}
        </button>
      </div>
    </form>
  )
}
