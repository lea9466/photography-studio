'use client'

import { useEffect } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { getPublicGalleryLightboxCopy } from '@/lib/public-gallery-copy'
import styles from './ClassicPortfolioLightbox.module.css'

export type ClassicPortfolioLightboxProps = {
  /** The currently-filtered photo URL list — indices are relative to this array, not the unfiltered full set. */
  photos: string[]
  openIndex: number | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  language: SiteLanguage
}

/**
 * React port of the lightbox markup+behavior shared by
 * lib/public-gallery-html.ts (lightboxMarkup/lightboxScript/
 * lightboxDelegationScript) — same fixed overlay, close/prev/next buttons,
 * counter, Escape-to-close and arrow-key navigation. State (which photo is
 * open) is lifted to the composing page instead of living in a DOM
 * querySelector dance, but the keyboard wiring is local to this component
 * since it's purely a "while I'm open" concern.
 */
export function ClassicPortfolioLightbox({
  photos,
  openIndex,
  onClose,
  onPrev,
  onNext,
  language,
}: ClassicPortfolioLightboxProps) {
  const copy = getPublicGalleryLightboxCopy(language)
  const isOpen = openIndex !== null && openIndex >= 0 && openIndex < photos.length

  useEffect(() => {
    if (!isOpen) return

    // Matches the old lightboxScript exactly: ArrowRight steps to the
    // previous photo, ArrowLeft to the next — an RTL-oriented mapping (in
    // RTL reading order, "right" is "back").
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onPrev()
      if (event.key === 'ArrowLeft') onNext()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, onPrev, onNext])

  if (!isOpen || openIndex === null) return null

  const currentUrl = photos[openIndex]
  const isFirst = openIndex === 0
  const isLast = openIndex >= photos.length - 1

  return (
    <div className={styles.lightbox} role="dialog" aria-modal="true">
      <button type="button" className={styles.close} aria-label={copy.close} onClick={onClose}>
        &times;
      </button>
      <button
        type="button"
        className={`${styles.nav} ${styles.navPrev}`}
        aria-label={copy.prev}
        onClick={onPrev}
        disabled={isFirst}
      >
        &#8250;
      </button>
      <button
        type="button"
        className={`${styles.nav} ${styles.navNext}`}
        aria-label={copy.next}
        onClick={onNext}
        disabled={isLast}
      >
        &#8249;
      </button>
      <div className={styles.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={currentUrl} alt="" className={styles.image} />
      </div>
      <p className={styles.counter}>
        {openIndex + 1} / {photos.length}
      </p>
    </div>
  )
}
