import type { FaqItem } from '@/lib/faq'
import styles from './DarkFaqAccordionItem.module.css'

export type DarkFaqAccordionItemProps = {
  item: FaqItem
}

/**
 * Single row of dark's FAQ accordion — 1:1 port of `renderModernItem()`'s
 * markup inside `generateFaqAccordionHTML('dark')`
 * (lib/homepage-themes/generate-homepage-html.ts, ~line 1021): a native
 * `<details>`/`<summary>` disclosure (no JS needed for expand/collapse),
 * bottom-border only, +/- toggle glyph swapped via the `[open]` CSS
 * attribute selector — shared with modern's FAQ (same `faq-item--modern`
 * class family, dark just recolors it), not classic's separate
 * magazine-style `ClassicFaqMagazineItem`.
 */
export function DarkFaqAccordionItem({ item }: DarkFaqAccordionItemProps) {
  return (
    <details className={styles.item}>
      <summary className={styles.summary}>
        <span className={styles.question}>{item.question}</span>
        <span className={styles.toggle} aria-hidden="true" />
      </summary>
      <div className={styles.answer}>{item.answer}</div>
    </details>
  )
}
