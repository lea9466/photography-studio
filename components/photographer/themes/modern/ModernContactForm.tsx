'use client'

import type { CSSProperties, FormEvent } from 'react'
import { contactLtrFieldClass, contactTextAlignClass, getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './ModernContactForm.module.css'

export type ModernContactFormValues = {
  name: string
  email: string
  phone: string
  message: string
  privacyConsent: boolean
}

export type ModernContactFormProps = {
  accentColor: string
  language: SiteLanguage
  /**
   * Visual-only, same contract as DarkContactForm's onSubmit — the caller
   * receives the raw field values and decides what to do with them. Wiring
   * the real contactFormSubmitScript endpoint is out of scope here.
   */
  onSubmit?: (values: ModernContactFormValues) => void
}

/**
 * Modern theme's contact form — 1:1 port of the `<form class="modern-contact-form">`
 * inside the `id="contact"` card in lib/homepage-themes/modern.ts (~line
 * 1177-1215): white boxed/bordered inputs (unlike dark's underline-only
 * fields), name+email as a 2-column row, then phone and message each full
 * width. Unlike dark's form, modern has no "subject" field.
 *
 * The privacy-consent row below mirrors generateContactPrivacyConsentHTML's
 * 'modern' branch (lib/homepage-themes/text-helpers.ts) — that helper
 * returns an HTML string meant for dangerouslySetInnerHTML, which this
 * rebuild avoids throughout, so its classes/copy are ported directly here
 * as real JSX instead of calling the string-returning helper.
 */
export function ModernContactForm({ accentColor, language, onSubmit }: ModernContactFormProps) {
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
      message: String(formData.get('message') ?? ''),
      privacyConsent: formData.get('privacy_consent') === 'on',
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.form} flex w-full flex-col gap-4`}
      style={{ '--modern-contact-accent': accentColor } as CSSProperties}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          name="name"
          type="text"
          required
          placeholder={copy.contactForm.fullName}
          className={`${styles.input} ${contactAlign}`}
        />
        <input
          name="email"
          type="email"
          required
          dir="ltr"
          placeholder={copy.contactForm.placeholders.email}
          className={`${styles.input} ${contactLtrAlign}`}
        />
      </div>

      <input
        name="phone"
        type="tel"
        dir="ltr"
        placeholder={copy.contactForm.placeholders.phone}
        className={`${styles.input} ${contactLtrAlign}`}
      />

      <textarea
        name="message"
        required
        rows={3}
        placeholder={copy.contactForm.placeholders.message}
        className={`${styles.input} ${styles.textarea} ${contactAlign}`}
      />

      <div className={styles.privacyConsent}>
        <input
          type="checkbox"
          name="privacy_consent"
          id="modern-contact-privacy-consent"
          required
          className={styles.privacyCheckbox}
        />
        <p className={styles.privacyText}>
          <label htmlFor="modern-contact-privacy-consent" className="cursor-pointer">
            {copy.contactForm.privacyBefore}
          </label>{' '}
          <a href="/privacy" className={styles.privacyLink}>
            {copy.contactForm.privacyLink}
          </a>
          .
        </p>
      </div>

      <button type="submit" className={styles.submit}>
        {copy.contactForm.submit}
      </button>
    </form>
  )
}
