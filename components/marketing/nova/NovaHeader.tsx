import Link from 'next/link'
import styles from './nova.module.css'

const BRAND_NAME = 'STG'

/**
 * The source design's nav had 5 generic placeholder links (בית/תכונות/חנות/
 * אודות/צור קשר) pointing nowhere — "חנות" doesn't correspond to anything in
 * this product at all. Lea asked to fit it to what's real rather than port
 * the placeholders: trimmed to the two sections this page actually has
 * (#how, #private) plus home, so every link goes somewhere real. No contact
 * link — this page has no contact section (the old marketing page's did;
 * this is deliberately not pulling that back in).
 */
export function NovaHeader() {
  return (
    <header className={styles.topbar}>
      <div className={`${styles.container} ${styles['topbar-inner']}`}>
        <Link href="/" className={styles.logo}>
          {BRAND_NAME}
        </Link>

        <nav className={styles.nav}>
          <Link href="/">בית</Link>
          <Link href="#how">איך זה עובד</Link>
          <Link href="#private">גלריות פרטיות</Link>
        </nav>

        <Link href="/register" className={styles.cta}>
          התחל עכשיו
        </Link>
      </div>
    </header>
  )
}
