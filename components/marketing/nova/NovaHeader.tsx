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
        <Link href="/" className={`${styles.logo} ${styles['fade-in-up']} ${styles['delay-1']}`}>
          {BRAND_NAME}
        </Link>

        <nav className={`${styles.nav} ${styles['fade-in-up']} ${styles['delay-2']}`}>
          <Link href="/">בית</Link>
          <Link href="#how">איך זה עובד</Link>
          <Link href="#private">גלריות פרטיות</Link>
        </nav>

        <div className={`${styles['header-actions']} ${styles['fade-in-up']} ${styles['delay-3']}`}>
          <Link href="/login" className={styles['login-link']}>
            כניסה
          </Link>
          <Link href="/register" className={styles.cta}>
            התחל עכשיו
          </Link>
        </div>
      </div>
    </header>
  )
}
