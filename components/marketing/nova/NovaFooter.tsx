import Link from 'next/link'
import styles from './nova.module.css'

const BRAND_NAME = 'STG'

const LEGAL_LINKS = [
  { href: '/accessibility', label: 'הצהרת נגישות' },
  { href: '/privacy', label: 'מדיניות פרטיות' },
  { href: '/terms', label: 'תקנון ותנאי שימוש' },
]

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
        <nav aria-label="קישורים משפטיים" className={styles['site-footer-legal']}>
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <a href="https://leatech.dev/" target="_blank" rel="noopener noreferrer">
          נבנה ע״י leatech.dev
        </a>
      </div>
    </footer>
  )
}
