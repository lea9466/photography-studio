'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './ModernBlogShareLinks.module.css'

function shareCopy(language: SiteLanguage) {
  return {
    copyLink: language === 'en' ? 'Copy link' : 'העתק קישור',
    copied: language === 'en' ? 'Copied!' : 'הועתק!',
    email: language === 'en' ? 'Email' : 'אימייל',
  }
}

function LinkIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function WhatsappIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function EmailIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

export type ModernBlogShareLinksProps = {
  shareUrl: string
  postTitle: string
  accentColor: string
  language: SiteLanguage
}

/**
 * Modern-theme post share row — identical behavior/markup to
 * ClassicBlogShareLinks.tsx (copy-link / WhatsApp / email, "copied!" flash as
 * local component state) — see that component's doc comment. Kept as its own
 * file per the "one folder per theme" convention rather than literally
 * shared.
 */
export function ModernBlogShareLinks({ shareUrl, postTitle, accentColor, language }: ModernBlogShareLinksProps) {
  const copy = shareCopy(language)
  const [copied, setCopied] = useState(false)

  const whatsappText = encodeURIComponent(`${postTitle} ${shareUrl}`)
  const emailSubject = encodeURIComponent(postTitle)
  const emailBody = encodeURIComponent(`${postTitle}\n\n${shareUrl}`)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be denied/unavailable — fail silently, same as
      // the old handler (it only ever acted inside a `.then()`).
    }
  }

  return (
    <div className={styles.share}>
      <div className={styles.links}>
        <button
          type="button"
          className={`${styles.icon} ${copied ? styles.iconCopied : ''}`}
          onClick={handleCopy}
          aria-label={copied ? copy.copied : copy.copyLink}
        >
          <LinkIcon color={accentColor} />
        </button>
        <a
          className={styles.icon}
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
        >
          <WhatsappIcon color={accentColor} />
        </a>
        <a
          className={styles.icon}
          href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
          aria-label={copy.email}
        >
          <EmailIcon color={accentColor} />
        </a>
      </div>
    </div>
  )
}
