import styles from './DarkMarqueeStrip.module.css'

export type DarkMarqueeStripProps = {
  studioName: string
}

// Matches the fixed English filler phrases hardcoded in dark.ts's marquee
// (~line 1487) — decorative, unrelated to any real studio data, and (like
// the source) not translated per site language. See DarkHomePage.tsx's doc
// comment history: this was previously skipped for exactly that reason, but
// Lea confirmed it's a real part of the production design and asked for it
// to be built.
const MARQUEE_FILLER_PHRASES = ['Fashion Editorial', 'Glamour Reality', 'High-End Photography', 'Visual Art']

/**
 * Dark-theme decorative scrolling text strip between the FAQ and Contact
 * sections — see DarkMarqueeStrip.module.css's doc comment for the exact
 * source rule it's ported from and why the looping technique here differs
 * slightly (two identical copies sliding by exactly one copy's width, instead
 * of the source's hand-typed partial second copy, so the loop stays seamless
 * regardless of studio name length).
 *
 * `.track` forces `direction: ltr` so it always rests flush against the
 * LEFT edge, the same fix the real testimonials carousel/marquee use
 * (`.classic-testimonials-track { direction: ltr }` in shared-styles.ts) for
 * the identical problem: an inline-flex box under `dir="rtl"` rests against
 * the RIGHT edge instead, so sliding it further along `-50%` drains all the
 * content past the far edge before the loop point, leaving a visible gap.
 */
export function DarkMarqueeStrip({ studioName }: DarkMarqueeStripProps) {
  const items = [studioName, ...MARQUEE_FILLER_PHRASES]
  const phrase = items.join(' • ')

  return (
    <section className={styles.strip} aria-hidden="true">
      <div className={styles.track}>
        <span className={styles.copy}>{phrase}</span>
        <span className={styles.copy}>{phrase}</span>
      </div>
    </section>
  )
}
