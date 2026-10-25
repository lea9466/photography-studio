'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './TestimonialText.module.css'

/** Lines a testimonial shows on its card before "read more". */
const CARD_LINES = 5

const COPY = {
  he: { more: 'קראי עוד', close: 'סגירה' },
  en: { more: 'Read more', close: 'Close' },
} as const

type TestimonialTextProps = {
  text: string
  /** The theme card's own text class (font, color, spacing). */
  className?: string
  title?: string | null
  meta?: string | null
  thumbSrc?: string | null
  accentColor: string
  language: SiteLanguage
}

/**
 * A testimonial's body on its card, cut at CARD_LINES lines so every card in
 * a row stays the same compact height. When the text really is longer, a
 * "read more" link opens the whole testimonial in a small dialog — the row
 * itself never changes size.
 */
export function TestimonialText({ text, className, title, meta, thumbSrc, accentColor, language }: TestimonialTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  const copy = language === 'en' ? COPY.en : COPY.he
  const dir = language === 'en' ? 'ltr' : 'rtl'

  // Re-measured on resize: the same text can fit on a wide card and not on a narrow one.
  useLayoutEffect(() => {
    const element = textRef.current
    if (!element) return
    const measure = () => setOverflowing(element.scrollHeight > element.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text])

  return (
    <div className={className}>
      <p ref={textRef} className={styles.clamped} style={{ WebkitLineClamp: CARD_LINES }}>
        {text}
      </p>

      {overflowing ? (
        <Dialog.Root>
          <Dialog.Trigger className={styles.more} style={{ color: accentColor }}>
            {copy.more}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.dialog} dir={dir} aria-describedby={undefined}>
              <Dialog.Close className={styles.close} aria-label={copy.close}>
                <X aria-hidden="true" size={20} />
              </Dialog.Close>

              <div className={styles.head}>
                {thumbSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className={styles.thumb} src={thumbSrc} />
                ) : null}
                <div>
                  <Dialog.Title className={styles.title}>{title || copy.more}</Dialog.Title>
                  {meta ? (
                    <p className={styles.meta} style={{ color: accentColor }}>
                      {meta}
                    </p>
                  ) : null}
                </div>
              </div>

              <p className={styles.body}>{text}</p>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </div>
  )
}
