import styles from './SectionHeadingAlign.module.css'

/**
 * THE switch for homepage section headings (galleries, recent photos, blog,
 * packages, testimonials, FAQ) across all four themes.
 *
 * true  → every one of those headings is centered (title, eyebrow/watermark,
 *         divider line and any "see all" link stacked under it).
 * false → each theme's original alignment (some docked left, some centered),
 *         exactly as before — nothing else needs changing to revert.
 *
 * About and contact are left alone on purpose: their headings belong to one
 * column of a side-by-side layout.
 */
export const CENTER_SECTION_HEADINGS = true

/** Extra class for a section's header wrapper; empty when the switch is off. */
export function sectionHeadingAlignClass(): string {
  return CENTER_SECTION_HEADINGS ? styles.center : ''
}
