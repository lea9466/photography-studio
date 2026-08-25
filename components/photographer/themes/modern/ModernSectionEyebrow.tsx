import styles from './ModernSectionEyebrow.module.css'

export type ModernSectionEyebrowProps = {
  /** English label rendered above the title, e.g. "COLLECTIONS", "FAQ" — always LTR/uppercase regardless of site language, matching modernSectionHeading() in lib/homepage-themes/generate-homepage-html.ts. */
  children: string
  /** White eyebrow variant for the contact card (rendered on the accent-colored background). */
  onDark?: boolean
  /**
   * Defaults to left (every gallery/posts/packages/testimonials/faq
   * section). The hero/about and the contact info column are the two
   * exceptions that right-align it (`.modern-about-content
   * .modern-section-eyebrow` / `.modern-contact-info .modern-section-eyebrow`
   * in modern.ts) — the label itself always stays `direction: ltr` either way.
   */
  align?: 'left' | 'right' | 'center'
}

/**
 * Modern-theme decorative eyebrow label — modern's equivalent of
 * ClassicSectionScript.tsx (classic's cursive "Great Vibes" label), except
 * modern's is a small uppercase English word instead of a script font. Kept
 * separate from the section title itself (shared/SectionTitle.tsx already
 * ports the identical `.site-section-title` typography rule every theme
 * uses) so each section composes eyebrow + SectionTitle the same way
 * ClassicGalleriesSection.tsx composes ClassicSectionScript + SectionTitle.
 */
export function ModernSectionEyebrow({ children, onDark = false, align = 'left' }: ModernSectionEyebrowProps) {
  return (
    <span
      className={`${styles.eyebrow} ${onDark ? styles.eyebrowOnDark : ''}`}
      style={{ textAlign: align }}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}
