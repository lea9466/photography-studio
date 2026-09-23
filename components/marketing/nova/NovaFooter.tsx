import Link from 'next/link'
import styles from './nova.module.css'

const BRAND_NAME = 'STG'

export function NovaFooter() {
  return (
    <footer className={styles['site-footer']}>
      <div className={`${styles.container} ${styles['site-footer-cta']}`}>
        <Link href="/register" className={styles['primary-btn']}>
          להתחיל בחינם
        </Link>
      </div>

      <div className={`${styles.container} ${styles['site-footer-inner']}`}>
        <span>
          © {new Date().getFullYear()} {BRAND_NAME}
        </span>
        <a href="https://leatech.dev/" target="_blank" rel="noopener noreferrer">
          נבנה ע״י leatech.dev
        </a>
      </div>
    </footer>
  )
}
