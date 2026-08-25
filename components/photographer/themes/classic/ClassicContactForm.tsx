'use client'

import type { FormEvent } from 'react'
import { contactLtrFieldClass, contactTextAlignClass, getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './ClassicContactForm.module.css'

export type ClassicContactFormValues = {
  name: string
  phone: string
  email: string
  message: string
  privacyConsent: boolean
}

export type ClassicContactFormProps = {
  accentColor: string
  hasContactBg: boolean
  language: SiteLanguage
  /**
   * Visual-only: the old renderer posted this to contactFormSubmitScript's
   * endpoint. Wiring the actual API call is out of scope here — the caller
   * receives the raw field values and decides what to do with them.
   */
  onSubmit?: (values: ClassicContactFormValues) => void
}

export function ClassicContactForm({ accentColor, hasContactBg, language, onSubmit }: ClassicContactFormProps) {
  const copy = getHomepageCopy(language)
  const contactAlign = contactTextAlignClass(language)
  const contactLtrAlign = contactLtrFieldClass(language)
  // contactLtrDirAttr() (lib/homepage-copy.ts) always resolves to dir="ltr"
  // for these two fields regardless of page language — phone/email input
  // regardless of site language.
  const contactLtrDir = 'ltr'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onSubmit?.({
      name: String(formData.get('name') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      message: String(formData.get('message') ?? ''),
      privacyConsent: formData.get('privacy_consent') === 'on',
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.form} ${hasContactBg ? 'bg-[#FAF7F4]/50 backdrop-blur-sm' : 'bg-[#FAF7F4]'} stagger-item w-full min-w-0 rounded-sm border border-[#d1c6b4]/20 p-12 shadow-xl lg:p-20`}
    >
      <div className={`${styles.row} mb-6`}>
        <div className={styles.field}>
          <label className={`block ${contactAlign}`}>{copy.contactForm.fullName}</label>
          <input
            name="name"
            type="text"
            required
            placeholder={copy.contactForm.placeholders.nameExample}
            className={`${hasContactBg ? 'bg-transparent' : 'bg-[#FAF7F4]'} w-full border-x-0 border-t-0 border-b border-[#d1c6b4]/40 px-0 py-4 ${contactAlign} placeholder:text-[#5a504a]/30 transition-all focus:ring-0`}
          />
        </div>
        <div className={styles.field}>
          <label className={`block ${contactAlign}`}>{copy.contactForm.phoneContact}</label>
          <input
            name="phone"
            type="tel"
            dir={contactLtrDir}
            placeholder={copy.contactForm.placeholders.phone}
            className={`${hasContactBg ? 'bg-transparent' : 'bg-[#FAF7F4]'} w-full border-x-0 border-t-0 border-b border-[#d1c6b4]/40 px-0 py-4 ${contactLtrAlign} placeholder:text-[#5a504a]/30 transition-all focus:ring-0`}
          />
        </div>
      </div>

      <div className={`${styles.field} mb-6`}>
        <label className={`block ${contactAlign}`}>{copy.contactForm.emailAddress}</label>
        <input
          name="email"
          type="email"
          required
          dir={contactLtrDir}
          placeholder={copy.contactForm.placeholders.email}
          className={`${hasContactBg ? 'bg-transparent' : 'bg-[#FAF7F4]'} w-full border-x-0 border-t-0 border-b border-[#d1c6b4]/40 px-0 py-4 ${contactLtrAlign} placeholder:text-[#5a504a]/30 transition-all focus:ring-0`}
        />
      </div>

      <div className={styles.messageBlock}>
        <div className={styles.field}>
          <label className={`block ${contactAlign}`}>{copy.contactForm.tellAboutEvent}</label>
          <textarea
            name="message"
            required
            rows={4}
            placeholder={copy.contactForm.placeholders.messageEvent}
            className={`${hasContactBg ? 'bg-transparent' : 'bg-[#FAF7F4]'} w-full resize-none border-x-0 border-t-0 border-b border-[#d1c6b4]/40 px-0 py-4 ${contactAlign} placeholder:text-[#5a504a]/30 transition-all focus:ring-0`}
          />
        </div>
      </div>

      <div className={`${styles.privacyConsent} w-full flex-row items-start text-start rtl:text-right`}>
        <input
          type="checkbox"
          name="privacy_consent"
          id="classic-contact-privacy-consent"
          required
          className={`${styles.privacyCheckbox} mt-1 shrink-0 cursor-pointer rounded border border-current/30`}
          style={{ accentColor }}
        />
        <p className="m-0 text-sm font-light leading-relaxed opacity-80">
          <label htmlFor="classic-contact-privacy-consent" className="cursor-pointer">
            {copy.contactForm.privacyBefore}
          </label>{' '}
          <a href="/privacy" className="underline hover:opacity-80">
            {copy.contactForm.privacyLink}
          </a>
          .
        </p>
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-4 rounded-sm py-4 text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ backgroundColor: accentColor }}
      >
        {copy.contactForm.sendInquiry}
        <span className={`material-symbols-outlined ${styles.icon} text-sm`}>send</span>
      </button>
    </form>
  )
}
