import styles from './ModernFaqItem.module.css'

export type ModernFaqItemProps = {
  question: string
  answer: string
}

/**
 * One modern-theme FAQ row — a native `<details>`/`<summary>` accordion,
 * ports renderModernItem() in lib/homepage-themes/generate-homepage-html.ts
 * (~line 1021-1035, the `currentTheme === 'modern'` branch of
 * generateFaqAccordionHTML). Unlike classic's "magazine" FAQ layout
 * (ClassicFaqMagazineItem.tsx), modern's FAQ is a plain two-column
 * accordion — see ModernFaqSection.tsx for the column split.
 */
export function ModernFaqItem({ question, answer }: ModernFaqItemProps) {
  return (
    <details className={styles.item}>
      <summary className={styles.summary}>
        <span className={styles.question}>{question}</span>
        <span className={styles.toggle} aria-hidden="true" />
      </summary>
      <div className={styles.answer}>{answer}</div>
    </details>
  )
}
